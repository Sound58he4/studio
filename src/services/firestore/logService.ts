// src/services/firestore/logService.ts
'use server';

import { db } from '@/lib/firebase/exports';
import {
  collection, query, where, getDocs, addDoc, deleteDoc,
  orderBy, Timestamp, writeBatch, limit, doc, runTransaction,
  serverTimestamp,
  increment, // Direct import for modular SDK
  documentId // For querying by document ID
} from 'firebase/firestore';
import type {
    StoredFoodLogEntry, StoredExerciseLogEntry,
    FirestoreFoodLogData, FirestoreExerciseLogData, DailyNutritionSummary
} from '@/app/dashboard/types';
import { createFirestoreServiceError } from './utils';
import { format, parseISO, isToday as dateFnsIsToday } from 'date-fns';

export async function getFoodLogs(userId: string, startDate: Date, endDate: Date): Promise<StoredFoodLogEntry[]> {
    if (!userId) throw createFirestoreServiceError("User ID is required to fetch food logs.", "invalid-argument");
    console.log(`[Log Service] Fetching food logs for user ${userId} from ${startDate.toISOString()} to ${endDate.toISOString()}`);
    try {
        const foodLogRef = collection(db, 'users', userId, 'foodLog');
        const startISO = startDate.toISOString();
        const endISO = endDate.toISOString();
        const foodLogQuery = query(foodLogRef, where('timestamp', '>=', startISO), where('timestamp', '<=', endISO), orderBy('timestamp', 'desc'));
        const foodLogSnap = await getDocs(foodLogQuery);
        const logs = foodLogSnap.docs.map(docSnap => {
            const data = docSnap.data();
            return {
                id: docSnap.id,
                foodItem: data.foodItem,
                identifiedFoodName: data.identifiedFoodName,
                calories: data.calories ?? 0,
                protein: data.protein ?? 0,
                carbohydrates: data.carbohydrates ?? 0,
                fat: data.fat ?? 0,
                timestamp: data.timestamp, // Keep as ISO string from Firestore
                logMethod: data.logMethod,
                originalDescription: data.originalDescription,
            } as StoredFoodLogEntry;
        });
        console.log(`[Log Service] Fetched ${logs.length} food logs.`);
        return logs;
    } catch (error: any) {
         if (error.code === 'failed-precondition' && error.message.includes('query requires an index')) {
            const indexUrl = `https://console.firebase.google.com/v1/r/project/${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}/firestore/indexes?create_composite=ClVwcm9qZWN0cy9udXRyaXRyYW5zZm9ybS1haS9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvZm9vZERvZ2cvaW5kZXhlcy9fEAEaDQoJdGltZXN0YW1wEAIaDAoIX19uYW1lX18QAQ`;
            const errorMessage = `Firestore index required for food log query (timestamp desc). Create it here: ${indexUrl}`;
            console.error(errorMessage);
            throw createFirestoreServiceError(errorMessage, "index-required");
         }
        console.error("[Log Service] Error fetching food logs:", error);
        throw createFirestoreServiceError("Failed to fetch food logs.", "fetch-failed");
    }
}

