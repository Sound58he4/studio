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
}) => {

    return (
        // The main ScrollArea component itself can take a ref if needed for the root element
        // However, the viewportRef was intended for the scrollable content area.
        // The `ScrollArea` component from shadcn/ui typically manages its own internal refs for viewport.
        // If direct manipulation of the viewport is needed, it's usually done via the `ref` on `ScrollArea` itself
        // and then finding the viewport element, or by passing the ref to a child that becomes the viewport.
        // For now, let's assume scrollAreaRef is for the viewport. Shadcn's ScrollArea forwards ref to its viewport.
        <ScrollArea ref={scrollAreaRef} className={cn("flex-1 bg-gradient-to-b from-background to-muted/10 min-h-0", className)}>
           <div className="p-2 sm:p-3 md:p-4 space-y-3 sm:space-y-4">
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
                           <Loader2 className="h-6 w-6 text-primary" />
                       </motion.div>
                   </motion.div> 
               )}
               {error && (
                   <motion.p 
                       className="text-destructive text-center text-sm"
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
                       className="text-center py-12 text-muted-foreground italic text-sm"
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
                        className="text-center py-12 text-muted-foreground italic text-sm"
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
                                className={cn("flex group", isUserMessage ? "justify-end" : "justify-start")}
                            >
                                <div className={cn("flex max-w-[85%] md:max-w-[80%] lg:max-w-[70%]", isUserMessage ? "flex-row-reverse items-end" : "flex-row items-end")}>
                                    {!isUserMessage && (
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ delay: Math.min(index * 0.1, 0.5) + 0.2, duration: 0.2 }}
                                        >
                                            <Avatar className="h-5 w-5 sm:h-6 sm:w-6 border shadow-sm flex-shrink-0 mr-1.5 sm:mr-2 mb-1 self-end">
                                                {msg.isAI ? (
                                                    <div className="flex items-center justify-center h-full w-full bg-gradient-to-br from-primary to-accent rounded-full">
                                                        <Bot size={10} className="sm:size-3 text-primary-foreground" />
                                                    </div>
                                                ) : (
                                                    <>
                                                        <AvatarImage src={friend?.photoURL ?? undefined} alt={friend?.displayName?.charAt(0) || 'U'} />
                                                        <AvatarFallback className="text-xs">{friend?.displayName?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                                                    </>
                                                )}
                                            </Avatar>
                                        </motion.div>
                                    )}
                                    <div className={cn("flex flex-col", isUserMessage ? "items-end" : "items-start")}>
                                        <motion.div 
                                            className={cn(
                                                "p-2 px-3 rounded-lg text-sm shadow-md relative",
                                                "transition-all duration-200 ease-out group-hover:scale-[1.01] group-hover:shadow-lg",
                                                isUserMessage
                                                    ? "bg-primary text-primary-foreground rounded-br-none"
                                                    : msg.isAI ? "bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/50 dark:to-purple-900/50 text-foreground rounded-bl-none" : "bg-muted text-foreground rounded-bl-none",
                                                isTemp && "opacity-70" 
                                            )}
                                            whileHover={{ scale: 1.01 }}
                                            whileTap={{ scale: 0.99 }}
                                            initial={{ scale: 0.9 }}
                                            animate={{ scale: 1 }}
                                            transition={{ delay: Math.min(index * 0.1, 0.5) + 0.1, duration: 0.2 }}
                                        >
                                            {msg.isAI && msg.text && msg.text !== "Bago is thinking..." ? (
                                                <MarkdownRenderer text={msg.text} />
                                            ) : msg.text === "[Voice Message]" ? (
                                                 <span className="italic text-muted-foreground flex items-center gap-1"><Mic size={14}/> Voice Message</span>
                                            ) : msg.text === "[Image Message]" ? (
                                                 <span className="italic text-muted-foreground flex items-center gap-1"><Camera size={14}/> Image Message</span>
                                            ) : msg.text ? (
                                                <p className="break-words whitespace-pre-wrap">{msg.text}</p>
                                            ) : null }
                                        </motion.div>
                                        <motion.p 
                                            className={cn("text-xs opacity-60 mt-1 px-1 transition-opacity duration-300 group-hover:opacity-100")}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 0.6 }}
                                            transition={{ delay: Math.min(index * 0.1, 0.5) + 0.3, duration: 0.2 }}
                                        >
                                            {msg.timestamp && !isTemp ? formatDistanceToNow(parseISO(msg.timestamp), { addSuffix: true }) : msg.id.startsWith('temp-ai-') ? 'AI is thinking...' : 'Sending...'}
                                        </motion.p>
                                    </div>
                                </div>
                            </motion.div>
                        );
                   })}
               </AnimatePresence>
           </div>
        </ScrollArea>
    );
});

MessageList.displayName = 'MessageList';

export default MessageList;
