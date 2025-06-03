import { useState, useEffect, useCallback } from 'react';
import NotificationService, { WeightReminderSettings } from '@/services/notificationService';

interface UseWeightReminderReturn {
  isSupported: boolean;
  permission: 'granted' | 'denied' | 'default';
  settings: WeightReminderSettings | null;
  isLoading: boolean;
  requestPermission: () => Promise<boolean>;
  scheduleReminder: (settings: WeightReminderSettings) => Promise<boolean>;
  cancelReminder: () => Promise<boolean>;
  showTestNotification: () => Promise<boolean>;
  showImmediateReminder: () => Promise<boolean>;
}

export function useWeightReminder(): UseWeightReminderReturn {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<'granted' | 'denied' | 'default'>('default');
  const [settings, setSettings] = useState<WeightReminderSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const notificationService = NotificationService.getInstance();
  // Initialize hook
  useEffect(() => {
    const initialize = () => {
      console.log('[Weight Reminder Hook] Initializing...');
      
      const supported = notificationService.isNotificationSupported();
      console.log('[Weight Reminder Hook] Notification support:', supported);
      setIsSupported(supported);
      
      const permissionState = notificationService.getPermissionState();
      console.log('[Weight Reminder Hook] Permission state:', permissionState);
      if (permissionState.granted) {
        setPermission('granted');
      } else if (permissionState.denied) {
        setPermission('denied');
      } else {
        setPermission('default');
      }

      const currentSettings = notificationService.getWeightReminderSettings();
      console.log('[Weight Reminder Hook] Current settings:', currentSettings);
      setSettings(currentSettings);
      
      setIsLoading(false);
    };

    initialize();

    // Register service worker if supported
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/weight-reminder-sw.js')
        .then((registration) => {
          console.log('[Weight Reminder Hook] Service worker registered:', registration);
        })
        .catch((error) => {
          console.error('[Weight Reminder Hook] Service worker registration failed:', error);
        });

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'REQUEST_REMINDER_SETTINGS') {
          const currentSettings = notificationService.getWeightReminderSettings();
          if (currentSettings && currentSettings.enabled) {
            // Re-send settings to service worker
            navigator.serviceWorker.ready.then((registration) => {
              if (registration.active) {
                registration.active.postMessage({
                  type: 'SCHEDULE_WEIGHT_REMINDER',
                  settings: currentSettings
                });
              }
            });
          }
        }
      });
    }
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const granted = await notificationService.requestPermission();
      setPermission(granted ? 'granted' : 'denied');
      return granted;
    } catch (error) {
      console.error('[Weight Reminder Hook] Permission request failed:', error);
      setPermission('denied');
      return false;
    }
  }, []);

  const scheduleReminder = useCallback(async (reminderSettings: WeightReminderSettings): Promise<boolean> => {
    try {
      const success = await notificationService.scheduleWeightReminder(reminderSettings);
      if (success) {
        setSettings(reminderSettings);
      }
      return success;
    } catch (error) {
      console.error('[Weight Reminder Hook] Schedule reminder failed:', error);
      return false;
    }
  }, []);

  const cancelReminder = useCallback(async (): Promise<boolean> => {
    try {
      const success = await notificationService.cancelWeightReminder();
      if (success) {
        setSettings(null);
      }
      return success;
    } catch (error) {
      console.error('[Weight Reminder Hook] Cancel reminder failed:', error);
      return false;
    }
  }, []);

  const showTestNotification = useCallback(async (): Promise<boolean> => {
    try {
      return await notificationService.showTestNotification();
    } catch (error) {
      console.error('[Weight Reminder Hook] Test notification failed:', error);
      return false;
    }
  }, []);

  const showImmediateReminder = useCallback(async (): Promise<boolean> => {
    try {
      return await notificationService.showWeightReminder();
    } catch (error) {
      console.error('[Weight Reminder Hook] Immediate reminder failed:', error);
      return false;
    }
  }, []);

  return {
    isSupported,
    permission,
    settings,
    isLoading,
    requestPermission,
    scheduleReminder,
    cancelReminder,
    showTestNotification,
    showImmediateReminder,
  };
}