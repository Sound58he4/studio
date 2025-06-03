// src/services/accountDeletionService.ts
'use client';

import { auth, deleteUser, signOut } from '@/lib/firebase/exports';
import { deleteUserAccount } from '@/services/firestore/profileService';

/**
 * Clears all client-side authentication state, including cookies and local storage
 */
function clearAuthState(): void {
    // Clear the isLoggedIn cookie with multiple domain approaches for robustness
    const expiredDate = new Date(0).toUTCString();
    document.cookie = `isLoggedIn=; path=/; expires=${expiredDate}; SameSite=Lax`;
    
    // Clear any other auth-related items from localStorage
    try {
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (
                key.includes('firebase:') || 
                key.includes('user-') || 
                key.includes('bago-user-')
            )) {
                keysToRemove.push(key);
            }
        }
        
        keysToRemove.forEach(key => {
            localStorage.removeItem(key);
            console.log(`[Account Deletion Service] Removed localStorage item: ${key}`);
        });
    } catch (error) {
        console.error("[Account Deletion Service] Error clearing localStorage:", error);
    }
    
    console.log(`[Account Deletion Service] Cleared all auth state.`);
}

/**
 * Complete account deletion service that handles both Firestore data cleanup
 * and Firebase Auth account deletion.
 */
export async function deleteCompleteUserAccount(): Promise<void> {
    const currentUser = auth.currentUser;
    if (!currentUser) {
        throw new Error("No authenticated user found");
    }

    const userId = currentUser.uid;
    console.log(`[Account Deletion Service] Starting complete account deletion for user: ${userId}`);

    let firestoreDeleted = false;
    
    try {
        // Step 1: Delete all Firestore data first
        console.log(`[Account Deletion Service] Deleting Firestore data for user: ${userId}`);
        await deleteUserAccount(userId);
        firestoreDeleted = true;

        // Step 2: Delete the Firebase Auth account
        console.log(`[Account Deletion Service] Deleting Firebase Auth account for user: ${userId}`);
        await deleteUser(currentUser);
        
        // Step 3: Clear auth state
        clearAuthState();

        console.log(`[Account Deletion Service] Successfully deleted complete account for user: ${userId}`);
    } catch (error: any) {
        console.error("[Account Deletion Service] Error during complete account deletion:", error);
        
        // If Firestore data was deleted but Auth deletion failed,
        // still clear cookies and sign out to force user to home page
        if (firestoreDeleted) {
            clearAuthState();
            
            // Try to sign out if we can't delete the account but we want to force log out
            try {
                await signOut(auth);
                console.log(`[Account Deletion Service] Signed out user after partial deletion.`);
            } catch (signOutError) {
                console.error("[Account Deletion Service] Error signing out after partial deletion:", signOutError);
            }
        }
        
        // If Firestore deletion succeeded but Auth deletion failed, 
        // the user might need to re-authenticate
        if (error.code === 'auth/requires-recent-login') {
            throw new Error("Recent authentication required. Please log out and log back in, then try again.");
        }        
        throw new Error(`Failed to delete account: ${error.message}`);
    }
}
