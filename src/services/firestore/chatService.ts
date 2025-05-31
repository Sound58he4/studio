// src/services/firestore/chatService.ts
'use server';

import { db } from '@/lib/firebase/exports';
import {
  doc, getDoc, setDoc, collection, query, orderBy, limit as firestoreLimit,
  addDoc, serverTimestamp, updateDoc, Timestamp, getDocs, writeBatch, deleteDoc
} from 'firebase/firestore';
import type { ChatMessage } from '@/app/dashboard/types';
import { AI_ASSISTANT_ID } from '@/app/dashboard/types'; // Import AI ID
import { createFirestoreServiceError } from './utils'; // Corrected import path

/**
 * Gets or creates a chat room ID based on two user IDs.
 * Creates the chat document if it doesn't exist.
 * Handles the special case for the AI assistant.
 */
export async function getOrCreateChatRoom(userId1: string, userId2: string): Promise<string> {
    if (!userId1 || !userId2) throw createFirestoreServiceError("Both user IDs required for chat room.", "invalid-argument");

    // Determine chat room ID based on whether AI is involved
    const chatRoomId = userId1 === AI_ASSISTANT_ID || userId2 === AI_ASSISTANT_ID
        ? `ai_${userId1 === AI_ASSISTANT_ID ? userId2 : userId1}` // AI chat ID format: ai_{userId}
        : [userId1, userId2].sort().join('_'); // User-to-user chat ID

    const chatDocRef = doc(db, 'chats', chatRoomId);

    console.log(`[Chat Service] Checking/Creating chat room: ${chatRoomId}`);
    try {
        const chatSnap = await getDoc(chatDocRef);
        if (!chatSnap.exists()) {
            await setDoc(chatDocRef, {
                participants: [userId1, userId2], // Store participants
                createdAt: serverTimestamp(),
                lastMessageTimestamp: null,
                isAIChat: chatRoomId.startsWith('ai_'), // Flag AI chats
            });
            console.log(`[Chat Service] Created new chat room: ${chatRoomId}`);
        } else {
             console.log(`[Chat Service] Chat room exists: ${chatRoomId}`);
        }
        return chatRoomId;
    } catch (error) {
        console.error("[Chat Service] Error getting/creating chat room:", error);
        throw createFirestoreServiceError("Failed to initialize chat room.", "chat-init-failed");
    }
}

/**
 * Fetches messages for a given chat room ID.
 * Note: For real-time updates, use onSnapshot in the component. This fetches initial messages.
 */
export async function getChatMessages(chatId: string, messageLimit: number = 50): Promise<ChatMessage[]> {
    if (!chatId) throw createFirestoreServiceError("Chat ID required.", "invalid-argument");
    console.log(`[Chat Service] Fetching messages for chat: ${chatId}`);
    try {
        const messagesRef = collection(db, 'chats', chatId, 'messages');
        const q = query(messagesRef, orderBy('timestamp', 'desc'), firestoreLimit(messageLimit));
        const messageSnap = await getDocs(q);
        const messages = messageSnap.docs.map(doc => {
             const data = doc.data();
             return {
                 id: doc.id,
                 senderId: data.senderId,
                 text: data.text,
                 timestamp: data.timestamp instanceof Timestamp ? data.timestamp.toDate().toISOString() : data.timestamp,
                 isAI: data.senderId === AI_ASSISTANT_ID // Flag AI messages
             } as ChatMessage;
        }).reverse(); // Reverse to show oldest first
        console.log(`[Chat Service] Fetched ${messages.length} messages for chat ${chatId}.`);
        return messages;
    } catch (error) {
        console.error(`[Chat Service] Error fetching messages for chat ${chatId}:`, error);
        throw createFirestoreServiceError("Failed to fetch messages.", "fetch-failed");
    }
}

/**
 * Sends a new chat message to a specific chat room.
 * Updates the lastMessageTimestamp on the chat document.
 */
export async function sendChatMessage(chatId: string, senderId: string, text: string): Promise<string> {
    if (!chatId || !senderId || !text) throw createFirestoreServiceError("Chat ID, sender ID, and text required.", "invalid-argument");
    console.log(`[Chat Service] Sending message to chat: ${chatId} from sender: ${senderId}`);
    try {
        const messagesRef = collection(db, 'chats', chatId, 'messages');
        const messageData = {
            senderId: senderId,
            text: text,
            timestamp: serverTimestamp(),
            isAI: senderId === AI_ASSISTANT_ID // Add flag if sender is AI
        };
        const docRef = await addDoc(messagesRef, messageData);

        const chatDocRef = doc(db, 'chats', chatId);
        await updateDoc(chatDocRef, {
             lastMessageTimestamp: serverTimestamp()
        });

        console.log(`[Chat Service] Message sent with ID: ${docRef.id} to chat ${chatId}.`);
        return docRef.id;
    } catch (error) {
        console.error(`[Chat Service] Error sending message to chat ${chatId}:`, error);
        throw createFirestoreServiceError("Failed to send message.", "send-failed");
    }
}


/**
 * Deletes all messages within a chat room's 'messages' subcollection.
 * Uses batch delete for efficiency. This function might need multiple runs
 * if there are more than 500 messages.
 */
export async function clearChatMessages(chatId: string): Promise<void> {
    if (!chatId) throw createFirestoreServiceError("Chat ID required.", "invalid-argument");
    console.log(`[Chat Service] Attempting to clear messages for chat: ${chatId}`);
    try {
        const messagesRef = collection(db, 'chats', chatId, 'messages');
        let deletedCount = 0;
        let querySnapshot = await getDocs(query(messagesRef, firestoreLimit(500)));

        while (querySnapshot.size > 0) {
             console.log(`[Chat Service] Clearing batch of ${querySnapshot.size} messages from chat ${chatId}.`);
             const batch = writeBatch(db);
             querySnapshot.docs.forEach((docSnapshot) => {
                 batch.delete(docSnapshot.ref);
             });
             await batch.commit();
             deletedCount += querySnapshot.size;
             console.log(`[Chat Service] Batch committed for chat ${chatId}. Total deleted so far: ${deletedCount}`);
            // Fetch the next batch only if the previous batch was full (500)
            if (querySnapshot.size < 500) break;
             querySnapshot = await getDocs(query(messagesRef, firestoreLimit(500)));
        }


        console.log(`[Chat Service] All messages cleared from chat ${chatId}. Total: ${deletedCount}`);

         // Optionally update the chat room's last message timestamp after clearing
        const chatDocRef = doc(db, 'chats', chatId);
        await updateDoc(chatDocRef, { lastMessageTimestamp: null }); // Reset last message time


    } catch (error) {
        console.error(`[Chat Service] Error clearing messages for chat ${chatId}:`, error);
        throw createFirestoreServiceError("Failed to clear chat messages.", "clear-failed");
    }
}