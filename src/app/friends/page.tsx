// src/app/friends/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertCircle, Users, MessageSquare, Eye, UserPlus, Search, ArrowLeft, LayoutDashboard, Settings, Crown, Trophy, Target, BarChart3, MessageCircle, ChevronUp } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from '@/context/AuthContext';
import { getFriends, searchUsers, sendViewRequest } from '@/services/firestore/socialService'; 
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { UserFriend, SearchResultUser } from '@/app/dashboard/types'; 
import ProgressViewer from './ProgressViewer'; 
import FriendProfile from '@/components/friends/FriendProfile';
import { AI_ASSISTANT_ID } from '@/app/dashboard/types';
import { motion, AnimatePresence } from 'framer-motion';
import FriendChatModal from '@/components/friends/FriendChatModal';
import FriendWeeklyGoal from '@/components/friends/FriendWeeklyGoal';
import { getFriendsWeeklyGoals, type FriendWeeklyGoal as FriendWeeklyGoalType } from '@/services/firestore/friendNutritionService';
import { formatPoints } from '@/lib/utils/pointsFormatter';

interface SelectedFriendAction {
    friend: UserFriend;
    action: 'progress' | 'profile' | 'weeklyGoal';
}

export default function FriendsPage() {
    const { userId, loading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [friends, setFriends] = useState<UserFriend[]>([]);    
    const [selectedFriendAction, setSelectedFriendAction] = useState<SelectedFriendAction | null>(null);
    const [isLoadingFriends, setIsLoadingFriends] = useState(true);
    const [firestoreError, setFirestoreError] = useState<string | null>(null);
    const [hasFetchedFriends, setHasFetchedFriends] = useState(false);    
    const [isNavMinimized, setIsNavMinimized] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showScrollTop, setShowScrollTop] = useState(false);
    const [showChatModal, setShowChatModal] = useState(false);
    const [chatModalFriend, setChatModalFriend] = useState<UserFriend | null>(null);
    const [isClient, setIsClient] = useState(false);
    const [isDark, setIsDark] = useState(false);
    const [friendsWeeklyGoals, setFriendsWeeklyGoals] = useState<{ [friendId: string]: FriendWeeklyGoalType }>({});
    const [isLoadingWeeklyGoals, setIsLoadingWeeklyGoals] = useState(false);

    useEffect(() => { setIsClient(true); }, []);

    // Detect theme from HTML class (consistent with Overview page)
    useEffect(() => {
        const updateDark = () => {
            setIsDark(document.documentElement.classList.contains('dark'));
        };

        updateDark(); // Initial check
        
        // Watch for theme changes
        const observer = new MutationObserver(updateDark);
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class']
        });

        return () => observer.disconnect();
    }, []);

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
            const filteredFriends = friendList.filter(f => f.id !== AI_ASSISTANT_ID);
            setFriends(filteredFriends); 
            console.log("[FriendsPage] Friends fetched:", friendList.length);
            
            // Fetch weekly goals for all friends
            await fetchWeeklyGoals(filteredFriends.map(f => f.id));
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

    const fetchWeeklyGoals = useCallback(async (friendIds: string[]) => {
        if (friendIds.length === 0) return;
        
        console.log("[Friends Page] Fetching weekly goals for friends...");
        setIsLoadingWeeklyGoals(true);
        
        try {
            const weeklyGoals = await getFriendsWeeklyGoals(friendIds);
            const goalsMap: { [friendId: string]: FriendWeeklyGoalType } = {};
            
            weeklyGoals.forEach(goal => {
                goalsMap[goal.userId] = goal;
            });
            
            setFriendsWeeklyGoals(goalsMap);
            console.log(`[Friends Page] Fetched weekly goals for ${weeklyGoals.length} friends`);
        } catch (error: any) {
            console.error("[Friends Page] Error fetching weekly goals:", error);
            // Don't show error toast for weekly goals as it's not critical
        } finally {
            setIsLoadingWeeklyGoals(false);
        }
    }, []);

    useEffect(() => {
        if (!authLoading && userId && !hasFetchedFriends) {
            fetchFriendsCallback();
        } else if (!authLoading && !userId) {
            setIsLoadingFriends(false);
        }    }, [authLoading, userId, fetchFriendsCallback, hasFetchedFriends]);

    const handleSelectAction = useCallback((friend: UserFriend, action: 'chat' | 'progress' | 'profile' | 'weeklyGoal') => {
        console.log(`[FriendsPage] Selected action '${action}' for friend: ${friend.displayName}`);
        
        if (action === 'chat') {
            // Use the new chat modal instead of the old interface
            setChatModalFriend(friend);
            setShowChatModal(true);
        } else {
            setSelectedFriendAction({ friend, action });
            // Minimize nav on mobile when other actions open
            if (window.innerWidth < 768) {
                setIsNavMinimized(true);
                document.documentElement.setAttribute('data-chat-minimized', 'true');
            }
        }
    }, []);    const clearSelection = useCallback(() => {
        console.log("[FriendsPage] Clearing friend selection.");
        setSelectedFriendAction(null);
        // Restore nav when closing
        setIsNavMinimized(false);
        // Remove the data attribute
        document.documentElement.removeAttribute('data-chat-minimized');
    }, []);const closeChatModal = useCallback(() => {
        setShowChatModal(false);
        setChatModalFriend(null);
    }, []);

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

    // Scroll to top functionality
    useEffect(() => {
        const handleScroll = () => {
            const scrollContainer = document.querySelector('.friends-scroll-container');
            if (scrollContainer) {
                setShowScrollTop(scrollContainer.scrollTop > 200);
            }
        };

        const scrollContainer = document.querySelector('.friends-scroll-container');
        if (scrollContainer) {
            scrollContainer.addEventListener('scroll', handleScroll);
            return () => scrollContainer.removeEventListener('scroll', handleScroll);
        }
    }, []);

    const scrollToTop = () => {
        const scrollContainer = document.querySelector('.friends-scroll-container');
        if (scrollContainer) {
            scrollContainer.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }
    };

    // Dynamic height calculation for mobile navigation
    useEffect(() => {
        const updateScrollHeight = () => {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        };

        updateScrollHeight();
        window.addEventListener('resize', updateScrollHeight);
        window.addEventListener('orientationchange', updateScrollHeight);

        return () => {
            window.removeEventListener('resize', updateScrollHeight);
            window.removeEventListener('orientationchange', updateScrollHeight);
        };
    }, []);

    // Function to determine if a user is recently active
    const getUserActivityStatus = (friend: UserFriend, friendWeeklyGoal?: FriendWeeklyGoalType): 'online' | 'offline' => {
        // For now, use a simple heuristic: if user has significant progress this week, they're likely active
        if (friendWeeklyGoal?.progress) {
            const totalProgress = (friendWeeklyGoal.progress.calories + friendWeeklyGoal.progress.protein + 
                                 friendWeeklyGoal.progress.carbohydrates + friendWeeklyGoal.progress.fat) / 4;
            if (totalProgress > 20) { // If they have more than 20% progress this week, consider them active
                return 'online';
            }
        }
        
        // For now, fall back to random status as placeholder until we have last_seen data
        return Math.random() > 0.3 ? 'online' : 'offline';
    };

    // Function to get a meaningful last activity message
    const getLastActivityMessage = (status: 'online' | 'offline', friend: UserFriend, friendWeeklyGoal?: FriendWeeklyGoalType): string => {
        if (status === 'online') {
            return 'Active now';
        }
        
        // For offline users, show a generic recent time for now
        const recentTimes = ['1h ago', '2h ago', '3h ago', '5h ago', '1d ago'];
        return recentTimes[Math.floor(Math.random() * recentTimes.length)];
    };

    if (authLoading || (isLoadingFriends && !hasFetchedFriends)) {
        return ( 
            <div className={`min-h-screen flex flex-col transition-all duration-500 ${
                isDark 
                    ? 'bg-[#1a1a1a]' 
                    : 'bg-gradient-to-br from-blue-50 via-blue-100 to-blue-100'
            }`}>
                <div className="flex justify-center items-center min-h-[calc(100dvh-100px)] p-4">
                    <Loader2 className={`h-12 w-12 animate-spin ${
                        isDark ? 'text-white' : 'text-primary'
                    }`} />
                </div>
            </div>
        );
    }

    if (firestoreError) {
        return (
            <div className={`min-h-screen flex flex-col transition-all duration-500 ${
                isDark 
                    ? 'bg-[#1a1a1a]' 
                    : 'bg-gradient-to-br from-blue-50 via-blue-100 to-blue-100'
            }`}>
                <div className="flex justify-center items-center min-h-[calc(100dvh-100px)] p-4">
                    <Card className={`w-full max-w-md text-center border-0 shadow-lg rounded-3xl ${
                        isDark 
                            ? 'bg-[#2a2a2a] border border-[#3a3a3a] backdrop-blur-sm' 
                            : 'backdrop-blur-sm bg-white/70 border-destructive'
                    }`}>
                        <CardHeader>
                            <AlertCircle className={`mx-auto h-10 w-10 ${
                                isDark ? 'text-red-400' : 'text-destructive'
                            }`} />
                            <CardTitle className={isDark ? 'text-red-400' : 'text-destructive'}>
                                Database Configuration Needed
                            </CardTitle>
                            <CardDescription className={`text-xs p-2 break-words ${
                                isDark ? 'text-gray-300' : 'text-muted-foreground'
                            }`}>
                                {firestoreError.includes("index required")
                                    ? "A Firestore index is required. Please create it in your Firebase console:"
                                    : "A database error occurred."}
                                 {firestoreError.includes("https://console.firebase.google.com") && (
                                   <a href={firestoreError.substring(firestoreError.indexOf("https://"))} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline block mt-2 text-sm">
                                       Open Firebase Console
                                   </a>
                                 )}
                                 {!firestoreError.includes("https://console.firebase.google.com") && (
                                     <pre className={`mt-2 text-left text-xs p-2 rounded overflow-x-auto ${
                                         isDark ? 'bg-gray-700/60' : 'bg-muted'
                                     }`}>{firestoreError}</pre>
                                 )}
                            </CardDescription>
                        </CardHeader>
                         <CardFooter className="justify-center">
                             <Button 
                                 onClick={() => { setHasFetchedFriends(false); fetchFriendsCallback(); }}
                                 className={`transition-all duration-300 hover:scale-105 ${
                                     isDark 
                                         ? 'bg-blue-600 hover:bg-blue-700' 
                                         : ''
                                 }`}
                             >
                                 Retry Loading
                             </Button>
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
                className={`h-[calc(100dvh-var(--header-height,60px)-var(--bottom-nav-height,64px))] flex flex-col md:flex-row overflow-hidden relative transition-all duration-500 ${
                    isDark 
                        ? 'bg-[#1a1a1a]' 
                        : 'bg-gradient-to-br from-blue-50 via-blue-100 to-blue-100'
                }`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6 }}
                style={{ zIndex: 1 }}
            >
                {/* Mobile Navigation Toggle */}
                <AnimatePresence>
                    {isNavMinimized && (
                        <motion.button
                            className={`md:hidden fixed bottom-20 left-4 z-50 text-white p-3 rounded-full shadow-lg transition-all duration-300 ${
                                isDark 
                                    ? 'bg-blue-600 hover:bg-blue-700' 
                                    : 'bg-blue-500 hover:bg-blue-600'
                            }`}
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
                        "backdrop-blur-sm flex flex-col transition-all duration-300 ease-in-out min-h-0 shadow-lg",
                        "md:w-80 lg:w-96",
                        !selectedFriendAction && "w-full md:flex",
                        selectedFriendAction && isNavMinimized && "hidden",                        selectedFriendAction && !isNavMinimized && "w-full md:w-80 lg:w-96",
                        isDark 
                            ? 'border-r border-[#3a3a3a] bg-[#2a2a2a]' 
                            : 'border-r border-gray-200/50 bg-white/90'
                    )}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                >
                    <div className={`p-3 flex items-center justify-between sticky top-0 z-10 h-14 flex-shrink-0 backdrop-blur-sm transition-all duration-300 ${
                        isDark 
                            ? 'border-b border-[#3a3a3a] bg-[#2a2a2a]' 
                            : 'border-b border-gray-200/50 bg-white/95'
                    }`}>
                        <h2 className={`text-lg font-semibold flex items-center gap-2 ${
                            isDark 
                                ? 'text-white' 
                                : 'text-blue-600'
                        }`}>
                            <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                                isDark 
                                    ? 'bg-blue-600' 
                                    : 'bg-blue-500'
                            }`}>
                                <Users className="w-2 h-2 text-white" />
                            </div>
                            Friends
                        </h2>
                        <div className="flex items-center gap-2">
                            {selectedFriendAction && (
                                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={clearSelection} 
                                        className={`md:hidden text-xs h-8 px-3 rounded-xl backdrop-blur-sm transition-all duration-300 ${
                                            isDark 
                                                ? 'bg-[#3a3a3a] hover:bg-gray-600/80 text-gray-400 hover:text-white' 
                                                : 'bg-white/60 hover:bg-gray-50/80'
                                        }`}
                                    >
                                        <ArrowLeft size={12} className="mr-1"/> Back
                                    </Button>
                                </motion.div>
                            )}
                        </div>
                    </div>
                    <div className={`flex-1 min-h-0 ${
                        isDark 
                            ? 'bg-[#1a1a1a]' 
                            : 'bg-gradient-to-br from-gray-50/50 to-blue-50/30'
                    }`}>
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
                                                "p-3 rounded-xl transition-all duration-300 ease-out cursor-pointer group hover:shadow-md",
                                                isDark ? (
                                                    selectedFriendAction?.friend.id === friend.id 
                                                        ? "bg-gradient-to-r from-blue-800/60 to-blue-700/60 backdrop-blur-sm shadow-md hover:from-blue-700/70 hover:to-blue-600/70"
                                                        : "hover:bg-gradient-to-r hover:from-blue-800/30 hover:to-blue-700/30 hover:backdrop-blur-sm"
                                                ) : (
                                                    selectedFriendAction?.friend.id === friend.id 
                                                        ? "bg-gradient-to-r from-blue-100/60 to-blue-200/60 backdrop-blur-sm shadow-md"
                                                        : "hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-blue-100/50 hover:backdrop-blur-sm"
                                                )
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="relative">
                                                    <Avatar className={`h-10 w-10 border-2 shadow-md flex-shrink-0 ${
                                                        isDark ? 'border-blue-500/30' : 'border-white/50'
                                                    }`}>
                                                        <AvatarImage src={friend.photoURL ?? undefined} alt={friend.displayName || 'F'} />                                        <AvatarFallback className={`text-sm backdrop-blur-sm font-medium ${
                                            isDark 
                                                ? 'bg-[#3a3a3a] text-gray-100' 
                                                : 'bg-blue-100/80 text-blue-600'
                                        }`}>
                                                            {friend.displayName?.charAt(0).toUpperCase() || 'U'}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full border ${
                                                        isDark ? 'border-[#2a2a2a]' : 'border-white'
                                                    }`}></div>
                                                </div>
                                                <div className="flex-grow min-w-0">
                                                    <div className="flex items-center justify-between">
                                                        <span className={`text-base font-medium truncate transition-colors duration-300 ${
                                                            isDark 
                                                                ? 'text-white group-hover:text-gray-100' 
                                                                : 'text-gray-900 group-hover:text-blue-700'
                                                        }`}>
                                                            {friend.displayName}
                                                        </span>
                                                        <Badge 
                                                            variant="secondary" 
                                                            className={`ml-2 text-xs px-2 py-0.5 rounded-full transition-colors duration-300 ${
                                                                isDark 
                                                                    ? 'bg-[#3a3a3a] text-gray-100 border-blue-500/20' 
                                                                    : 'bg-blue-100/80 text-blue-700 border-blue-200/50'
                                                            }`}
                                                        >
                                                            Level {friend.level || 1}
                                                        </Badge>
                                                    </div>
                                                    <p className={`text-xs transition-colors duration-300 ${
                                                        isDark 
                                                            ? 'text-gray-400 group-hover:text-gray-300' 
                                                            : 'text-gray-600 group-hover:text-blue-600'
                                                    }`}>
                                                        Online • {formatPoints(friend.totalPoints || 0)} pts • {friend.badges || 0} badges • {friend.dayStreak || 0} day streak
                                                    </p>
                                                    
                                                    {/* Weekly Goal Progress */}
                                                    {friendsWeeklyGoals[friend.id] && (
                                                        <div className="mt-2">
                                                            <FriendWeeklyGoal 
                                                                weeklyGoal={friendsWeeklyGoals[friend.id]}
                                                                isDark={isDark}
                                                                compact={true}
                                                            />
                                                        </div>
                                                    )}
                                                    
                                                    {!friendsWeeklyGoals[friend.id] && !isLoadingWeeklyGoals && (
                                                        <div className={`mt-2 p-2 rounded-lg text-xs text-center ${
                                                            isDark ? 'bg-[#3a3a3a] text-gray-400' : 'bg-gray-100/70 text-gray-500'
                                                        }`}>
                                                            Weekly goals not available
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex gap-1 ml-auto">
                                                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            className={`h-7 w-7 backdrop-blur-sm rounded-lg transition-all duration-300 ${
                                                                isDark 
                                                                    ? 'text-gray-400 hover:text-white hover:bg-[#3a3a3a]' 
                                                                    : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50/50'
                                                            }`}
                                                            onClick={(e) => { e.stopPropagation(); handleSelectAction(friend, 'chat'); }} 
                                                            title="Chat"
                                                        >
                                                            <MessageSquare size={14}/>
                                                        </Button>
                                                    </motion.div>
                                                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            className={`h-7 w-7 backdrop-blur-sm rounded-lg transition-all duration-300 ${
                                                                isDark 
                                                                    ? 'text-gray-400 hover:text-white hover:bg-[#3a3a3a]' 
                                                                    : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50/50'
                                                            }`}
                                                            onClick={(e) => { e.stopPropagation(); handleSelectAction(friend, 'progress'); }} 
                                                            title="View Progress"
                                                        >
                                                            <Eye size={14}/>
                                                        </Button>
                                                    </motion.div>
                                                    {friendsWeeklyGoals[friend.id] && (
                                                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                                            <Button 
                                                                variant="ghost" 
                                                                size="icon" 
                                                                className={`h-7 w-7 backdrop-blur-sm rounded-lg transition-all duration-300 ${
                                                                    isDark 
                                                                        ? 'text-gray-400 hover:text-white hover:bg-[#3a3a3a]' 
                                                                        : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50/50'
                                                                }`}
                                                                onClick={(e) => { e.stopPropagation(); handleSelectAction(friend, 'weeklyGoal'); }} 
                                                                title="View Weekly Goal"
                                                            >
                                                                <Target size={14}/>
                                                            </Button>
                                                        </motion.div>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                ))
                            ) : (
                                 !isLoadingFriends && friends.length === 0 && (
                                    <motion.div 
                                        className={`p-6 text-center text-sm italic backdrop-blur-sm rounded-2xl shadow-md border-0 m-2 ${
                                            isDark 
                                                ? 'text-gray-400 bg-[#2a2a2a]' 
                                                : 'text-gray-600 bg-white/60'
                                        }`}
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
                                         <Link href="/settings" className={`ml-1 font-medium hover:underline ${
                                             isDark ? 'text-white hover:text-gray-100' : 'text-blue-600 hover:text-blue-700'
                                         }`}>Add some!</Link>
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
                        selectedFriendAction && !isNavMinimized && "hidden md:flex",                        selectedFriendAction && isNavMinimized && "flex"
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
                            className="flex flex-col h-full w-full"                        >
                            {selectedFriendAction.action === 'progress' && (
                                <div className="flex-1 min-h-0">
                                    <ProgressViewer friend={selectedFriendAction.friend} currentUserId={userId} isDark={isDark} />
                                </div>
                            )}
                            {selectedFriendAction.action === 'profile' && (
                                <div className="flex-1 min-h-0 overflow-auto">
                                    <FriendProfile friend={selectedFriendAction.friend} onBack={clearSelection} isDark={isDark} />
                                </div>
                            )}
                            {selectedFriendAction.action === 'weeklyGoal' && (
                                <div className="flex-1 min-h-0 overflow-auto p-4 sm:p-6">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                {selectedFriendAction.friend.displayName}'s Weekly Goal
                                            </h2>
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                onClick={clearSelection}
                                                className={`rounded-xl ${
                                                    isDark 
                                                        ? 'hover:bg-gray-700/60 text-gray-300' 
                                                        : 'hover:bg-gray-100/60 text-gray-600'
                                                }`}
                                            >
                                                <ArrowLeft className="w-4 h-4 mr-2" />
                                                Back
                                            </Button>
                                        </div>
                                        
                                        {friendsWeeklyGoals[selectedFriendAction.friend.id] ? (
                                            <FriendWeeklyGoal 
                                                weeklyGoal={friendsWeeklyGoals[selectedFriendAction.friend.id]}
                                                isDark={isDark}
                                                compact={false}
                                            />
                                        ) : (
                                            <div className={`p-8 text-center rounded-2xl ${
                                                isDark ? 'bg-[#2a2a2a] text-gray-400' : 'bg-white/60 text-gray-600'
                                            }`}>
                                                <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                                <p className="text-lg font-medium mb-2">Weekly Goal Not Available</p>
                                                <p className="text-sm">
                                                    This friend hasn't set up their nutritional targets yet.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </motion.div>
            </motion.div>
        );
    }

    // Main friends grid view with new design
    return (        <motion.div 
            className={`min-h-screen flex flex-col overflow-hidden touch-pan-y transition-all duration-500 ${
                isDark 
                    ? 'bg-[#1a1a1a]' 
                    : 'bg-gradient-to-br from-blue-50 via-blue-100 to-blue-100'
            }`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            <div className={`flex-1 w-full max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 overflow-y-auto scrollbar-thin scrollbar-track-transparent hover:scrollbar-thumb-gray-400 friends-scroll-container scroll-smooth overscroll-contain pb-safe ${
                isDark ? 'scrollbar-thumb-white/20' : 'scrollbar-thumb-blue-300'
            }`}>
                {/* Header Section */}
                <motion.div 
                    className={`backdrop-blur-sm p-4 sm:p-6 shadow-lg rounded-2xl sm:rounded-3xl mb-4 sm:mb-6 transition-all duration-300 ${
                        isDark 
                            ? 'border border-[#3a3a3a] bg-[#2a2a2a]' 
                            : 'border border-gray-200/50 bg-white/90'
                    }`}
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                >
                    <div className="text-center mb-4 sm:mb-6">
                        <h1 className={`text-2xl sm:text-3xl font-bold mb-2 ${
                            isDark ? 'text-white' : 'text-gray-900'
                        }`}>
                            Friends
                        </h1>
                        <p className={`text-base sm:text-lg ${
                            isDark ? 'text-gray-300' : 'text-gray-600'
                        }`}>
                            Connect with your fitness community
                        </p>
                    </div>

                    {/* Search and Actions */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
                        <div className="relative flex-1">
                            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                                isDark ? 'text-gray-400' : 'text-gray-500'
                            }`} />
                            <Input 
                                placeholder="Search friends..." 
                                value={searchQuery} 
                                onChange={e => setSearchQuery(e.target.value)} 
                                className={`pl-10 rounded-xl sm:rounded-2xl border-0 h-11 sm:h-12 text-sm backdrop-blur-sm transition-all duration-300 ${
                                    isDark 
                                        ? 'bg-[#3a3a3a] focus:bg-[#3a3a3a] text-gray-100 placeholder:text-gray-400' 
                                        : 'bg-gray-100/80 focus:bg-white/80 placeholder:text-gray-500'
                                }`}
                            />
                        </div>
                        <div className="flex gap-3">
                            <Button 
                                variant="outline" 
                                onClick={() => router.push('/settings')}
                                className={`h-11 sm:h-12 px-4 sm:px-6 rounded-xl sm:rounded-2xl shadow-lg transition-all duration-300 hover:scale-[1.02] backdrop-blur-sm text-sm sm:text-base ${
                                    isDark 
                                        ? 'border-blue-500/30 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30' 
                                        : 'border-blue-200/50 bg-blue-50/80 text-blue-700 hover:bg-blue-100/80'
                                }`}
                            >
                                <Settings className="w-4 h-4 mr-2" />
                                <span className="hidden sm:inline">Manage</span>
                                <span className="sm:hidden">Manage</span>
                            </Button>
                        </div>
                    </div>
                </motion.div>                {/* Loading State */}
                {(authLoading || (isLoadingFriends && !hasFetchedFriends)) && (
                    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-h-[calc(100vh-320px)] sm:max-h-[calc(100vh-280px)] overflow-y-auto scrollbar-thin scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400 pr-2 pb-20 sm:pb-8 ${
                        isDark ? 'scrollbar-thumb-white/20' : 'scrollbar-thumb-gray-300'
                    }`}>
                        {[1,2,3,4,5,6].map(i => (
                            <Card key={i} className={`backdrop-blur-sm shadow-lg rounded-2xl sm:rounded-3xl ${
                                isDark 
                                    ? 'border border-[#3a3a3a] bg-[#2a2a2a]' 
                                    : 'border border-gray-200/50 bg-white/90'
                            }`}>
                                <CardHeader className="pb-3 sm:pb-4">
                                    <div className="flex items-center space-x-3 sm:space-x-4">
                                        <Skeleton className={`h-12 w-12 sm:h-16 sm:w-16 rounded-full ${
                                            isDark ? 'bg-gray-700' : 'bg-gray-200'
                                        }`} />
                                        <div className="flex-1">
                                            <Skeleton className={`h-4 sm:h-5 w-24 sm:w-32 mb-2 ${
                                                isDark ? 'bg-gray-700' : 'bg-gray-200'
                                            }`} />
                                            <Skeleton className={`h-3 sm:h-4 w-16 sm:w-20 ${
                                                isDark ? 'bg-gray-700' : 'bg-gray-200'
                                            }`} />
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3 sm:space-y-4">
                                    <Skeleton className={`h-12 sm:h-16 w-full rounded-xl sm:rounded-2xl ${
                                        isDark ? 'bg-gray-700' : 'bg-gray-200'
                                    }`} />
                                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                                        <Skeleton className={`h-10 sm:h-12 w-full rounded-lg sm:rounded-xl ${
                                            isDark ? 'bg-gray-700' : 'bg-gray-200'
                                        }`} />
                                        <Skeleton className={`h-10 sm:h-12 w-full rounded-lg sm:rounded-xl ${
                                            isDark ? 'bg-gray-700' : 'bg-gray-200'
                                        }`} />
                                    </div>
                                    <div className="flex space-x-2 pt-2">
                                        <Skeleton className={`h-7 sm:h-8 flex-1 rounded-lg sm:rounded-xl ${
                                            isDark ? 'bg-gray-700' : 'bg-gray-200'
                                        }`} />
                                        <Skeleton className={`h-7 w-7 sm:h-8 sm:w-8 rounded-lg sm:rounded-xl ${
                                            isDark ? 'bg-gray-700' : 'bg-gray-200'
                                        }`} />
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}                {/* Error State */}
                {firestoreError && (
                    <Card className={`w-full max-w-2xl mx-auto text-center mb-20 sm:mb-8 shadow-lg rounded-3xl ${
                        isDark 
                            ? 'bg-[#2a2a2a] border border-[#3a3a3a] backdrop-blur-sm' 
                            : 'border-destructive bg-white/90'
                    }`}>
                        <CardHeader>
                            <AlertCircle className={`mx-auto h-10 w-10 ${
                                isDark ? 'text-red-400' : 'text-destructive'
                            }`} />
                            <CardTitle className={isDark ? 'text-red-400' : 'text-destructive'}>
                                Database Configuration Needed
                            </CardTitle>
                            <CardDescription className={`text-xs p-2 break-words ${
                                isDark ? 'text-gray-300' : 'text-muted-foreground'
                            }`}>
                                {firestoreError.includes("index required")
                                    ? "A Firestore index is required. Please create it in your Firebase console:"
                                    : "A database error occurred."}
                                 {firestoreError.includes("https://console.firebase.google.com") && (
                                   <a href={firestoreError.substring(firestoreError.indexOf("https://"))} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline block mt-2 text-sm">
                                       Open Firebase Console
                                   </a>
                                 )}
                                 {!firestoreError.includes("https://console.firebase.google.com") && (
                                     <pre className={`mt-2 text-left text-xs p-2 rounded overflow-x-auto ${
                                         isDark ? 'bg-gray-700/60' : 'bg-muted'
                                     }`}>{firestoreError}</pre>
                                 )}
                            </CardDescription>
                        </CardHeader>
                         <CardFooter className="justify-center">
                             <Button 
                                 onClick={() => { setHasFetchedFriends(false); fetchFriendsCallback(); }}
                                 className={`transition-all duration-300 hover:scale-105 ${
                                     isDark 
                                         ? 'bg-blue-600 hover:bg-blue-700' 
                                         : ''
                                 }`}
                             >
                                 Retry Loading
                             </Button>
                         </CardFooter>
                    </Card>
                )}                {/* Friends Grid */}
                {!authLoading && !isLoadingFriends && !firestoreError && filteredFriends.length > 0 && (
                    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-h-[calc(100vh-320px)] sm:max-h-[calc(100vh-280px)] overflow-y-auto scrollbar-thin scrollbar-track-gray-100 pr-2 pb-20 sm:pb-8 ${
                        isDark ? 'scrollbar-thumb-white/20 hover:scrollbar-thumb-white/30' : 'scrollbar-thumb-blue-300 hover:scrollbar-thumb-blue-400'
                    }`}>
                        {filteredFriends.map((friend, index) => {
                            // Get real data from Firebase
                            const friendWeeklyGoal = friendsWeeklyGoals[friend.id];
                            const dayStreak = friend.dayStreak || 0;
                            const badges = friend.badges || 0;
                            const totalPoints = friend.totalPoints || 0;
                            const level = friend.level || 1;
                            
                            // Debug logging to see what data we're getting
                            console.log(`[Friends Page] Friend ${friend.displayName}:`, {
                                dayStreak,
                                badges,
                                totalPoints,
                                level,
                                hasWeeklyGoal: !!friendWeeklyGoal
                            });
                            
                            // Calculate weekly progress if weekly goal data exists
                            let weeklyProgress = 0;
                            let completedGoals = 0;
                            let totalGoals = 4; // calories, protein, carbs, fat
                            
                            if (friendWeeklyGoal?.progress) {
                                const progress = friendWeeklyGoal.progress;
                                if (progress.calories >= 80) completedGoals++;
                                if (progress.protein >= 80) completedGoals++;
                                if (progress.carbohydrates >= 80) completedGoals++;
                                if (progress.fat >= 80) completedGoals++;
                                weeklyProgress = (completedGoals / totalGoals) * 100;
                            }
                            
                            // Get activity status based on recent data
                            const status = getUserActivityStatus(friend, friendWeeklyGoal);
                            const lastActivityMessage = getLastActivityMessage(status, friend, friendWeeklyGoal);
                            
                            const progressPercentage = weeklyProgress;
                            const getProgressWidth = (percentage: number) => {
                                if (percentage >= 100) return 'w-full';
                                if (percentage >= 90) return 'w-11/12';
                                if (percentage >= 80) return 'w-4/5';
                                if (percentage >= 75) return 'w-3/4';
                                if (percentage >= 66) return 'w-2/3';
                                if (percentage >= 60) return 'w-3/5';
                                if (percentage >= 50) return 'w-1/2';
                                if (percentage >= 40) return 'w-2/5';
                                if (percentage >= 33) return 'w-1/3';
                                if (percentage >= 25) return 'w-1/4';
                                if (percentage >= 20) return 'w-1/5';
                                return 'w-1/12';
                            };
                            
                            return (
                                <motion.div
                                    key={friend.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ duration: 0.3, delay: index * 0.1 }}
                                >
                                    <Card className={`backdrop-blur-sm shadow-lg rounded-2xl sm:rounded-3xl transition-all duration-300 hover:scale-[1.02] hover:shadow-xl cursor-pointer group scroll-mt-4 ${
                                        isDark 
                                            ? 'border border-[#3a3a3a] bg-[#2a2a2a] hover:bg-[#3a3a3a]' 
                                            : 'border border-gray-200/50 bg-white/90'
                                    }`}
                                          onClick={() => handleSelectAction(friend, 'profile')}>
                                        <CardHeader className="pb-3 sm:pb-4">
                                            <div className="flex items-center space-x-3 sm:space-x-4">
                                                <div className="relative flex-shrink-0">
                                                    <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full p-0.5 ${
                                                        isDark 
                                                            ? 'bg-blue-600' 
                                                            : 'bg-blue-400'
                                                    }`}>
                                                        <div className={`w-full h-full rounded-full flex items-center justify-center ${
                                                            isDark ? 'bg-[#2a2a2a]' : 'bg-white'
                                                        }`}>
                                                            {friend.photoURL ? (
                                                                <img src={friend.photoURL} alt={friend.displayName || 'F'} className="w-full h-full rounded-full object-cover" />
                                                            ) : (
                                                                <span className={`text-lg sm:text-xl font-bold ${
                                                                    isDark ? 'text-gray-100' : 'text-gray-700'
                                                                }`}>
                                                                    {friend.displayName?.charAt(0).toUpperCase() || 'U'}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className={`absolute -bottom-0.5 -right-0.5 sm:-bottom-1 sm:-right-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 ${
                                                        isDark ? 'border-[#2a2a2a]' : 'border-white'
                                                    } ${status === 'online' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className={`font-semibold text-base sm:text-lg truncate ${
                                                        isDark ? 'text-white' : 'text-gray-900'
                                                    }`}>
                                                        {friend.displayName || 'Unknown User'}
                                                    </h3>
                                                    <div className="flex items-center space-x-2 mt-1">
                                                        <Badge variant="secondary" className={`text-xs px-2 py-0.5 sm:py-1 ${
                                                            isDark 
                                                                ? 'bg-[#3a3a3a] text-gray-100' 
                                                                : 'bg-blue-100 text-blue-700'
                                                        }`}>
                                                            Level {friend.level || 1}
                                                        </Badge>
                                                        <span className={`text-xs truncate ${
                                                            isDark ? 'text-gray-400' : 'text-gray-500'
                                                        }`}>
                                                            {lastActivityMessage} • {formatPoints(totalPoints)} pts • {badges} badges
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardHeader>
                                          <CardContent className="space-y-3 sm:space-y-4">
                                            {/* Weekly Progress */}
                                            <div className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl ${
                                                isDark ? 'bg-[#3a3a3a]' : 'bg-gray-50/80'
                                            }`}>
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className={`text-xs sm:text-sm font-medium ${
                                                        isDark ? 'text-gray-400' : 'text-gray-600'
                                                    }`}>
                                                        Weekly Goals
                                                    </span>
                                                    <span className={`text-xs sm:text-sm font-bold ${
                                                        isDark ? 'text-white' : 'text-gray-900'
                                                    }`}>
                                                        {completedGoals}/{totalGoals}
                                                    </span>
                                                </div>
                                                <div className={`w-full rounded-full h-2 ${
                                                    isDark ? 'bg-[#1a1a1a]' : 'bg-gray-200'
                                                }`}>
                                                    <div 
                                                        className={`h-2 rounded-full transition-all duration-300 ${
                                                            isDark 
                                                                ? 'bg-blue-600' 
                                                                : 'bg-blue-400'
                                                        } ${getProgressWidth(progressPercentage)}`}
                                                    ></div>
                                                </div>
                                            </div>

                                            {/* Stats */}
                                            <div className="grid grid-cols-2 gap-2 sm:gap-3">
                                                <div className={`text-center p-2 sm:p-3 rounded-lg sm:rounded-xl ${
                                                    isDark ? 'bg-[#3a3a3a]' : 'bg-gray-50/80'
                                                }`}>
                                                    <div className={`text-base sm:text-lg font-bold ${
                                                        isDark ? 'text-white' : 'text-gray-900'
                                                    }`}>
                                                        {dayStreak}
                                                    </div>
                                                    <div className={`text-xs ${
                                                        isDark ? 'text-gray-400' : 'text-gray-500'
                                                    }`}>
                                                        Day Streak
                                                    </div>
                                                </div>
                                                <div className={`text-center p-2 sm:p-3 rounded-lg sm:rounded-xl ${
                                                    isDark ? 'bg-[#3a3a3a]' : 'bg-gray-50/80'
                                                }`}>
                                                    <div className={`text-base sm:text-lg font-bold ${
                                                        isDark ? 'text-white' : 'text-gray-900'
                                                    }`}>
                                                        {friend.badges || 0}
                                                    </div>
                                                    <div className={`text-xs ${
                                                        isDark ? 'text-gray-400' : 'text-gray-500'
                                                    }`}>
                                                        Badges
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex space-x-2 pt-2">
                                                <Button 
                                                    onClick={(e) => { e.stopPropagation(); handleSelectAction(friend, 'profile'); }} 
                                                    variant="outline" 
                                                    size="sm" 
                                                    className={`flex-1 rounded-lg sm:rounded-xl transition-all duration-300 text-xs sm:text-sm h-8 sm:h-9 ${
                                                        isDark 
                                                            ? 'border-blue-500/30 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30' 
                                                            : 'border-blue-200/50 bg-blue-50/50 text-blue-700 hover:bg-blue-100/80'
                                                    }`}
                                                >
                                                    <span className="hidden sm:inline">View Profile</span>
                                                    <span className="sm:hidden">Profile</span>
                                                </Button>
                                                <Button 
                                                    onClick={(e) => { e.stopPropagation(); handleSelectAction(friend, 'chat'); }} 
                                                    size="sm" 
                                                    className={`rounded-lg sm:rounded-xl transition-all duration-300 text-white h-8 sm:h-9 px-3 sm:px-4 ${
                                                        isDark 
                                                            ? 'bg-blue-600 hover:bg-blue-700' 
                                                            : 'bg-blue-400 hover:bg-blue-500'
                                                    }`}
                                                >
                                                    <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            );
                        })}
                        
                        {/* Extra spacing at the bottom for mobile navigation */}
                        <div className="col-span-full h-4 sm:h-2"></div>
                    </div>
                )}                {/* Empty State */}
                {!authLoading && !isLoadingFriends && !firestoreError && filteredFriends.length === 0 && (
                    <div className={`text-center py-12 sm:py-16 rounded-2xl sm:rounded-3xl backdrop-blur-sm mx-2 sm:mx-0 mb-20 sm:mb-8 ${
                        isDark ? 'bg-[#2a2a2a]' : 'bg-white/30'
                    }`}>
                        <Users className={`w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 ${
                            isDark ? 'text-gray-500' : 'text-gray-400'
                        }`} />
                        <h3 className={`text-lg sm:text-xl font-semibold mb-2 ${
                            isDark ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                            {searchQuery ? 'No friends found' : 'No friends yet'}
                        </h3>
                        <p className={`text-sm mb-6 px-4 ${
                            isDark ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                            {searchQuery ? 'Try adjusting your search terms' : 'Start connecting with other fitness enthusiasts'}
                        </p>
                        {!searchQuery && (
                            <Button 
                                onClick={() => router.push('/settings')}
                                className={`px-6 sm:px-8 py-2 sm:py-3 rounded-xl sm:rounded-2xl shadow-lg transition-all duration-300 hover:scale-[1.02] text-white text-sm sm:text-base ${
                                    isDark 
                                        ? 'bg-blue-600 hover:bg-blue-700' 
                                        : 'bg-blue-400 hover:bg-blue-500'
                                }`}
                            >
                                <UserPlus className="w-4 h-4 mr-2" />
                                <span className="hidden sm:inline">Add Your First Friend</span>
                                <span className="sm:hidden">Add Friend</span>
                            </Button>
                        )}
                    </div>
                )}
            </div>

            {/* Scroll to Top Button */}
            <AnimatePresence>
                {showScrollTop && (
                    <motion.button
                        className={`fixed bottom-24 sm:bottom-20 right-4 z-50 text-white p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110 backdrop-blur-sm border border-white/20 ${
                            isDark 
                                ? 'bg-blue-600 hover:bg-blue-700' 
                                : 'bg-blue-500 hover:bg-blue-600'
                        }`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        transition={{ duration: 0.3 }}
                        onClick={scrollToTop}
                        title="Scroll to top"
                    >
                        <ChevronUp className="w-5 h-5" />
                    </motion.button>
                )}            </AnimatePresence>

            {/* Chat Modal */}
            {chatModalFriend && (
                <FriendChatModal 
                    friend={chatModalFriend} 
                    isOpen={showChatModal} 
                    onClose={closeChatModal}
                    isDark={isDark}
                />
            )}
        </motion.div>
    );
}
