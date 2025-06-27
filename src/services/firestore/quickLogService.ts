// src/services/firestore/quickLogService.ts
'use server';

import { db } from '@/lib/firebase/exports';
import {
  collection, query, getDocs, addDoc, deleteDoc, updateDoc,
  orderBy, Timestamp, doc, serverTimestamp
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
    const q = query(quickLogRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const items = querySnapshot.docs.map(docSnap => {
        const data = docSnap.data() as FirestoreQuickLogData;
        return {
            id: docSnap.id,
            ...data,
            createdAt: (data.createdAt as Timestamp).toDate().toISOString(),
        } as StoredQuickLogItem;
    });
    console.log(`[QuickLog Service] Fetched ${items.length} items from ${QUICK_LOG_ITEMS_COLLECTION}.`);
    return items;
  } catch (error: any) {
    if (error.code === 'failed-precondition' && error.message.includes('query requires an index')) {
        const indexUrl = `https://console.firebase.google.com/v1/r/project/${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}/firestore/indexes?create_composite=Clxwcm9qZWN0cy9udXRyaXRyYW5zZm9ybS1haS9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMv${QUICK_LOG_ITEMS_COLLECTION}/pbmRleGVzL18QARIPCgtjcmVhdGVkQXQQAhIMCghfX25hbWVfXxAB`;
        const errorMessage = `Firestore index required for ${QUICK_LOG_ITEMS_COLLECTION} query (createdAt desc). Create it here: ${indexUrl}`;
        console.error(errorMessage);
        throw createFirestoreServiceError(errorMessage, "index-required");
     }
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