export async function addFoodLog(userId: string, logData: FirestoreFoodLogData): Promise<string> {
    if (!userId) throw createFirestoreServiceError("User ID is required to add food log.", "invalid-argument");
    console.log(`[Log Service] Adding food log for user: ${userId}`, logData);

    const logTimestamp = (logData.timestamp instanceof Date) ? logData.timestamp : parseISO(logData.timestamp as string || new Date().toISOString());
    const logDateStr = format(logTimestamp, 'yyyy-MM-dd');
    const isCurrentDayLog = dateFnsIsToday(logTimestamp);

    const individualLogRef = doc(collection(db, 'users', userId, 'foodLog'));
    const dailySummaryRef = doc(db, 'users', userId, 'dailyNutritionSummaries', logDateStr);
    const userProfileRef = doc(db, 'users', userId);

    const calories = Number(logData.calories ?? 0);
    const protein = Number(logData.protein ?? 0);
    const carbohydrates = Number(logData.carbohydrates ?? 0);
    const fat = Number(logData.fat ?? 0);

    try {
        const newLogId = await runTransaction(db, async (transaction) => {
            // --- READ PHASE ---
            const dailySummarySnap = await transaction.get(dailySummaryRef);
            let userProfileSnap = null;
            if (isCurrentDayLog) {
                userProfileSnap = await transaction.get(userProfileRef);
            }

            // --- WRITE PHASE ---
            const dataToSave: Omit<FirestoreFoodLogData, 'timestamp'> & { timestamp: string } = {
                foodItem: logData.foodItem, calories, protein, carbohydrates, fat,
                timestamp: logTimestamp.toISOString(),
                logMethod: logData.logMethod ?? 'manual',
                ...(logData.identifiedFoodName && { identifiedFoodName: logData.identifiedFoodName }),
                ...(logData.originalDescription && { originalDescription: logData.originalDescription })
            };
            transaction.set(individualLogRef, dataToSave);

            const summaryIncrementData = {
                totalCalories: increment(calories),
                totalProtein: increment(protein),
                totalCarbohydrates: increment(carbohydrates),
                totalFat: increment(fat),
                entryCount: increment(1),
                lastUpdated: serverTimestamp()
            };

            if (dailySummarySnap.exists()) {
                transaction.update(dailySummaryRef, summaryIncrementData);
            } else {
                // If creating, set initial values directly from the log
                transaction.set(dailySummaryRef, {
                    totalCalories: calories,
                    totalProtein: protein,
                    totalCarbohydrates: carbohydrates,
                    totalFat: fat,
                    entryCount: 1,
                    lastUpdated: serverTimestamp()
                });
            }

            if (isCurrentDayLog) {
                 if (userProfileSnap && userProfileSnap.exists()) {
                    transaction.update(userProfileRef, {
                        todayCalories: increment(calories),
                        todayProtein: increment(protein),
                        todayCarbohydrates: increment(carbohydrates),
                        todayFat: increment(fat),
                        todayEntryCount: increment(1),
                        todayLastUpdated: serverTimestamp()
                    });
                 } else {
                     console.warn(`[Log Service] User profile ${userId} not found during addFoodLog transaction. Today's stats on profile not updated.`);
                 }
            }
            return individualLogRef.id;
        });
        console.log(`[Log Service] Food log added with ID: ${newLogId} and summaries updated.`);
        return newLogId;
    } catch (error:any) {
        console.error("[Log Service] Error in addFoodLog transaction:", error);
        throw createFirestoreServiceError(`Failed to add food log and update summaries. Reason: ${error.message}`, "transaction-failed");
    }
}

export async function getExerciseLogs(userId: string, startDate: Date, endDate: Date): Promise<StoredExerciseLogEntry[]> {
    if (!userId) throw createFirestoreServiceError("User ID is required to fetch exercise logs.", "invalid-argument");
     console.log(`[Log Service] Fetching exercise logs for user ${userId} from ${startDate.toISOString()} to ${endDate.toISOString()}`);
    try {
        const exerciseLogRef = collection(db, 'users', userId, 'exerciseLog');
        const startISO = startDate.toISOString();
        const endISO = endDate.toISOString();
        const exerciseLogQuery = query(exerciseLogRef, where('timestamp', '>=', startISO), where('timestamp', '<=', endISO), orderBy('timestamp', 'desc'));
        const exerciseLogSnap = await getDocs(exerciseLogQuery);
        const logs = exerciseLogSnap.docs.map(docSnap => {
            const data = docSnap.data();
            return {
                id: docSnap.id,
                exerciseName: data.exerciseName,
                exerciseType: data.exerciseType,
                timestamp: data.timestamp, // Keep as ISO string
                duration: data.duration,
                distance: data.distance,
                sets: data.sets,
                reps: data.reps,
                weight: data.weight,
                estimatedCaloriesBurned: data.estimatedCaloriesBurned,
                notes: data.notes,
            } as StoredExerciseLogEntry;
        });
        console.log(`[Log Service] Fetched ${logs.length} exercise logs.`);
        return logs;
    } catch (error: any) {
        if (error.code === 'failed-precondition' && error.message.includes('query requires an index')) {
            const indexUrl = `https://console.firebase.google.com/v1/r/project/${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}/firestore/indexes?create_composite=ClVwcm9qZWN0cy9udXRyaXRyYW5zZm9ybS1haS9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvZXhlcmNpc2VMb2cvaW5kZXhlcy9fEAEaDQoJdGltZXN0YW1wEAIaDAoIX19uYW1lX18QAQ`;
            const errorMessage = `Firestore index required for exercise log query (timestamp desc). Create it here: ${indexUrl}`;
            console.error(errorMessage);
            throw createFirestoreServiceError(errorMessage, "index-required");
        }
        console.error("[Log Service] Error fetching exercise logs:", error);
        throw createFirestoreServiceError("Failed to fetch exercise logs.", "fetch-failed");
    }
}

