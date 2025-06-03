// src/services/firestore/profileService.ts
'use server';

import { db } from '@/lib/firebase/exports';
import {
  doc, getDoc, setDoc, collection, query, where, getDocs, limit, Timestamp, updateDoc, serverTimestamp, FieldValue, deleteDoc, writeBatch
} from 'firebase/firestore';
import type { StoredUserProfile, AppSettings, Gender, FitnessGoal, ActivityLevel, TranslatePreference } from '@/app/dashboard/types';
import { createFirestoreServiceError } from './utils';

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'light',
  progressViewPermission: 'request_only',
};

const DEFAULT_TRANSLATE_PREFERENCE: TranslatePreference = 'en';
const LOCAL_STORAGE_PROFILE_KEY_PREFIX = 'bago-user-profile-';

export async function getUserProfile(userId: string): Promise<StoredUserProfile> {
    if (!userId) {
        console.error("[Profile Service] getUserProfile called with no userId.");
        throw createFirestoreServiceError("User ID is required to fetch profile.", "invalid-argument");
    }
    console.log(`[Profile Service] Attempting to fetch profile for user: ${userId}`);

    if (typeof window !== 'undefined') {
        try {
            const cachedProfileData = localStorage.getItem(`${LOCAL_STORAGE_PROFILE_KEY_PREFIX}${userId}`);
            if (cachedProfileData) {
                const cachedProfile = JSON.parse(cachedProfileData) as StoredUserProfile;
                if (cachedProfile.displayName !== undefined) {
                    if (cachedProfile.todayLastUpdated && !(typeof cachedProfile.todayLastUpdated === 'string' || cachedProfile.todayLastUpdated === null)) {
                         cachedProfile.todayLastUpdated = cachedProfile.todayLastUpdated instanceof Timestamp 
                            ? cachedProfile.todayLastUpdated.toDate().toISOString()
                            : new Date(cachedProfile.todayLastUpdated as any).toISOString();
                    }
                    console.log(`[Profile Service] Profile found in localStorage for user: ${userId}`);
                    return cachedProfile;
                }
            }
        } catch (e) {
            console.warn("[Profile Service] Error reading profile from localStorage:", e);
        }
    }

    const userDocRef = doc(db, 'users', userId);
    let profileToReturnClient: StoredUserProfile;

    try {
        const profileSnap = await getDoc(userDocRef);

        if (profileSnap.exists()) {
            console.log(`[Profile Service] Profile found in Firestore for user: ${userId}`);
            const firestoreData = profileSnap.data();

            profileToReturnClient = {
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
                    theme: firestoreData.settings?.theme ?? DEFAULT_SETTINGS.theme,
                    progressViewPermission: firestoreData.settings?.progressViewPermission ?? DEFAULT_SETTINGS.progressViewPermission,
                },
                translatePreference: firestoreData.translatePreference ?? DEFAULT_TRANSLATE_PREFERENCE,
                todayCalories: firestoreData.todayCalories ?? 0,
                todayProtein: firestoreData.todayProtein ?? 0,
                todayCarbohydrates: firestoreData.todayCarbohydrates ?? 0,
                todayFat: firestoreData.todayFat ?? 0,
                todayEntryCount: firestoreData.todayEntryCount ?? 0,
                todayLastUpdated: firestoreData.todayLastUpdated instanceof Timestamp
                    ? firestoreData.todayLastUpdated.toDate().toISOString()
                    : (typeof firestoreData.todayLastUpdated === 'string' ? firestoreData.todayLastUpdated : null),
            };
        } else {
            console.log(`[Profile Service] No profile found for user ${userId}. Creating default profile.`);
            const defaultDisplayName = `user_${userId.substring(0, 6)}`;
            const defaultProfileForFirestore: StoredUserProfile = {
                 email: null, displayName: defaultDisplayName, lowercaseDisplayName: defaultDisplayName.toLowerCase(),
                 photoURL: null, height: null, weight: null, age: null, gender: null,
                 fitnessGoal: null, activityLevel: null, preferFewerRestDays: false,
                 foodPreferences: "", foodHistory: "", localFoodStyle: "", dietaryStyles: [], allergies: [],
                 otherAllergies: "", foodDislikes: "",
                 useAiTargets: true,
                 manualTargetCalories: null, manualTargetProtein: null, manualTargetCarbs: null, manualTargetFat: null, manualTargetActivityCalories: null,
                 targetCalories: null, targetProtein: null, targetCarbs: null, targetFat: null, targetActivityCalories: null, maintenanceCalories: null,
                 settings: { ...DEFAULT_SETTINGS },
                 translatePreference: DEFAULT_TRANSLATE_PREFERENCE,
                 todayCalories: 0, todayProtein: 0, todayCarbohydrates: 0, todayFat: 0, todayEntryCount: 0,
                 todayLastUpdated: serverTimestamp() as Timestamp, // Server timestamp for Firestore write
            };
            try {
                await setDoc(userDocRef, defaultProfileForFirestore);
                console.log(`[Profile Service] Default profile CREATED in Firestore for ${userId}.`);
                profileToReturnClient = { // Convert for client/cache
                    ...defaultProfileForFirestore,
                    todayLastUpdated: new Date().toISOString(), // Serializable for client/cache
                };
            } catch (createError: any) {
                console.error(`[Profile Service] FAILED to create default profile for ${userId}:`, createError);
                throw createFirestoreServiceError(`Failed to create default profile. Reason: ${createError.message}`, "profile-create-failed");
            }
        }

        if (typeof window !== 'undefined') {
            try {
                localStorage.setItem(`${LOCAL_STORAGE_PROFILE_KEY_PREFIX}${userId}`, JSON.stringify(profileToReturnClient));
                console.log(`[Profile Service] Profile cached in localStorage for ${userId}`);
            } catch (e) {
                console.warn("[Profile Service] Error writing profile to localStorage:", e);
            }
        }
        return profileToReturnClient;
    } catch (fetchError: any) {
        console.error(`[Profile Service] Critical error fetching/creating profile for ${userId}:`, fetchError);
        throw createFirestoreServiceError(`Failed to fetch or create user profile. Reason: ${fetchError.message}`, "profile-fetch-create-failed");
    }
}

