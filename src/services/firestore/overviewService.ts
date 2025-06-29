// src/services/firestore/overviewService.ts
'use server';

import { db } from '@/lib/firebase/exports';
import {
  doc, getDoc, collection, query, where, getDocs, orderBy, setDoc
} from 'firebase/firestore';
import type {
  StoredUserProfile, StoredExerciseLogEntry, StoredFoodLogEntry
} from '@/app/dashboard/types';
import { createFirestoreServiceError } from './utils';
import { 
  calculateTodayProgress, 
  calculateCurrentPoints, 
  processPointsForNewDay,
  type DailyNutritionTargets 
} from '@/lib/utils/pointsCalculator';
import { startOfDay, endOfDay } from 'date-fns';

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
      pointsSnap,
      todayFoodLogsSnap
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
      getDoc(doc(db, 'users', userId, 'points', 'current')),

      // 4. Today's Food Logs for fresh points calculation
      getDocs(query(
        collection(db, 'users', userId, 'foodLog'),
        where('timestamp', '>=', startOfDay(new Date()).toISOString()),
        where('timestamp', '<=', endOfDay(new Date()).toISOString()),
        orderBy('timestamp', 'desc')
      ))
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
    console.log(`[Overview Service] Loaded ${exerciseLogs.length} exercise logs`);

    // Process Today's Food Logs
    const todayFoodLogs: StoredFoodLogEntry[] = todayFoodLogsSnap.docs.map(docSnap => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        userId: data.userId,
        foodName: data.foodName,
        servingSize: data.servingSize,
        servingUnit: data.servingUnit,
        calories: data.calories,
        protein: data.protein,
        carbohydrates: data.carbohydrates,
        fat: data.fat,
        fiber: data.fiber,
        sugar: data.sugar,
        sodium: data.sodium,
        timestamp: data.timestamp,
        mealType: data.mealType,
        logDate: data.logDate,
        entryType: data.entryType,
        // Missing required fields
        foodItem: data.foodItem || null,
        logMethod: data.logMethod || 'manual',
        // Other fields with defaults
        cholesterol: data.cholesterol || 0,
        potassium: data.potassium || 0,
        vitaminA: data.vitaminA || 0,
        vitaminC: data.vitaminC || 0,
        calcium: data.calcium || 0,
        iron: data.iron || 0,
        saturatedFat: data.saturatedFat || 0,
        monounsaturatedFat: data.monounsaturatedFat || 0,
        polyunsaturatedFat: data.polyunsaturatedFat || 0,
        transFat: data.transFat || 0,
        glycemicIndex: data.glycemicIndex || null,
        // Additional fields
        imageUrl: data.imageUrl || null,
        brand: data.brand || null,
        category: data.category || null,
        barcode: data.barcode || null,
        notes: data.notes || null,
        isCustom: data.isCustom || false,
        isVerified: data.isVerified || false,
      } as StoredFoodLogEntry;
    });
    console.log(`[Overview Service] Loaded ${todayFoodLogs.length} today's food logs`);

    // Calculate fresh points using the same logic as Points page
    let pointsData: PointsData;
    const existingPointsData = pointsSnap.exists() ? pointsSnap.data() as PointsData : null;
    
    // Process points for new day if needed
    const processedPointsData = processPointsForNewDay(existingPointsData);
    
    if (userProfile) {
      // Calculate today's nutrition progress
      const todayProgress = calculateTodayProgress(todayFoodLogs);
      
      // Use profile's daily targets
      const targets: DailyNutritionTargets = {
        calories: userProfile.targetCalories || 2000,
        protein: userProfile.targetProtein || 150,
        carbohydrates: userProfile.targetCarbs || 250,
        fat: userProfile.targetFat || 65,
      };
      
      // Calculate current points (fresh calculation)
      const currentTodayPoints = calculateCurrentPoints(
        todayProgress, 
        targets, 
        todayFoodLogs, 
        processedPointsData.perfectDayBonusClaimed || false
      );
      
      pointsData = {
        ...processedPointsData,
        todayPoints: currentTodayPoints
      };
      
      console.log(`[Overview Service] Calculated fresh points: ${pointsData.todayPoints} today, ${pointsData.totalPoints} total`);
    } else {
      // No profile, use processed data as-is
      pointsData = processedPointsData;
      console.log(`[Overview Service] No profile found, using default points: ${pointsData.todayPoints} today, ${pointsData.totalPoints} total`);
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