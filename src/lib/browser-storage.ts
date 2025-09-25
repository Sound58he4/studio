// Browser storage fallback for database operations
// Used when database is disabled for free mode

import { StoredUserProfile, StoredFoodLogEntry } from '@/app/dashboard/types';

const STORAGE_KEYS = {
  USER_PROFILE: 'bago_user_profile',
  FOOD_LOGS: 'bago_food_logs',
  WORKOUT_PLANS: 'bago_workout_plans',
  SUBSCRIPTION_STATUS: 'bago_subscription',
  SETTINGS: 'bago_settings'
} as const;

// Utility functions for localStorage operations
export const browserStorage = {
  // User Profile Operations
  getUserProfile: (userId: string): StoredUserProfile | null => {
    if (typeof window === 'undefined') return null;
    
    try {
      const stored = localStorage.getItem(`${STORAGE_KEYS.USER_PROFILE}_${userId}`);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Error reading user profile from localStorage:', error);
      return null;
    }
  },

  setUserProfile: (userId: string, profile: StoredUserProfile): boolean => {
    if (typeof window === 'undefined') return false;
    
    try {
      // Always set isPro to true in free mode
      const freeProfile = { ...profile, isPro: true };
      localStorage.setItem(`${STORAGE_KEYS.USER_PROFILE}_${userId}`, JSON.stringify(freeProfile));
      return true;
    } catch (error) {
      console.error('Error saving user profile to localStorage:', error);
      return false;
    }
  },

  // Food Log Operations
  getFoodLogs: (userId: string, date?: string): StoredFoodLogEntry[] => {
    if (typeof window === 'undefined') return [];
    
    try {
      const key = date 
        ? `${STORAGE_KEYS.FOOD_LOGS}_${userId}_${date}`
        : `${STORAGE_KEYS.FOOD_LOGS}_${userId}`;
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error reading food logs from localStorage:', error);
      return [];
    }
  },

  setFoodLogs: (userId: string, logs: StoredFoodLogEntry[], date?: string): boolean => {
    if (typeof window === 'undefined') return false;
    
    try {
      const key = date 
        ? `${STORAGE_KEYS.FOOD_LOGS}_${userId}_${date}`
        : `${STORAGE_KEYS.FOOD_LOGS}_${userId}`;
      localStorage.setItem(key, JSON.stringify(logs));
      return true;
    } catch (error) {
      console.error('Error saving food logs to localStorage:', error);
      return false;
    }
  },

  // Subscription Status (always Pro in free mode)
  getSubscriptionStatus: (userId: string) => {
    return {
      isPro: true,
      subscriptionType: 'yearly' as const,
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      daysRemaining: 365
    };
  },

  // Generic storage operations
  get: (key: string): any => {
    if (typeof window === 'undefined') return null;
    
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error(`Error reading ${key} from localStorage:`, error);
      return null;
    }
  },

  set: (key: string, value: any): boolean => {
    if (typeof window === 'undefined') return false;
    
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error saving ${key} to localStorage:`, error);
      return false;
    }
  },

  remove: (key: string): boolean => {
    if (typeof window === 'undefined') return false;
    
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing ${key} from localStorage:`, error);
      return false;
    }
  },

  clear: (): boolean => {
    if (typeof window === 'undefined') return false;
    
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('Error clearing localStorage:', error);
      return false;
    }
  }
};

// Create fallback subscription service for free mode
export const freeSubscriptionService = {
  // Always return Pro status
  checkProStatus: async (userId: string) => {
    return browserStorage.getSubscriptionStatus(userId);
  },

  // Always return true for Pro access
  hasProAccess: async (userId: string) => {
    return true;
  },

  // Mock payment history
  getPaymentHistory: async (userId: string) => {
    return [];
  },

  // Mock activation - just log
  activateProSubscription: async (userId: string, paymentDetails: any) => {
    console.log('Mock subscription activation in FREE MODE:', { userId, paymentDetails });
    return {
      success: true,
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      message: 'Free subscription activated successfully'
    };
  }
};