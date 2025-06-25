// src/services/firestore/streakService.ts
import { db } from '@/lib/firebase/exports';
import { doc, getDoc, setDoc, writeBatch, collection, query, orderBy, getDocs, limit, where } from 'firebase/firestore';
import { createFirestoreServiceError } from './utils';
import { format, parseISO, isAfter, isBefore, addDays, subDays } from 'date-fns';

export interface DayStreakRecord {
  date: string; // YYYY-MM-DD format
  points: number;
  metThreshold: boolean; // true if points >= 10
}

export interface UserStreak {
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastUpdatedDate: string; // YYYY-MM-DD format
  lastUpdated: string; // ISO timestamp
}

const DAILY_POINTS_THRESHOLD = 10; // Minimum points required per day for streak

/**
 * Updates a user's streak based on their daily points
 * Should be called when daily points are updated
 */
export async function updateUserStreak(userId: string, date: string, todayPoints: number): Promise<UserStreak> {
  if (!userId || !date) throw createFirestoreServiceError("User ID and date are required.", "invalid-argument");
  
  console.log(`[Streak Service] Updating streak for user ${userId} on ${date}: ${todayPoints} points`);
  
  try {
    const streakDocRef = doc(db, 'users', userId, 'streak', 'current');
    const streakSnap = await getDoc(streakDocRef);
    
    let currentStreak = 0;
    let longestStreak = 0;
    let lastUpdatedDate = '';
    
    // Get existing streak data
    if (streakSnap.exists()) {
      const streakData = streakSnap.data();
      currentStreak = streakData.currentStreak || 0;
      longestStreak = streakData.longestStreak || 0;
      lastUpdatedDate = streakData.lastUpdatedDate || '';
    }
    
    const dateObj = parseISO(date);
    const lastUpdatedDateObj = lastUpdatedDate ? parseISO(lastUpdatedDate) : null;
    
    // Check if this is a new day or update to today
    const metThreshold = todayPoints >= DAILY_POINTS_THRESHOLD;
    
    if (!lastUpdatedDateObj || format(dateObj, 'yyyy-MM-dd') === format(lastUpdatedDateObj, 'yyyy-MM-dd')) {
      // Same day update or first time
      if (metThreshold && (!lastUpdatedDateObj || format(dateObj, 'yyyy-MM-dd') !== lastUpdatedDate)) {
        // New day and met threshold
        currentStreak += 1;
        longestStreak = Math.max(longestStreak, currentStreak);
      } else if (!metThreshold && lastUpdatedDateObj && format(dateObj, 'yyyy-MM-dd') === lastUpdatedDate) {
        // Same day but no longer meets threshold - don't change streak yet
        // Wait for next day to break streak
      }
    } else {
      // Different day
      const yesterday = subDays(dateObj, 1);
      const isConsecutiveDay = lastUpdatedDateObj && format(yesterday, 'yyyy-MM-dd') === lastUpdatedDate;
      
      if (metThreshold) {
        if (isConsecutiveDay) {
          // Consecutive day with threshold met
          currentStreak += 1;
        } else {
          // Gap in days or first day meeting threshold
          currentStreak = 1;
        }
        longestStreak = Math.max(longestStreak, currentStreak);
      } else {
        // Didn't meet threshold - break streak
        currentStreak = 0;
      }
    }
    
    const updatedStreak: UserStreak = {
      userId,
      currentStreak,
      longestStreak,
      lastUpdatedDate: metThreshold ? format(dateObj, 'yyyy-MM-dd') : lastUpdatedDate,
      lastUpdated: new Date().toISOString()
    };
    
    // Save updated streak
    await setDoc(streakDocRef, updatedStreak);
    
    console.log(`[Streak Service] Updated streak for ${userId}:`, updatedStreak);
    return updatedStreak;
    
  } catch (error: any) {
    console.error("[Streak Service] Error updating user streak:", error);
    throw createFirestoreServiceError(`Failed to update user streak. Reason: ${error.message}`, "update-failed");
  }
}

/**
 * Gets current streak for a user
 */
