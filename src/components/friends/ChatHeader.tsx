// src/components/friends/ChatHeader.tsx
"use client";

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";
import { Eraser, Bot, ArrowLeft, Eye, MessageSquare } from "lucide-react";
import { cn } from '@/lib/utils';
import type { UserFriend } from '@/app/dashboard/types';
import { clearChatMessages } from '@/services/firestore/chatService'; // For friend chats
import { useToast } from "@/hooks/use-toast";
import { AI_ASSISTANT_ID } from '@/app/dashboard/types'; // Import AI_ASSISTANT_ID

interface ChatHeaderProps {
    friend: UserFriend | null;
    chatId: string | null; // For friend chats, null for AI if no Firestore doc
    onClose?: () => void;
    currentAction?: 'chat' | 'progress';
    onSwitchView?: (action: 'chat' | 'progress') => void;
    onClearLocalAIChat?: () => void; // New prop for clearing local AI chat
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ friend, chatId, onClose, currentAction, onSwitchView, onClearLocalAIChat }) => {
    const { toast } = useToast();

    const isAI = friend?.id === AI_ASSISTANT_ID;

    const handleClearFirestoreChat = async () => {
         if (!chatId || !friend || isAI) { // Ensure this is only for friend chats
             toast({ variant: "destructive", title: "Error", description: "Chat session not found or not applicable." });
             return;
         }
         try {
             await clearChatMessages(chatId);
             toast({ title: "Chat Cleared", description: `Messages with ${friend.displayName} removed from server.` });
         } catch (err) {
             console.error("[ChatHeader] Error clearing Firestore chat:", err);
             toast({ variant: "destructive", title: "Error", description: "Could not clear chat messages from server." });
         }
     };

    const handleClearChatAction = () => {
        if (isAI && onClearLocalAIChat) {
            onClearLocalAIChat();
        } else if (!isAI && chatId) {
            // Trigger AlertDialog for Firestore chat clear
            // The AlertDialog already calls handleClearFirestoreChat via its action
        }
    };

    if (!friend) return null;

    return (
        <div className="p-3 border-b flex items-center justify-between gap-3 bg-card/95 backdrop-blur-sm sticky top-0 z-20 h-14">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                {onClose && (
                     <Button variant="ghost" size="icon" onClick={onClose} className="md:hidden h-8 w-8 text-muted-foreground hover:text-primary">
                         <ArrowLeft size={18}/>
                     </Button>
                )}
                <Avatar className="h-8 w-8 sm:h-9 sm:w-9 border-2 border-border shadow-sm flex-shrink-0">
                    {isAI ? (
                        <div className="flex items-center justify-center h-full w-full bg-gradient-to-br from-primary to-accent rounded-full">
                            <Bot size={16} className="text-primary-foreground" />
                        </div>
                    ) : (
                        <>
                            <AvatarImage src={friend.photoURL ?? undefined} alt={friend.displayName || 'F'} />
                            <AvatarFallback className="text-xs bg-muted text-muted-foreground">{friend.displayName?.charAt(0).toUpperCase() || 'F'}</AvatarFallback>
                        </>
                    )}
                </Avatar>
                <p className="font-semibold text-sm sm:text-base text-foreground truncate">{friend.displayName}</p>
            </div>
            <div className="flex items-center gap-1 sm:gap-1.5">
                {onSwitchView && !isAI && (
                    currentAction === 'chat' ? (
                        <Button variant="ghost" size="sm" className="h-7 px-2 sm:h-8 sm:px-3 text-muted-foreground hover:text-primary text-xs" onClick={() => onSwitchView('progress')} title="View Progress">
                            <Eye size={14} className="mr-1"/> Progress
                        </Button>
                    ) : currentAction === 'progress' && (
                        <Button variant="ghost" size="sm" className="h-7 px-2 sm:h-8 sm:px-3 text-muted-foreground hover:text-primary text-xs" onClick={() => onSwitchView('chat')} title="Chat">
                            <MessageSquare size={14} className="mr-1"/> Chat
                        </Button>
                    )
                )}

                {/* Clear Chat button: AlertDialog for friend, direct call for AI */}
                {currentAction === 'chat' && (
                    isAI && onClearLocalAIChat ? (
                        <Button variant="ghost" size="icon" onClick={handleClearChatAction} className="h-7 w-7 sm:h-8 sm:w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex-shrink-0" title="Clear AI Chat">
                            <Eraser size={14}/>
                        </Button>
                    ) : !isAI && chatId && (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex-shrink-0" title="Clear Chat">
                                    <Eraser size={14}/>
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Clear Chat History?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. All messages with {friend.displayName} will be permanently deleted.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleClearFirestoreChat} className={cn(buttonVariants({ variant: "destructive" }))}>Clear Chat</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )
                )}
            </div>
        </div>
    );
};

export default ChatHeader;
