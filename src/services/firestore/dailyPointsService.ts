// src/services/firestore/dailyPointsService.ts
'use server';

import { db } from '@/lib/firebase/exports';
import { doc, getDoc, setDoc, collection, query, orderBy, getDocs, limit } from 'firebase/firestore';
import { createFirestoreServiceError } from './utils';
import { calculateBadgesAdvanced, getDayOfWeek, type DailyPointsRecord } from '@/lib/utils/badgeCalculator';
import { format } from 'date-fns';

/**
 * Updates daily points for a user and calculates badges
 * Also updates the user's day streak and main points document
 */
export async function updateDailyPoints(userId: string, date: string, points: number): Promise<void> {
  if (!userId || !date) throw createFirestoreServiceError("User ID and date are required.", "invalid-argument");
  
  console.log(`[Daily Points Service] Updating daily points for user ${userId} on ${date}: ${points} points`);
  
  try {
    const dailyPointsDocRef = doc(db, 'users', userId, 'dailyPoints', date);
    await setDoc(dailyPointsDocRef, {
      date,
      points,
      dayOfWeek: getDayOfWeek(date),
      lastUpdated: new Date().toISOString()
    });
    
    // Update main points document to sync today's points
    try {
      const { updateUserPointsSafely } = await import('./pointsService');
      const { getUserPoints } = await import('./pointsService');
      
      // Get current points data
      const currentPoints = await getUserPoints(userId);
      if (currentPoints) {
        const today = format(new Date(), 'yyyy-MM-dd');
        if (currentPoints.lastUpdated === today) {
          // Update today's points
          await updateUserPointsSafely(userId, {
            ...currentPoints,
            todayPoints: points
          });
        }
      }
    } catch (pointsError) {
      console.warn(`[Daily Points Service] Could not sync main points for user ${userId}:`, pointsError);
      // Don't fail the entire operation if points sync fails
    }
    
    // Update streak when daily points are updated
    try {
      const { updateUserStreak } = await import('./streakService');
      await updateUserStreak(userId, date, points);
    } catch (streakError) {
      console.warn(`[Daily Points Service] Could not update streak for user ${userId}:`, streakError);
      // Don't fail the entire operation if streak update fails
    }
    
    console.log(`[Daily Points Service] Updated daily points for ${userId} on ${date}`);
  } catch (error: any) {
    console.error("[Daily Points Service] Error updating daily points:", error);
    throw createFirestoreServiceError(`Failed to update daily points. Reason: ${error.message}`, "update-failed");
  }
}

/**
 * Fetches daily points history for a user and calculates badges
 */
export async function getUserBadges(userId: string): Promise<{ badges: number; dailyHistory: DailyPointsRecord[] }> {
  if (!userId) throw createFirestoreServiceError("User ID is required to get badges.", "invalid-argument");
  
  console.log(`[Daily Points Service] Fetching badges for user: ${userId}`);
  
  try {
    const dailyPointsRef = collection(db, 'users', userId, 'dailyPoints');
    const dailyPointsQuery = query(dailyPointsRef, orderBy('date', 'asc'), limit(365)); // Last year
    const dailyPointsSnap = await getDocs(dailyPointsQuery);
    
    const dailyHistory: DailyPointsRecord[] = [];
    dailyPointsSnap.forEach((doc) => {
      const data = doc.data();
      dailyHistory.push({
        date: data.date,
        points: data.points || 0,
        dayOfWeek: data.dayOfWeek
      });
    });
    
    const badges = calculateBadgesAdvanced(dailyHistory);
    
    console.log(`[Daily Points Service] User ${userId} has ${badges} badges from ${dailyHistory.length} days of data`);
    return { badges, dailyHistory };
  } catch (error: any) {
    console.error("[Daily Points Service] Error fetching user badges:", error);
    throw createFirestoreServiceError(`Failed to fetch user badges. Reason: ${error.message}`, "fetch-failed");
  }
}

/**
 * Gets badges for multiple users efficiently
 */
export async function getBadgesForUsers(userIds: string[]): Promise<Record<string, number>> {
  const badgeResults: Record<string, number> = {};
  
  // Process users in parallel but limit concurrency to avoid overwhelming Firestore
  const batchSize = 5;
  for (let i = 0; i < userIds.length; i += batchSize) {
    const batch = userIds.slice(i, i + batchSize);
    const batchPromises = batch.map(async (userId) => {
      try {
        const { badges } = await getUserBadges(userId);
        return { userId, badges };
      } catch (error) {
        console.warn(`[Daily Points Service] Could not fetch badges for user ${userId}:`, error);
        return { userId, badges: 0 };
      }
    });
    
    const batchResults = await Promise.all(batchPromises);
    batchResults.forEach(({ userId, badges }) => {
      badgeResults[userId] = badges;
    });
  }
  
  return badgeResults;
}
