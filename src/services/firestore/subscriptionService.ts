// src/services/firestore/subscriptionService.ts
'use server';

import { db } from '@/lib/firebase/exports';
import {
  doc, getDoc, setDoc, updateDoc, serverTimestamp, Timestamp, arrayUnion
} from 'firebase/firestore';
import type { StoredUserProfile, ProPaymentRecord } from '@/app/dashboard/types';
import { createFirestoreServiceError } from './utils';

/**
 * Calculates expiry date based on subscription type and start date
 */
function calculateExpiryDate(startDate: Date, subscriptionType: 'monthly' | 'yearly'): Date {
  const expiryDate = new Date(startDate);
  
  if (subscriptionType === 'monthly') {
    expiryDate.setMonth(expiryDate.getMonth() + 1);
  } else if (subscriptionType === 'yearly') {
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);
  }
  
  return expiryDate;
}

/**
 * Activates or extends a user's pro subscription
 */
export async function activateProSubscription(
  userId: string,
  paymentDetails: {
    orderId: string;
    paymentId?: string;
    amount: number;
    finalAmount: number;
    couponCode?: string;
    discountPercent?: number;
    subscriptionType: 'monthly' | 'yearly';
    paymentMethod: 'free' | 'razorpay';
  }
): Promise<{ success: boolean; expiryDate: Date; message: string }> {
  if (!userId) {
    throw createFirestoreServiceError("User ID is required to activate subscription.", "invalid-argument");
  }

  console.log(`[Subscription Service] Activating pro subscription for user: ${userId}`);

  try {
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      throw createFirestoreServiceError("User profile not found.", "user-not-found");
    }

    const currentData = userDoc.data() as StoredUserProfile;
    const now = new Date();
    
    // Calculate start date - if user already has pro and it's not expired, extend from current expiry
    let startDate = now;
    const currentExpiryDate = currentData.proExpiryDate;
    
    if (currentData.isPro && currentExpiryDate) {
      const expiryAsDate = currentExpiryDate instanceof Timestamp 
        ? currentExpiryDate.toDate() 
        : new Date(currentExpiryDate);
      
      // If current subscription is still valid, extend from expiry date
      if (expiryAsDate > now) {
        startDate = expiryAsDate;
        console.log(`[Subscription Service] Extending existing subscription from: ${startDate.toISOString()}`);
      }
    }

    const expiryDate = calculateExpiryDate(startDate, paymentDetails.subscriptionType);
    
    // Create payment record - ensure no undefined values
    const paymentTimestamp = new Date();
    const paymentRecord: ProPaymentRecord = {
      orderId: paymentDetails.orderId,
      paymentId: paymentDetails.paymentId || undefined, // Explicitly handle undefined
      amount: paymentDetails.amount,
      finalAmount: paymentDetails.finalAmount,
      couponCode: paymentDetails.couponCode || undefined, // Explicitly handle undefined
      discountPercent: paymentDetails.discountPercent || 0, // Default to 0 instead of undefined
      subscriptionType: paymentDetails.subscriptionType,
      paymentMethod: paymentDetails.paymentMethod,
      status: 'success',
      timestamp: Timestamp.fromDate(paymentTimestamp), // Use Timestamp.fromDate() instead of serverTimestamp()
      expiryDate: Timestamp.fromDate(expiryDate),
    };

    // Remove undefined fields to prevent Firestore errors
    const cleanPaymentRecord = Object.fromEntries(
      Object.entries(paymentRecord).filter(([_, value]) => value !== undefined)
    ) as ProPaymentRecord;

    // Update user profile with pro status
    const updateData: Partial<StoredUserProfile> = {
      isPro: true,
      proExpiryDate: Timestamp.fromDate(expiryDate),
      proSubscriptionType: paymentDetails.subscriptionType,
      proSubscriptionStartDate: currentData.proSubscriptionStartDate || Timestamp.fromDate(now),
      proPaymentHistory: arrayUnion(cleanPaymentRecord) as any, // Use cleaned record
    };

    await updateDoc(userDocRef, updateData);

    console.log(`[Subscription Service] Pro subscription activated successfully for user: ${userId}, expires: ${expiryDate.toISOString()}`);

    return {
      success: true,
      expiryDate,
      message: paymentDetails.finalAmount === 0 
        ? `Free ${paymentDetails.subscriptionType} subscription activated until ${expiryDate.toLocaleDateString()}`
        : `${paymentDetails.subscriptionType} subscription activated until ${expiryDate.toLocaleDateString()}`
    };

  } catch (error: any) {
    console.error("[Subscription Service] Error activating pro subscription:", error);
    throw createFirestoreServiceError(
      `Failed to activate pro subscription. Reason: ${error.message}`, 
      "subscription-activation-failed"
    );
  }
}