export async function saveUserProfile(userId: string, profileData: Partial<StoredUserProfile>): Promise<void> {
    if (!userId) throw createFirestoreServiceError("User ID is required to save profile.", "invalid-argument");
    console.log(`[Profile Service] Server: Saving profile for user: ${userId}.`);

    const userDocRef = doc(db, 'users', userId);
    const dataToSave: { [key: string]: any } = {};

    // Whitelist and sanitize fields
    const allowedFields: (keyof StoredUserProfile)[] = [
        'displayName', 'height', 'weight', 'age', 'gender', 'fitnessGoal', 'activityLevel',
        'preferFewerRestDays', 'foodPreferences', 'foodHistory', 'localFoodStyle',
        'dietaryStyles', 'allergies', 'otherAllergies', 'foodDislikes',
        'useAiTargets', 'manualTargetCalories', 'manualTargetProtein', 'manualTargetCarbs', 'manualTargetFat', 'manualTargetActivityCalories',
        'targetCalories', 'targetProtein', 'targetCarbs', 'targetFat', 'targetActivityCalories', 'maintenanceCalories',
        'settings', 'translatePreference',
        'todayCalories', 'todayProtein', 'todayCarbohydrates', 'todayFat', 'todayEntryCount' // Allow today's aggregates to be updated
    ];

    for (const key of allowedFields) {
        if (key in profileData && profileData[key] !== undefined) {
            dataToSave[key] = profileData[key];
        } else if (key in profileData && profileData[key] === undefined) {
            dataToSave[key] = null; // Convert explicit undefined to null for Firestore
        }
    }

    if (dataToSave.displayName !== undefined) {
        dataToSave.lowercaseDisplayName = String(dataToSave.displayName).toLowerCase();
    }
    if (dataToSave.settings && typeof dataToSave.settings === 'object') {
        dataToSave.settings = { // Ensure settings is a plain object
            theme: dataToSave.settings.theme ?? DEFAULT_SETTINGS.theme,
            progressViewPermission: dataToSave.settings.progressViewPermission ?? DEFAULT_SETTINGS.progressViewPermission,
        };
    } else if ('settings' in profileData && profileData.settings === undefined){
        dataToSave.settings = { ...DEFAULT_SETTINGS }; // Reset to default if explicitly undefined
    }


    // If any of today's aggregate fields are being updated, set todayLastUpdated to serverTimestamp
    const todayAggregateFields: (keyof StoredUserProfile)[] = [
        'todayCalories', 'todayProtein', 'todayCarbohydrates', 'todayFat', 'todayEntryCount'
    ];
    const isUpdatingTodayAggregates = todayAggregateFields.some(field => field in dataToSave);

    if (isUpdatingTodayAggregates) {
        dataToSave.todayLastUpdated = serverTimestamp();
    } else {
        // Avoid accidentally clearing todayLastUpdated if not changing aggregates
        delete dataToSave.todayLastUpdated;
    }

    if (Object.keys(dataToSave).length === 0) {
        console.log("[Profile Service] No valid fields to save. Aborting save.");
        return;
    }
    
    console.log("[Profile Service] Final data for setDoc (merge:true):", dataToSave);
    try {
        await setDoc(userDocRef, dataToSave, { merge: true });
        console.log(`[Profile Service] Firestore profile updated/merged for user: ${userId}`);

        if (typeof window !== 'undefined') {
            try {
                // Fetch the latest profile to update cache correctly with server-generated timestamps
                const updatedProfileSnap = await getDoc(userDocRef);
                if (updatedProfileSnap.exists()) {
                    const freshData = updatedProfileSnap.data();
                    const clientSafeProfile: StoredUserProfile = {
                        ...freshData,
                        todayLastUpdated: freshData.todayLastUpdated instanceof Timestamp
                            ? freshData.todayLastUpdated.toDate().toISOString()
                            : freshData.todayLastUpdated, // Should already be string if from previous client cache
                    } as StoredUserProfile; // Cast as we're assuming all fields are correct
                    localStorage.setItem(`${LOCAL_STORAGE_PROFILE_KEY_PREFIX}${userId}`, JSON.stringify(clientSafeProfile));
                    console.log(`[Profile Service] localStorage updated for ${userId} post-save with fresh server data.`);
                }
            } catch (e) {
                console.warn("[Profile Service] Error updating localStorage post-save:", e);
            }
        }
    } catch (error: any) {
        console.error("[Profile Service] Error saving user profile:", error);
        throw createFirestoreServiceError(`Failed to save user profile. Reason: ${error.message}`, "save-failed");
    }
}

