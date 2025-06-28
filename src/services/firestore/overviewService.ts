// src/services/firestore/overviewService.ts
'use server';

import { db } from '@/lib/firebase/exports';
import {
  doc, getDoc, collection, query, where, getDocs, orderBy, setDoc
} from 'firebase/firestore';
import type {
  StoredUserProfile, StoredExerciseLogEntry
} from '@/app/dashboard/types';
import { createFirestoreServiceError } from './utils';

interface PointsData {
  todayPoints: number;
  totalPoints: number;
  lastUpdated: string;
}

interface OverviewData {
  userProfile: StoredUserProfile | null;
  exerciseLogs: StoredExerciseLogEntry[];
  pointsData: PointsData; // Never null, always has default values
}

/**
 * Optimized single-request function to fetch all overview page data
 * Uses Promise.all to batch multiple Firestore requests for better performance
 */
export async function getOverviewData(
  userId: string, 
  weekStart: Date, 
  weekEnd: Date
): Promise<OverviewData> {
  if (!userId) {
    throw createFirestoreServiceError("User ID is required to fetch overview data.", "invalid-argument");
  }

  console.log(`[Overview Service] Fetching batched overview data for user: ${userId}`);
  console.log(`[Overview Service] Week range: ${weekStart.toISOString()} to ${weekEnd.toISOString()}`);

  try {
    // Batch all requests using Promise.all for optimal performance
    const [
      profileSnap,
      exerciseLogsSnap,
      pointsSnap
    ] = await Promise.all([
      // 1. User Profile
      getDoc(doc(db, 'users', userId)),
      
      // 2. Exercise Logs for the week
      getDocs(query(
        collection(db, 'users', userId, 'exerciseLog'),
        where('timestamp', '>=', weekStart.toISOString()),
        where('timestamp', '<=', weekEnd.toISOString()),
        orderBy('timestamp', 'desc')
      )),
        // 3. Points Data (force fresh fetch, bypass cache)
      getDoc(doc(db, 'users', userId, 'points', 'current'))
    ]);

    // Process User Profile
    let userProfile: StoredUserProfile | null = null;
    if (profileSnap.exists()) {
      const firestoreData = profileSnap.data();
      userProfile = {
        email: firestoreData.email ?? null,
        displayName: firestoreData.displayName ?? `user_${userId.substring(0, 6)}`,
        lowercaseDisplayName: (firestoreData.displayName ?? `user_${userId.substring(0, 6)}`).toLowerCase(),
        photoURL: firestoreData.photoURL ?? null,
        height: firestoreData.height ?? null,
        weight: firestoreData.weight ?? null,
        age: firestoreData.age ?? null,
        gender: firestoreData.gender ?? null,
        fitnessGoal: firestoreData.fitnessGoal ?? null,
        activityLevel: firestoreData.activityLevel ?? null,
        preferFewerRestDays: firestoreData.preferFewerRestDays ?? false,
        foodPreferences: firestoreData.foodPreferences ?? "",
        foodHistory: firestoreData.foodHistory ?? "",
        localFoodStyle: firestoreData.localFoodStyle ?? "",
        dietaryStyles: Array.isArray(firestoreData.dietaryStyles) ? firestoreData.dietaryStyles : [],
        allergies: Array.isArray(firestoreData.allergies) ? firestoreData.allergies : [],
        otherAllergies: firestoreData.otherAllergies ?? "",
        foodDislikes: firestoreData.foodDislikes ?? "",
        useAiTargets: firestoreData.useAiTargets ?? true,
        manualTargetCalories: firestoreData.manualTargetCalories ?? null,
        manualTargetProtein: firestoreData.manualTargetProtein ?? null,
        manualTargetCarbs: firestoreData.manualTargetCarbs ?? null,
        manualTargetFat: firestoreData.manualTargetFat ?? null,
        manualTargetActivityCalories: firestoreData.manualTargetActivityCalories ?? null,
        targetCalories: firestoreData.targetCalories ?? null,
        targetProtein: firestoreData.targetProtein ?? null,
        targetCarbs: firestoreData.targetCarbs ?? null,
        targetFat: firestoreData.targetFat ?? null,
        targetActivityCalories: firestoreData.targetActivityCalories ?? null,
        maintenanceCalories: firestoreData.maintenanceCalories ?? null,
        settings: {
          theme: firestoreData.settings?.theme ?? 'light',
          progressViewPermission: firestoreData.settings?.progressViewPermission ?? 'request_only',
        },
        translatePreference: firestoreData.translatePreference ?? 'en',
        todayCalories: firestoreData.todayCalories ?? 0,
        todayProtein: firestoreData.todayProtein ?? 0,
        todayCarbohydrates: firestoreData.todayCarbohydrates ?? 0,
        todayFat: firestoreData.todayFat ?? 0,
        todayEntryCount: firestoreData.todayEntryCount ?? 0,
        todayLastUpdated: firestoreData.todayLastUpdated?.toDate?.()?.toISOString() ?? 
                         (typeof firestoreData.todayLastUpdated === 'string' ? firestoreData.todayLastUpdated : null),
      };
      console.log(`[Overview Service] Profile loaded for user: ${userProfile.displayName}`);
    } else {
      console.log(`[Overview Service] No profile found for user: ${userId}`);
    }

    // Process Exercise Logs
    const exerciseLogs: StoredExerciseLogEntry[] = exerciseLogsSnap.docs.map(docSnap => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        exerciseName: data.exerciseName,
        exerciseType: data.exerciseType,
        timestamp: data.timestamp,
        duration: data.duration,
        distance: data.distance,
        sets: data.sets,
        reps: data.reps,
        weight: data.weight,
        estimatedCaloriesBurned: data.estimatedCaloriesBurned,
        notes: data.notes,
      } as StoredExerciseLogEntry;
    });
    console.log(`[Overview Service] Loaded ${exerciseLogs.length} exercise logs`);    // Process Points Data - Simply read from Firestore without recalculating
    let pointsData: PointsData;
    if (pointsSnap.exists()) {
      const rawPointsData = pointsSnap.data();
      pointsData = {
        todayPoints: rawPointsData.todayPoints || 0,
        totalPoints: rawPointsData.totalPoints || 0,
        lastUpdated: rawPointsData.lastUpdated || new Date().toISOString()
      };
      console.log(`[Overview Service] Points loaded: ${pointsData.todayPoints} today, ${pointsData.totalPoints} total, last updated: ${pointsData.lastUpdated}`);
    } else {
      console.log(`[Overview Service] No points document found for user: ${userId} - using default values`);
      // Use default points data structure without saving to Firestore
      // Let the Points page handle the actual points calculation and saving
      pointsData = {
        todayPoints: 0,
        totalPoints: 0,
        lastUpdated: new Date().toISOString()
      };
    }

    console.log(`[Overview Service] Batch fetch completed successfully for user: ${userId}`);

    return {
      userProfile,
      exerciseLogs,
      pointsData
    };

  } catch (error: any) {
    // Handle specific Firestore index errors
    if (error.code === 'failed-precondition' && error.message.includes('query requires an index')) {
      const indexUrl = `https://console.firebase.google.com/v1/r/project/${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}/firestore/indexes?create_composite=ClVwcm9qZWN0cy9udXRyaXRyYW5zZm9ybS1haS9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvZXhlcmNpc2VMb2cvaW5kZXhlcy9fEAEaDQoJdGltZXN0YW1wEAIaDAoIX19uYW1lX18QAQ`;
      const errorMessage = `Firestore index required for exercise log query (timestamp desc). Create it here: ${indexUrl}`;
      console.error("[Overview Service]", errorMessage);
      throw createFirestoreServiceError(errorMessage, "index-required");
    }

    console.error("[Overview Service] Error in batch fetch:", error);
    throw createFirestoreServiceError(
      `Failed to fetch overview data. Reason: ${error.message}`, 
      "overview-fetch-failed"
    );
  }
}