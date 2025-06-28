// src/services/firestore/quickLogService.ts

import { db } from '@/lib/firebase/exports';
import {
  collection, getDocs, addDoc, deleteDoc, updateDoc,
  Timestamp, doc, serverTimestamp
} from 'firebase/firestore';
import type { StoredQuickLogItem, FirestoreQuickLogData } from '@/app/dashboard/types';
import { createFirestoreServiceError } from './utils';

const QUICK_LOG_ITEMS_COLLECTION = 'quickLogItems';
// Removed PERSONAL_INTAKE_PRESETS_COLLECTION

// --- Standard Quick Log Items ---

export const addQuickLogItem = async (userId: string, itemData: Omit<FirestoreQuickLogData, 'createdAt'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'users', userId, QUICK_LOG_ITEMS_COLLECTION), {
      ...itemData,
      createdAt: serverTimestamp(),
    });
    
    console.log(`[QuickLogService] Quick log item added with ID: ${docRef.id}`);
    return docRef.id;
  } catch (error) {
    console.error('[QuickLogService] Error adding quick log item:', error);
    throw error;
  }
};

export async function getQuickLogItems(userId: string): Promise<StoredQuickLogItem[]> {
  if (!userId) throw createFirestoreServiceError("User ID is required.", "invalid-argument");
  console.log(`[QuickLog Service] Fetching ${QUICK_LOG_ITEMS_COLLECTION} for user: ${userId}`);
  try {
    const quickLogRef = collection(db, 'users', userId, QUICK_LOG_ITEMS_COLLECTION);
    // Remove orderBy to avoid composite index requirement - we'll sort on the client side
    const querySnapshot = await getDocs(quickLogRef);
    const items = querySnapshot.docs.map(docSnap => {
        const data = docSnap.data() as FirestoreQuickLogData;
        return {
            id: docSnap.id,
            ...data,
            createdAt: (data.createdAt as Timestamp).toDate().toISOString(),
        } as StoredQuickLogItem;
    });
    
    // Sort items by createdAt on the client side (most recent first)
    const sortedItems = items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    console.log(`[QuickLog Service] Fetched ${sortedItems.length} items from ${QUICK_LOG_ITEMS_COLLECTION}.`);
    return sortedItems;
  } catch (error: any) {
    // Simplified error handling since we removed the problematic query
    console.error(`[QuickLog Service] Error fetching items from ${QUICK_LOG_ITEMS_COLLECTION}:`, error);
    console.error(`[QuickLog Service] Error fetching items from ${QUICK_LOG_ITEMS_COLLECTION}:`, error);
    throw createFirestoreServiceError("Failed to fetch quick log items.", "fetch-failed");
  }
}

export const deleteQuickLogItem = async (userId: string, itemId: string): Promise<void> => {
  try {
    const itemRef = doc(db, 'users', userId, QUICK_LOG_ITEMS_COLLECTION, itemId);
    await deleteDoc(itemRef);
    console.log(`[QuickLogService] Quick log item deleted: ${itemId}`);
  } catch (error) {
    console.error('[QuickLogService] Error deleting quick log item:', error);
    throw error;
  }
};

export const updateQuickLogItem = async (userId: string, itemId: string, updates: Partial<Omit<FirestoreQuickLogData, 'createdAt' | 'userId'>>): Promise<void> => {
  try {
    const itemRef = doc(db, 'users', userId, QUICK_LOG_ITEMS_COLLECTION, itemId);
    await updateDoc(itemRef, updates);
    console.log(`[QuickLogService] Quick log item updated: ${itemId}`);
  } catch (error) {
    console.error('[QuickLogService] Error updating quick log item:', error);
    throw error;
  }
};

// --- Removed Personal Intake Presets Functions ---
