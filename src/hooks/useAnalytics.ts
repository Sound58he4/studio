import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import { 
  setAnalyticsUserId, 
  setAnalyticsUserProperties, 
  trackPageView,
  trackEvent,
  trackFoodLog,
  trackExerciseLog,
  trackAIInteraction,
  trackFeatureUsage,
  trackError,
  trackUserPreference,
  trackDeviceCapabilities,
  trackUserAction
} from '@/lib/firebase/analytics';

export const useAnalytics = () => {
  const router = useRouter();
  const { user, userId } = useAuth();

  // Set user ID and properties when user logs in
  useEffect(() => {
    if (user && userId) {
      setAnalyticsUserId(userId);
      setAnalyticsUserProperties({
        user_email: user.email,
        email_verified: user.emailVerified,
        sign_in_method: user.providerData[0]?.providerId || 'unknown',
        account_created: user.metadata.creationTime,
        last_sign_in: user.metadata.lastSignInTime,
        is_anonymous: user.isAnonymous
      });
      
      // Track device capabilities on first login
      trackDeviceCapabilities();
    }
  }, [user, userId]);

  // Track page views on route changes
  useEffect(() => {
    const handleRouteChange = (url: string) => {
      // Extract page name from URL
      const pageName = url.split('?')[0].split('#')[0];
      const pageTitle = document.title;
      
      trackPageView(pageName, pageTitle);
      
      // Track specific page types
      if (pageName.includes('/log')) {
        trackFeatureUsage('food_logging_page_visit');
      } else if (pageName.includes('/quick-log')) {
        trackFeatureUsage('quick_log_page_visit');
      } else if (pageName.includes('/history')) {
        trackFeatureUsage('history_page_visit');
      } else if (pageName.includes('/dashboard')) {
        trackFeatureUsage('dashboard_page_visit');
      }
    };

    // Track initial page load
    handleRouteChange(router.asPath);

    router.events.on('routeChangeComplete', handleRouteChange);
    return () => router.events.off('routeChangeComplete', handleRouteChange);
  }, [router.events, router.asPath]);

  // Analytics functions to return
  const analytics = {
    // Basic tracking
    trackEvent,
    trackPageView,
    trackUserAction,
    
    // App-specific tracking
    trackFoodLog: useCallback((method: 'image' | 'voice' | 'manual' | 'quick_log' | 'history', foodName?: string, calories?: number) => {
      trackFoodLog(method, {
        food_name: foodName,
        calories: calories,
        user_id: userId
      });
    }, [userId]),
    
    trackExerciseLog: useCallback((exerciseType: string, exerciseName?: string, duration?: number) => {
      trackExerciseLog(exerciseType, {
        exercise_name: exerciseName,
        duration: duration,
        user_id: userId
      });
    }, [userId]),
    
    trackAIUsage: useCallback((feature: 'food_recognition' | 'voice_processing' | 'nutrition_estimation' | 'suggestions', success: boolean, processingTime?: number) => {
      trackAIInteraction(feature, success, {
        processing_time_ms: processingTime,
        user_id: userId
      });
    }, [userId]),
    
    trackFeatureClick: useCallback((feature: string, location?: string) => {
      trackFeatureUsage(feature, {
        click_location: location,
        page: router.pathname,
        user_id: userId
      });
    }, [router.pathname, userId]),
    
    trackError: useCallback((error: Error, context?: string) => {
      trackError('app_error', error.message, {
        error_stack: error.stack?.substring(0, 500),
        context,
        page: router.pathname,
        user_id: userId
      });
    }, [router.pathname, userId]),
    
    trackUserPreference: useCallback((type: string, value: any) => {
      trackUserPreference(type, value);
    }, []),
    
    // Session tracking
    trackSessionStart: useCallback(() => {
      trackEvent('session_start', {
        user_id: userId,
        page: router.pathname,
        timestamp: Date.now()
      });
    }, [userId, router.pathname]),
    
    trackSessionEnd: useCallback(() => {
      trackEvent('session_end', {
        user_id: userId,
        timestamp: Date.now()
      });
    }, [userId])
  };

  return analytics;
};
