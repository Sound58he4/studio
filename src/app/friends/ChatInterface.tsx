
// src/app/friends/ChatInterface.tsx
"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo, useImperativeHandle, forwardRef } from 'react';
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
import { usePerformanceMonitor, useFirebasePerformance } from '@/hooks/use-performance';

import MessageList from '@/components/friends/MessageList';
import MessageInput from '@/components/friends/MessageInput';
import AISuggestionBar from '@/components/friends/AISuggestionBar';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface ChatInterfaceProps {
    friend: UserFriend | null;
    currentUserId: string | null;
    chatId: string | null; 
}

export interface ChatInterfaceHandle {
    performClearLocalAIChat: () => void;
}

const ChatInterface = forwardRef<ChatInterfaceHandle, ChatInterfaceProps>(({ friend, currentUserId, chatId }, ref) => {
    // Performance monitoring
    const performanceRef = usePerformanceMonitor('ChatInterface');
    const firebasePerf = useFirebasePerformance();
    
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const initialAIMessage: ChatMessage = {
        id: `ai-greeting-${Date.now()}`, senderId: AI_ASSISTANT_ID,
        text: "Hello! I'm Bago AI. How can I help you with your fitness and nutrition today?",
        timestamp: new Date().toISOString(), isAI: true,
    };
    const [aiLocalMessages, setAiLocalMessages] = useState<ChatMessage[]>([initialAIMessage]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [isAIChatting, setIsAIChatting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const messageInputRef = useRef<HTMLInputElement>(null); 
    const { toast } = useToast();
    const [showSuggestions, setShowSuggestions] = useState(false);

    const isAISelected = useMemo(() => friend?.id === AI_ASSISTANT_ID, [friend]);

    const scrollToBottom = useCallback(() => {
        setTimeout(() => {
            if (scrollAreaRef.current) {
                scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
            }
        }, 50); // A small delay can help ensure content has rendered
    }, []);

    const focusInput = useCallback(() => {
        setTimeout(() => { 
            messageInputRef.current?.focus();
        }, 100);
    }, []);

    // Firestore listener for friend chats
    useEffect(() => {
        if (!isAISelected && friend && currentUserId && chatId) {
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
                        isAI: false // Friend chats are not AI unless explicitly marked
                    });
                });
                setMessages(fetchedMessages);
                setIsLoadingMessages(false);
                scrollToBottom();
            }, (err) => {
                console.error("[ChatInterface] Error fetching friend messages:", err);
                setError("Could not load messages."); setIsLoadingMessages(false);
            });
            return () => unsubscribe();
        } else if (!isAISelected) {
             setMessages([]); // Clear messages if no friend chat
             setIsLoadingMessages(false);
        }
    }, [friend, currentUserId, chatId, scrollToBottom, isAISelected]);

    // Effect for AI chat initialization and suggestion bar
    useEffect(() => {
        if (isAISelected) {
            // AI chat history is managed locally by aiLocalMessages
            // No need to load from localStorage here due to ephemeral requirement
            // Ensure the chat is reset to initial greeting if it's not already
            if (aiLocalMessages.length > 1 || (aiLocalMessages.length === 1 && aiLocalMessages[0].id !== initialAIMessage.id)) {
               // This condition might be too aggressive if called repeatedly, handled by parent's clear on mount.
               // setAiLocalMessages([initialAIMessage]);
            }
            setIsLoadingMessages(false); // Not loading from server for AI
            scrollToBottom();
            focusInput();
            // Removed automatic suggestion triggering - now only shows on button tap
            // setShowSuggestions(newMessage.trim() === ''); // Show suggestions if input is empty
        } else {
            setShowSuggestions(false);
        }
    }, [isAISelected, aiLocalMessages, newMessage, scrollToBottom, focusInput, initialAIMessage.id]);


    useImperativeHandle(ref, () => ({
        performClearLocalAIChat: () => {
            if (isAISelected) {
                console.log("[ChatInterface] Clearing local AI chat messages via ref.");
                setAiLocalMessages([initialAIMessage]); // Reset to only the greeting
                scrollToBottom();
                focusInput();
            }
        }
    }));

    const triggerAIChat = useCallback(async (
        historyForAI: ChatMessage[], 
        userMessageText?: string,
        voiceUri?: string,
        imageUri?: string
    ) => {
         if (!isAISelected || !currentUserId) return;
         setIsAIChatting(true);
         const thinkingAIMessage: ChatMessage = {
             id: `temp-ai-${Date.now()}`, senderId: AI_ASSISTANT_ID, text: "Bago is thinking...",
             timestamp: new Date().toISOString(), isAI: true,
         };
         // Add thinking message to aiLocalMessages directly
         setAiLocalMessages(prev => [...prev, thinkingAIMessage]);
         scrollToBottom();

         try {
             const aiInput: AskAIChatInput = {
                 userId: currentUserId,
                 message: userMessageText,
                 voiceRecordingDataUri: voiceUri,
                 imageDataUri: imageUri,
                 chatHistory: historyForAI.slice(-10).map(msg => ({ // Use up to last 10 messages for context
                     senderId: msg.senderId,
                     text: msg.text,
                     timestamp: msg.timestamp,
                     isAI: msg.isAI
                 }))
             };
             const aiResponse = await askAIChatAssistant(aiInput);
             const finalAIMessage: ChatMessage = {
                id: `ai-${Date.now()}`, senderId: AI_ASSISTANT_ID, text: aiResponse.response,
                timestamp: new Date().toISOString(), isAI: true,
             };
             // Replace thinking message with actual response in aiLocalMessages
             setAiLocalMessages(prev => [...prev.filter(msg => msg.id !== thinkingAIMessage.id), finalAIMessage]);
         } catch (aiError: any) {
             console.error("[ChatInterface] AI chat flow error:", aiError);
             const errorMessageText = `Sorry, I encountered an error: ${aiError.message}. Please try again.`;
             const errorAIMessage: ChatMessage = {
                id: `ai-error-${Date.now()}`, senderId: AI_ASSISTANT_ID, text: errorMessageText,
                timestamp: new Date().toISOString(), isAI: true,
             };
             // Replace thinking message with error message
             setAiLocalMessages(prev => [...prev.filter(msg => msg.id !== thinkingAIMessage.id), errorAIMessage]);
         } finally { 
            setIsAIChatting(false); 
            scrollToBottom(); 
            // focusInput(); // Focus might be problematic on mobile, let user tap
        }
     }, [isAISelected, currentUserId, scrollToBottom]);


    const handleSendMessage = useCallback(async (text: string, voiceUri?: string, imageUri?: string) => {
        const messageText = text.trim();
        if ((!messageText && !voiceUri && !imageUri) || !currentUserId || isSending || isAIChatting) return;
        
        const commonMessageContent = messageText || (voiceUri ? "[Voice Message]" : "[Image Message]");
        const optimisticUserMessage: ChatMessage = {
            id: `temp-user-${Date.now()}`, senderId: currentUserId,
            text: commonMessageContent, timestamp: new Date().toISOString(), isAI: false,
        };
        
        setNewMessage(''); 
        
        if (isAISelected) {
            // For AI, update local state directly and trigger AI
            setIsSending(true); // Briefly set to true for UI feedback on user message part
            const currentAIMessages = [...aiLocalMessages, optimisticUserMessage];
            setAiLocalMessages(currentAIMessages);
            scrollToBottom();
            setIsSending(false); // Reset for AI call
            // No need to explicitly focus input here, can cause mobile issues. Let user tap.
            await triggerAIChat(currentAIMessages, messageText || undefined, voiceUri, imageUri);
        } else { // Friend chat
            if (!chatId) {
                setError("Chat session not available."); 
                toast({variant: "destructive", title: "Error", description: "Chat session not available."});
                return;
            }
            setIsSending(true);
            const messagesBeforeUserSend = [...messages]; // For potential rollback
            setMessages(prev => [...prev, optimisticUserMessage]); // Optimistic UI update
            scrollToBottom();
            // No need to explicitly focus input here.
            try {
                await sendChatMessage(chatId, currentUserId, commonMessageContent);
                // Firestore listener will update messages state with the real message.
                // We can remove the optimistic message if the listener is very fast,
                // or rely on the listener to replace it by ID matching.
                // For simplicity, often the listener updating with the real message (which will have a different ID)
                // and the optimistic one being filtered out or eventually replaced by a full list refresh is fine.
            } catch (err) {
                console.error("[ChatInterface] Error sending friend message:", err);
                setError("Failed to send message.");
                toast({ variant: "destructive", title: "Send Error", description: "Could not send message." });
                setNewMessage(text); // Restore input field content
                setMessages(messagesBeforeUserSend); // Rollback optimistic update
            } finally {
                setIsSending(false);
            }
        }
    }, [chatId, currentUserId, isSending, isAIChatting, scrollToBottom, isAISelected, triggerAIChat, messages, aiLocalMessages, toast]);
    
    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
          setNewMessage(e.target.value);
      }, []);

    return (
        <div className="flex flex-col h-full bg-background"> {/* Removed overflow-hidden for mobile */}
            {friend ? (
                <>
                    <MessageList
                        messages={isAISelected ? aiLocalMessages : messages}
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
                                setNewMessage(prompt); 
                                setShowSuggestions(false); 
                                focusInput(); 
                            }} 
                            onHide={() => setShowSuggestions(false)} 
                        />
                    )}
                    {isAISelected && !showSuggestions && (
                        <div className="p-2 border-t bg-muted/50 flex justify-center">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setShowSuggestions(true)}
                                className="text-xs px-3 py-1 h-7 rounded-md"
                            >
                                Show AI Suggestions
                            </Button>
                        </div>
                    )}
                    <MessageInput
                        ref={messageInputRef} 
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

