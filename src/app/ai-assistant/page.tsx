// src/app/ai-assistant/page.tsx
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import ChatInterface, { type ChatInterfaceHandle } from '@/app/friends/ChatInterface'; 
import { useAuth } from '@/context/AuthContext';
import { aiFriendProfile } from '@/app/dashboard/types';
import { Loader2, Bot } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import ChatHeader from '@/components/friends/ChatHeader';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

export default function AIAssistantPage() {
    const { userId, loading: authLoading } = useAuth();
    const router = useRouter();
    const [chatId, setChatId] = useState<string | null>(null);
    const [isLoadingAIChat, setIsLoadingAIChat] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const chatInterfaceRef = useRef<ChatInterfaceHandle>(null);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    const handleClearAIChatLocally = useCallback(() => {
        if (chatInterfaceRef.current) {
            chatInterfaceRef.current.performClearLocalAIChat();
            console.log("[AI Assistant Page] Local AI chat clear triggered via ref.");
        } else {
            console.warn("[AI Assistant Page] ChatInterface ref not available to clear chat.");
        }
    }, []);

    const initializeAIChatSession = useCallback(async () => {
        if (!userId || !isClient) {
            if (!authLoading && isClient) setError("User not authenticated or client not ready.");
            setIsLoadingAIChat(false);
            return;
        }
        console.log("[AI Assistant Page] Initializing AI chat session for user:", userId);
        setIsLoadingAIChat(true);
        setError(null);
        try {
            const aiChatRoomId = `ai_session_local_${userId}_${Date.now()}`; 
            setChatId(aiChatRoomId); 
            console.log("[AI Assistant Page] AI Chat ID for session keying set:", aiChatRoomId);
            // Ensure chat history is cleared when a new session starts
            if (chatInterfaceRef.current) {
                chatInterfaceRef.current.performClearLocalAIChat();
            }
        } catch (err: any) {
            console.error("[AI Assistant Page] Error initializing AI chat session:", err);
            setError("Could not prepare Bago AI session. Please try again later.");
        } finally {
            setIsLoadingAIChat(false);
        }
    }, [userId, isClient, authLoading]);

    useEffect(() => {
        if (!authLoading && isClient) {
            if (userId) {
                initializeAIChatSession();
            } else {
                setError("Please log in to chat with the AI Assistant.");
                setIsLoadingAIChat(false);
            }
        }
    }, [authLoading, userId, initializeAIChatSession, isClient]);

    // This effect ensures that whenever the AI assistant page's chatId changes (new session),
    // OR when the component mounts with a valid userId and isClient,
    // the chat history in ChatInterface is reset.
    useEffect(() => {
        if (chatId && chatInterfaceRef.current && isClient && userId) {
            console.log("[AI Assistant Page] New AI Chat ID or mount detected, ensuring ChatInterface history is reset.");
            chatInterfaceRef.current.performClearLocalAIChat();
        }
    }, [chatId, isClient, userId]); // Added isClient and userId to dependencies

    if (authLoading || (isLoadingAIChat && !error)) {
        return (
            <motion.div 
                className="flex flex-col items-center justify-center min-h-[calc(100dvh-var(--header-height,60px)-var(--bottom-nav-height,64px))] p-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                <motion.div
                    className="relative mb-6"
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    <motion.div
                        className="absolute inset-0 bg-primary/20 rounded-full blur-xl"
                        animate={{ 
                            scale: [1, 1.2, 1],
                            opacity: [0.3, 0.6, 0.3]
                        }}
                        transition={{ 
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    />
                    <Loader2 className="h-12 w-12 animate-spin text-primary relative z-10" />
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.4 }}
                    className="text-center"
                >
                    <motion.p 
                        className="text-muted-foreground mb-2 font-medium"
                        animate={{ opacity: [0.7, 1, 0.7] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                    >
                        Connecting to Bago AI...
                    </motion.p>
                    <motion.div 
                        className="flex justify-center space-x-1"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                    >
                        {[0, 1, 2].map((i) => (
                            <motion.div
                                key={i}
                                className="w-2 h-2 bg-primary/60 rounded-full"
                                animate={{ 
                                    y: [0, -8, 0],
                                    opacity: [0.4, 1, 0.4]
                                }}
                                transition={{
                                    duration: 1.2,
                                    repeat: Infinity,
                                    delay: i * 0.2,
                                    ease: "easeInOut"
                                }}
                            />
                        ))}
                    </motion.div>
                </motion.div>
            </motion.div>
        );
    }

    if (error) {
        return (
            <motion.div 
                className="flex flex-col items-center justify-center min-h-[calc(100dvh-var(--header-height,60px)-var(--bottom-nav-height,64px))] p-4"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
            >
                <Card className="w-full max-w-md text-center border-destructive/20 bg-destructive/5">
                    <CardHeader>
                        <motion.div
                            initial={{ rotate: -10, scale: 0.8 }}
                            animate={{ rotate: 0, scale: 1 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                        >
                            <Bot size={48} className="mx-auto mb-3 text-destructive" />
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.2 }}
                        >
                            <CardTitle className="text-destructive">Connection Error</CardTitle>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.3 }}
                        >
                            <CardDescription className="text-destructive/80">{error}</CardDescription>
                        </motion.div>
                    </CardHeader>
                    <CardContent>
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.4 }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <Button 
                                onClick={initializeAIChatSession} 
                                variant="outline"
                                className="hover:bg-destructive/10 hover:border-destructive/30 transition-all duration-200"
                            >
                                Try Again
                            </Button>
                        </motion.div>
                    </CardContent>
                </Card>
            </motion.div>
        );
    }
    
    return (
        <motion.div 
            className="h-[calc(100dvh-var(--header-height,0px)-var(--bottom-nav-height,0px))] flex flex-col bg-card relative px-2 sm:px-4 pb-4 sm:pb-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
        >
            {/* Animated background gradient */}
            <motion.div
                className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1.2 }}
            />
            
            {/* Floating particles effect */}
            <div className="absolute inset-0 pointer-events-none">
                {[...Array(6)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-2 h-2 bg-primary/20 rounded-full"
                        initial={{ 
                            x: Math.random() * window.innerWidth, 
                            y: window.innerHeight + 20,
                            opacity: 0 
                        }}
                        animate={{ 
                            y: -20,
                            opacity: [0, 0.6, 0],
                            scale: [0.5, 1, 0.5]
                        }}
                        transition={{ 
                            duration: 8 + Math.random() * 4,
                            repeat: Infinity,
                            delay: i * 2,
                            ease: "linear"
                        }}
                        style={{
                            left: `${20 + (i * 15)}%`
                        }}
                    />
                ))}
            </div>

            <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="relative z-10"
            >
                <ChatHeader
                    friend={aiFriendProfile}
                    chatId={null} 
                    currentAction="chat"
                    onClearLocalAIChat={handleClearAIChatLocally} 
                />
            </motion.div>
            
            <motion.div 
                className="flex-grow min-h-0 flex flex-col relative z-10"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
            >
                <AnimatePresence mode="wait">
                    {chatId && userId ? ( 
                        <motion.div
                            key="chat-interface"
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -20 }}
                            transition={{ 
                                duration: 0.4,
                                ease: "easeOut"
                            }}
                            className="h-full"
                        >
                            <ChatInterface
                                friend={aiFriendProfile} 
                                currentUserId={userId}
                                chatId={chatId} 
                                ref={chatInterfaceRef}
                            />
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="loading-state"
                            className="flex flex-col items-center justify-center h-full text-muted-foreground italic p-6 text-center bg-muted/20"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.3 }}
                        >
                            <motion.div
                                animate={{ 
                                    rotate: [0, 360],
                                    scale: [1, 1.1, 1]
                                }}
                                transition={{ 
                                    duration: 4,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                                className="mb-4"
                            >
                                <Bot size={40} className="opacity-40"/>
                            </motion.div>
                            <motion.p
                                animate={{ opacity: [0.6, 1, 0.6] }}
                                transition={{ 
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                            >
                                Setting up AI chat. Please wait a moment...
                            </motion.p>
                            <motion.div 
                                className="flex justify-center space-x-2 mt-4"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 }}
                            >
                                {[0, 1, 2].map((i) => (
                                    <motion.div
                                        key={i}
                                        className="w-1 h-1 bg-muted-foreground/40 rounded-full"
                                        animate={{ 
                                            scale: [1, 1.5, 1],
                                            opacity: [0.3, 0.8, 0.3]
                                        }}
                                        transition={{
                                            duration: 1.5,
                                            repeat: Infinity,
                                            delay: i * 0.3,
                                            ease: "easeInOut"
                                        }}
                                    />
                                ))}
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </motion.div>
    );
}
