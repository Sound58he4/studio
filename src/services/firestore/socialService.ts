// src/services/firestore/socialService.ts
'use server';

import { db } from '@/lib/firebase/exports';
import {
  doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs,
  orderBy, Timestamp, writeBatch, limit, deleteDoc
} from 'firebase/firestore';
import type {
    StoredUserProfile, SearchResultUser, ViewRequest, UserFriend
} from '@/app/dashboard/types';
import { createFirestoreServiceError } from './utils'; 
import { AI_ASSISTANT_ID } from '@/app/dashboard/types'; // Import AI_ASSISTANT_ID

/**
 * Searches for users by display name (case-insensitive prefix match).
 * Filters out the current user.
 * Checks view request/friendship status.
 */
export async function searchUsers(currentUserId: string, searchQuery: string): Promise<SearchResultUser[]> {
    if (!searchQuery || searchQuery.trim().length < 2) return [];
    if (!currentUserId) throw createFirestoreServiceError("Current User ID is required for search.", "invalid-argument");

    const searchLower = searchQuery.toLowerCase();
    const searchTermUpper = searchLower + '\uf8ff';

    console.log(`[Social Service] Searching users with lowercase display name starting with: ${searchLower}`);
    try {
        const usersRef = collection(db, 'users');
        const userQuery = query(usersRef,
            where('lowercaseDisplayName', '>=', searchLower),
            where('lowercaseDisplayName', '<=', searchTermUpper),
            limit(10)
        );

        const userSnap = await getDocs(userQuery);
        const statusChecks = userSnap.docs.map(async (userDoc) => {
            const userData = userDoc.data() as StoredUserProfile;
            const userId = userDoc.id;

            if (userId === currentUserId || userId === AI_ASSISTANT_ID) return null; // Exclude self and AI

            let requestStatus: SearchResultUser['requestStatus'] = 'none';
            try {
                const friendRef = doc(db, 'users', currentUserId, 'friends', userId);
                const requestRef = doc(db, 'users', userId, 'viewRequests', currentUserId);
                const [friendSnap, requestSnap] = await Promise.all([getDoc(friendRef), getDoc(requestRef)]);

                if (friendSnap.exists()) requestStatus = 'following';
                else if (requestSnap.exists() && requestSnap.data()?.status === 'pending') requestStatus = 'pending';

            } catch (reqError) { console.error(`[Social Service] Error checking request/friend status for user ${userId}:`, reqError); }

            return {
                id: userId, displayName: userData.displayName || 'Unnamed User', email: userData.email,
                photoURL: userData.photoURL ?? null, requestStatus: requestStatus
            };
        });

        const resultsWithStatus = (await Promise.all(statusChecks)).filter(Boolean) as SearchResultUser[];
        console.log(`[Social Service] Found ${resultsWithStatus.length} users.`);
        return resultsWithStatus;
    } catch (error: any) {
        console.error("[Social Service] Error searching users:", error);
        if (error.code === 'failed-precondition' && error.message.includes('query requires an index')) {
            const indexUrl = `https://console.firebase.google.com/v1/r/project/${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}/firestore/indexes?create_composite=Chtwcm9qZWN0cy9udXRyaXRyYW5zZm9ybS1haS9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvdXNlcnMvaW5kZXhlcy9fEAEaGgoWbG93ZXJjYXNlRGlzcGxheU5hbWUQARoMCghfX25hbWVfXxAB`;
            const errorMessage = `Firestore index needed for user search (lowercaseDisplayName). Create it here: ${indexUrl}`;
            console.error(errorMessage);
            throw createFirestoreServiceError(errorMessage, "index-required");
        }
        throw createFirestoreServiceError("Failed to search users.", "search-failed");
    }
}

/**
 * Sends a view request from the current user to a target user.
 */
