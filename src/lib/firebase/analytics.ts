import { logEvent, setUserId, setUserProperties, type Analytics } from 'firebase/analytics';
import { analytics } from './config';

// Set user ID when user logs in
export const setAnalyticsUserId = (userId: string) => {
  if (analytics) {
    setUserId(analytics, userId);
  }
};

// Set custom user properties
export const setAnalyticsUserProperties = (properties: Record<string, any>) => {
  if (analytics) {
    setUserProperties(analytics, properties);
  }
};

// Track page views
export const trackPageView = (pageName: string, pageTitle?: string) => {
  if (analytics) {
    logEvent(analytics, 'page_view', {
      page_title: pageTitle || pageName,
      page_location: window.location.href,
      page_path: window.location.pathname
    });
  }
};

// Track custom events
export const trackEvent = (eventName: string, parameters?: Record<string, any>) => {
  if (analytics) {
    logEvent(analytics, eventName, parameters);
  }
};

// Track user actions
export const trackUserAction = (action: string, details?: Record<string, any>) => {
  if (analytics) {
    logEvent(analytics, 'user_action', {
      action_type: action,
      timestamp: Date.now(),
      ...details
    });
  }
};

// Track food logging activities
export const trackFoodLog = (method: 'image' | 'voice' | 'manual' | 'quick_log' | 'history', details?: Record<string, any>) => {
  if (analytics) {
    logEvent(analytics, 'food_logged', {
      log_method: method,
      timestamp: Date.now(),
      ...details
    });
  }
};

// Track exercise logging
export const trackExerciseLog = (exerciseType: string, details?: Record<string, any>) => {
  if (analytics) {
    logEvent(analytics, 'exercise_logged', {
      exercise_type: exerciseType,
      timestamp: Date.now(),
      ...details
    });
  }
};

// Track AI interactions
export const trackAIInteraction = (feature: string, success: boolean, details?: Record<string, any>) => {
  if (analytics) {
    logEvent(analytics, 'ai_interaction', {
      ai_feature: feature,
      success,
      timestamp: Date.now(),
      ...details
    });
  }
};

// Track feature usage
export const trackFeatureUsage = (feature: string, details?: Record<string, any>) => {
  if (analytics) {
    logEvent(analytics, 'feature_used', {
      feature_name: feature,
      timestamp: Date.now(),
      ...details
    });
  }
};

// Track errors
export const trackError = (errorType: string, errorMessage: string, context?: Record<string, any>) => {
  if (analytics) {
    logEvent(analytics, 'app_error', {
      error_type: errorType,
      error_message: errorMessage.substring(0, 100), // Limit message length
      timestamp: Date.now(),
      ...context
    });
  }
};

// Track user preferences
export const trackUserPreference = (preferenceType: string, value: any) => {
  if (analytics) {
    logEvent(analytics, 'preference_changed', {
      preference_type: preferenceType,
      preference_value: String(value),
      timestamp: Date.now()
    });
  }
};

// Track device capabilities
export const trackDeviceCapabilities = () => {
  if (analytics && typeof window !== 'undefined') {
    const capabilities = {
      has_camera: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
      has_microphone: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
      supports_webrtc: 'RTCPeerConnection' in window,
      supports_push: 'serviceWorker' in navigator && 'PushManager' in window,
      connection_type: (navigator as any).connection?.effectiveType || 'unknown',
      screen_size: `${window.screen.width}x${window.screen.height}`,
      viewport_size: `${window.innerWidth}x${window.innerHeight}`,
      device_memory: (navigator as any).deviceMemory || 'unknown',
      hardware_concurrency: navigator.hardwareConcurrency || 'unknown'
    };
    
    logEvent(analytics, 'device_capabilities', capabilities);
  }
};