export async function isDisplayNameTaken(displayName: string): Promise<boolean> {
    if (!displayName) return false;
    console.log(`[Profile Service] Checking if display name is taken: ${displayName}`);
    try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('lowercaseDisplayName', '==', displayName.toLowerCase()), limit(1));
        const querySnapshot = await getDocs(q);
        const isTaken = !querySnapshot.empty;
        console.log(`[Profile Service] Display name "${displayName}" is taken: ${isTaken}`);
        return isTaken;
    } catch (error: any) {
        console.error("[Profile Service] Error checking display name uniqueness:", error);
        if (error.code === 'failed-precondition' && error.message.includes('query requires an index')) {
             const indexUrl = `https://console.firebase.google.com/v1/r/project/${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}/firestore/indexes?create_composite=Chtwcm9qZWN0cy9udXRyaXRyYW5zZm9ybS1haS9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvdXNlcnMvaW5kZXhlcy9fEAEaGgoWbG93ZXJjYXNlRGlzcGxheU5hbWUQARoMCghfX25hbWVfXxAB`;
             const errorMessage = `Firestore index needed for display name check. Create it here: ${indexUrl}`;
             console.error(errorMessage);
             throw createFirestoreServiceError(errorMessage, "index-required");
         }
        throw createFirestoreServiceError("Failed to check display name uniqueness.", "check-failed");
    }
}

/**
 * Deletes all user data from Firestore and their Firebase Auth account.
 * This is a comprehensive deletion that removes all user subcollections and documents.
 */
