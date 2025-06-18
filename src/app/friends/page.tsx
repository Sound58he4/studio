// src/app/friends/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertCircle, Users, MessageSquare, Eye, UserPlus, Search, ArrowLeft, LayoutDashboard, Settings, Crown, Trophy, Target, BarChart3, MessageCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from '@/context/AuthContext';
import { getFriends, searchUsers, sendViewRequest } from '@/services/firestore/socialService'; 
import { getOrCreateChatRoom } from '@/services/firestore/chatService';
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { UserFriend, SearchResultUser } from '@/app/dashboard/types'; 
import ChatInterface from '@/components/friends/ChatInterface';
import ProgressViewer from './ProgressViewer'; 
import FriendProfile from '@/components/friends/FriendProfile';
import ChatHeader from '@/components/friends/ChatHeader';
import { AI_ASSISTANT_ID } from '@/app/dashboard/types';
import { motion, AnimatePresence } from 'framer-motion';

interface SelectedFriendAction {
    friend: UserFriend;
    action: 'chat' | 'progress' | 'profile';
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
    const [isNavMinimized, setIsNavMinimized] = useState(false);
    const [isFullChatMode, setIsFullChatMode] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

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

    const handleSelectAction = useCallback((friend: UserFriend, action: 'chat' | 'progress' | 'profile') => {
        console.log(`[FriendsPage] Selected action '${action}' for friend: ${friend.displayName}`);
        setSelectedFriendAction({ friend, action });
        // Minimize nav on mobile when chat opens
        if (window.innerWidth < 768) {
            setIsNavMinimized(true);
            // Set the data attribute to communicate with layout
            document.documentElement.setAttribute('data-chat-minimized', 'true');
        }
    }, []);
    
    const clearSelection = useCallback(() => {
        console.log("[FriendsPage] Clearing friend selection.");
        setSelectedFriendAction(null);
        setCurrentChatId(null);
        // Restore nav when closing chat
        setIsNavMinimized(false);
        setIsFullChatMode(false);
        // Remove the data attribute
        document.documentElement.removeAttribute('data-chat-minimized');
    }, []);

    const toggleFullChatMode = useCallback(() => {
        setIsFullChatMode(!isFullChatMode);
        if (!isFullChatMode && selectedFriendAction) {
            // Entering full chat mode - minimize everything
            setIsNavMinimized(true);
            document.documentElement.setAttribute('data-chat-minimized', 'true');
            document.documentElement.setAttribute('data-navbar-minimized', 'true');
        } else {
            // Exiting full chat mode - restore normal chat view
            if (window.innerWidth < 768) {
                setIsNavMinimized(true);
            } else {
                setIsNavMinimized(false);
            }
            document.documentElement.removeAttribute('data-navbar-minimized');
        }
    }, [isFullChatMode, selectedFriendAction]);

