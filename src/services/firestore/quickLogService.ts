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

export async function addQuickLogItem(userId: string, itemData: Omit<FirestoreQuickLogData, 'createdAt'>): Promise<string> {
  if (!userId) throw createFirestoreServiceError("User ID is required.", "invalid-argument");
  if (!itemData.foodName || itemData.calories === undefined || itemData.protein === undefined || itemData.carbohydrates === undefined || itemData.fat === undefined) {
    throw createFirestoreServiceError("Food name and all nutritional values are required.", "invalid-argument");
  }
  console.log(`[QuickLog Service] Adding new item to ${QUICK_LOG_ITEMS_COLLECTION} for user: ${userId}`, itemData.foodName);
  try {
    const quickLogRef = collection(db, 'users', userId, QUICK_LOG_ITEMS_COLLECTION);
    const dataWithTimestamp: FirestoreQuickLogData = {
        ...itemData,
        createdAt: serverTimestamp() as Timestamp
    };
    const docRef = await addDoc(quickLogRef, dataWithTimestamp);
    console.log(`[QuickLog Service] Item added with ID: ${docRef.id} to ${QUICK_LOG_ITEMS_COLLECTION}.`);
    return docRef.id;
  } catch (error) {
    console.error(`[QuickLog Service] Error adding item to ${QUICK_LOG_ITEMS_COLLECTION}:`, error);
    throw createFirestoreServiceError("Failed to add quick log item.", "add-failed");
  }
}

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

export async function deleteQuickLogItem(userId: string, itemId: string): Promise<void> {
  if (!userId || !itemId) throw createFirestoreServiceError("User ID and Item ID are required.", "invalid-argument");
  console.log(`[QuickLog Service] Deleting item ID: ${itemId} from ${QUICK_LOG_ITEMS_COLLECTION} for user: ${userId}`);
  try {
    const itemDocRef = doc(db, 'users', userId, QUICK_LOG_ITEMS_COLLECTION, itemId);
    await deleteDoc(itemDocRef);
    console.log(`[QuickLog Service] Item deleted successfully from ${QUICK_LOG_ITEMS_COLLECTION}.`);
  } catch (error) {
    console.error(`[QuickLog Service] Error deleting item from ${QUICK_LOG_ITEMS_COLLECTION}:`, error);
    throw createFirestoreServiceError("Failed to delete quick log item.", "delete-failed");
  }
}

export async function updateQuickLogItem(userId: string, itemId: string, data: Partial<Omit<FirestoreQuickLogData, 'createdAt'>>): Promise<void> {
  if (!userId || !itemId) throw createFirestoreServiceError("User ID and Item ID are required.", "invalid-argument");
  console.log(`[QuickLog Service] Updating item ID: ${itemId} in ${QUICK_LOG_ITEMS_COLLECTION} for user: ${userId}`);
  try {
    const itemDocRef = doc(db, 'users', userId, QUICK_LOG_ITEMS_COLLECTION, itemId);
    await updateDoc(itemDocRef, data);
    console.log(`[QuickLog Service] Item updated successfully in ${QUICK_LOG_ITEMS_COLLECTION}.`);
  } catch (error) {
    console.error(`[QuickLog Service] Error updating item in ${QUICK_LOG_ITEMS_COLLECTION}:`, error);
    throw createFirestoreServiceError("Failed to update quick log item.", "update-failed");
  }
}

// --- Removed Personal Intake Presets Functions ---
