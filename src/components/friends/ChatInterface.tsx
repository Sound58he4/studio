// src/components/friends/ChatInterface.tsx
"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useToast } from "@/hooks/use-toast";
import type { UserFriend, ChatMessage } from '@/app/dashboard/types';
import { 
  db,
  onSnapshot, 
  query, 
  collection, 
  orderBy, 
  limit as firestoreLimit, 
  type QueryDocumentSnapshot, 
  type DocumentData, 
  Timestamp 
} from '@/lib/firebase/exports';
import { sendChatMessage } from '@/services/firestore/chatService';
import { askAIChatAssistant, AskAIChatInput } from '@/ai/flows/ai-chat-assistant';
import { AI_ASSISTANT_ID } from '@/app/dashboard/types';
import { debounce } from 'lodash';

import MessageList from '@/components/friends/MessageList';
import MessageInput from '@/components/friends/MessageInput';
import AISuggestionBar from '@/components/friends/AISuggestionBar';
import { Loader2 } from 'lucide-react';

interface ChatInterfaceProps {
    friend: UserFriend | null;
    currentUserId: string | null;
    chatId: string | null;
}

const ChatInterface: React.FC<ChatInterfaceProps> = React.memo(({ friend, currentUserId, chatId }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [isAIChatting, setIsAIChatting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const { toast } = useToast();
    const [showSuggestions, setShowSuggestions] = useState(false);

    const isAISelected = useMemo(() => friend?.id === AI_ASSISTANT_ID, [friend]);

    const scrollToBottom = useCallback(() => {
        setTimeout(() => {
            if (scrollAreaRef.current) {
                scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
            }
        }, 50);
    }, []);

    useEffect(() => {
        if (!friend || !currentUserId || !chatId) {
            setMessages([]); setError(null); setIsLoadingMessages(false);
            return;
        }

        setIsLoadingMessages(true); setError(null);
        const messagesRef = collection(db, 'chats', chatId, 'messages');
        const q = query(messagesRef, orderBy('timestamp', 'asc'), firestoreLimit(100));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const fetchedMessages: ChatMessage[] = [];
            querySnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
                const data = doc.data();
                fetchedMessages.push({
                    id: doc.id,
                    senderId: data.senderId,
                    text: data.text,
                    timestamp: data.timestamp instanceof Timestamp ? data.timestamp.toDate().toISOString() : data.timestamp,
                    isAI: data.senderId === AI_ASSISTANT_ID
                });
            });
            setMessages(fetchedMessages);
            setIsLoadingMessages(false);
            scrollToBottom();
        }, (err) => {
            console.error("[ChatInterface] Error fetching messages:", err);
            setError("Could not load messages."); setIsLoadingMessages(false);
        });

        return () => unsubscribe();
    }, [friend, currentUserId, chatId, scrollToBottom, isAISelected]);

    useEffect(() => {
        setShowSuggestions(isAISelected && messages.length > 0 && newMessage.trim() === '');
    }, [isAISelected, messages, newMessage]);


    const triggerAIChat = useCallback(async (
        history: ChatMessage[],
        userMessage?: string,
        voiceUri?: string,
        imageUri?: string
    ) => {
         if (!isAISelected || !currentUserId || !chatId) return;

         setIsAIChatting(true);
         const optimisticAIMessage: ChatMessage = {
             id: `temp-ai-${Date.now()}`, senderId: AI_ASSISTANT_ID, text: "Bago is thinking...",
             timestamp: new Date().toISOString(), isAI: true,
         };
         setMessages(prev => [...prev, optimisticAIMessage]);
         scrollToBottom();

         try {
             const historyForAI = history.slice(-10);
             const aiInput: AskAIChatInput = {
                 userId: currentUserId,
                 message: userMessage,
                 voiceRecordingDataUri: voiceUri,
                 imageDataUri: imageUri,
                 chatHistory: historyForAI.map(msg => ({
                     senderId: msg.senderId,
                     text: msg.text,
                     timestamp: msg.timestamp,
                     isAI: msg.isAI
                 }))
             };
             const aiResponse = await askAIChatAssistant(aiInput);

             await sendChatMessage(chatId, AI_ASSISTANT_ID, aiResponse.response);
             setMessages(prev => prev.filter(msg => msg.id !== optimisticAIMessage.id));


         } catch (aiError: any) {
             console.error("[ChatInterface] AI chat flow error:", aiError);
             const errorMessage = `Sorry, I encountered an error: ${aiError.message}. Please try again.`;
             await sendChatMessage(chatId, AI_ASSISTANT_ID, errorMessage);
             setMessages(prev => prev.filter(msg => msg.id !== optimisticAIMessage.id));
         } finally { setIsAIChatting(false); }
     }, [isAISelected, currentUserId, chatId, scrollToBottom]);


    const handleSendMessage = useCallback(async (text: string, voiceUri?: string, imageUri?: string) => {
        const messageText = text.trim();
        if ((!messageText && !voiceUri && !imageUri) || !chatId || !currentUserId || isSending || isAIChatting) return;

        setNewMessage('');

        setIsSending(true);

        const optimisticUserMessage: ChatMessage = {
            id: `temp-user-${Date.now()}`, senderId: currentUserId,
            text: messageText || (voiceUri ? "[Voice Message]" : "[Image Message]"),
            timestamp: new Date().toISOString(), isAI: false,
        };
        
        const messagesBeforeUserSend = [...messages]; // Capture messages *before* adding optimistic user message
        setMessages(prev => [...prev, optimisticUserMessage]);
        scrollToBottom();

        try {
            await sendChatMessage(chatId, currentUserId, messageText || (voiceUri ? "[Voice Message]" : "[Image Message]"));
            // Optimistic message will be replaced by real message from Firestore snapshot listener
            setIsSending(false);

             if (isAISelected) {
                 // Pass the state of messages *before* the user's message was optimistically added
                 await triggerAIChat(messagesBeforeUserSend, messageText || undefined, voiceUri, imageUri);
             }
        } catch (err) {
            console.error("[ChatInterface] Error sending message:", err);
            setError("Failed to send message.");
            setNewMessage(messageText); // Restore input if send failed
            setMessages(prev => prev.filter(msg => msg.id !== optimisticUserMessage.id)); // Remove optimistic message
            setIsSending(false);
        }
    }, [chatId, currentUserId, isSending, isAIChatting, scrollToBottom, isAISelected, triggerAIChat, messages]);
    
    const debouncedAIChatTrigger = useCallback(
       debounce((message: string, history: ChatMessage[]) => {
           // This specific debounced trigger logic seems to have been removed or integrated elsewhere.
           // If it was meant for AI suggestions *during typing*, that would need a different flow.
           // For now, it's just an empty debounced function.
       }, 1000),
       [] 
    );

     const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
          const value = e.target.value;
          setNewMessage(value);
          debouncedAIChatTrigger.cancel(); 
      }, [debouncedAIChatTrigger]); // Include setNewMessage in deps if ESLint complains, though it's stable

    useEffect(() => { return () => { debouncedAIChatTrigger.cancel(); }; }, [debouncedAIChatTrigger]);

    return (
        <div className="flex flex-col h-full bg-background">
            {friend ? (
                <>
                    <MessageList
                        messages={messages}
                        currentUserId={currentUserId}
                        isLoading={isLoadingMessages}
                        error={error}
                        friend={friend}
                        isAISelected={isAISelected}
                        scrollAreaRef={scrollAreaRef}
                    />
                    {isAISelected && showSuggestions && (
                        <AISuggestionBar 
                            onSuggestionClick={(prompt) => {
                                setNewMessage(prompt); // Set input field directly
                                setShowSuggestions(false); // Hide suggestions after click
                                // Optionally, auto-send or let user press send
                            }} 
                            onHide={() => setShowSuggestions(false)} 
                        />
                    )}
                    <MessageInput
                        newMessage={newMessage}
                        onInputChange={handleInputChange}
                        onSendMessage={handleSendMessage}
                        isSending={isSending || isAIChatting}
                        isAISelected={isAISelected}
                    />
                </>
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground italic p-6 text-center bg-muted/20">
                     <Loader2 size={40} className="mb-4 opacity-40 animate-spin"/>
                    Loading chat...
                </div>
            )}
        </div>
    );
});

ChatInterface.displayName = 'ChatInterface';

export default ChatInterface;