    // Effect to handle navigation minimization state
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768) {
                // Desktop - always show nav, remove mobile-specific attributes
                setIsNavMinimized(false);
                document.documentElement.removeAttribute('data-chat-minimized');
            } else if (selectedFriendAction) {
                // Mobile with chat open - minimize nav
                setIsNavMinimized(true);
                document.documentElement.setAttribute('data-chat-minimized', 'true');
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [selectedFriendAction]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            document.documentElement.removeAttribute('data-chat-minimized');
        };
    }, []);

    // Filter friends based on search
    const filteredFriends = friends.filter(friend => 
        friend.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) || false
    );

    if (authLoading || (isLoadingFriends && !hasFetchedFriends)) {
        return ( 
            <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
                <div className="flex justify-center items-center min-h-[calc(100dvh-100px)] p-4">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
            </div>
        );
    }

    if (firestoreError) {
        return (
            <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
                <div className="flex justify-center items-center min-h-[calc(100dvh-100px)] p-4">
                    <Card className="w-full max-w-md text-center border-destructive" style={{ background: 'rgba(255, 255, 255, 0.9)' }}>
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
            </div>
        );
    }

    // If a friend action is selected, show the chat/progress interface
    if (selectedFriendAction) {
        return (
            <motion.div 
                className="h-[calc(100dvh-var(--header-height,60px)-var(--bottom-nav-height,64px))] flex flex-col md:flex-row bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 overflow-hidden relative"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6 }}
                style={{ zIndex: 1 }}
            >
                {/* Full Chat Mode Toggle */}
                <AnimatePresence>
                    {selectedFriendAction?.action === 'chat' && (
                        <motion.button
                            className="fixed top-16 right-4 z-40 bg-white/90 text-gray-600 p-2 rounded-full shadow-lg border-2 border-gray-200/50 hover:bg-white hover:text-gray-800 transition-colors backdrop-blur-sm"
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            transition={{ delay: 0.3 }}
                            onClick={toggleFullChatMode}
                            title={isFullChatMode ? "Exit full chat mode" : "Enter full chat mode"}
                        >
                            {isFullChatMode ? (
                                <ArrowLeft size={16} className="rotate-45" />
                            ) : (
                                <ArrowLeft size={16} className="-rotate-45" />
                            )}
                        </motion.button>
                    )}
                </AnimatePresence>

                {/* Mobile Navigation Toggle */}
                <AnimatePresence>
                    {isNavMinimized && !isFullChatMode && (
                        <motion.button
                            className="md:hidden fixed bottom-20 left-4 z-50 bg-gradient-to-br from-blue-400 to-purple-500 text-white p-3 rounded-full shadow-lg"
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            transition={{ delay: 0.2 }}
                            onClick={() => setIsNavMinimized(false)}
                            title="Show friends list"
                        >
                            <Users size={20} />
                        </motion.button>
                    )}
                </AnimatePresence>

                <motion.div 
                    className={cn(
                        "backdrop-blur-sm border-r border-gray-200/50 flex flex-col transition-all duration-300 ease-in-out min-h-0 shadow-lg",
                        "md:w-80 lg:w-96",
                        !selectedFriendAction && "w-full md:flex",
                        selectedFriendAction && isNavMinimized && "hidden",
                        selectedFriendAction && !isNavMinimized && "w-full md:w-80 lg:w-96",
                        isFullChatMode && "hidden"
                    )}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    style={{ background: 'rgba(255, 255, 255, 0.9)' }}                >
                    <div className="p-3 border-b border-gray-200/50 flex items-center justify-between sticky top-0 z-10 h-14 flex-shrink-0 bg-white/95 backdrop-blur-sm">
                        <h2 className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
                            <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                <Users className="w-2 h-2 text-white" />
                            </div>
                            Friends
                        </h2>
                        <div className="flex items-center gap-2">
                            {selectedFriendAction && (
                                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                    <Button variant="ghost" size="sm" onClick={clearSelection} className="md:hidden text-xs h-8 px-3 rounded-xl bg-white/60 backdrop-blur-sm hover:bg-gray-50/80 transition-all duration-300">
                                        <ArrowLeft size={12} className="mr-1"/> Back
                                    </Button>
                                </motion.div>
                            )}
                        </div>
                    </div>
                    <div className="flex-1 min-h-0 bg-gradient-to-br from-gray-50/50 to-blue-50/30">
                        <div className="p-2 space-y-1">
                            <AnimatePresence>
                                {friends.length > 0 ? (
                                    friends.map((friend, index) => (
                                        <motion.div 
                                            key={friend.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -20 }}
                                            transition={{ duration: 0.3, delay: index * 0.05 }}
                                            onClick={() => handleSelectAction(friend, 'chat')} 
                                            className={cn(
                                                "p-3 rounded-xl transition-all duration-300 ease-out hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 hover:backdrop-blur-sm hover:shadow-md",
                                                "cursor-pointer group", 
                                                selectedFriendAction?.friend.id === friend.id && "bg-gradient-to-r from-blue-100/60 to-indigo-100/60 backdrop-blur-sm shadow-md"
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="relative">
                                                    <Avatar className="h-10 w-10 border-2 border-white/50 shadow-md flex-shrink-0">
                                                        <AvatarImage src={friend.photoURL ?? undefined} alt={friend.displayName || 'F'} />
                                                        <AvatarFallback className="text-sm bg-gradient-to-br from-blue-100/80 to-purple-100/80 backdrop-blur-sm text-blue-600 font-medium">{friend.displayName?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                                                    </Avatar>
                                                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 border border-white rounded-full"></div>
                                                </div>
                                                <div className="flex-grow min-w-0">
                                                    <span className="text-base font-medium text-gray-900 truncate block group-hover:text-blue-700 transition-colors duration-300">{friend.displayName}</span>
                                                    <p className="text-xs text-gray-600 group-hover:text-blue-600 transition-colors duration-300">Online</p>
                                                </div>
                                                <div className="flex gap-1 ml-auto">
                                                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-blue-600 hover:bg-blue-50/50 backdrop-blur-sm rounded-lg transition-all duration-300" onClick={(e) => { e.stopPropagation(); handleSelectAction(friend, 'chat'); }} title="Chat">
                                                            <MessageSquare size={14}/>
                                                        </Button>
                                                    </motion.div>
                                                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-blue-600 hover:bg-blue-50/50 backdrop-blur-sm rounded-lg transition-all duration-300" onClick={(e) => { e.stopPropagation(); handleSelectAction(friend, 'progress'); }} title="View Progress">
                                                            <Eye size={14}/>
                                                        </Button>
                                                    </motion.div>
                                                </div>
                                            </div>
                                        </motion.div>
                                ))
                            ) : (
                                 !isLoadingFriends && friends.length === 0 && (
                                    <motion.div 
                                        className="p-6 text-center text-sm text-gray-600 italic bg-white/60 backdrop-blur-sm rounded-2xl shadow-md border-0 m-2"
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ delay: 0.2, duration: 0.3, type: "spring" }}
                                        >
                                            <Users size={32} className="mx-auto mb-2 opacity-50"/>
                                        </motion.div>
                                       No friends yet.
                                         <Link href="/settings" className="text-blue-600 hover:text-blue-700 hover:underline ml-1 font-medium">Add some!</Link>
                                    </motion.div>
                                 )
                            )}
                            </AnimatePresence>
                        </div>
                    </div>
                </motion.div>

                <motion.div 
                    className={cn(
                        "flex-1 flex flex-col overflow-hidden min-h-0", 
                        !selectedFriendAction && "hidden md:flex",
                        selectedFriendAction && !isNavMinimized && "hidden md:flex",
                        selectedFriendAction && isNavMinimized && "flex",
                        isFullChatMode && "flex"
                    )}
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={`${selectedFriendAction.friend.id}-${selectedFriendAction.action}`}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                            className="flex flex-col h-full w-full"
                        >                                        <div className={cn(
                                            "flex-shrink-0",
                                            isFullChatMode ? "hidden" : "hidden md:block",
                                            selectedFriendAction.action === 'profile' && "hidden"
                                        )}>
                                <ChatHeader
                                    friend={selectedFriendAction.friend}
                                    chatId={currentChatId} 
                                    onClose={clearSelection}
                                    currentAction={selectedFriendAction.action}
                                    onSwitchView={(action) => handleSelectAction(selectedFriendAction.friend, action)}
                                />
                            </div>
                            {selectedFriendAction.action === 'chat' && (
                                isLoadingChatId ? (
                                    <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                                ) : currentChatId ? (
                                    <div className="flex-1 min-h-0 relative w-full h-full px-2 sm:px-4 pb-4 sm:pb-2">
                                        <ChatInterface friend={selectedFriendAction.friend} currentUserId={userId} chatId={currentChatId} />
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-500 italic p-6 text-center">
                                        <MessageSquare size={40} className="mb-4 opacity-40"/> Could not load chat.
                                    </div>
                                )                            )}
                            {selectedFriendAction.action === 'progress' && (
                                <div className="flex-1 min-h-0">
                                    <ProgressViewer friend={selectedFriendAction.friend} currentUserId={userId} />
                                </div>
                            )}
                            {selectedFriendAction.action === 'profile' && (
                                <div className="flex-1 min-h-0 overflow-auto">
                                    <FriendProfile friend={selectedFriendAction.friend} onBack={clearSelection} />
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </motion.div>
            </motion.div>
        );
    }

    // Main friends grid view with new design
    return (
        <motion.div 
            className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            <div className="flex-1 w-full max-w-6xl mx-auto px-4 py-6">
                
                {/* Header Section */}
                <motion.div 
                    className="backdrop-blur-sm p-6 border border-gray-200/50 shadow-lg rounded-3xl mb-6 transition-all duration-300"
                    style={{ background: 'rgba(255, 255, 255, 0.9)' }}
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                >
                    <div className="text-center mb-6">
                        <h1 className="text-3xl font-bold mb-2 text-gray-900">
                            Friends
                        </h1>
                        <p className="text-lg text-gray-600">
                            Connect with your fitness community
                        </p>
                    </div>

                    {/* Search and Actions */}
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <Input 
                                placeholder="Search friends..." 
                                value={searchQuery} 
                                onChange={e => setSearchQuery(e.target.value)} 
                                className="pl-10 rounded-2xl border-0 h-12 text-sm backdrop-blur-sm bg-gray-100/80 focus:bg-white/80" 
                            />
                        </div>
                        <div className="flex gap-3">
                            <Button 
                                variant="outline" 
                                onClick={() => router.push('/settings')}
                                className="h-12 px-6 rounded-2xl shadow-lg transition-all duration-300 hover:scale-[1.02] backdrop-blur-sm border-purple-200/50 bg-purple-50/80 text-purple-700 hover:bg-purple-100/80"
                            >
                                <Settings className="w-4 h-4 mr-2" />
                                Manage
                            </Button>
                        </div>
                    </div>
                </motion.div>

                {/* Loading State */}
                {(authLoading || (isLoadingFriends && !hasFetchedFriends)) && (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1,2,3,4,5,6].map(i => (
                            <Card key={i} className="backdrop-blur-sm border border-gray-200/50 shadow-lg rounded-3xl" style={{ background: 'rgba(255, 255, 255, 0.9)' }}>
                                <CardHeader className="pb-4">
                                    <div className="flex items-center space-x-4">
                                        <Skeleton className="h-16 w-16 rounded-full" />
                                        <div className="flex-1">
                                            <Skeleton className="h-5 w-32 mb-2" />
                                            <Skeleton className="h-4 w-20" />
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <Skeleton className="h-16 w-full rounded-2xl" />
                                    <div className="grid grid-cols-2 gap-3">
                                        <Skeleton className="h-12 w-full rounded-xl" />
                                        <Skeleton className="h-12 w-full rounded-xl" />
                                    </div>
                                    <div className="flex space-x-2 pt-2">
                                        <Skeleton className="h-8 flex-1 rounded-xl" />
                                        <Skeleton className="h-8 w-8 rounded-xl" />
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Error State */}
                {firestoreError && (
                    <Card className="w-full max-w-2xl mx-auto text-center border-destructive" style={{ background: 'rgba(255, 255, 255, 0.9)' }}>
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
                )}                {/* Friends Grid */}
                {!authLoading && !isLoadingFriends && !firestoreError && filteredFriends.length > 0 && (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredFriends.map((friend, index) => (
                            <motion.div
                                key={friend.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.3, delay: index * 0.1 }}
                            >
                                <Card className="backdrop-blur-sm border border-gray-200/50 shadow-lg rounded-3xl transition-all duration-300 hover:scale-[1.02] hover:shadow-xl cursor-pointer group"
                                      style={{ background: 'rgba(255, 255, 255, 0.9)' }}>
                                    <CardHeader className="pb-4">
                                        <div className="flex items-center space-x-4">
                                            <div className="relative">
                                                <div className="w-16 h-16 rounded-full p-0.5 bg-gradient-to-br from-blue-400 to-purple-500">
                                                    <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                                                        {friend.photoURL ? (
                                                            <img src={friend.photoURL} alt={friend.displayName || 'F'} className="w-full h-full rounded-full object-cover" />
                                                        ) : (
                                                            <span className="text-xl font-bold text-gray-700">
                                                                {friend.displayName?.charAt(0).toUpperCase() || 'U'}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white bg-green-500"></div>
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-lg text-gray-900">
                                                    {friend.displayName || 'Unknown User'}
                                                </h3>
                                                <div className="flex items-center space-x-2 mt-1">
                                                    <Badge variant="secondary" className="text-xs px-2 py-1 bg-purple-100 text-purple-700">
                                                        Level 1
                                                    </Badge>
                                                    <span className="text-xs text-gray-500">
                                                        Active now
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    
                                    <CardContent className="space-y-4">
                                        {/* Weekly Progress */}
                                        <div className="p-4 rounded-2xl bg-gray-50/80">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm font-medium text-gray-600">
                                                    Weekly Goal
                                                </span>
                                                <span className="text-sm font-bold text-gray-900">
                                                    3/5
                                                </span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div className="h-2 rounded-full transition-all duration-300 bg-gradient-to-r from-blue-400 to-purple-500 w-[60%]"></div>
                                            </div>
                                        </div>

                                        {/* Stats */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="text-center p-3 rounded-xl bg-gray-50/80">
                                                <div className="text-lg font-bold text-gray-900">
                                                    7
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    Day Streak
                                                </div>
                                            </div>
                                            <div className="text-center p-3 rounded-xl bg-gray-50/80">
                                                <div className="text-lg font-bold text-gray-900">
                                                    2
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    Badges
                                                </div>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex space-x-2 pt-2">                                                    <Button 
                                                        onClick={() => handleSelectAction(friend, 'profile')} 
                                                        variant="outline" 
                                                        size="sm" 
                                                        className="flex-1 rounded-xl transition-all duration-300 border-purple-200/50 bg-purple-50/50 text-purple-700 hover:bg-purple-100/80"
                                                    >
                                                        View Profile
                                                    </Button>
                                            <Button 
                                                onClick={() => handleSelectAction(friend, 'chat')} 
                                                size="sm" 
                                                className="rounded-xl transition-all duration-300 bg-gradient-to-br from-blue-400 to-purple-500 hover:from-blue-500 hover:to-purple-600 text-white"
                                            >
                                                <MessageCircle className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Empty State */}
                {!authLoading && !isLoadingFriends && !firestoreError && filteredFriends.length === 0 && (
                    <div className="text-center py-16 rounded-3xl bg-white/30 backdrop-blur-sm">
                        <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                        <h3 className="text-xl font-semibold mb-2 text-gray-600">
                            {searchQuery ? 'No friends found' : 'No friends yet'}
                        </h3>
                        <p className="text-sm mb-6 text-gray-500">
                            {searchQuery ? 'Try adjusting your search terms' : 'Start connecting with other fitness enthusiasts'}
                        </p>
                        {!searchQuery && (
                            <Button 
                                onClick={() => router.push('/settings')}
                                className="px-8 py-3 rounded-2xl shadow-lg transition-all duration-300 hover:scale-[1.02] bg-gradient-to-br from-blue-400 to-purple-500 hover:from-blue-500 hover:to-purple-600 text-white"
                            >
                                <UserPlus className="w-4 h-4 mr-2" />
                                Add Your First Friend
                            </Button>                        )}
                    </div>
                )}
            </div>
        </motion.div>
    );
}