export async function getUserStreak(userId: string): Promise<UserStreak | null> {
  if (!userId) throw createFirestoreServiceError("User ID is required to get streak.", "invalid-argument");
  
  try {
    const streakDocRef = doc(db, 'users', userId, 'streak', 'current');
    const streakSnap = await getDoc(streakDocRef);
    
    if (streakSnap.exists()) {
      const streakData = streakSnap.data() as UserStreak;
      
      // Check if streak should be broken due to missing days
      const today = format(new Date(), 'yyyy-MM-dd');
      const lastUpdatedDate = streakData.lastUpdatedDate;
      
      if (lastUpdatedDate) {
        const lastDate = parseISO(lastUpdatedDate);
        const todayDate = parseISO(today);
        const daysSinceLastUpdate = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        
        // If more than 1 day has passed without an update, break the streak
        if (daysSinceLastUpdate > 1) {
          const brokenStreak: UserStreak = {
            ...streakData,
            currentStreak: 0,
            lastUpdated: new Date().toISOString()
          };
          
          // Update the broken streak in database
          await setDoc(streakDocRef, brokenStreak);
          return brokenStreak;
        }
      }
      
      return streakData;
    } else {
      return null;
    }
  } catch (error: any) {
    console.error("[Streak Service] Error fetching user streak:", error);
    throw createFirestoreServiceError(`Failed to fetch user streak. Reason: ${error.message}`, "fetch-failed");
  }
}

/**
 * Gets streaks for multiple users efficiently
 */
export async function getStreaksForUsers(userIds: string[]): Promise<Record<string, number>> {
  const streakResults: Record<string, number> = {};
  
  // Process users in parallel but limit concurrency
  const batchSize = 5;
  for (let i = 0; i < userIds.length; i += batchSize) {
    const batch = userIds.slice(i, i + batchSize);
    const batchPromises = batch.map(async (userId) => {
      try {
        const streak = await getUserStreak(userId);
        return { userId, currentStreak: streak?.currentStreak || 0 };
      } catch (error) {
        console.warn(`[Streak Service] Could not fetch streak for user ${userId}:`, error);
        return { userId, currentStreak: 0 };
      }
    });
    
    const batchResults = await Promise.all(batchPromises);
    batchResults.forEach(({ userId, currentStreak }) => {
      streakResults[userId] = currentStreak;
    });
  }
  
  return streakResults;
}

/**
 * Calculates streak from daily points history
 * Used for migration or verification purposes
 */
export async function calculateStreakFromHistory(userId: string): Promise<UserStreak> {
  try {
    // Get daily points history
    const dailyPointsRef = collection(db, 'users', userId, 'dailyPoints');
    const dailyPointsQuery = query(dailyPointsRef, orderBy('date', 'desc'), limit(365));
    const dailyPointsSnap = await getDocs(dailyPointsQuery);
    
    const dailyHistory: DayStreakRecord[] = [];
    dailyPointsSnap.forEach((doc) => {
      const data = doc.data();
      dailyHistory.push({
        date: data.date,
        points: data.points || 0,
        metThreshold: (data.points || 0) >= DAILY_POINTS_THRESHOLD
      });
    });
    
    // Calculate current streak (from most recent backwards)
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let lastUpdatedDate = '';
    
    // Calculate current streak (from most recent day backwards)
    for (let i = 0; i < dailyHistory.length; i++) {
      if (dailyHistory[i].metThreshold) {
        currentStreak++;
        if (i === 0) lastUpdatedDate = dailyHistory[i].date;
      } else {
        break;
      }
    }
    
    // Calculate longest streak
    for (const record of dailyHistory.reverse()) { // Go chronologically
      if (record.metThreshold) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    }
    
    const calculatedStreak: UserStreak = {
      userId,
      currentStreak,
      longestStreak,
      lastUpdatedDate,
      lastUpdated: new Date().toISOString()
    };
    
    // Save calculated streak
    const streakDocRef = doc(db, 'users', userId, 'streak', 'current');
    await setDoc(streakDocRef, calculatedStreak);
    
    console.log(`[Streak Service] Calculated streak from history for ${userId}:`, calculatedStreak);
    return calculatedStreak;
    
  } catch (error: any) {
    console.error("[Streak Service] Error calculating streak from history:", error);
    throw createFirestoreServiceError(`Failed to calculate streak from history. Reason: ${error.message}`, "calculation-failed");
  }
}
