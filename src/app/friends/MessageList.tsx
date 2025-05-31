
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

interface MessageListProps {
    messages: ChatMessage[];
    currentUserId: string | null;
    isLoading: boolean;
    error: string | null;
    friend: UserFriend | null;
    isAISelected: boolean;
    scrollAreaRef: React.RefObject<HTMLDivElement>;
}

const MessageList: React.FC<MessageListProps> = React.memo(({
    messages, currentUserId, isLoading, error, friend, isAISelected, scrollAreaRef
}) => {

    return (
        <ScrollArea className="flex-grow bg-gradient-to-b from-background to-muted/10 min-h-0" viewportRef={scrollAreaRef}>
           <div className="p-3 sm:p-4 space-y-4">
               {isLoading && ( <div className="flex justify-center items-center h-32"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> )}
               {error && <p className="text-destructive text-center text-sm">{error}</p>}
               {!isLoading && !error && messages.length === 0 && !isAISelected && (
                   <div className="text-center py-12 text-muted-foreground italic text-sm">
                       <MessageSquare size={40} className="mx-auto mb-3 opacity-50"/>
                       No messages yet. Say hello!
                   </div>
               )}
                {!isLoading && !error && messages.length === 0 && isAISelected && (
                    <div className="text-center py-12 text-muted-foreground italic text-sm">
                        <Bot size={40} className="mx-auto mb-3 opacity-50"/>
                        Ask Bago AI anything! You can also send voice notes or images.
                    </div>
                )}
               {!isLoading && !error && messages.map((msg) => {
                    const isUserMessage = msg.senderId === currentUserId;
                    const isTemp = msg.id.startsWith('temp-');
                    
                    return (
                        <div key={msg.id} className={cn("flex group", isUserMessage ? "justify-end" : "justify-start")}>
                            <div className={cn("flex max-w-[80%] sm:max-w-[70%]", isUserMessage ? "flex-row-reverse items-end" : "flex-row items-end")}>
                                {!isUserMessage && (
                                    <Avatar className="h-6 w-6 border shadow-sm flex-shrink-0 mr-2 mb-1 self-end">
                                        {msg.isAI ? (
                                            <div className="flex items-center justify-center h-full w-full bg-gradient-to-br from-primary to-accent rounded-full">
                                                <Bot size={12} className="text-primary-foreground" />
                                            </div>
                                        ) : (
                                            <>
                                                <AvatarImage src={friend?.photoURL ?? undefined} alt={friend?.displayName?.charAt(0) || 'U'} />
                                                <AvatarFallback className="text-xs">{friend?.displayName?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                                            </>
                                        )}
                                    </Avatar>
                                )}
                                <div className={cn("flex flex-col", isUserMessage ? "items-end" : "items-start")}>
                                    <div className={cn(
                                        "p-2 px-3 rounded-lg text-sm shadow-md relative",
                                        "transition-all duration-200 ease-out group-hover:scale-[1.01] group-hover:shadow-lg",
                                        isUserMessage
                                            ? "bg-primary text-primary-foreground rounded-br-none"
                                            : msg.isAI ? "bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/50 dark:to-purple-900/50 text-foreground rounded-bl-none" : "bg-muted text-foreground rounded-bl-none",
                                        isTemp && "opacity-70" 
                                    )}>
                                        {msg.isAI && msg.text && msg.text !== "Bago is thinking..." ? (
                                            <MarkdownRenderer text={msg.text} />
                                        ) : msg.text === "[Voice Message]" ? (
                                             <span className="italic text-muted-foreground flex items-center gap-1"><Mic size={14}/> Voice Message</span>
                                        ) : msg.text === "[Image Message]" ? (
                                             <span className="italic text-muted-foreground flex items-center gap-1"><Camera size={14}/> Image Message</span>
                                        ) : msg.text ? (
                                            <p className="break-words whitespace-pre-wrap">{msg.text}</p>
                                        ) : null }

                                    </div>
                                    <p className={cn("text-xs opacity-60 mt-1 px-1 transition-opacity duration-300 group-hover:opacity-100")}>
                                        {msg.timestamp && !isTemp ? formatDistanceToNow(parseISO(msg.timestamp), { addSuffix: true }) : msg.id.startsWith('temp-ai-') ? 'AI is thinking...' : 'Sending...'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    );
               })}
           </div>
        </ScrollArea>
    );
});

MessageList.displayName = 'MessageList';

export default MessageList;
