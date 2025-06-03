/**
 * Notification service for managing weight reminder notifications
 */

export interface NotificationPermissionState {
  granted: boolean;
  denied: boolean;
  default: boolean;
}

export interface WeightReminderSettings {
  enabled: boolean;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  hour: number; // 0-23
  minute: number; // 0-59
  lastPrompted?: string; // ISO date string
}

class NotificationService {
  private static instance: NotificationService;
  private isSupported: boolean = false;

  constructor() {
    // More robust check for notification support in PWAs
    this.isSupported = this.checkNotificationSupport();
  }

  private checkNotificationSupport(): boolean {
    // Check for basic Notification API support
    if (!('Notification' in window)) {
      console.log('[NotificationService] Notification API not available');
      return false;
    }

    // Check for Service Worker support (required for background notifications)
    if (!('serviceWorker' in navigator)) {
      console.log('[NotificationService] Service Worker not available');
      return false;
    }

    // Check if we're in a secure context (required for notifications)
    if (!window.isSecureContext && location.protocol !== 'http:') {
      console.log('[NotificationService] Not in secure context');
      return false;
    }

    // Additional check for PWA/mobile browsers
    try {
      // Try to access the permission property
      const permission = Notification.permission;
      console.log('[NotificationService] Notification permission:', permission);
      return true;
    } catch (error) {
      console.error('[NotificationService] Error checking notification support:', error);
      return false;
    }
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Check if notifications are supported
   */
  public isNotificationSupported(): boolean {
    return this.isSupported;
  }

  /**
   * Get current notification permission state
   */
  public getPermissionState(): NotificationPermissionState {
    if (!this.isSupported) {
      return { granted: false, denied: true, default: false };
    }

    const permission = Notification.permission;
    return {
      granted: permission === 'granted',
      denied: permission === 'denied',
      default: permission === 'default'
    };
  }

  /**
   * Request notification permission
   */
  public async requestPermission(): Promise<boolean> {
    if (!this.isSupported) {
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  /**
   * Show a test notification
   */
  public async showTestNotification(): Promise<boolean> {
    const permissionState = this.getPermissionState();
    if (!permissionState.granted) {
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification('Weight Reminder Test', {
        body: 'This is a test notification for your weight tracking reminder.',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-192x192.png',
        tag: 'weight-reminder-test',
        requireInteraction: true,
        actions: [
          {
            action: 'update',
            title: 'Update Weight'
          },
          {
            action: 'dismiss',
            title: 'Dismiss'
          }
        ]
      });
      return true;
    } catch (error) {
      console.error('Error showing test notification:', error);
      return false;
    }
  }

  /**
   * Schedule weekly weight reminder
   */
  public async scheduleWeightReminder(settings: WeightReminderSettings): Promise<boolean> {
    if (!this.isSupported || !this.getPermissionState().granted) {
      return false;
    }

    try {
      // Store settings in localStorage
      localStorage.setItem('weightReminderSettings', JSON.stringify(settings));

      // Register the reminder with the service worker
      const registration = await navigator.serviceWorker.ready;
      
      // Send message to service worker to set up the reminder
      if (registration.active) {
        registration.active.postMessage({
          type: 'SCHEDULE_WEIGHT_REMINDER',
          settings: settings
        });
      }

      return true;
    } catch (error) {
      console.error('Error scheduling weight reminder:', error);
      return false;
    }
  }

  /**
   * Cancel weight reminder
   */
  public async cancelWeightReminder(): Promise<boolean> {
    try {
      // Remove settings from localStorage
      localStorage.removeItem('weightReminderSettings');

      // Send message to service worker to cancel the reminder
      const registration = await navigator.serviceWorker.ready;
      if (registration.active) {
        registration.active.postMessage({
          type: 'CANCEL_WEIGHT_REMINDER'
        });
      }

      return true;
    } catch (error) {
      console.error('Error canceling weight reminder:', error);
      return false;
    }
  }

  /**
   * Get current weight reminder settings
   */
  public getWeightReminderSettings(): WeightReminderSettings | null {
    try {
      const settings = localStorage.getItem('weightReminderSettings');
      return settings ? JSON.parse(settings) : null;
    } catch (error) {
      console.error('Error getting weight reminder settings:', error);
      return null;
    }
  }

  /**
   * Check if we should show weight reminder today
   */
  public shouldShowWeightReminder(): boolean {
    const settings = this.getWeightReminderSettings();
    if (!settings || !settings.enabled) {
      return false;
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Check if it's the right day of the week
    if (now.getDay() !== settings.dayOfWeek) {
      return false;
    }

    // Check if we already prompted today
    if (settings.lastPrompted) {
      const lastPrompted = new Date(settings.lastPrompted);
      const lastPromptedDate = new Date(lastPrompted.getFullYear(), lastPrompted.getMonth(), lastPrompted.getDate());
      
      if (today.getTime() === lastPromptedDate.getTime()) {
        return false; // Already prompted today
      }
    }

    return true;
  }

  /**
   * Mark that we prompted the user today
   */
  public markAsPromptedToday(): void {
    const settings = this.getWeightReminderSettings();
    if (settings) {
      settings.lastPrompted = new Date().toISOString();
      localStorage.setItem('weightReminderSettings', JSON.stringify(settings));
    }
  }

  /**
   * Show immediate weight reminder notification
   */
  public async showWeightReminder(): Promise<boolean> {
    const permissionState = this.getPermissionState();
    if (!permissionState.granted) {
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification('Weekly Weight Check-in', {
        body: 'Time for your weekly weight update! Tap to log your current weight.',
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
            title: 'Remind Later'
          }
        ]
      });
      
      // Mark as prompted
      this.markAsPromptedToday();
      return true;
    } catch (error) {
      console.error('Error showing weight reminder:', error);
      return false;
    }
  }
}

export default NotificationService;
