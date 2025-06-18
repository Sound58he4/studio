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
import { clearChatMessages } from '@/services/firestore/chatService';
import { useToast } from "@/hooks/use-toast";
import { AI_ASSISTANT_ID } from '@/app/dashboard/types';
import { motion } from 'framer-motion';

interface ChatHeaderProps {
    friend: UserFriend | null;
    chatId: string | null;
    onClose?: () => void;    currentAction?: 'chat' | 'progress' | 'profile';
    onSwitchView?: (action: 'chat' | 'progress' | 'profile') => void;
    onClearLocalAIChat?: () => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ friend, chatId, onClose, currentAction, onSwitchView, onClearLocalAIChat }) => {
    const { toast } = useToast();

    const isAI = friend?.id === AI_ASSISTANT_ID;

    const handleClearFirestoreChat = async () => {
         if (!chatId || !friend || isAI) {
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
        <motion.div 
            className="p-3 sm:p-4 border-b flex items-center justify-between gap-3 bg-clayGlass backdrop-blur-sm sticky top-0 z-20 h-14 sm:h-16 shadow-clay border-0"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                {onClose && (
                     <motion.div
                         whileHover={{ scale: 1.05 }}
                         whileTap={{ scale: 0.95 }}
                     >
                         <Button 
                             variant="ghost" 
                             size="icon" 
                             onClick={onClose} 
                             className="md:hidden h-9 w-9 text-gray-600 hover:text-blue-600 hover:bg-blue-50/80 flex-shrink-0 rounded-2xl bg-white/60 backdrop-blur-sm shadow-clayInset hover:shadow-clay transition-all duration-300"
                         >
                             <ArrowLeft size={18}/>
                         </Button>
                     </motion.div>
                )}
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1, duration: 0.3, type: "spring" }}
                >
                    <Avatar className="h-9 w-9 sm:h-10 sm:w-10 md:h-11 md:w-11 border-2 border-white/50 shadow-clay flex-shrink-0">
                        {isAI ? (
                            <div className="flex items-center justify-center h-full w-full bg-gradient-to-br from-blue-400 to-blue-600 rounded-full">
                                <Bot size={16} className="sm:size-5 text-white" />
                            </div>
                        ) : (
                            <>
                                <AvatarImage src={friend.photoURL ?? undefined} alt={friend.displayName || 'F'} />
                                <AvatarFallback className="text-sm bg-gradient-to-br from-blue-400 to-blue-600 text-white font-medium">{friend.displayName?.charAt(0).toUpperCase() || 'F'}</AvatarFallback>
                            </>
                        )}
                    </Avatar>
                </motion.div>
                <motion.div
                    className="min-w-0 flex-1"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2, duration: 0.3 }}
                >
                    <p className="font-semibold text-base sm:text-lg text-gray-800 truncate">{friend.displayName}</p>
                    {isAI && (
                        <p className="text-xs text-gray-600 font-medium">AI Assistant</p>
                    )}
                </motion.div>
            </div>
            <motion.div 
                className="flex items-center gap-1 sm:gap-2 flex-shrink-0"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.3 }}
            >                {onSwitchView && !isAI && (
                    currentAction === 'chat' ? (
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 px-2 sm:h-9 sm:px-3 md:h-10 md:px-4 text-gray-600 hover:text-blue-600 hover:bg-blue-50/80 text-xs sm:text-sm rounded-2xl bg-white/60 backdrop-blur-sm shadow-clayInset hover:shadow-clay transition-all duration-300" 
                                onClick={() => onSwitchView('progress')} 
                                title="View Progress"
                            >
                                <Eye size={14} className="sm:size-4 mr-1"/> 
                                <span className="hidden sm:inline font-medium">Progress</span>
                            </Button>
                        </motion.div>
                    ) : (currentAction === 'progress' || currentAction === 'profile') && (
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 px-2 sm:h-9 sm:px-3 md:h-10 md:px-4 text-gray-600 hover:text-blue-600 hover:bg-blue-50/80 text-xs sm:text-sm rounded-2xl bg-white/60 backdrop-blur-sm shadow-clayInset hover:shadow-clay transition-all duration-300" 
                                onClick={() => onSwitchView('chat')} 
                                title="Chat"
                            >
                                <MessageSquare size={14} className="sm:size-4 mr-1"/> 
                                <span className="hidden sm:inline font-medium">Chat</span>
                            </Button>
                        </motion.div>
                    )
                )}

                {/* Clear Chat button: AlertDialog for friend, direct call for AI */}
                {currentAction === 'chat' && (
                    isAI && onClearLocalAIChat ? (
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={handleClearChatAction} 
                                className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 text-gray-600 hover:text-red-600 hover:bg-red-50/80 flex-shrink-0 rounded-2xl bg-white/60 backdrop-blur-sm shadow-clayInset hover:shadow-clay transition-all duration-300" 
                                title="Clear AI Chat"
                            >
                                <Eraser size={14} className="sm:size-4"/>
                            </Button>
                        </motion.div>
                    ) : !isAI && chatId && (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 text-gray-600 hover:text-red-600 hover:bg-red-50/80 flex-shrink-0 rounded-2xl bg-white/60 backdrop-blur-sm shadow-clayInset hover:shadow-clay transition-all duration-300" 
                                        title="Clear Chat"
                                    >
                                        <Eraser size={16}/>
                                    </Button>
                                </motion.div>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-clayGlass backdrop-blur-sm border-0 shadow-clayStrong rounded-3xl">
                                <AlertDialogHeader>
                                    <AlertDialogTitle className="text-gray-800">Clear Chat History?</AlertDialogTitle>
                                    <AlertDialogDescription className="text-gray-600">
                                        This action cannot be undone. All messages with {friend.displayName} will be permanently deleted.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel className="rounded-2xl bg-white/60 backdrop-blur-sm border-0 shadow-clayInset hover:shadow-clay text-gray-700 hover:text-gray-800">Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleClearFirestoreChat} className={cn("rounded-2xl bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-clay hover:shadow-clayStrong border-0")}>Clear Chat</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )
                )}
            </motion.div>
        </motion.div>
    );
};

export default ChatHeader;
