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
import { countUnhealthyFoods, calculateUnhealthyFoodPenalty } from '@/data/food-categories';

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
    console.log(`[Overview Service] Loaded ${exerciseLogs.length} exercise logs`);    // Process Points Data
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
      console.log(`[Overview Service] No points document found for user: ${userId} - creating new document`);
      // Create default points data structure and save it to Firestore
      pointsData = {
        todayPoints: 0,
        totalPoints: 0,
        lastUpdated: new Date().toISOString()
      };
      
      try {
        // Create the points document
        await setDoc(doc(db, 'users', userId, 'points', 'current'), pointsData);
        console.log(`[Overview Service] Created new points document for user: ${userId}`);
      } catch (error) {
        console.error(`[Overview Service] Failed to create points document:`, error);
        // Continue with default data even if creation fails
      }
    }

    // Points calculation logic
    const now = new Date();
    const timeDiff = Math.abs(now.getTime() - new Date(pointsData.lastUpdated).getTime());
    const diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24)); // Difference in days

    // If last updated was not today, reset today's points and update lastUpdated
    if (diffDays > 0) {
      pointsData.todayPoints = 0;
      pointsData.lastUpdated = now.toISOString();
      console.log(`[Overview Service] Reset today's points for user: ${userId}, diffDays: ${diffDays}`);
    }

    // Calculate total points based on exercise logs
    let totalExercisePoints = 0;
    for (const log of exerciseLogs) {
      // Simple points calculation: 1 point for every 10 minutes of exercise
      const minutes = (log.duration || 0) / 60;
      totalExercisePoints += Math.floor(minutes / 10);
    }

    // Update points data
    pointsData.todayPoints = (pointsData.todayPoints || 0) + totalExercisePoints;
    pointsData.totalPoints = (pointsData.totalPoints || 0) + totalExercisePoints;

    // Save updated points data to Firestore
    try {
      await setDoc(doc(db, 'users', userId, 'points', 'current'), pointsData, { merge: true });
      console.log(`[Overview Service] Updated points data for user: ${userId}, todayPoints: ${pointsData.todayPoints}, totalPoints: ${pointsData.totalPoints}`);
    } catch (error) {
      console.error(`[Overview Service] Failed to update points data:`, error);
    }

    // --- Calculate Today's Points ---
    // 1. Get today's food logs
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
    const foodLogRef = collection(db, 'users', userId, 'foodLog');
    const foodLogQuery = query(
      foodLogRef,
      where('timestamp', '>=', startOfDay.toISOString()),
      where('timestamp', '<=', endOfDay.toISOString()),
      orderBy('timestamp', 'desc')
    );
    const foodLogSnap = await getDocs(foodLogQuery);
    const todayFoodLogs = foodLogSnap.docs.map(docSnap => docSnap.data());

    // 2. Calculate nutrition progress
    const todayProgress = todayFoodLogs.reduce(
      (totals, log) => ({
        calories: totals.calories + (log.calories || 0),
        protein: totals.protein + (log.protein || 0),
        carbohydrates: totals.carbohydrates + (log.carbohydrates || 0),
        fat: totals.fat + (log.fat || 0),
      }),
      { calories: 0, protein: 0, carbohydrates: 0, fat: 0 }
    );

    // 3. Get daily targets from profile
    const targets = {
      calories: userProfile?.targetCalories || 2000,
      protein: userProfile?.targetProtein || 150,
      carbohydrates: userProfile?.targetCarbs || 250,
      fat: userProfile?.targetFat || 65,
    };

    // 4. Calculate points (same logic as points page)
    let points = 0;
    const caloriesPercent = targets.calories > 0 ? (todayProgress.calories / targets.calories) * 100 : 0;
    const proteinPercent = targets.protein > 0 ? (todayProgress.protein / targets.protein) * 100 : 0;
    const carbsPercent = targets.carbohydrates > 0 ? (todayProgress.carbohydrates / targets.carbohydrates) * 100 : 0;
    const fatPercent = targets.fat > 0 ? (todayProgress.fat / targets.fat) * 100 : 0;
    if (caloriesPercent >= 25) points += 7;
    if (caloriesPercent >= 50) points += 8;
    if (caloriesPercent >= 75) points += 7;
    if (caloriesPercent >= 100) points += 8;
    if (proteinPercent >= 25) points += 6;
    if (proteinPercent >= 50) points += 6;
    if (proteinPercent >= 75) points += 6;
    if (proteinPercent >= 100) points += 7;
    if (carbsPercent >= 25) points += 4;
    if (carbsPercent >= 50) points += 4;
    if (carbsPercent >= 75) points += 3;
    if (carbsPercent >= 100) points += 4;
    if (fatPercent >= 25) points += 3;
    if (fatPercent >= 50) points += 2;
    if (fatPercent >= 75) points += 2;
    if (fatPercent >= 100) points += 3;
    if (caloriesPercent >= 100 && proteinPercent >= 100 && carbsPercent >= 100 && fatPercent >= 100) {
      points += 10;
    }
    const unhealthyFoodCount = countUnhealthyFoods(todayFoodLogs as Array<{ foodItem: string; identifiedFoodName?: string }>);
    const penalty = calculateUnhealthyFoodPenalty(unhealthyFoodCount);
    points -= penalty;
    points = Math.max(0, Math.min(points, 100));

    // 5. Update pointsData if needed
    const todayStr = new Date().toISOString().slice(0, 10);
    if (pointsData.todayPoints !== points || pointsData.lastUpdated !== todayStr) {
      // If new day, add previous todayPoints to totalPoints
      let newTotalPoints = pointsData.totalPoints;
      if (pointsData.lastUpdated !== todayStr) {
        newTotalPoints += pointsData.todayPoints;
      }
      pointsData = {
        todayPoints: points,
        totalPoints: newTotalPoints,
        lastUpdated: todayStr
      };
      await setDoc(doc(db, 'users', userId, 'points', 'current'), pointsData);
      console.log(`[Overview Service] Points updated in Firestore:`, pointsData);
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