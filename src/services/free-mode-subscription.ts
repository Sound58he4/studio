// Wrapper for subscription service with free mode fallback
// This file replaces database calls with localStorage for free mode

import { freeSubscriptionService } from '@/lib/browser-storage';

// Enable free mode (database disabled)
const FREE_MODE = true;

// Export free mode implementations that always return Pro status
export const checkProStatus = async (userId: string) => {
  if (FREE_MODE) {
    return freeSubscriptionService.checkProStatus(userId);
  }
  
  // Original database implementation would go here
  throw new Error('Database is disabled in free mode');
};

export const hasProAccess = async (userId: string): Promise<boolean> => {
  if (FREE_MODE) {
    return freeSubscriptionService.hasProAccess(userId);
  }
  
  // Original database implementation would go here
  throw new Error('Database is disabled in free mode');
};

export const getPaymentHistory = async (userId: string) => {
  if (FREE_MODE) {
    return freeSubscriptionService.getPaymentHistory(userId);
  }
  
  // Original database implementation would go here
  throw new Error('Database is disabled in free mode');
};

export const activateProSubscription = async (userId: string, paymentDetails: any) => {
  if (FREE_MODE) {
    return freeSubscriptionService.activateProSubscription(userId, paymentDetails);
  }
  
  // Original database implementation would go here
  throw new Error('Database is disabled in free mode');
};

export const recordFailedPayment = async (userId: string, paymentDetails: any) => {
  if (FREE_MODE) {
    console.log('Mock failed payment record in FREE MODE:', { userId, paymentDetails });
    return true;
  }
  
  // Original database implementation would go here
  throw new Error('Database is disabled in free mode');
};