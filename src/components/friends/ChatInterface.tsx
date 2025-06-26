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
}

export interface ChatInterfaceHandle {
    performClearLocalAIChat: () => void;
    showSuggestions: () => void;
    sendMessage: (text: string, voiceUri?: string, imageUri?: string) => Promise<void>;
}

const ChatInterface = forwardRef<ChatInterfaceHandle, ChatInterfaceProps>(({ friend, currentUserId, chatId }, ref) => {
    // Performance monitoring
    const performanceRef = usePerformanceMonitor('ChatInterface');
    const firebasePerf = useFirebasePerformance();
    
    const [lightTheme, setLightTheme] = useState(() => {
        if (typeof window !== 'undefined') {
            // Check if dark theme class is applied to document root
            return !document.documentElement.classList.contains('dark');
        }
        return true; // Default to light theme
    });

    useEffect(() => {
        const handleThemeChange = () => {
            if (typeof window !== 'undefined') {
                setLightTheme(!document.documentElement.classList.contains('dark'));
            }
        };

        // Listen for class changes on the document element
        const observer = new MutationObserver(() => {
            handleThemeChange();
        });

        if (typeof window !== 'undefined') {
            observer.observe(document.documentElement, {
                attributes: true,
                attributeFilter: ['class']
            });
        }

        return () => observer.disconnect();
    }, []);

    const isDark = !lightTheme;
    
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
    }, []);    const scrollToBottom = useCallback((force = false) => {
        if (!scrollAreaRef.current) return;
        
        const scrollContainer = scrollAreaRef.current;
        
        if (force) {
            // Always scroll to bottom when explicitly requested
            requestAnimationFrame(() => {
                scrollContainer.scrollTop = scrollContainer.scrollHeight;
            });
        } else if (shouldAutoScroll) {
            // Only auto-scroll if user is near bottom
            const isNearBottom = scrollContainer.scrollHeight - scrollContainer.scrollTop - scrollContainer.clientHeight < 100;
            if (isNearBottom) {
                requestAnimationFrame(() => {
                    scrollContainer.scrollTop = scrollContainer.scrollHeight;
                });
            }
        }
    }, [shouldAutoScroll]);    const handleScroll = useCallback(() => {
        if (!scrollAreaRef.current) return;
        
        const scrollContainer = scrollAreaRef.current;
        // Check if user is near the bottom (within 100px)
        const isAtBottom = scrollContainer.scrollHeight - scrollContainer.scrollTop - scrollContainer.clientHeight < 100;
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
            setIsLoadingMessages(false); // Not loading from server for AI
            scrollToBottom();
            focusInput();
        } else {
            setShowSuggestions(false);
        }
    }, [isAISelected, scrollToBottom, focusInput]);    useImperativeHandle(ref, () => ({
        performClearLocalAIChat: () => {
            if (isAISelected) {
                console.log("[ChatInterface] Clearing local AI chat messages via ref.");
                setAiLocalMessages([initialAIMessage]); // Reset to only the greeting
                scrollToBottom();
                focusInput();
            }
        },
        showSuggestions: () => {
            if (isAISelected) {
                console.log("[ChatInterface] Showing AI suggestions via ref.");
                setShowSuggestions(true);
            }
        },
        sendMessage: async (text: string, voiceUri?: string, imageUri?: string) => {
            await handleSendMessage(text, voiceUri, imageUri);
        }
    }));    const triggerAIChat = useCallback(async (
        historyForAI: ChatMessage[], 
        userMessageText?: string,
        voiceUri?: string,
        imageUri?: string
    ) => {
         if (!isAISelected || !currentUserId) return;
         setIsAIChatting(true);
         scrollToBottom(true); // Force scroll when AI starts processing

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
             // Add the actual AI response to aiLocalMessages
             setAiLocalMessages(prev => [...prev, finalAIMessage]);
         } catch (aiError: any) {
             console.error("[ChatInterface] AI chat flow error:", aiError);
             const errorMessageText = `Sorry, I encountered an error: ${aiError.message}. Please try again.`;
             const errorAIMessage: ChatMessage = {
                id: `ai-error-${Date.now()}`, senderId: AI_ASSISTANT_ID, text: errorMessageText,
                timestamp: new Date().toISOString(), isAI: true,
             };
             // Add error message to aiLocalMessages
             setAiLocalMessages(prev => [...prev, errorAIMessage]);
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
            const finalUserMessage: ChatMessage = {
                id: `user-${Date.now()}`, senderId: currentUserId,
                text: commonMessageContent, timestamp: new Date().toISOString(), isAI: false,
            };
            const currentAIMessages = [...aiLocalMessages, finalUserMessage];
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
    }, [friend]);    // Auto-scroll when new AI messages are added (only for new messages, not when loading)
    useEffect(() => {
        if (isAISelected && aiLocalMessages.length > 1) { // More than just the initial greeting
            // Only auto-scroll if user is near bottom or it's a new user/AI message
            const lastMessage = aiLocalMessages[aiLocalMessages.length - 1];
            if (lastMessage && (lastMessage.senderId === currentUserId || shouldAutoScroll)) {
                scrollToBottom(false); // Use gentle auto-scroll
            }
        }
    }, [aiLocalMessages.length, scrollToBottom, isAISelected, currentUserId, shouldAutoScroll]);

    // Auto-scroll when new friend messages are added (only for new messages)
    useEffect(() => {
        if (!isAISelected && messages.length > 0) {
            const lastMessage = messages[messages.length - 1];
            if (lastMessage && (lastMessage.senderId === currentUserId || shouldAutoScroll)) {
                scrollToBottom(false); // Use gentle auto-scroll
            }
        }
    }, [messages.length, scrollToBottom, isAISelected, currentUserId, shouldAutoScroll]);

    return (
        <div className="flex flex-col h-full w-full overflow-hidden relative">
            {friend ? (
                <>                    {/* Messages Area - Fixed scrolling with proper height */}
                    <div 
                        ref={scrollAreaRef}
                        className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth p-3 sm:p-4 lg:p-6 custom-scrollbar chat-messages-container"
                        onScroll={handleScroll}
                    >
                        <div className="space-y-4 sm:space-y-5 break-words pb-8">
                            <MessageList
                                messages={isAISelected ? aiLocalMessages : messages}
                                currentUserId={currentUserId}
                                isLoading={isLoadingMessages}
                                error={error}
                                friend={friend}
                                isAISelected={isAISelected}
                                scrollAreaRef={scrollAreaRef}
                                isAIProcessing={isAIChatting}
                            />
                        </div>
                    </div>                    {/* Auto-scroll button when not at bottom - Always visible when not at bottom */}
                    <AnimatePresence>
                        {!shouldAutoScroll && (
                            <motion.button
                                className={`absolute bottom-4 right-4 z-30 text-white p-3 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110 border border-white/20 backdrop-blur-sm ${
                                    isDark 
                                        ? 'bg-blue-600 hover:bg-blue-700' 
                                        : 'bg-blue-600 hover:bg-blue-700'
                                }`}
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                                whileHover={{ y: -2 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => scrollToBottom(true)}
                                title="Scroll to latest message"
                            >
                                <div className="flex flex-col items-center">
                                    <ArrowLeft size={16} className="rotate-90" />
                                    <span className="text-xs font-medium mt-0.5">Latest</span>
                                </div>
                            </motion.button>
                        )}
                    </AnimatePresence>

                    {/* AI Suggestions Bar - Fixed above input */}
                    {isAISelected && showSuggestions && (
                        <motion.div 
                            className="flex-shrink-0 backdrop-blur-sm border-t border-gray-200/50 bg-white/90"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <AISuggestionBar 
                                onSuggestionClick={(prompt) => {
                                    setNewMessage(prompt); 
                                    setShowSuggestions(false); 
                                    focusInput(); 
                                }} 
                                onHide={() => setShowSuggestions(false)} 
                            />
                        </motion.div>                    )}

                    {/* Input Area - Fixed at bottom - Hidden for AI Assistant */}
                    {!isAISelected && (
                        <div className="backdrop-blur-sm p-3 sm:p-4 lg:p-6 shadow-lg transition-all duration-300 flex-shrink-0 bg-white/90 border-t border-gray-200/50 relative z-10">
                            <MessageInput
                                ref={messageInputRef} 
                                newMessage={newMessage}
                                onInputChange={handleInputChange}
                                onSendMessage={handleSendMessage}
                                isSending={isSending || isAIChatting}
                                isAISelected={isAISelected}
                            />
                        </div>
                    )}
                </>
            ) : (
                <motion.div 
                    className="flex flex-col items-center justify-center h-full text-gray-600 italic p-4 md:p-6 text-center backdrop-blur-sm rounded-2xl m-2 md:m-4"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                >
                     <motion.div
                         animate={{ rotate: 360 }}
                         transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                     >
                         <Loader2 size={28} className="md:size-8 mb-3 opacity-40 text-blue-600"/>
                     </motion.div>
                    <span className="text-sm font-medium">Loading chat...</span>
                </motion.div>
            )}
        </div>
    );
});

ChatInterface.displayName = 'ChatInterface';
export default ChatInterface;
