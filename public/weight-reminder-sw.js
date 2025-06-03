// Weight Reminder Service Worker
// This service worker handles background notifications for weekly weight reminders

let reminderTimeout = null;

// Listen for messages from the main thread
self.addEventListener('message', function(event) {
  const data = event.data;
  
  switch (data.type) {
    case 'SCHEDULE_WEIGHT_REMINDER':
      scheduleWeightReminder(data.settings);
      break;
    case 'CANCEL_WEIGHT_REMINDER':
      cancelWeightReminder();
      break;
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  const action = event.action;
  const tag = event.notification.tag;
  
  if (tag === 'weight-reminder' || tag === 'weight-reminder-test') {
    switch (action) {
      case 'update-weight':
      case 'update':
        // Open the profile page where users can update their weight
        event.waitUntil(
          clients.openWindow('/profile')
        );
        break;
      case 'snooze':
        // Schedule a reminder for 2 hours later
        scheduleSnoozeReminder();
        break;
      case 'dismiss':
      default:
        // Just close the notification
        break;
    }
  }
});

function scheduleWeightReminder(settings) {
  // Clear any existing reminder
  cancelWeightReminder();
  
  if (!settings.enabled) {
    return;
  }
  
  const now = new Date();
  const nextReminderTime = getNextReminderTime(settings, now);
  const delay = nextReminderTime.getTime() - now.getTime();
  
  if (delay > 0) {
    reminderTimeout = setTimeout(() => {
      showWeightReminderNotification();
      // Schedule the next week's reminder
      scheduleWeightReminder(settings);
    }, delay);
    
    console.log('[Weight Reminder SW] Scheduled next reminder for:', nextReminderTime);
  }
}

function getNextReminderTime(settings, fromDate = new Date()) {
  const targetDay = settings.dayOfWeek; // 0 = Sunday, 1 = Monday, etc.
  const targetHour = settings.hour;
  const targetMinute = settings.minute;
  
  const now = new Date(fromDate);
  const nextReminder = new Date(now);
  
  // Set the time to the target time
  nextReminder.setHours(targetHour, targetMinute, 0, 0);
  
  // Calculate days until target day
  const currentDay = now.getDay();
  let daysUntilTarget = targetDay - currentDay;
  
  // If target day is today but time has passed, or target day is in the past this week
  if (daysUntilTarget < 0 || (daysUntilTarget === 0 && now.getTime() >= nextReminder.getTime())) {
    daysUntilTarget += 7; // Move to next week
  }
  
  nextReminder.setDate(now.getDate() + daysUntilTarget);
  
  return nextReminder;
}

function cancelWeightReminder() {
  if (reminderTimeout) {
    clearTimeout(reminderTimeout);
    reminderTimeout = null;
    console.log('[Weight Reminder SW] Cancelled existing reminder');
  }
}

function scheduleSnoozeReminder() {
  // Schedule a reminder for 2 hours later
  const snoozeDelay = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
  
  setTimeout(() => {
    showWeightReminderNotification();
  }, snoozeDelay);
  
  console.log('[Weight Reminder SW] Scheduled snooze reminder for 2 hours');
}

function showWeightReminderNotification() {
  const options = {
    body: 'Time for your weekly weight check-in! Tap to log your current weight.',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    tag: 'weight-reminder',
    requireInteraction: true,
    actions: [
      {
        action: 'update-weight',
        title: 'Update Weight'
      },
      {
        action: 'snooze',
        title: 'Remind in 2hrs'
      }
    ],
    data: {
      timestamp: new Date().toISOString()
    }
  };
  
  self.registration.showNotification('Weekly Weight Check-in', options);
  console.log('[Weight Reminder SW] Showed weight reminder notification');
}

// Handle service worker activation
self.addEventListener('activate', function(event) {
  console.log('[Weight Reminder SW] Service worker activated');
  
  // Check if there are stored reminder settings and reschedule
  event.waitUntil(
    clients.matchAll().then(function(clients) {
      // Send message to main thread to get current settings
      clients.forEach(function(client) {
        client.postMessage({
          type: 'REQUEST_REMINDER_SETTINGS'
        });
      });
    })
  );
});

console.log('[Weight Reminder SW] Service worker loaded');