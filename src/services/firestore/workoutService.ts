// src/services/firestore/workoutService.ts
'use server';

import { db } from '@/lib/firebase/exports';
import {
  doc, getDoc, setDoc, updateDoc, deleteField
} from 'firebase/firestore';
import type { WeeklyWorkoutPlan, CompletedWorkoutEntry, CompletedWorkouts, PDFWorkoutReference } from '@/app/dashboard/types';
import { createFirestoreServiceError } from './utils'; // Corrected import path

/**
 * Fetches the user's current workout plan from Firestore.
 */
export async function getWorkoutPlan(userId: string): Promise<WeeklyWorkoutPlan | null> {
    if (!userId) throw createFirestoreServiceError("User ID is required to fetch workout plan.", "invalid-argument");
    console.log(`[Workout Service] Fetching workout plan for user: ${userId}`);
    try {
        const planDocRef = doc(db, 'users', userId, 'workoutPlan', 'current');
        const planSnap = await getDoc(planDocRef);
        if (planSnap.exists()) {
            console.log(`[Workout Service] Workout plan found for user: ${userId}`);
            return planSnap.data() as WeeklyWorkoutPlan;
        } else {
            console.log(`[Workout Service] No workout plan found for user: ${userId}`);
            return null;
        }
    } catch (error) {
        console.error("[Workout Service] Error fetching workout plan:", error);
        throw createFirestoreServiceError("Failed to fetch workout plan.", "fetch-failed");
    }
}

/**
 * Saves the user's workout plan to Firestore.
 */
export async function saveWorkoutPlan(userId: string, plan: WeeklyWorkoutPlan): Promise<void> {
    if (!userId) throw createFirestoreServiceError("User ID is required to save workout plan.", "invalid-argument");
    console.log(`[Workout Service] Saving workout plan for user: ${userId}`);
    try {
        const planDocRef = doc(db, 'users', userId, 'workoutPlan', 'current');
        const sanitizedPlan: WeeklyWorkoutPlan = { ...plan };
        
        // Sanitize exercise data for each day
        const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;
        daysOfWeek.forEach(day => {
            if (Array.isArray(sanitizedPlan[day])) {
                sanitizedPlan[day] = sanitizedPlan[day].map(ex => ({
                    ...ex,
                    sets: ex.sets ?? null, 
                    reps: ex.reps ?? null, 
                    notes: ex.notes ?? "",
                    youtubeLink: ex.youtubeLink ?? null, 
                    weight: ex.weight ?? null, 
                    rpe: ex.rpe ?? null,
                    tempo: ex.tempo ?? "", 
                    tags: Array.isArray(ex.tags) ? ex.tags : [],
                    equipment: Array.isArray(ex.equipment) ? ex.equipment : [],
                }));
            }
        });

        // Sanitize PDF workouts if they exist
        if (sanitizedPlan.pdfWorkouts) {
            const sanitizedPdfWorkouts = { ...sanitizedPlan.pdfWorkouts };
            daysOfWeek.forEach(day => {
                if (Array.isArray(sanitizedPdfWorkouts[day])) {
                    sanitizedPdfWorkouts[day] = sanitizedPdfWorkouts[day].map(pdf => ({
                        id: pdf.id,
                        name: pdf.name || "",
                        category: pdf.category || "",
                        day: pdf.day || 1,
                        filePath: pdf.filePath || "",
                        description: pdf.description || ""
                    }));
                }
            });
            sanitizedPlan.pdfWorkouts = sanitizedPdfWorkouts;
        }

        await setDoc(planDocRef, sanitizedPlan);
        console.log(`[Workout Service] Workout plan saved successfully for user: ${userId}`);
    } catch (error) {
        console.error("[Workout Service] Error saving workout plan:", error);
        throw createFirestoreServiceError("Failed to save workout plan.", "save-failed");
    }
}

/**
 * Fetches completed workout status for a specific date from Firestore.
 */