export async function addExerciseLog(userId: string, logData: FirestoreExerciseLogData): Promise<string> {
    if (!userId) throw createFirestoreServiceError("User ID is required to add exercise log.", "invalid-argument");
    console.log(`[Log Service] Adding exercise log for user: ${userId}`, logData);
    try {
        const exerciseLogRef = collection(db, 'users', userId, 'exerciseLog');
        const dataToSave: { [key: string]: any } = {
            exerciseName: logData.exerciseName, exerciseType: logData.exerciseType,
            timestamp: (logData.timestamp instanceof Date) ? logData.timestamp.toISOString() : (logData.timestamp || new Date().toISOString()),
        };
        dataToSave.duration = (logData.duration !== undefined && logData.duration !== null && !isNaN(logData.duration)) ? Number(logData.duration) : null;
        dataToSave.distance = (logData.distance !== undefined && logData.distance !== null && !isNaN(logData.distance)) ? Number(logData.distance) : null;
        dataToSave.sets = (logData.sets !== undefined && logData.sets !== null && !isNaN(Number(logData.sets))) ? Number(logData.sets) : null;
        dataToSave.reps = (logData.reps !== undefined && logData.reps !== null) ? String(logData.reps) : null;
        dataToSave.weight = (logData.weight !== undefined && logData.weight !== null && !isNaN(Number(logData.weight))) ? Number(logData.weight) : null;
        dataToSave.estimatedCaloriesBurned = (logData.estimatedCaloriesBurned !== undefined && logData.estimatedCaloriesBurned !== null && !isNaN(logData.estimatedCaloriesBurned)) ? Math.round(logData.estimatedCaloriesBurned) : null;

        if (logData.notes && logData.notes.trim() !== "") dataToSave.notes = logData.notes;

        const docRef = await addDoc(exerciseLogRef, dataToSave);
        console.log(`[Log Service] Exercise log added with ID: ${docRef.id}`);
        return docRef.id;
    } catch (error) {
        console.error("[Log Service] Error adding exercise log:", error);
        throw createFirestoreServiceError("Failed to add exercise log.", "add-failed");
    }
}