/**
 * Checks if a user's pro subscription is still valid
 */
export async function checkProStatus(userId: string): Promise<{
  isPro: boolean;
  expiryDate?: Date;
  subscriptionType?: 'monthly' | 'yearly';
  daysRemaining?: number;
}> {
  if (!userId) {
    throw createFirestoreServiceError("User ID is required to check pro status.", "invalid-argument");
  }

  try {
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      return { isPro: false };
    }

    const userData = userDoc.data() as StoredUserProfile;
    
    if (!userData.isPro || !userData.proExpiryDate) {
      return { isPro: false };
    }

    const expiryDate = userData.proExpiryDate instanceof Timestamp 
      ? userData.proExpiryDate.toDate() 
      : new Date(userData.proExpiryDate);
    
    const now = new Date();
    const isStillValid = expiryDate > now;
    
    if (!isStillValid) {
      // Subscription has expired, update the user's pro status
      await updateDoc(userDocRef, {
        isPro: false,
        proExpiryDate: null,
        proSubscriptionType: null,
      });
      
      console.log(`[Subscription Service] Pro subscription expired for user: ${userId}`);
      return { isPro: false };
    }

    const daysRemaining = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    return {
      isPro: true,
      expiryDate,
      subscriptionType: userData.proSubscriptionType || undefined,
      daysRemaining,
    };

  } catch (error: any) {
    console.error("[Subscription Service] Error checking pro status:", error);
    throw createFirestoreServiceError(
      `Failed to check pro status. Reason: ${error.message}`, 
      "pro-status-check-failed"
    );
  }
}

/**
 * Gets the payment history for a user
 */
export async function getPaymentHistory(userId: string): Promise<ProPaymentRecord[]> {
  if (!userId) {
    throw createFirestoreServiceError("User ID is required to get payment history.", "invalid-argument");
  }

  try {
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      return [];
    }

    const userData = userDoc.data() as StoredUserProfile;
    return userData.proPaymentHistory || [];

  } catch (error: any) {
    console.error("[Subscription Service] Error getting payment history:", error);
    throw createFirestoreServiceError(
      `Failed to get payment history. Reason: ${error.message}`, 
      "payment-history-failed"
    );
  }
}

/**
 * Records a failed payment attempt
 */
export async function recordFailedPayment(
  userId: string,
  paymentDetails: {
    orderId: string;
    amount: number;
    finalAmount: number;
    couponCode?: string;
    discountPercent?: number;
    subscriptionType: 'monthly' | 'yearly';
    paymentMethod: 'free' | 'razorpay';
    errorMessage?: string;
  }
): Promise<void> {
  if (!userId) {
    throw createFirestoreServiceError("User ID is required to record failed payment.", "invalid-argument");
  }

  try {
    const userDocRef = doc(db, 'users', userId);
    
    // Create payment record - ensure no undefined values
    const failureTimestamp = new Date();
    const paymentRecord: ProPaymentRecord = {
      orderId: paymentDetails.orderId,
      amount: paymentDetails.amount,
      finalAmount: paymentDetails.finalAmount,
      couponCode: paymentDetails.couponCode || undefined,
      discountPercent: paymentDetails.discountPercent || 0,
      subscriptionType: paymentDetails.subscriptionType,
      paymentMethod: paymentDetails.paymentMethod,
      status: 'failed',
      timestamp: Timestamp.fromDate(failureTimestamp), // Use Timestamp.fromDate() instead of serverTimestamp()
      expiryDate: Timestamp.fromDate(failureTimestamp), // Not applicable for failed payments
    };

    // Remove undefined fields to prevent Firestore errors
    const cleanPaymentRecord = Object.fromEntries(
      Object.entries(paymentRecord).filter(([_, value]) => value !== undefined)
    ) as ProPaymentRecord;

    await updateDoc(userDocRef, {
      proPaymentHistory: arrayUnion(cleanPaymentRecord)
    });

    console.log(`[Subscription Service] Failed payment recorded for user: ${userId}, order: ${paymentDetails.orderId}`);

  } catch (error: any) {
    console.error("[Subscription Service] Error recording failed payment:", error);
    throw createFirestoreServiceError(
      `Failed to record failed payment. Reason: ${error.message}`, 
      "failed-payment-record-failed"
    );
  }
}

/**
 * Utility function to check if a user has access to pro features
 * This can be used throughout the app to gate pro features
 */
export async function hasProAccess(userId: string): Promise<boolean> {
  try {
    const proStatus = await checkProStatus(userId);
    return proStatus.isPro;
  } catch (error) {
    console.error("[Subscription Service] Error checking pro access:", error);
    return false; // Default to no access on error
  }
}
