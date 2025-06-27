// src/services/firestore/pointsService.ts
'use server';

import { db } from '@/lib/firebase/exports';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { createFirestoreServiceError } from './utils';

interface PointsData {
  todayPoints: number;
  totalPoints: number;
  lastUpdated: string;
}

/**
 * Fetches the user's points data from Firestore.
 */
export async function getUserPoints(userId: string): Promise<PointsData | null> {
  if (!userId) throw createFirestoreServiceError("User ID is required to get points.", "invalid-argument");
  
  console.log(`[Points Service] Fetching points for user: ${userId}`);
  
  try {
    const pointsDocRef = doc(db, 'users', userId, 'points', 'current');
    const pointsSnap = await getDoc(pointsDocRef);
    
    if (pointsSnap.exists()) {
      const pointsData = pointsSnap.data() as PointsData;
      console.log(`[Points Service] Points found for user ${userId}:`, pointsData);
      return pointsData;
    } else {
      console.log(`[Points Service] No points data found for user ${userId}`);
      return null;
    }
  } catch (error: any) {
    console.error("[Points Service] Error fetching user points:", error);
    throw createFirestoreServiceError(`Failed to fetch user points. Reason: ${error.message}`, "fetch-failed");
  }
}

/**
 * Updates the user's points data in Firestore.
 */
export async function updateUserPoints(userId: string, pointsData: PointsData): Promise<void> {
  if (!userId) throw createFirestoreServiceError("User ID is required to update points.", "invalid-argument");
  
  console.log(`[Points Service] Updating points for user: ${userId}`, pointsData);
  
  try {
    const pointsDocRef = doc(db, 'users', userId, 'points', 'current');
    await setDoc(pointsDocRef, pointsData);
    console.log(`[Points Service] Points updated successfully for user: ${userId}`);
  } catch (error: any) {
    console.error("[Points Service] Error updating user points:", error);
    throw createFirestoreServiceError(`Failed to update user points. Reason: ${error.message}`, "update-failed");
  }
}

/**
 * Transfers today's points to total points at the end of the day.
 * This function should be called when a new day starts to ensure continuous point accumulation.
 */
export async function transferDailyPointsToTotal(userId: string): Promise<void> {
  if (!userId) throw createFirestoreServiceError("User ID is required to transfer points.", "invalid-argument");
  
  console.log(`[Points Service] Transferring daily points to total for user: ${userId}`);
  
  try {
    const pointsDocRef = doc(db, 'users', userId, 'points', 'current');
    const pointsSnap = await getDoc(pointsDocRef);
    
    if (pointsSnap.exists()) {
      const currentData = pointsSnap.data() as PointsData;
      const today = new Date().toISOString().split('T')[0];
      
      // Only transfer if it's a new day
      if (currentData.lastUpdated !== today) {
        const updatedData: PointsData = {
          todayPoints: 0, // Reset today's points
          totalPoints: currentData.totalPoints + currentData.todayPoints, // Add today's points to total
          lastUpdated: today
        };
        
        await setDoc(pointsDocRef, updatedData);
        console.log(`[Points Service] Transferred ${currentData.todayPoints} points to total for user: ${userId}`);
      }
    }
  } catch (error: any) {
    console.error("[Points Service] Error transferring daily points:", error);
    throw createFirestoreServiceError(`Failed to transfer daily points. Reason: ${error.message}`, "transfer-failed");
  }
}

/**
 * Updates the user's points data in Firestore ensuring total points never decrease.
 */
export async function updateUserPointsSafely(userId: string, pointsData: PointsData): Promise<void> {
  if (!userId) throw createFirestoreServiceError("User ID is required to update points.", "invalid-argument");
  
  console.log(`[Points Service] Safely updating points for user: ${userId}`, pointsData);
  
  try {
    const pointsDocRef = doc(db, 'users', userId, 'points', 'current');
    const currentSnap = await getDoc(pointsDocRef);
    
    let finalData = pointsData;
    
    if (currentSnap.exists()) {
      const currentData = currentSnap.data() as PointsData;
      
      // Ensure total points never decrease
      if (pointsData.totalPoints < currentData.totalPoints) {
        finalData = {
          ...pointsData,
          totalPoints: currentData.totalPoints
        };
        console.log(`[Points Service] Prevented total points decrease for user: ${userId}`);
      }
    }
    
    await setDoc(pointsDocRef, finalData);
    console.log(`[Points Service] Points updated safely for user: ${userId}`);
  } catch (error: any) {
    console.error("[Points Service] Error updating user points safely:", error);
    throw createFirestoreServiceError(`Failed to update user points safely. Reason: ${error.message}`, "update-failed");
  }
}