export async function sendViewRequest(currentUserId: string, targetUserId: string, currentUserProfile: StoredUserProfile): Promise<void> {
    if (!currentUserId || !targetUserId) throw createFirestoreServiceError("Both user IDs are required.", "invalid-argument");
    if (currentUserId === targetUserId) throw createFirestoreServiceError("Cannot send request to yourself.", "invalid-argument");
    if (targetUserId === AI_ASSISTANT_ID) throw createFirestoreServiceError("Cannot send view request to AI Assistant.", "invalid-argument");


    console.log(`[Social Service] User ${currentUserId} sending view request to ${targetUserId}`);
    try {
        const requestDocRef = doc(db, 'users', targetUserId, 'viewRequests', currentUserId);
        const friendRef = doc(db, 'users', currentUserId, 'friends', targetUserId);
        const [requestSnap, friendSnap] = await Promise.all([getDoc(requestDocRef), getDoc(friendRef)]);

        if (friendSnap.exists()) { console.log(`[Social Service] Users are already friends.`); return; }
        if (requestSnap.exists() && requestSnap.data()?.status === 'pending') { console.log(`[Social Service] Request already pending.`); return; }

        const requestData: Omit<ViewRequest, 'id'> = {
            requestingUserId: currentUserId, requestingUserDisplayName: currentUserProfile?.displayName || 'Unknown User',
            requestingUserPhotoURL: currentUserProfile?.photoURL ?? null, status: 'pending',
            timestamp: new Date().toISOString(),
        };

        await setDoc(requestDocRef, requestData);
        console.log(`[Social Service] View request sent successfully.`);
    } catch (error) {
        console.error("[Social Service] Error sending view request:", error);
        throw createFirestoreServiceError("Failed to send view request.", "send-failed");
    }
}


/**
 * Fetches incoming view requests (status = 'pending') for the current user.
 */
export async function getIncomingViewRequests(currentUserId: string): Promise<ViewRequest[]> {
    if (!currentUserId) throw createFirestoreServiceError("User ID is required.", "invalid-argument");
    console.log(`[Social Service] Fetching incoming view requests for user: ${currentUserId}`);
    try {
        const requestsRef = collection(db, 'users', currentUserId, 'viewRequests');
        const requestQuery = query(requestsRef, where('status', '==', 'pending'), orderBy('timestamp', 'desc'));
        const requestSnap = await getDocs(requestQuery);
        const requests = requestSnap.docs.map(doc => ({ id: doc.id, ...doc.data(), requestingUserPhotoURL: doc.data().requestingUserPhotoURL ?? null } as ViewRequest));
        console.log(`[Social Service] Found ${requests.length} pending incoming requests.`);
        return requests;
    } catch (error: any) {
        console.error("[Social Service] Error fetching incoming view requests:", error);
        if (error.code === 'failed-precondition' && error.message.includes('query requires an index')) {
             const indexUrl = `https://console.firebase.google.com/v1/r/project/${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}/firestore/indexes?create_composite=ClZwcm9qZWN0cy9udXRyaXRyYW5zZm9ybS1haS9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvdmlld1JlcXVlc3RzL2luZGV4ZXMvXxABGgoKBnN0YXR1cxABGg0KCXRpbWVzdGFtcBACGgwKCF9fbmFtZV9fEAI`;
             const errorMessage = `Firestore index needed for view requests (status == pending, timestamp desc). Create it here: ${indexUrl}`;
             console.error(errorMessage);
             throw createFirestoreServiceError(errorMessage, "index-required");
         }
        throw createFirestoreServiceError("Failed to fetch incoming view requests.", "fetch-failed");
    }
}

/**
 * Updates the status of an incoming view request to 'declined'.
 */
export async function declineViewRequest(currentUserId: string, requestingUserId: string): Promise<void> {
    if (!currentUserId || !requestingUserId) throw createFirestoreServiceError("User IDs are required.", "invalid-argument");
    console.log(`[Social Service] User ${currentUserId} declining request from ${requestingUserId}`);
    try {
        const requestDocRef = doc(db, 'users', currentUserId, 'viewRequests', requestingUserId);
        const requestSnap = await getDoc(requestDocRef);
        if (!requestSnap.exists() || requestSnap.data()?.status !== 'pending') { console.warn(`[Social Service] Request not found or not pending. Cannot decline.`); return; }
        await updateDoc(requestDocRef, { status: 'declined' });
        console.log(`[Social Service] View request declined.`);
    } catch (error) {
        console.error("[Social Service] Error declining view request:", error);
        throw createFirestoreServiceError("Failed to decline view request.", "update-failed");
    }
}

/**
 * Accepts an incoming view request, updates its status, and adds both users to each other's friends list.
 */
