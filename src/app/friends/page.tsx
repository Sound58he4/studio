// src/app/friends/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, Users, MessageSquare, Eye, UserPlus, Search, ArrowLeft } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/context/AuthContext';
import { getFriends, searchUsers, sendViewRequest } from '@/services/firestore/socialService'; 
import { getOrCreateChatRoom } from '@/services/firestore/chatService';
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { UserFriend, SearchResultUser } from '@/app/dashboard/types'; 
import ChatInterface from '@/components/friends/ChatInterface';
import ProgressViewer from './ProgressViewer'; 
import ChatHeader from '@/components/friends/ChatHeader'; 
import { AI_ASSISTANT_ID } from '@/app/dashboard/types';
import { motion, AnimatePresence } from 'framer-motion';

interface SelectedFriendAction {
    friend: UserFriend;
    action: 'chat' | 'progress';
}

export default function FriendsPage() {
    const { userId, loading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [friends, setFriends] = useState<UserFriend[]>([]);
    const [selectedFriendAction, setSelectedFriendAction] = useState<SelectedFriendAction | null>(null);
    const [currentChatId, setCurrentChatId] = useState<string | null>(null);
    const [isLoadingFriends, setIsLoadingFriends] = useState(true);
    const [isLoadingChatId, setIsLoadingChatId] = useState(false);
    const [firestoreError, setFirestoreError] = useState<string | null>(null);
    const [hasFetchedFriends, setHasFetchedFriends] = useState(false);

    const fetchFriendsCallback = useCallback(async () => {
        if (!userId || hasFetchedFriends) {
            if (!userId && !authLoading) setIsLoadingFriends(false);
            return;
        }
        console.log("[FriendsPage] Fetching friends...");
        setIsLoadingFriends(true);
        setFirestoreError(null);
        setHasFetchedFriends(true); 
        try {
            const friendList = await getFriends(userId);
            setFriends(friendList.filter(f => f.id !== AI_ASSISTANT_ID)); 
            console.log("[FriendsPage] Friends fetched:", friendList.length);
        } catch (error: any) {
            console.error("[Friends Page] Error fetching friends:", error);
            if (error.message?.includes("index required")) {
                setFirestoreError(error.message);
            } else {
                toast({ variant: "destructive", title: "Error", description: "Could not load friends list." });
            }
            setFriends([]);
        } finally {
            setIsLoadingFriends(false);
        }
    }, [userId, toast, hasFetchedFriends, authLoading]);

    useEffect(() => {
        if (!authLoading && userId && !hasFetchedFriends) {
            fetchFriendsCallback();
        } else if (!authLoading && !userId) {
            setIsLoadingFriends(false);
        }
    }, [authLoading, userId, fetchFriendsCallback, hasFetchedFriends]);

    useEffect(() => {
        if (selectedFriendAction?.action === 'chat' && selectedFriendAction.friend && userId) {
            console.log(`[FriendsPage] Initializing chat for ${selectedFriendAction.friend.displayName}`);
            setIsLoadingChatId(true);
            setCurrentChatId(null);
            const friendIdToUse = selectedFriendAction.friend.id;

            getOrCreateChatRoom(userId, friendIdToUse)
                .then(chatId => {
                    setCurrentChatId(chatId);
                    console.log(`[FriendsPage] Chat ID set: ${chatId}`);
                })
                .catch(err => {
                    console.error("[Friends Page] Error getting chat room ID:", err);
                    toast({ variant: "destructive", title: "Chat Error", description: "Could not initialize chat session." });
                    setCurrentChatId(null);
                })
                .finally(() => setIsLoadingChatId(false));
        } else {
            setCurrentChatId(null); 
            setIsLoadingChatId(false);
        }
    }, [selectedFriendAction, userId, toast]);

    const handleSelectAction = useCallback((friend: UserFriend, action: 'chat' | 'progress') => {
        console.log(`[FriendsPage] Selected action '${action}' for friend: ${friend.displayName}`);
        setSelectedFriendAction({ friend, action });
    }, []);
    
    const clearSelection = useCallback(() => {
        console.log("[FriendsPage] Clearing friend selection.");
        setSelectedFriendAction(null);
        setCurrentChatId(null);
    }, []);

    if (authLoading || (isLoadingFriends && !hasFetchedFriends)) {
        return ( <div className="flex justify-center items-center min-h-[calc(100dvh-100px)] p-4"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div> );
    }

    if (firestoreError) {
        return (
            <div className="flex justify-center items-center min-h-[calc(100dvh-100px)] p-4">
                <Card className="w-full max-w-md text-center border-destructive">
                    <CardHeader>
                        <AlertCircle className="mx-auto h-10 w-10 text-destructive" />
                        <CardTitle className="text-destructive">Database Configuration Needed</CardTitle>
                        <CardDescription className="text-xs text-muted-foreground p-2 break-words">
                            {firestoreError.includes("index required")
                                ? "A Firestore index is required. Please create it in your Firebase console:"
                                : "A database error occurred."}
                             {firestoreError.includes("https://console.firebase.google.com") && (
                               <a href={firestoreError.substring(firestoreError.indexOf("https://"))} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline block mt-2 text-sm">
                                   Open Firebase Console
                               </a>
                             )}
                             {!firestoreError.includes("https://console.firebase.google.com") && (
                                 <pre className="mt-2 text-left text-xs bg-muted p-2 rounded overflow-x-auto">{firestoreError}</pre>
                             )}
                        </CardDescription>
                    </CardHeader>
                     <CardFooter className="justify-center">
                         <Button onClick={() => { setHasFetchedFriends(false); fetchFriendsCallback(); }}>Retry Loading</Button>
                     </CardFooter>
                </Card>
            </div>
        );
    }

    return (
        <motion.div 
            className={cn(
                "h-[calc(100dvh-var(--header-height,0px)-var(--footer-height,0px)-var(--bottom-nav-height,0px))] md:h-[calc(100vh-var(--header-height-md,0px)-var(--footer-height-md,0px))] flex flex-col md:flex-row bg-muted/30"
            )}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
        >
            <motion.div 
                className={cn(
                    "border-r bg-card flex flex-col transition-all duration-300 ease-in-out",
                    selectedFriendAction && "hidden md:flex md:w-1/3 lg:w-1/4",
                    !selectedFriendAction && "w-full md:flex md:w-1/3 lg:w-1/4"
                )}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
            >
                <div className="p-3 border-b flex items-center justify-between sticky top-0 bg-card/95 backdrop-blur-sm z-10 h-14">
                    <h2 className="text-lg font-semibold text-primary flex items-center gap-2">
                        <Users size={20}/> Friends
                    </h2>
                    <Button variant="outline" size="sm" onClick={() => router.push('/settings')} className="text-xs shadow-sm hover:border-primary">
                        <UserPlus size={14} className="mr-1"/> Manage
                    </Button>
                </div>
                <ScrollArea className="flex-grow">
                    {isLoadingFriends ? (
                        <div className="p-3 space-y-2">
                            {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-14 w-full rounded-md" />)}
                        </div>
                    ) : (
                        <ul className="p-2 space-y-1">
                            <AnimatePresence>
                                {friends.length > 0 ? (
                                    friends.map((friend, index) => (
                                        <motion.li 
                                            key={friend.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -20 }}
                                            transition={{ duration: 0.3, delay: index * 0.05 }}
                                            onClick={() => handleSelectAction(friend, 'chat')} 
                                            className={cn(
                                                "p-2 rounded-lg transition-all duration-150 ease-out hover:bg-muted",
                                                "cursor-pointer", 
                                                selectedFriendAction?.friend.id === friend.id && "bg-primary/10"
                                            )}
                                        >
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-10 w-10 border-2 border-border flex-shrink-0">
                                                <AvatarImage src={friend.photoURL ?? undefined} alt={friend.displayName || 'F'} />
                                                <AvatarFallback className="text-sm bg-muted text-muted-foreground">{friend.displayName?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-grow min-w-0">
                                                <span className="text-sm font-medium text-foreground truncate block">{friend.displayName}</span>
                                            </div>
                                            <div className="flex gap-1.5 ml-auto">
                                                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={(e) => { e.stopPropagation(); handleSelectAction(friend, 'chat'); }} title="Chat">
                                                    <MessageSquare size={14}/>
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={(e) => { e.stopPropagation(); handleSelectAction(friend, 'progress'); }} title="View Progress">
                                                    <Eye size={14}/>
                                                </Button>
                                            </div>
                                        </div>
                                    </motion.li>
                                ))
                            ) : (
                                 !isLoadingFriends && friends.length === 0 && (
                                    <motion.div 
                                        className="p-6 text-center text-sm text-muted-foreground italic"
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                       No friends yet.
                                         <Link href="/settings" className="text-primary hover:underline ml-1">Add some!</Link>
                                    </motion.div>
                                 )
                            )}
                            </AnimatePresence>
                        </ul>
                    )}
                </ScrollArea>
            </motion.div>

            <motion.div 
                className={cn("flex-grow flex flex-col overflow-hidden", !selectedFriendAction && "hidden md:flex")}
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
            >
                <AnimatePresence mode="wait">
                    {selectedFriendAction ? (
                        <motion.div
                            key={`${selectedFriendAction.friend.id}-${selectedFriendAction.action}`}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                            className="flex flex-col h-full"
                        >
                            <ChatHeader
                                friend={selectedFriendAction.friend}
                                chatId={currentChatId} 
                                onClose={clearSelection}
                                currentAction={selectedFriendAction.action}
                                onSwitchView={(action) => handleSelectAction(selectedFriendAction.friend, action)}
                            />
                            {selectedFriendAction.action === 'chat' && (
                                isLoadingChatId ? (
                                    <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                                ) : currentChatId ? (
                                    <ChatInterface friend={selectedFriendAction.friend} currentUserId={userId} chatId={currentChatId} />
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground italic p-6 text-center">
                                        <MessageSquare size={40} className="mb-4 opacity-40"/> Could not load chat.
                                    </div>
                                )
                            )}
                            {selectedFriendAction.action === 'progress' && (
                                <ProgressViewer friend={selectedFriendAction.friend} currentUserId={userId} />
                            )}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="no-selection"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.3 }}
                            className="flex flex-col items-center justify-center h-full text-muted-foreground italic p-6 text-center bg-card"
                        >
                            <Users size={48} className="mb-4 opacity-30"/>
                            Select a friend to start chatting or view their progress.
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </motion.div>
    );
}
