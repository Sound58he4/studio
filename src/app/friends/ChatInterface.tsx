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
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';

import MessageList from '@/components/friends/MessageList';
import MessageInput from '@/components/friends/MessageInput';
import AISuggestionBar from '@/components/friends/AISuggestionBar';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface ChatInterfaceProps {
    friend: UserFriend | null;
    currentUserId: string | null;
    chatId: string | null; 
    isDark?: boolean;
}

export interface ChatInterfaceHandle {
    performClearLocalAIChat: () => void;
}

const ChatInterface = forwardRef<ChatInterfaceHandle, ChatInterfaceProps>(({ friend, currentUserId, chatId, isDark: propIsDark }, ref) => {
    // Performance monitoring
    const performanceRef = usePerformanceMonitor('ChatInterface');
    const firebasePerf = useFirebasePerformance();
    
    // Dark theme state management
    const [isDark, setIsDark] = useState(propIsDark || false);
    
    // Detect theme from HTML class if not provided as prop
    useEffect(() => {
        if (propIsDark !== undefined) {
            setIsDark(propIsDark);
            return;
        }
        
        const updateDark = () => {
            setIsDark(document.documentElement.classList.contains('dark'));
        };

        updateDark(); // Initial check
        
        // Watch for theme changes
        const observer = new MutationObserver(updateDark);
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class']
        });

        return () => observer.disconnect();
    }, [propIsDark]);
    
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
    const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

    const isAISelected = useMemo(() => friend?.id === AI_ASSISTANT_ID, [friend]);

    const focusInput = useCallback(() => {
        if (messageInputRef.current) {
            messageInputRef.current.focus();
        }
    }, []);

    const scrollToBottom = useCallback((force = false) => {
        if (!scrollAreaRef.current) return;
        
        const scrollContainer = scrollAreaRef.current;
        const isNearBottom = scrollContainer.scrollHeight - scrollContainer.scrollTop - scrollContainer.clientHeight < 100;
        
        if (force || shouldAutoScroll || isNearBottom) {
            setTimeout(() => {
                scrollContainer.scrollTop = scrollContainer.scrollHeight;
            }, 50);
        }
    }, [shouldAutoScroll]);

    const handleScroll = useCallback(() => {
        if (!scrollAreaRef.current) return;
        
        const scrollContainer = scrollAreaRef.current;
        const isAtBottom = scrollContainer.scrollHeight - scrollContainer.scrollTop - scrollContainer.clientHeight < 10;
        setShouldAutoScroll(isAtBottom);
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
                scrollToBottom(true); // Force scroll for new messages
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
    }, [isAISelected, scrollToBottom, focusInput]);

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
         scrollToBottom(true); // Force scroll for AI thinking message

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
            scrollToBottom(true); // Force scroll for AI response
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
            scrollToBottom(true); // Force scroll for user message
            setIsSending(false); // Reset for AI call
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
            scrollToBottom(true); // Force scroll for user message
            try {
                await sendChatMessage(chatId, currentUserId, commonMessageContent);
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

    // Effect to manage chat minimization state
    useEffect(() => {
        if (friend) {
            // Set data attribute to indicate chat is active - but let the parent manage it
            const isMobile = window.innerWidth < 768;
            if (isMobile) {
                document.documentElement.setAttribute('data-chat-minimized', 'true');
            }
        }

        return () => {
            // Only remove if we're actually unmounting, not just re-rendering
            if (!friend) {
                document.documentElement.removeAttribute('data-chat-minimized');
            }
        };
    }, [friend]);

    return (
        <div className={`flex flex-col h-full w-full backdrop-blur-sm overflow-hidden relative shadow-clay rounded-2xl ${
            isDark 
                ? 'bg-[#2a2a2a]/90 border border-[#3a3a3a]/30' 
                : 'bg-clayGlass'
        }`} data-chat-container>
            {friend ? (
                <>
                    <div className="flex-1 min-h-0 overflow-hidden">
                        <div 
                            ref={scrollAreaRef}
                            className="h-full overflow-y-auto overflow-x-hidden scroll-smooth pb-4 break-words"
                            onScroll={handleScroll}
                        >
                            <MessageList
                                messages={isAISelected ? aiLocalMessages : messages}
                                currentUserId={currentUserId}
                                isLoading={isLoadingMessages}
                                error={error}
                                friend={friend}
                                isAISelected={isAISelected}
                                scrollAreaRef={scrollAreaRef}
                                isDark={isDark}
                            />
                        </div>
                    </div>
                    
                    {/* Auto-scroll button when not at bottom */}
                    <AnimatePresence>
                        {!shouldAutoScroll && (
                            <motion.button
                                className={`absolute bottom-20 right-4 z-30 p-2 rounded-full shadow-lg transition-all duration-200 ${
                                    isDark 
                                        ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                                        : 'bg-primary text-primary-foreground hover:bg-primary/90'
                                }`}
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                                onClick={() => scrollToBottom(true)}
                                title="Scroll to bottom"
                            >
                                <ArrowLeft size={16} className="rotate-90" />
                            </motion.button>
                        )}
                    </AnimatePresence>

                    {isAISelected && showSuggestions && (
                        <div className={`flex-shrink-0 backdrop-blur-sm border-t ${
                            isDark 
                                ? 'bg-[#2a2a2a]/80 border-[#3a3a3a]/30' 
                                : 'bg-clayGlass border-clay-300/30'
                        }`}>
                            <AISuggestionBar 
                                onSuggestionClick={(prompt) => {
                                    setNewMessage(prompt); 
                                    setShowSuggestions(false); 
                                    focusInput(); 
                                }} 
                                onHide={() => setShowSuggestions(false)}
                                isDark={isDark}
                            />
                        </div>
                    )}
                    
                    {isAISelected && !showSuggestions && (
                        <div className={`px-2 py-1 border-t backdrop-blur-sm flex justify-center flex-shrink-0 shadow-clay ${
                            isDark 
                                ? 'bg-[#2a2a2a]/80 border-[#3a3a3a]/30' 
                                : 'bg-clayGlass border-clay-300/30'
                        }`}>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setShowSuggestions(true)}
                                className={`text-xs px-3 py-1 h-6 rounded-xl backdrop-blur-sm border-0 shadow-clay hover:shadow-clayStrong transition-all duration-300 hover:scale-105 ${
                                    isDark 
                                        ? 'bg-[#3a3a3a]/60 text-gray-300 hover:text-blue-400 hover:bg-[#4a4a4a]/60' 
                                        : 'bg-clayGlass text-gray-700 hover:text-blue-600'
                                }`}
                            >
                                Show AI Suggestions
                            </Button>
                        </div>
                    )}
                    
                    <div className={`flex-shrink-0 backdrop-blur-sm border-t ${
                        isDark 
                            ? 'bg-[#2a2a2a]/80 border-[#3a3a3a]/30' 
                            : 'bg-clayGlass border-clay-300/30'
                    }`}>
                        <MessageInput
                            ref={messageInputRef} 
                            newMessage={newMessage}
                            onInputChange={handleInputChange}
                            onSendMessage={handleSendMessage}
                            isSending={isSending || isAIChatting}
                            isAISelected={isAISelected}
                            isDark={isDark}
                        />
                    </div>
                </>
            ) : (
                <div className={`flex flex-col items-center justify-center h-full italic p-4 text-center backdrop-blur-sm rounded-2xl shadow-clay ${
                    isDark 
                        ? 'text-gray-400 bg-[#2a2a2a]/20' 
                        : 'text-gray-600 bg-clayGlass/20'
                }`}>
                     <Loader2 size={32} className={`mb-3 opacity-40 animate-spin ${
                         isDark ? 'text-gray-400' : 'text-gray-600'
                     }`}/>
                    <span className="text-sm">Loading chat...</span>
                </div>
            )}
        </div>
    );
});

ChatInterface.displayName = 'ChatInterface';
export default ChatInterface;