export async function deleteLogEntry(userId: string, collectionName: 'foodLog' | 'exerciseLog', docId: string): Promise<void> {
    if (!userId) throw createFirestoreServiceError("User ID is required to delete log entry.", "invalid-argument");
    if (!docId) throw createFirestoreServiceError("Document ID is required to delete log entry.", "invalid-argument");
    console.log(`[Log Service] Deleting ${collectionName} entry with ID: ${docId} for user: ${userId}`);

    const individualLogRef = doc(db, 'users', userId, collectionName, docId);

    try {
        await runTransaction(db, async (transaction) => {
            // --- READ PHASE ---
            const logSnap = await transaction.get(individualLogRef); // READ 1: The log entry itself

            if (!logSnap.exists()) {
                console.warn(`[Log Service] Log entry ${docId} not found in ${collectionName}, cannot delete or update summaries.`);
                return; // Exit transaction if log doesn't exist
            }
            const logEntryData = logSnap.data();
            if (!logEntryData) {
                 console.warn(`[Log Service] Log entry data missing for ${docId} in ${collectionName}.`);
                 return; // Exit if data is somehow missing
            }

            let dailySummarySnap = null;
            let userProfileSnap = null;
            let isCurrentDayLog = false;
            let logDateStr = '';
            const dailySummaryRef = null; // Will be defined inside the if block

            if (collectionName === 'foodLog') {
                const logTimestamp = parseISO(logEntryData.timestamp as string);
                logDateStr = format(logTimestamp, 'yyyy-MM-dd');
                isCurrentDayLog = dateFnsIsToday(logTimestamp);
                
                const summaryDocRef = doc(db, 'users', userId, 'dailyNutritionSummaries', logDateStr);
                dailySummarySnap = await transaction.get(summaryDocRef); // READ 2 (conditional for foodLog)

                if (isCurrentDayLog) {
                    const userProfileRef = doc(db, 'users', userId);
                    userProfileSnap = await transaction.get(userProfileRef); // READ 3 (conditional for foodLog and today)
                }
            }

            // --- WRITE PHASE ---
            transaction.delete(individualLogRef); // WRITE 1: Delete the actual log entry

            if (collectionName === 'foodLog') {
                const calories = Number(logEntryData.calories ?? 0);
                const protein = Number(logEntryData.protein ?? 0);
                const carbohydrates = Number(logEntryData.carbohydrates ?? 0);
                const fat = Number(logEntryData.fat ?? 0);

                if (dailySummarySnap && dailySummarySnap.exists()) { // Check if summary snap was read and exists
                    const decrementData = {
                        totalCalories: increment(-calories),
                        totalProtein: increment(-protein),
                        totalCarbohydrates: increment(-carbohydrates),
                        totalFat: increment(-fat),
                        entryCount: increment(-1),
                        lastUpdated: serverTimestamp()
                    };
                    transaction.update(dailySummarySnap.ref, decrementData); // WRITE 2 (conditional)
                } else {
                    console.warn(`[Log Service] Daily summary for ${logDateStr} not found or not read during delete. Cannot decrement values.`);
                }

                if (isCurrentDayLog) {
                    if (userProfileSnap && userProfileSnap.exists()) { // Check if profile snap was read and exists
                        transaction.update(userProfileSnap.ref, { // WRITE 3 (conditional)
                            todayCalories: increment(-calories),
                            todayProtein: increment(-protein),
                            todayCarbohydrates: increment(-carbohydrates),
                            todayFat: increment(-fat),
                            todayEntryCount: increment(-1),
                            todayLastUpdated: serverTimestamp()
                        });
                    } else {
                         console.warn(`[Log Service] User profile ${userId} not found or not read during delete for today's log. Today's stats on profile not updated.`);
                    }
                }
            }
        });
        console.log(`[Log Service] Log entry ${docId} from ${collectionName} deleted successfully and summaries updated if applicable.`);
    } catch (error: any) {
        console.error(`[Log Service] Error in deleteLogEntry transaction for ${docId} in ${collectionName}:`, error);
        throw createFirestoreServiceError(`Failed to delete ${collectionName} entry and update summaries. Reason: ${error.message}`, "transaction-failed");
    }
}