export async function acceptViewRequest(currentUserId: string, requestingUserId: string): Promise<void> {
    if (!currentUserId || !requestingUserId) throw createFirestoreServiceError("User IDs are required.", "invalid-argument");
    console.log(`[Social Service] User ${currentUserId} accepting request from ${requestingUserId}`);
    try {
        const requestDocRef = doc(db, 'users', currentUserId, 'viewRequests', requestingUserId);
        const requestSnap = await getDoc(requestDocRef);
        if (!requestSnap.exists() || requestSnap.data()?.status !== 'pending') { console.warn(`[Social Service] Request not found or not pending. Cannot accept.`); return; }

        const batch = writeBatch(db);
        batch.update(requestDocRef, { status: 'accepted' });

        const currentUserFriendRef = doc(db, 'users', currentUserId, 'friends', requestingUserId);
        const requestingUserProfileSnap = await getDoc(doc(db, 'users', requestingUserId));
        const requestingUserProfile = requestingUserProfileSnap.exists() ? requestingUserProfileSnap.data() as StoredUserProfile : null;
        batch.set(currentUserFriendRef, { id: requestingUserId, displayName: requestingUserProfile?.displayName || 'Unknown User', photoURL: requestingUserProfile?.photoURL ?? null, since: new Date().toISOString(), isAI: false });

        const requestingUserFriendRef = doc(db, 'users', requestingUserId, 'friends', currentUserId);
        const currentUserProfileSnap = await getDoc(doc(db, 'users', currentUserId));
        const currentUserProfile = currentUserProfileSnap.exists() ? currentUserProfileSnap.data() as StoredUserProfile : null;
        batch.set(requestingUserFriendRef, { id: currentUserId, displayName: currentUserProfile?.displayName || 'Unknown User', photoURL: currentUserProfile?.photoURL ?? null, since: new Date().toISOString(), isAI: false });

        await batch.commit();
        console.log(`[Social Service] View request accepted. Friendship established.`);
    } catch (error) {
        console.error("[Social Service] Error accepting view request:", error);
        throw createFirestoreServiceError("Failed to accept view request.", "accept-failed");
    }
}

/**
 * Fetches the friends list for the current user.
 * Filters out the AI assistant if it's present.
 */
export async function getFriends(currentUserId: string): Promise<UserFriend[]> {
    if (!currentUserId) throw createFirestoreServiceError("User ID is required.", "invalid-argument");
    console.log(`[Social Service] Fetching friends list for user: ${currentUserId}`);
    try {
        const friendsRef = collection(db, 'users', currentUserId, 'friends');
        const friendsQuery = query(friendsRef, orderBy('displayName', 'asc'));
        const friendsSnap = await getDocs(friendsQuery);
        const friends = friendsSnap.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as UserFriend))
            .filter(friend => friend.id !== AI_ASSISTANT_ID && !friend.isAI); // Explicitly filter out AI
        console.log(`[Social Service] Found ${friends.length} human friends.`);
        return friends;
    } catch (error: any) {
         if (error.code === 'failed-precondition' && error.message.includes('query requires an index')) {
             const indexUrl = `https://console.firebase.google.com/v1/r/project/${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}/firestore/indexes?create_composite=ClRwcm9qZWN0cy9udXRyaXRyYW5zZm9ybS1haS9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvZnJpZW5kcy9pbmRleGVzL18QARIRCg1kaXNwbGF5TmFtZRABGgwKCF9fbmFtZV9fEAE`;
             const errorMessage = `Firestore index needed for friends list query (displayName asc). Create it here: ${indexUrl}`;
             console.error(errorMessage);
             throw createFirestoreServiceError(errorMessage, "index-required");
         }
        console.error("[Social Service] Error fetching friends list:", error);
        throw createFirestoreServiceError("Failed to fetch friends list.", "fetch-failed");
    }
}

/**
 * Removes a friend relationship between two users.
 */
export async function removeFriend(currentUserId: string, friendUserId: string): Promise<void> {
    if (!currentUserId || !friendUserId) throw createFirestoreServiceError("Both user IDs are required.", "invalid-argument");
    console.log(`[Social Service] User ${currentUserId} removing friend ${friendUserId}`);
    try {
        const batch = writeBatch(db);
        const currentUserFriendRef = doc(db, 'users', currentUserId, 'friends', friendUserId);
        batch.delete(currentUserFriendRef);
        const friendUserFriendRef = doc(db, 'users', friendUserId, 'friends', currentUserId);
        batch.delete(friendUserFriendRef);
        
        // Also set the view request status back to 'declined' or delete it on both sides
        const viewRequestRef1 = doc(db, 'users', currentUserId, 'viewRequests', friendUserId);
        const viewRequestRef2 = doc(db, 'users', friendUserId, 'viewRequests', currentUserId);
        
        batch.delete(viewRequestRef1); // Or update status to 'declined'
        batch.delete(viewRequestRef2); // Or update status to 'declined'

        await batch.commit();
        console.log(`[Social Service] Friendship removed.`);
    } catch (error) {
        console.error("[Social Service] Error removing friend:", error);
        throw createFirestoreServiceError("Failed to remove friend.", "remove-failed");
    }
}
