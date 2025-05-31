// src/services/firestore/progressService.ts
'use server';

import { db } from '@/lib/firebase/exports';
import { doc, getDoc } from 'firebase/firestore';
import { startOfDay, endOfDay, subDays, format } from 'date-fns';
import { getFoodLogs, getExerciseLogs } from './logService'; // Use log service
import { getWorkoutPlan } from './workoutService'; // Use workout service
import { getUserProfile } from './profileService'; // Import getUserProfile
import type {
    StoredUserProfile, // Add StoredUserProfile
    StoredFoodLogEntry, StoredExerciseLogEntry, WeeklyWorkoutPlan
} from '@/app/dashboard/types';
import { createFirestoreServiceError } from './utils'; // Corrected import path

/**
 * Fetches the latest food and exercise logs for a friend (within a date range).
 * Assumes permission is already granted before calling.
 */
export async function getFriendLatestLogs(friendUserId: string, daysAgo: number = 7): Promise<{ food: StoredFoodLogEntry[], exercise: StoredExerciseLogEntry[] }> {
    if (!friendUserId) throw createFirestoreServiceError("Friend User ID is required.", "invalid-argument");

    const endDate = endOfDay(new Date());
    const startDate = startOfDay(subDays(endDate, daysAgo - 1)); // Fetch for the last 'daysAgo' days

    console.log(`[Progress Service] Fetching latest logs for friend: ${friendUserId} from ${format(startDate, 'yyyy-MM-dd')} to ${format(endDate, 'yyyy-MM-dd')}`);

    try {
        // Note: These calls might trigger index creation errors if not setup
        const [foodLogs, exerciseLogs] = await Promise.all([
            getFoodLogs(friendUserId, startDate, endDate),
            getExerciseLogs(friendUserId, startDate, endDate)
        ]);
        console.log(`[Progress Service] Fetched ${foodLogs.length} food logs and ${exerciseLogs.length} exercise logs for friend ${friendUserId}.`);
        return { food: foodLogs, exercise: exerciseLogs };
    } catch (error) {
        console.error(`[Progress Service] Error fetching latest logs for friend ${friendUserId}:`, error);
        // Propagate index errors specifically if possible
        if ((error as any).code === 'index-required') {
             throw error; // Let the caller handle index creation message
        }
        throw createFirestoreServiceError("Failed to fetch friend's activity.", "fetch-friend-logs-failed");
    }
}

/**
 * Fetches the current workout plan for a friend.
 * Assumes permission is already granted.
 */
export async function getFriendWorkoutPlan(friendUserId: string): Promise<WeeklyWorkoutPlan | null> {
    if (!friendUserId) throw createFirestoreServiceError("Friend User ID is required.", "invalid-argument");
    console.log(`[Progress Service] Fetching workout plan for friend: ${friendUserId}`);
    try {
        // Reuses the existing getWorkoutPlan function
        const plan = await getWorkoutPlan(friendUserId);
        console.log(`[Progress Service] Workout plan ${plan ? 'found' : 'not found'} for friend ${friendUserId}.`);
        return plan;
    } catch (error) {
        console.error(`[Progress Service] Error fetching workout plan for friend ${friendUserId}:`, error);
        throw createFirestoreServiceError("Failed to fetch friend's workout plan.", "fetch-friend-plan-failed");
    }
}

/**
 * Fetches the profile data for a friend.
 * Assumes permission is already granted.
 */
export async function getFriendProfile(friendUserId: string): Promise<StoredUserProfile | null> {
    if (!friendUserId) throw createFirestoreServiceError("Friend User ID is required.", "invalid-argument");
    console.log(`[Progress Service] Fetching profile for friend: ${friendUserId}`);
    try {
        // Use the existing getUserProfile function from profileService
        // Note: getUserProfile now returns StoredUserProfile or throws, not null.
        // Adjust the return type or handle potential errors here.
        const profile = await getUserProfile(friendUserId);
        console.log(`[Progress Service] Profile ${profile ? 'found' : 'not found'} for friend ${friendUserId}.`);
        return profile;
    } catch (error: any) {
         // If getUserProfile throws because the user doesn't exist (e.g., after creation failed)
         if (error.code === 'profile-fetch-create-failed' || error.message.includes('User profile not found')) {
             console.warn(`[Progress Service] Profile not found for friend ${friendUserId}. Returning null.`);
             return null; // Return null if the profile truly doesn't exist
         }
        console.error(`[Progress Service] Error fetching profile for friend ${friendUserId}:`, error);
        // Re-throw other errors
        throw createFirestoreServiceError("Failed to fetch friend's profile.", "fetch-friend-profile-failed");
    }
}