// src/components/friends/MessageList.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, MessageSquare, Bot, Mic, Camera } from "lucide-react";
import { cn } from '@/lib/utils';
import type { ChatMessage, UserFriend } from '@/app/dashboard/types';
import { formatDistanceToNow, parseISO } from 'date-fns';
import MarkdownRenderer from '@/components/friends/MarkdownRenderer';
import { motion, AnimatePresence } from 'framer-motion';

interface MessageListProps {
    messages: ChatMessage[];
    currentUserId: string | null;
    isLoading: boolean;
    error: string | null;
    friend: UserFriend | null;
    isAISelected: boolean;
    scrollAreaRef: React.RefObject<HTMLDivElement>; // This ref is for the viewport
    isAIProcessing?: boolean; // New prop to show AI processing state
    className?: string;
    isDark?: boolean;
}

const MessageList: React.FC<MessageListProps> = React.memo(({
    messages, currentUserId, isLoading, error, friend, isAISelected, scrollAreaRef, isAIProcessing = false, className, isDark: propIsDark
}) => {
    const [lightTheme, setLightTheme] = useState(() => {
        if (typeof window !== 'undefined') {
            // Check if dark theme class is applied to document root
            return !document.documentElement.classList.contains('dark');
        }
        return true; // Default to light theme
    });

    // Use prop value if provided, otherwise detect from document
    const isDark = propIsDark !== undefined ? propIsDark : !lightTheme;

    useEffect(() => {
        if (propIsDark !== undefined) return; // Skip detection if prop is provided
        
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
    }, [propIsDark]);

    return (
        <div className="space-y-4 sm:space-y-5">
            {isLoading && ( 
                <motion.div 
                    className="flex justify-center items-center h-32"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.3 }}
                >                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                        <Loader2 className={`h-6 w-6 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                    </motion.div>
                </motion.div> 
            )}
              {/* AI Processing Indicator - More prominent and clear */}
            {isAIProcessing && (
                <motion.div 
                    className="flex justify-start mb-6"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                >
                    <div className="max-w-[85%] sm:max-w-[80%] lg:max-w-[75%] xl:max-w-[70%]">
                        <div className="flex items-start space-x-3 sm:space-x-4">
                            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0 mt-1 shadow-xl ring-2 ${
                                isDark 
                                    ? 'bg-blue-600 ring-blue-400/30' 
                                    : 'bg-blue-500 ring-blue-200/50'
                            }`}>
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                >
                                    <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                                </motion.div>
                            </div>
                            <div className="flex flex-col">                                <div className={`rounded-tl-lg sm:rounded-tl-xl p-4 sm:p-5 lg:p-6 rounded-2xl sm:rounded-3xl shadow-xl backdrop-blur-sm border-2 relative overflow-hidden ${
                                    isDark 
                                        ? 'bg-[#3a3a3a] text-gray-200 border-blue-500/30' 
                                        : 'bg-blue-50 text-gray-800 border-blue-200/60'
                                }`}>
                                    {/* Background animation */}
                                    <motion.div
                                        className={`absolute inset-0 ${
                                            isDark 
                                                ? 'bg-gradient-to-r from-[#8b5cf6]/10 to-[#7c3aed]/10' 
                                                : 'bg-gradient-to-r from-blue-200/20 to-blue-300/20'
                                        }`}
                                        animate={{ x: [-100, 100] }}
                                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                    />
                                    <div className="relative z-10">
                                        <div className="flex items-center space-x-3">
                                            <div className="flex space-x-1.5">                                                <motion.div
                                                    className={`w-3 h-3 rounded-full ${
                                                        isDark ? 'bg-[#8b5cf6]' : 'bg-blue-500'
                                                    }`}
                                                    animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
                                                    transition={{ duration: 1.2, repeat: Infinity, delay: 0 }}
                                                />
                                                <motion.div
                                                    className={`w-3 h-3 rounded-full ${
                                                        isDark ? 'bg-[#3b82f6]' : 'bg-blue-500'
                                                    }`}
                                                    animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
                                                    transition={{ duration: 1.2, repeat: Infinity, delay: 0.3 }}
                                                />
                                                <motion.div
                                                    className={`w-3 h-3 rounded-full ${
                                                        isDark ? 'bg-[#8b5cf6]' : 'bg-blue-500'
                                                    }`}
                                                    animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
                                                    transition={{ duration: 1.2, repeat: Infinity, delay: 0.6 }}
                                                />
                                            </div>
                                            <div>                                                <span className={`text-base font-semibold ${
                                                    isDark ? 'text-white' : 'text-gray-800'
                                                }`}>Bago AI is thinking...</span>
                                                <p className={`text-sm mt-1 ${
                                                    isDark ? 'text-gray-400' : 'text-gray-600'
                                                }`}>Processing your request and generating a response</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <p className={`text-xs mt-2 font-medium ${
                                    isDark ? 'text-gray-400' : 'text-gray-500'
                                }`}>⚡ AI is analyzing and preparing your response</p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}            {error && (
                <motion.p 
                    className={`text-center text-sm backdrop-blur-sm p-3 rounded-2xl border shadow-lg ${
                        isDark 
                            ? 'text-red-400 bg-red-600/10 border-red-500/30' 
                            : 'text-red-600 bg-red-50/80 border-red-200/50'
                    }`}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                >
                    {error}
                </motion.p>
            )}            {!isLoading && !error && messages.length === 0 && !isAISelected && (
                <motion.div 
                    className={`text-center py-12 italic text-sm backdrop-blur-sm rounded-3xl shadow-lg p-6 ${
                        isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.4, duration: 0.3, type: "spring" }}
                    >
                        <MessageSquare size={40} className="mx-auto mb-3 opacity-50"/>
                    </motion.div>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6, duration: 0.3 }}
                    >
                        No messages yet. Say hello!
                    </motion.p>
                </motion.div>
            )}            {!isLoading && !error && messages.length === 0 && isAISelected && (
                <motion.div 
                    className={`text-center py-12 italic text-sm backdrop-blur-sm rounded-3xl shadow-lg p-6 ${
                        isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.4, duration: 0.3, type: "spring" }}
                    >
                        <Bot size={40} className="mx-auto mb-3 opacity-50"/>
                    </motion.div>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6, duration: 0.3 }}
                    >
                        Ask Bago AI anything! You can also send voice notes or images.
                    </motion.p>
                </motion.div>
            )}
            <AnimatePresence mode="popLayout">
                {!isLoading && !error && messages.map((msg, index) => {
                    const isUserMessage = msg.senderId === currentUserId;
                    const isTemp = msg.id.startsWith('temp-');
                    
                    return (
                        <motion.div 
                            key={msg.id}
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            transition={{ 
                                duration: 0.3,
                                delay: Math.min(index * 0.1, 0.5),
                                ease: "easeOut"
                            }}                            layout
                            className={cn("flex mb-3 sm:mb-4", isUserMessage ? "justify-end" : "justify-start")}
                        >
                            <div className={cn("max-w-[85%] sm:max-w-[80%] lg:max-w-[75%] xl:max-w-[70%]", isUserMessage ? "flex items-start space-x-2 sm:space-x-3" : "")}>                                {!isUserMessage && (
                                    <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 shadow-lg ${
                                        isDark 
                                            ? 'bg-[#8b5cf6]' 
                                            : 'bg-gradient-to-br from-blue-500 to-blue-600'
                                    }`}>
                                        <Bot className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                                    </div>
                                )}
                                <div className="flex flex-col">                                    <div className={cn(
                                        "p-3 sm:p-4 lg:p-5 rounded-2xl sm:rounded-3xl shadow-lg backdrop-blur-sm transition-all duration-300 border",
                                        isUserMessage 
                                            ? isDark
                                                ? "bg-[#8b5cf6] text-white rounded-tr-lg sm:rounded-tr-xl ml-auto border-[#8b5cf6]/30" 
                                                : "bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-tr-lg sm:rounded-tr-xl ml-auto border-blue-300/30"
                                            : msg.isAI 
                                                ? isDark
                                                    ? "bg-[#3a3a3a] text-gray-200 rounded-tl-lg sm:rounded-tl-xl border-[#4a4a4a]" 
                                                    : "bg-white/95 text-gray-800 rounded-tl-lg sm:rounded-tl-xl border-gray-200/50"
                                                : isDark
                                                    ? "bg-[#3a3a3a] text-gray-200 rounded-tl-lg sm:rounded-tl-xl border-[#4a4a4a]" 
                                                    : "bg-white/95 text-gray-800 rounded-tl-lg sm:rounded-tl-xl border-gray-200/50",
                                        isTemp && "opacity-70"                                    )}>
                        {msg.isAI && msg.text === "Bago is thinking..." ? (
                            <div className="flex items-center space-x-2">
                                <div className="flex space-x-1">
                                    <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full animate-bounce ${
                                        isDark ? 'bg-gray-400' : 'bg-gray-400'
                                    }`}></div>
                                    <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full animate-bounce [animation-delay:0.1s] ${
                                        isDark ? 'bg-gray-400' : 'bg-gray-400'
                                    }`}></div>
                                    <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full animate-bounce [animation-delay:0.2s] ${
                                        isDark ? 'bg-gray-400' : 'bg-gray-400'
                                    }`}></div>
                                </div>
                                <span className={`text-sm ${
                                    isDark ? 'text-gray-400' : 'text-gray-600'
                                }`}>Processing...</span>
                            </div>
                        ) : msg.isAI && msg.text && msg.text !== "Bago is thinking..." ? (
                            <MarkdownRenderer text={msg.text} />
                        ) : msg.text === "[Voice Message]" ? (
                            <span className={`italic flex items-center gap-2 ${
                                isDark ? 'text-gray-400' : 'text-gray-600'
                            }`}><Mic size={16}/> Voice Message</span>
                        ) : msg.text === "[Image Message]" ? (
                            <span className={`italic flex items-center gap-2 ${
                                isDark ? 'text-gray-400' : 'text-gray-600'
                            }`}><Camera size={16}/> Image Message</span>
                        ) : msg.text ? (
                            <p className="text-sm sm:text-base lg:text-lg leading-relaxed break-words">{msg.text}</p>
                        ) : null }
                                    </div>

                                    <p className={cn("text-xs mt-2", !isUserMessage ? "" : "text-right", isDark ? "text-gray-400" : "text-gray-500", "font-medium")}>
                                        {msg.timestamp && !isTemp ? formatDistanceToNow(parseISO(msg.timestamp), { addSuffix: true }) : msg.id.startsWith('temp-ai-') ? 'AI is thinking...' : 'Sending...'}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
});

MessageList.displayName = 'MessageList';

export default MessageList;
