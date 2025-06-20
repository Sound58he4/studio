// src/app/ai-assistant/page.tsx
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import ChatInterface, { type ChatInterfaceHandle } from '@/components/friends/ChatInterface'; 
import { useAuth } from '@/context/AuthContext';
import { aiFriendProfile } from '@/app/dashboard/types';
import { Loader2, Bot, Sparkles, Camera, Mic, Send } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion, AnimatePresence } from 'framer-motion';
import MobileNavigation from '@/components/MobileNavigation';
import AISuggestionBar from '@/components/friends/AISuggestionBar';

export default function AIAssistantPage() {
    const { userId, loading: authLoading } = useAuth();
    const router = useRouter();
    const [chatId, setChatId] = useState<string | null>(null);
    const [isLoadingAIChat, setIsLoadingAIChat] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const chatInterfaceRef = useRef<ChatInterfaceHandle>(null);
    const [isClient, setIsClient] = useState(false);    const [message, setMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [isAIProcessing, setIsAIProcessing] = useState(false); // Track AI processing state
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

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
    }, [chatId, isClient, userId]); // Added isClient and userId to dependencies    // Handle sending messages
    const handleSendMessage = useCallback(async () => {
        if (!message.trim() || isSending || !chatInterfaceRef.current) return;
        
        setIsSending(true);
        setIsAIProcessing(true); // Start AI processing indicator
        try {
            // Use the ChatInterface's sendMessage method to handle AI chat
            await chatInterfaceRef.current.sendMessage(message.trim());
            setMessage(''); // Clear the input after successful send
        } catch (error) {
            console.error("[AI Assistant Page] Error sending message:", error);
        } finally {
            setIsSending(false);
            // Keep AI processing indicator for a bit longer to show the thinking state
            setTimeout(() => setIsAIProcessing(false), 1000);
        }
    }, [message, isSending]);

    const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    }, [handleSendMessage]);

    // Handle camera/image functionality
    const handleCameraClick = useCallback(() => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    }, []);

    const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const result = event.target?.result as string;
                setImagePreview(result);
            };
            reader.readAsDataURL(file);
        }
    }, []);

    const removeImage = useCallback(() => {
        setImagePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, []);

    // Clean up audio URL on unmount
    useEffect(() => {
        return () => {
            if (audioUrl) {
                URL.revokeObjectURL(audioUrl);
            }
        };
    }, [audioUrl]);

    // Voice recording logic
    const handleMicClick = useCallback(async () => {
        if (isRecording) {
            // Stop recording
            setIsRecording(false);
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                mediaRecorderRef.current.stop();
            }
        } else {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                const mediaRecorder = new window.MediaRecorder(stream);
                audioChunksRef.current = [];
                mediaRecorder.ondataavailable = (event) => {
                    if (event.data.size > 0) {
                        audioChunksRef.current.push(event.data);
                    }
                };
                mediaRecorder.onstop = () => {
                    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                    setAudioBlob(audioBlob);
                    const url = URL.createObjectURL(audioBlob);
                    setAudioUrl(url);
                    stream.getTracks().forEach(track => track.stop());
                };
                mediaRecorderRef.current = mediaRecorder;
                mediaRecorder.start();
                setIsRecording(true);
            } catch (error) {
                console.error('Microphone access denied:', error);
                alert('Microphone access is required for voice messages.');
            }
        }
    }, [isRecording]);

    // Send audio message to assistant
    const handleSendAudio = useCallback(async () => {
        if (!audioBlob || isSending || !chatInterfaceRef.current) return;
        setIsSending(true);        try {
            // Convert audioBlob to a data URL
            const reader = new FileReader();
            reader.onloadend = async () => {
                const audioDataUrl = reader.result as string;
                if (chatInterfaceRef.current) {
                    await chatInterfaceRef.current.sendMessage('[Voice message]', undefined, audioDataUrl);
                }
                setAudioBlob(null);
                if (audioUrl) {
                    URL.revokeObjectURL(audioUrl);
                    setAudioUrl(null);
                }
                setIsSending(false);
            };
            reader.readAsDataURL(audioBlob);
        } catch (error) {
            console.error('[AI Assistant Page] Error sending audio message:', error);
            setIsSending(false);
        }
    }, [audioBlob, isSending, audioUrl]);    // Handle sending message with media (text, image, or audio)
    const handleSendMessageWithMedia = useCallback(async () => {
        if ((!message.trim() && !imagePreview) || isSending || !chatInterfaceRef.current) return;
        setIsSending(true);
        setIsAIProcessing(true); // Start AI processing indicator
        try {
            await chatInterfaceRef.current.sendMessage(message.trim(), undefined, imagePreview || undefined);
            setMessage('');
            setImagePreview(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } catch (error) {
            console.error('[AI Assistant Page] Error sending message:', error);
        } finally {
            setIsSending(false);
            // Keep AI processing indicator for a bit longer to show the thinking state
            setTimeout(() => setIsAIProcessing(false), 1000);
        }
    }, [message, imagePreview, isSending]);

    // Key press handler for input (send on Enter)
    const handleKeyPressWithMedia = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessageWithMedia();
        }
    }, [handleSendMessageWithMedia]);

    if (authLoading) {
        return (
            <motion.div 
                className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
            >
                <motion.div 
                    className="flex-1 flex items-center justify-center p-4"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                >
                    <Card className="w-full max-w-md backdrop-blur-sm bg-white/90 border-blue-200/50 shadow-lg">
                        <CardContent className="p-8 text-center">
                            <motion.div 
                                className="w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center shadow-lg bg-gradient-to-br from-blue-400 to-purple-500"
                                animate={{ rotate: 360 }}
                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            >
                                <Bot className="w-8 h-8 text-white" />
                            </motion.div>
                            <motion.h2 
                                className="text-xl font-semibold text-gray-900 mb-3"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                Initializing Bago AI
                            </motion.h2>
                            <motion.div 
                                className="flex justify-center space-x-2 mb-4"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.4 }}
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
                            <motion.p 
                                className="text-sm text-gray-600"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                            >
                                Setting up your personalized AI experience...
                            </motion.p>
                        </CardContent>
                    </Card>
                </motion.div>
            </motion.div>
        );
    }

    if (error) {
        return (
            <motion.div 
                className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
            >
                <motion.div 
                    className="flex-1 flex items-center justify-center p-4"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                >
                    <Card className="w-full max-w-md backdrop-blur-sm bg-white/90 border-red-200/50 shadow-lg">
                        <CardHeader className="text-center pb-3">
                            <motion.div 
                                className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center shadow-lg bg-gradient-to-br from-red-400 to-pink-500"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                            >
                                <Bot className="w-8 h-8 text-white" />
                            </motion.div>
                            <CardTitle className="text-red-700 text-lg">Connection Error</CardTitle>
                            <CardDescription className="text-red-600/80">{error}</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0 text-center">
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                <Button 
                                    onClick={initializeAIChatSession}
                                    variant="outline"
                                    className="hover:bg-red-50 hover:border-red-300 transition-all duration-200"
                                >
                                    Try Again
                                </Button>
                            </motion.div>
                        </CardContent>
                    </Card>
                </motion.div>
            </motion.div>
        );
    }

    if (isLoadingAIChat || !chatId) {
        return (
            <motion.div 
                className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
            >
                <motion.div 
                    className="flex-1 flex items-center justify-center p-4"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                >
                    <Card className="w-full max-w-md backdrop-blur-sm bg-white/90 border-blue-200/50 shadow-lg">
                        <CardContent className="p-8 text-center">
                            <motion.div 
                                className="w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center shadow-lg bg-gradient-to-br from-blue-400 to-purple-500"
                                animate={{ rotate: 360 }}
                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            >
                                <Bot className="w-8 h-8 text-white" />
                            </motion.div>
                            <motion.h2 
                                className="text-xl font-semibold text-gray-900 mb-3"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                Preparing Bago AI
                            </motion.h2>
                            <motion.div 
                                className="flex justify-center space-x-2 mb-4"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.4 }}
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
                            <motion.p 
                                className="text-sm text-gray-600"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                            >
                                Getting your AI assistant ready...
                            </motion.p>
                        </CardContent>
                    </Card>
                </motion.div>
            </motion.div>
        );
    }    return (
        <div className="min-h-screen flex flex-col transition-all duration-500 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative">            {/* Main Container - Fixed height with improved spacing */}
            <div className="flex-1 w-full max-w-4xl mx-auto flex flex-col px-2 sm:px-4 lg:px-6 pb-32 md:pb-28 h-[calc(100vh-80px)]">
        
                {/* Chat Header - Enhanced visual appeal */}
                <div className="backdrop-blur-sm p-4 sm:p-5 lg:p-6 border shadow-xl rounded-b-2xl sm:rounded-b-3xl mx-2 sm:mx-4 lg:mx-6 mt-3 sm:mt-4 transition-all duration-300 flex-shrink-0 bg-white/95 border-gray-200/60">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 sm:space-x-4">
                            <div className="flex items-center space-x-3 sm:space-x-4">
                                <div className="relative">
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-full flex items-center justify-center shadow-xl bg-gradient-to-br from-blue-400 to-purple-500">
                                        <Bot className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-white" />
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-green-500 border-2 border-white rounded-full shadow-lg"></div>
                                </div>
                                <div>
                                    <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900">Bago AI</h2>
                                    <p className="text-sm sm:text-base text-green-600 font-medium">Active now</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>                {/* Messages Container - Fixed height for proper scrolling */}
                <div className="flex-1 mx-2 sm:mx-4 lg:mx-6 min-h-0 overflow-hidden border border-gray-200/60 rounded-2xl bg-white/60 backdrop-blur-sm shadow-lg mt-3">
                    <ChatInterface 
                        friend={aiFriendProfile} 
                        currentUserId={userId} 
                        chatId={chatId} 
                        ref={chatInterfaceRef}
                    />
                </div>
            </div>            {/* Combined Actions and Input Card - Enhanced styling */}
            <div className="fixed bottom-20 md:bottom-4 left-0 right-0 z-50">
                <div className="w-full max-w-4xl mx-auto px-2 sm:px-4 lg:px-6">
                    <div className="backdrop-blur-lg p-4 sm:p-5 lg:p-6 shadow-2xl mx-2 sm:mx-4 lg:mx-6 rounded-2xl sm:rounded-3xl transition-all duration-300 bg-white/95 border border-gray-200/60">                        {/* Quick Actions - Improved spacing and styling */}
                        <div className="flex flex-wrap gap-2 sm:gap-3 lg:gap-4 mb-4 sm:mb-5">                            {/* AI Processing Status Indicator */}
                            {(isSending || isAIProcessing) && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="flex items-center space-x-3 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200/60 rounded-full px-4 py-2 shadow-lg"
                                >
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                        className="w-5 h-5 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                                    />
                                    <span className="text-sm font-medium text-gray-700">
                                        {isSending ? "Sending..." : "🤖 AI is thinking..."}
                                    </span>
                                </motion.div>
                            )}<Button 
                                variant="outline" 
                                size="sm" 
                                className={`text-sm rounded-full px-4 sm:px-5 lg:px-6 py-2 sm:py-2.5 h-auto backdrop-blur-sm flex-1 sm:flex-none min-w-0 transition-all duration-300 font-medium ${
                                    showSuggestions 
                                        ? 'bg-blue-600 border-blue-600 text-white hover:bg-blue-700 hover:border-blue-700 shadow-lg' 
                                        : 'bg-blue-50/90 border-blue-200/60 text-blue-700 hover:bg-blue-100/90 shadow-md'
                                }`}
                                onClick={() => setShowSuggestions(!showSuggestions)}
                            >
                                <Sparkles className="w-4 h-4 mr-2 flex-shrink-0" />
                                <span className="truncate">{showSuggestions ? 'Hide Suggestions' : 'Show AI Suggestions'}</span>
                            </Button></div>
                        
                        {/* AI Suggestions Bar */}
                        <AnimatePresence>
                            {showSuggestions && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="mb-3 sm:mb-4"
                                >
                                    <AISuggestionBar 
                                        onSuggestionClick={(prompt) => {
                                            setMessage(prompt);
                                            setShowSuggestions(false);
                                        }} 
                                        onHide={() => setShowSuggestions(false)} 
                                    />
                                </motion.div>
                            )}                        </AnimatePresence>
                        
                        {/* Image Preview */}
                        {imagePreview && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="mb-3 sm:mb-4"
                            >
                                <div className="relative inline-block">
                                    <img 
                                        src={imagePreview} 
                                        alt="Selected image" 
                                        className="h-20 w-20 sm:h-24 sm:w-24 object-cover rounded-lg border-2 border-blue-200"
                                    />
                                    <button
                                        onClick={removeImage}
                                        className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm transition-colors"
                                        aria-label="Remove image"
                                    >
                                        ×
                                    </button>
                                </div>
                            </motion.div>
                        )}
                        
                        {/* Audio Preview */}
                        {audioUrl && (
                            <div className="mb-3 sm:mb-4 flex items-center space-x-3">
                                <audio controls src={audioUrl} className="h-8" />
                                <Button size="sm" variant="link" onClick={() => { setAudioBlob(null); if (audioUrl) { URL.revokeObjectURL(audioUrl); setAudioUrl(null); } }}>Clear</Button>
                                <Button size="sm" onClick={handleSendAudio} disabled={isSending} className="bg-gradient-to-br from-blue-400 to-purple-500 text-white">Send Voice</Button>
                            </div>
                        )}
                          {/* Input Area - Enhanced styling */}
                        <div className="flex items-center space-x-3 sm:space-x-4">
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-10 w-10 sm:h-12 sm:w-12 rounded-full transition-all duration-300 flex-shrink-0 text-gray-500 hover:text-purple-600 hover:bg-purple-50/90 shadow-md hover:shadow-lg"
                                onClick={handleCameraClick}
                            >
                                <Camera className="w-5 h-5 sm:w-6 sm:h-6" />
                            </Button>                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className={`h-10 w-10 sm:h-12 sm:w-12 rounded-full transition-all duration-300 flex-shrink-0 shadow-md hover:shadow-lg ${isRecording ? 'text-red-600 bg-red-50 hover:bg-red-100' : 'text-gray-500 hover:text-purple-600 hover:bg-purple-50/90'}`}
                                onClick={handleMicClick}
                                disabled={isSending}
                            >
                                <Mic className="w-5 h-5 sm:w-6 sm:h-6" />
                                {isRecording && <span className="sr-only">Recording...</span>}
                            </Button>
                            <div className="flex-1 relative min-w-0">
                                <Input
                                    placeholder="Type a message..."
                                    className="pr-12 sm:pr-14 border-0 rounded-full h-10 sm:h-12 text-sm sm:text-base focus:ring-2 focus:ring-purple-200/60 transition-all backdrop-blur-sm bg-gray-100/90 focus:bg-white/95 shadow-md focus:shadow-lg font-medium"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    onKeyDown={handleKeyPressWithMedia}
                                />{/* File input for image selection */}
                                <input
                                    type="file"
                                    accept="image/*"
                                    ref={fileInputRef}
                                    onChange={handleImageSelect}
                                    className="hidden"
                                    aria-label="Select image from camera or gallery"
                                    title="Select image"
                                />                                <Button
                                    onClick={handleSendMessageWithMedia}
                                    disabled={!message.trim() && !imagePreview || isSending}
                                    size="icon"
                                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 sm:h-10 sm:w-10 rounded-full shadow-xl transition-all duration-300 bg-gradient-to-br from-blue-400 to-purple-500 hover:from-blue-500 hover:to-purple-600 disabled:opacity-50 hover:scale-105 disabled:hover:scale-100"
                                >
                                    <Send className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <MobileNavigation />
        </div>
    );
}
