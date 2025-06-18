// src/components/friends/MessageList.tsx
"use client";

import React from 'react';
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
    className?: string;
}

const MessageList: React.FC<MessageListProps> = React.memo(({
    messages, currentUserId, isLoading, error, friend, isAISelected, scrollAreaRef, className
}) => {    return (
        <div className="space-y-3 sm:space-y-4">
            {isLoading && ( 
                <motion.div 
                    className="flex justify-center items-center h-32"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.3 }}
                >
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                        <Loader2 className="h-6 w-6 text-blue-600" />
                    </motion.div>
                </motion.div> 
            )}
            {error && (
                <motion.p 
                    className="text-red-600 text-center text-sm bg-red-50/80 backdrop-blur-sm p-3 rounded-2xl border border-red-200/50 shadow-lg"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                >
                    {error}
                </motion.p>
            )}
            {!isLoading && !error && messages.length === 0 && !isAISelected && (
                <motion.div 
                    className="text-center py-12 text-gray-600 italic text-sm backdrop-blur-sm rounded-3xl shadow-lg p-6"
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
            )}
            {!isLoading && !error && messages.length === 0 && isAISelected && (
                <motion.div 
                    className="text-center py-12 text-gray-600 italic text-sm backdrop-blur-sm rounded-3xl shadow-lg p-6"
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
                            }}
                            layout
                            className={cn("flex", isUserMessage ? "justify-end" : "justify-start")}
                        >
                            <div className={cn("max-w-[85%] sm:max-w-[80%] lg:max-w-[75%] xl:max-w-[70%]", isUserMessage ? "flex items-start space-x-2 sm:space-x-3" : "")}>
                                {!isUserMessage && (
                                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 shadow-lg bg-gradient-to-br from-blue-400 to-purple-500">
                                        <Bot className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                                    </div>
                                )}
                                <div className="flex flex-col">
                                    <div className={cn(
                                        "p-2.5 sm:p-3 lg:p-4 rounded-2xl sm:rounded-3xl shadow-lg backdrop-blur-sm transition-all duration-300",
                                        isUserMessage 
                                            ? "bg-gradient-to-br from-blue-400 to-purple-500 text-white rounded-tr-lg sm:rounded-tr-xl ml-auto" 
                                            : msg.isAI 
                                                ? "bg-white/90 text-gray-800 rounded-tl-lg sm:rounded-tl-xl" 
                                                : "bg-white/90 text-gray-800 rounded-tl-lg sm:rounded-tl-xl",
                                        isTemp && "opacity-70" 
                                    )}>                        {msg.isAI && msg.text === "Bago is thinking..." ? (
                            <div className="flex space-x-1">
                                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full animate-bounce bg-gray-400"></div>
                                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full animate-bounce bg-gray-400 [animation-delay:0.1s]"></div>
                                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full animate-bounce bg-gray-400 [animation-delay:0.2s]"></div>
                            </div>
                        ) : msg.isAI && msg.text && msg.text !== "Bago is thinking..." ? (
                                            <MarkdownRenderer text={msg.text} />
                                        ) : msg.text === "[Voice Message]" ? (
                                             <span className="italic text-gray-600 flex items-center gap-1.5"><Mic size={14}/> Voice Message</span>
                                        ) : msg.text === "[Image Message]" ? (
                                             <span className="italic text-gray-600 flex items-center gap-1.5"><Camera size={14}/> Image Message</span>
                                        ) : msg.text ? (
                                            <p className="text-xs sm:text-sm lg:text-base leading-relaxed break-words">{msg.text}</p>
                                        ) : null }
                                    </div>
                                    <p className={cn("text-xs mt-1", !isUserMessage ? "" : "text-right", "text-gray-500")}>
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