export async function clearAllLogs(userId: string, collectionName: 'foodLog' | 'exerciseLog'): Promise<void> {
    if (!userId) throw createFirestoreServiceError("User ID is required to clear logs.", "invalid-argument");
    console.log(`[Log Service] Clearing all ${collectionName} entries for user: ${userId}`);
    try {
        const logCollectionRef = collection(db, 'users', userId, collectionName);
        let logSnap = await getDocs(query(logCollectionRef, limit(500)));

        while(!logSnap.empty) {
            const batch = writeBatch(db);
            logSnap.docs.forEach((docSnapshot) => { batch.delete(docSnapshot.ref); });
            await batch.commit();
            console.log(`[Log Service] Cleared a batch of ${logSnap.size} ${collectionName} entries.`);
            if (logSnap.size < 500) break; // Exit if last batch was not full
            logSnap = await getDocs(query(logCollectionRef, limit(500)));
        }

        if (collectionName === 'foodLog') {
            const dailySummariesRef = collection(db, 'users', userId, 'dailyNutritionSummaries');
            let summarySnap = await getDocs(query(dailySummariesRef, limit(500)));
            while(!summarySnap.empty) {
                const batch = writeBatch(db);
                summarySnap.docs.forEach((docSnapshot) => { batch.delete(docSnapshot.ref); });
                await batch.commit();
                console.log(`[Log Service] Cleared a batch of ${summarySnap.size} dailyNutritionSummaries.`);
                 if (summarySnap.size < 500) break; // Exit if last batch was not full
                summarySnap = await getDocs(query(dailySummariesRef, limit(500)));
            }

            const userProfileRef = doc(db, 'users', userId);
            // Check if profile exists before updating, though usually it should
            const userProfileSnap = await getDoc(userProfileRef);
            if (userProfileSnap.exists()){
                await updateDoc(userProfileRef, {
                    todayCalories: 0, todayProtein: 0, todayCarbohydrates: 0, todayFat: 0,
                    todayEntryCount: 0, todayLastUpdated: serverTimestamp()
                });
                console.log(`[Log Service] Reset today's nutritional counts in user profile.`);
            } else {
                console.warn(`[Log Service] User profile ${userId} not found during clearAllLogs. Today's stats not reset on profile.`);
            }
        }
        console.log(`[Log Service] All ${collectionName} entries (and related summaries if food) cleared successfully.`);
    } catch (error: any) {
        console.error(`[Log Service] Error clearing ${collectionName} history:`, error);
        throw createFirestoreServiceError(`Failed to clear ${collectionName} history. Reason: ${error.message}`, "clear-failed");
    }
}

export async function getDailyNutritionSummaries(userId: string, startDate: Date, endDate: Date): Promise<DailyNutritionSummary[]> {
    if (!userId) throw createFirestoreServiceError("User ID is required.", "invalid-argument");
    console.log(`[Log Service] Fetching daily nutrition summaries for user ${userId} from ${format(startDate, 'yyyy-MM-dd')} to ${format(endDate, 'yyyy-MM-dd')}`);

    const summaries: DailyNutritionSummary[] = [];
    try {
        const summariesRef = collection(db, 'users', userId, 'dailyNutritionSummaries');
        const q = query(summariesRef,
            where(documentId(), ">=", format(startDate, 'yyyy-MM-dd')),
            where(documentId(), "<=", format(endDate, 'yyyy-MM-dd')),
            orderBy(documentId()) // Explicitly order by document ID
        );

        const querySnapshot = await getDocs(q);

        querySnapshot.forEach(docSnap => {
            const data = docSnap.data();
            summaries.push({
                id: docSnap.id,
                totalCalories: Number(data.totalCalories ?? 0),
                totalProtein: Number(data.totalProtein ?? 0),
                totalCarbohydrates: Number(data.totalCarbohydrates ?? 0),
                totalFat: Number(data.totalFat ?? 0),
                entryCount: Number(data.entryCount ?? 0),
                lastUpdated: (data.lastUpdated instanceof Timestamp ? data.lastUpdated.toDate().toISOString() : data.lastUpdated) || new Date().toISOString(),
            });
        });
        console.log(`[Log Service] Fetched ${summaries.length} daily nutrition summaries.`);
        return summaries.sort((a, b) => (a.id ?? "").localeCompare(b.id ?? ""));
    } catch (error: any) {
        console.error("[Log Service] Error fetching daily nutrition summaries:", error);
        throw createFirestoreServiceError(
            `Failed to fetch daily nutrition summaries. Firestore Error: ${error.message || 'Unknown'} (Code: ${error.code || 'N/A'})`,
            "fetch-failed"
        );
    }
}
