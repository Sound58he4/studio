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