export async function getCompletedWorkoutsForDate(userId: string, dateKey: string): Promise<CompletedWorkouts> {
    if (!userId) throw createFirestoreServiceError("User ID is required to fetch completed workouts.", "invalid-argument");
    console.log(`[Workout Service] Fetching completed workouts for user ${userId} on date ${dateKey}`);
    try {
        const dateDocRef = doc(db, 'users', userId, 'completedWorkouts', dateKey);
        const dateSnap = await getDoc(dateDocRef);
        if (dateSnap.exists()) {
            console.log(`[Workout Service] Found completed workouts document for ${dateKey}`);
            const data = dateSnap.data();
            const completedWorkouts: CompletedWorkouts = {};
            for (const exerciseName in data) {
                completedWorkouts[exerciseName] = {
                    completed: data[exerciseName]?.completed ?? false,
                    timestamp: data[exerciseName]?.timestamp ?? new Date().toISOString(),
                    logId: data[exerciseName]?.logId ?? null,
                    loggedCalories: data[exerciseName]?.loggedCalories ?? null,
                    isEstimated: data[exerciseName]?.isEstimated ?? null,
                };
            }
            return completedWorkouts;
        } else {
            console.log(`[Workout Service] No completed workouts document found for ${dateKey}. Returning empty object.`);
            return {};
        }
    } catch (error) {
        console.error(`[Workout Service] Error fetching completed workouts for ${dateKey}:`, error);
        throw createFirestoreServiceError("Failed to fetch completed workouts.", "fetch-failed");
    }
}

/**
 * Saves or updates the completion status of a specific workout for a given date.
 */
export async function saveCompletedWorkout(userId: string, dateKey: string, exerciseName: string, data: CompletedWorkoutEntry): Promise<void> {
    if (!userId) throw createFirestoreServiceError("User ID is required to save completed workout.", "invalid-argument");
    console.log(`[Workout Service] Saving completed workout status for "${exerciseName}" on ${dateKey} for user ${userId}`);
    try {
        const dateDocRef = doc(db, 'users', userId, 'completedWorkouts', dateKey);
        const dataToSave: CompletedWorkoutEntry = {
            completed: data.completed, timestamp: data.timestamp,
            logId: data.logId ?? null, loggedCalories: data.loggedCalories ?? null,
            isEstimated: data.isEstimated ?? null,
        };
        const fieldKey = exerciseName.includes('.') || exerciseName.includes('/') ? `\`${exerciseName}\`` : exerciseName;
        await setDoc(dateDocRef, { [fieldKey]: dataToSave }, { merge: true });
        console.log(`[Workout Service] Completed workout status saved successfully for "${exerciseName}" on ${dateKey}.`);
    } catch (error) {
        console.error(`[Workout Service] Error saving completed workout status for "${exerciseName}" on ${dateKey}:`, error);
        throw createFirestoreServiceError("Failed to save completed workout status.", "save-failed");
    }
}

/**
 * Deletes the completion status of a specific workout for a given date.
 */
export async function deleteCompletedWorkout(userId: string, dateKey: string, exerciseName: string): Promise<void> {
    if (!userId) throw createFirestoreServiceError("User ID is required to delete completed workout status.", "invalid-argument");
    console.log(`[Workout Service] Deleting completed workout status for "${exerciseName}" on ${dateKey} for user ${userId}`);
    try {
        const dateDocRef = doc(db, 'users', userId, 'completedWorkouts', dateKey);
        const fieldKey = exerciseName.includes('.') || exerciseName.includes('/') ? `\`${exerciseName}\`` : exerciseName;
        await updateDoc(dateDocRef, { [fieldKey]: deleteField() });
        console.log(`[Workout Service] Completed workout status field removed successfully for "${exerciseName}" on ${dateKey}.`);
    } catch (error: any) {
        if (error.code === 'not-found' || (error.code === 'invalid-argument' && error.message.includes('No document to update'))) {
             console.log(`[Workout Service] Document or field for "${exerciseName}" on ${dateKey} not found, nothing to delete.`);
         } else {
             console.error(`[Workout Service] Error deleting completed workout status field for "${exerciseName}" on ${dateKey}:`, error);
             throw createFirestoreServiceError("Failed to delete completed workout status.", "delete-failed");
         }
    }
}