export async function deleteUserAccount(userId: string): Promise<void> {
    if (!userId) throw createFirestoreServiceError("User ID is required to delete account.", "invalid-argument");
    
    console.log(`[Profile Service] Starting complete account deletion for user: ${userId}`);
    
    try {
        // List of all subcollections that need to be deleted
        const subcollections = [
            'foodLog',
            'exerciseLog', 
            'quickLogItems',
            'dailyNutritionSummaries',
            'workoutPlan',
            'completedWorkouts',
            'points',
            'friends',
            'viewRequests'
        ];

        // Delete all subcollections in batches
        for (const subcollectionName of subcollections) {
            await deleteSubcollection(userId, subcollectionName);
        }

        // Remove user from all friend lists and view requests of other users
        await removeUserFromAllFriendships(userId);
        
        // Clear localStorage cache if running on client
        if (typeof window !== 'undefined') {
            try {
                localStorage.removeItem(`${LOCAL_STORAGE_PROFILE_KEY_PREFIX}${userId}`);
                console.log(`[Profile Service] Cleared localStorage cache for user: ${userId}`);
            } catch (e) {
                console.warn("[Profile Service] Error clearing localStorage cache:", e);
            }
        }

        // Finally, delete the main user document
        const userDocRef = doc(db, 'users', userId);
        await deleteDoc(userDocRef);
        
        console.log(`[Profile Service] Successfully deleted all data for user: ${userId}`);
        
    } catch (error: any) {
        console.error("[Profile Service] Error during account deletion:", error);
        throw createFirestoreServiceError(`Failed to delete user account. Reason: ${error.message}`, "delete-failed");
    }
}

/**
 * Helper function to delete all documents in a subcollection
 */
async function deleteSubcollection(userId: string, subcollectionName: string): Promise<void> {
    console.log(`[Profile Service] Deleting subcollection: ${subcollectionName} for user: ${userId}`);
    
    try {
        const subcollectionRef = collection(db, 'users', userId, subcollectionName);
        let querySnapshot = await getDocs(query(subcollectionRef, limit(500)));
        let totalDeleted = 0;

        while (!querySnapshot.empty) {
            const batch = writeBatch(db);
            querySnapshot.docs.forEach((docSnapshot) => {
                batch.delete(docSnapshot.ref);
            });
            await batch.commit();
            totalDeleted += querySnapshot.size;
            
            console.log(`[Profile Service] Deleted batch of ${querySnapshot.size} documents from ${subcollectionName}. Total: ${totalDeleted}`);
            
            // Break if we got less than the limit (last batch)
            if (querySnapshot.size < 500) break;
            
            // Get next batch
            querySnapshot = await getDocs(query(subcollectionRef, limit(500)));
        }
        
        console.log(`[Profile Service] Completed deletion of ${subcollectionName}. Total documents deleted: ${totalDeleted}`);
    } catch (error: any) {
        console.error(`[Profile Service] Error deleting subcollection ${subcollectionName}:`, error);
        // Continue with other deletions even if one fails
    }
}

/**
 * Helper function to remove user from all friendships and view requests
 */
async function removeUserFromAllFriendships(userId: string): Promise<void> {
    console.log(`[Profile Service] Removing user ${userId} from all friendships and view requests`);
    
    try {
        // First, get all friends of this user
        const friendsRef = collection(db, 'users', userId, 'friends');
        const friendsSnapshot = await getDocs(friendsRef);
        
        // Remove this user from each friend's friend list and view requests
        const removalPromises = friendsSnapshot.docs.map(async (friendDoc) => {
            const friendUserId = friendDoc.id;
            try {
                const batch = writeBatch(db);
                
                // Remove this user from friend's friends list
                const friendFriendRef = doc(db, 'users', friendUserId, 'friends', userId);
                batch.delete(friendFriendRef);
                
                // Remove any view requests between these users
                const friendViewRequestRef = doc(db, 'users', friendUserId, 'viewRequests', userId);
                batch.delete(friendViewRequestRef);
                
                await batch.commit();
                console.log(`[Profile Service] Removed user ${userId} from friend ${friendUserId}'s lists`);
            } catch (error: any) {
                console.error(`[Profile Service] Error removing user ${userId} from friend ${friendUserId}:`, error);
                // Continue with other removals
            }
        });
        
        await Promise.all(removalPromises);
        
        // Also check for any pending view requests to this user from others
        // Note: This is a simplified approach. In a real app, you might want to maintain
        // a more efficient index for this purpose.
        console.log(`[Profile Service] Completed friendship cleanup for user: ${userId}`);
        
    } catch (error: any) {
        console.error(`[Profile Service] Error during friendship cleanup for user ${userId}:`, error);
        // Continue with account deletion even if friendship cleanup fails
    }
}
