// src/app/overview/page.tsx
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import DashboardProfileHeader from '@/components/dashboard/DashboardProfileHeader';
import { StoredUserProfile, StoredExerciseLogEntry } from '@/app/dashboard/types';
import { getOverviewData } from '@/services/firestore/overviewService';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { Flame, Dumbbell, TrendingUp, AlertCircle, Star, Trophy, Activity, Clock, Zap, ClipboardList, User, Target, Heart, CheckCircle, Edit } from 'lucide-react';
import { cn } from '@/lib/utils';
import FitnessTip from '@/components/dashboard/FitnessTip';
import WaterIntakeTip from '@/components/dashboard/WaterIntakeTip';
import SleepGoals from '@/components/dashboard/SleepGoals';
import { FitnessTipData } from '@/app/dashboard/types';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedWrapper from '@/components/ui/animated-wrapper';

const fitnessTips: FitnessTipData[] = [
  { id: 1, type: 'do', text: 'Stay hydrated! Aim for 8 glasses of water throughout the day.' },
  { id: 2, type: 'do', text: 'Prioritize 7-9 hours of quality sleep for optimal muscle recovery and hormone regulation.' },
  { id: 3, type: 'dont', text: 'Minimize processed foods, sugary drinks, and excessive saturated fats.' },
];

interface WeeklyActivitySummary {
    totalWorkouts: number;
    totalCaloriesBurned: number;
    strengthWorkouts: number;
    cardioWorkouts: number;
    otherWorkouts: number;
}

interface PointsData {
  todayPoints: number;
  totalPoints: number;
  lastUpdated: string;
}

export default function OverviewPage() {
    const { userId, loading: authLoading } = useAuth();
    const router = useRouter();
    const [userProfile, setUserProfile] = useState<StoredUserProfile | null>(null);
    const [weeklyActivitySummary, setWeeklyActivitySummary] = useState<WeeklyActivitySummary | null>(null);
    const [pointsData, setPointsData] = useState<PointsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [randomTip, setRandomTip] = useState<FitnessTipData | null>(null);
    const [isClient, setIsClient] = useState(false);
    const [isDark, setIsDark] = useState(false);    useEffect(() => { setIsClient(true); }, []);

    // Detect theme from HTML class (consistent with Settings page)
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

    useEffect(() => {
        if (isClient && !randomTip && fitnessTips.length > 0) {
            setRandomTip(fitnessTips[Math.floor(Math.random() * fitnessTips.length)]);
        }
    }, [isClient, randomTip]);

    useEffect(() => {
        const fetchOverviewData = async () => {
            if (!userId) {
                setIsLoading(false);
                return;
            }
            setIsLoading(true);
            setError(null);

            try {
                const weekStart = startOfWeek(new Date(), { weekStartsOn: 0 });
                const weekEnd = endOfWeek(new Date(), { weekStartsOn: 0 });

                console.log(`[Overview Page] Fetching batched data for user: ${userId}`);

                // Fetch all data in a single optimized batch request
                const overviewData = await getOverviewData(userId, weekStart, weekEnd);

                console.log(`[Overview Page] Batched data received:`, {
                    profile: !!overviewData.userProfile,
                    exerciseLogs: overviewData.exerciseLogs.length,
                    points: !!overviewData.pointsData
                });

                setUserProfile(overviewData.userProfile);
                setPointsData(overviewData.pointsData); // pointsData is always defined now

                let totalWorkouts = 0;
                let totalCaloriesBurned = 0;
                let strengthWorkouts = 0;
                let cardioWorkouts = 0;
                let otherWorkouts = 0;

                overviewData.exerciseLogs.forEach(log => {
                    totalWorkouts++;
                    totalCaloriesBurned += log.estimatedCaloriesBurned || 0;
                    if (log.exerciseType === 'strength') strengthWorkouts++;
                    else if (log.exerciseType === 'cardio') cardioWorkouts++;
                    else otherWorkouts++;
                });

                setWeeklyActivitySummary({
                    totalWorkouts,
                    totalCaloriesBurned: Math.round(totalCaloriesBurned),
                    strengthWorkouts,
                    cardioWorkouts,
                    otherWorkouts
                });

            } catch (err: any) {
                console.error("[Overview Page] Error fetching data:", err);
                setError("Could not load overview data. " + err.message);
            } finally {
                setIsLoading(false);
            }
        };

        if (!authLoading && userId) {
            fetchOverviewData();
        } else if (!authLoading && !userId) {
            router.replace('/authorize');
        }
    }, [authLoading, userId, router]);

    // Manual refresh function for retry button
    const fetchData = useCallback(async () => {
        if (!userId) return;
        
        setIsLoading(true);
        setError(null);

        try {
            const weekStart = startOfWeek(new Date(), { weekStartsOn: 0 });
            const weekEnd = endOfWeek(new Date(), { weekStartsOn: 0 });

            console.log(`[Overview Page] Manual refresh - fetching fresh data for user: ${userId}`);

            // Fetch fresh data using optimized batch request
            const overviewData = await getOverviewData(userId, weekStart, weekEnd);

            console.log(`[Overview Page] Manual refresh - Batched data received:`, {
                profile: !!overviewData.userProfile,
                exerciseLogs: overviewData.exerciseLogs.length,
                points: !!overviewData.pointsData
            });

            setUserProfile(overviewData.userProfile);
            setPointsData(overviewData.pointsData); // pointsData is always defined now

            let totalWorkouts = 0;
            let totalCaloriesBurned = 0;
            let strengthWorkouts = 0;
            let cardioWorkouts = 0;
            let otherWorkouts = 0;

            overviewData.exerciseLogs.forEach(log => {
                totalWorkouts++;
                totalCaloriesBurned += log.estimatedCaloriesBurned || 0;
                if (log.exerciseType === 'strength') strengthWorkouts++;
                else if (log.exerciseType === 'cardio') cardioWorkouts++;
                else otherWorkouts++;
            });

            setWeeklyActivitySummary({
                totalWorkouts,
                totalCaloriesBurned: Math.round(totalCaloriesBurned),
                strengthWorkouts,
                cardioWorkouts,
                otherWorkouts
            });

        } catch (err: any) {
            console.error("[Overview Page] Manual refresh error:", err);
            setError("Could not refresh overview data. " + err.message);
        } finally {
            setIsLoading(false);
        }
    }, [userId]);

    const profileHeaderData = useMemo(() => {
        if (!userProfile) return null;
        return {
            displayName: userProfile.displayName || "User",
            photoURL: userProfile.photoURL || `https://placehold.co/100x100.png?text=${(userProfile.displayName || "U").charAt(0)}`,
        };    }, [userProfile]);

    if (isLoading || authLoading) {return (
            <div className={`min-h-screen pb-20 md:pb-0 animate-fade-in transition-all duration-500 ${
                isDark 
                    ? 'bg-[#1a1a1a]' 
                    : 'bg-gradient-to-br from-slate-100 via-blue-50 to-slate-200'
            }`}>
                <div className="p-3 md:p-6">
                    <div className="max-w-4xl mx-auto space-y-4 md:space-y-6">
                        {/* Header Skeleton */}
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                        >
                            <div className={`backdrop-blur-sm rounded-3xl shadow-lg border-0 p-4 md:p-6 text-center transition-all duration-500 ${
                                isDark 
                                    ? 'bg-[#2a2a2a] border border-[#3a3a3a]' 
                                    : 'bg-clay-100/70 border border-white/50 shadow-clayStrong'
                            }`}>
                                <Skeleton className={`h-8 md:h-10 w-3/4 mx-auto mb-2 ${isDark ? 'bg-[#3a3a3a]' : ''}`} />
                                <Skeleton className={`h-4 w-1/2 mx-auto ${isDark ? 'bg-[#3a3a3a]' : ''}`} />
                            </div>
                        </motion.div>

                        {/* Profile Card Skeleton */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.1 }}
                        >
                            <Card className={`backdrop-blur-sm border-0 rounded-3xl transition-all duration-500 ${
                                isDark 
                                    ? 'bg-[#2a2a2a] border border-[#3a3a3a]' 
                                    : 'bg-clay-100/70 shadow-clayStrong'
                            }`}>
                                <CardContent className="p-4 md:p-6">
                                    <div className="flex items-center space-x-3 md:space-x-4">
                                        <Skeleton className={`h-12 w-12 md:h-16 md:w-16 rounded-full ${isDark ? 'bg-[#3a3a3a]' : ''}`} />
                                        <div className="flex-1 space-y-2">
                                            <Skeleton className={`h-6 w-1/2 ${isDark ? 'bg-[#3a3a3a]' : ''}`} />
                                            <Skeleton className={`h-4 w-3/4 ${isDark ? 'bg-[#3a3a3a]' : ''}`} />
                                            <Skeleton className={`h-3 w-1/3 ${isDark ? 'bg-[#3a3a3a]' : ''}`} />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>

                        {/* Additional Cards Skeleton */}
                        {[...Array(3)].map((_, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.2 + i * 0.1 }}
                            >
                                <Card className={`backdrop-blur-sm border-0 rounded-3xl transition-all duration-500 ${
                                    isDark 
                                        ? 'bg-[#2a2a2a] border border-[#3a3a3a]' 
                                        : 'bg-clay-100/70 shadow-clayStrong'
                                }`}>
                                    <CardContent className="p-4 md:p-6">
                                        <Skeleton className={`h-24 w-full ${isDark ? 'bg-[#3a3a3a]' : ''}`} />
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }    if (error) {
        return (
            <div className={`min-h-screen pb-20 md:pb-0 animate-fade-in transition-all duration-500 ${
                isDark 
                    ? 'bg-[#1a1a1a]' 
                    : 'bg-gradient-to-br from-slate-100 via-blue-50 to-slate-200'
            }`}>
                <div className="p-3 md:p-6">
                    <div className="max-w-xl mx-auto text-center">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                        >
                            <Card className={`backdrop-blur-sm border-0 rounded-3xl transition-all duration-500 ${
                                isDark 
                                    ? 'bg-[#2a2a2a] border border-[#3a3a3a]' 
                                    : 'bg-clay-100/70 shadow-clayStrong'
                            }`}>
                                <CardHeader>
                                    <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
                                    <CardTitle className={`${isDark ? 'text-red-400' : 'text-red-600'}`}>Error Loading Overview</CardTitle>
                                    <CardDescription className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{error}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Button onClick={fetchData} variant="outline" className="rounded-2xl">
                                        Try Again
                                    </Button>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </div>
                </div>
            </div>
        );
    }    
    return (
        <div className={`min-h-screen pb-20 md:pb-0 animate-fade-in transition-all duration-500 ${
            isDark 
                ? 'bg-[#1a1a1a]' 
                : 'bg-gradient-to-br from-slate-100 via-blue-50 to-slate-200'
        }`}>
            <div className="p-3 md:p-6">
                <div className="max-w-4xl mx-auto space-y-4 md:space-y-6">
                    {/* Header */}
                    <motion.div 
                        className="mb-6 md:mb-8"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className={`backdrop-blur-sm rounded-3xl shadow-lg border-0 p-4 md:p-6 text-center transition-all duration-500 ${
                            isDark 
                                ? 'bg-[#2a2a2a] border border-[#3a3a3a]' 
                                : 'bg-clay-100/70 shadow-clayStrong'
                        }`}>
                            <h1 className={`text-2xl md:text-3xl lg:text-4xl font-bold mb-2 ${
                                isDark ? 'text-white' : 'text-gray-800'
                            }`}>
                                Activity Overview
                            </h1>
                            <p className={`text-sm md:text-base ${
                                isDark ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                                Track your fitness journey with beautiful insights
                            </p>
                        </div>
                    </motion.div>                    {/* User Profile Section */}
                    {profileHeaderData && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.1 }}
                        >
                            <Card className={`backdrop-blur-sm border-0 hover:shadow-lg transition-all duration-300 rounded-3xl ${
                                isDark 
                                    ? 'bg-[#2a2a2a] border border-[#3a3a3a]' 
                                    : 'bg-clay-100/70 shadow-clayStrong hover:shadow-xl'
                            }`}>
                                <CardContent className="p-4 md:p-6">
                                    <div className="flex items-center space-x-3 md:space-x-4">
                                        <Avatar className="h-12 w-12 md:h-16 md:w-16 shadow-lg flex-shrink-0">
                                            <AvatarImage 
                                                src={profileHeaderData.photoURL}
                                                alt={`${profileHeaderData.displayName}'s profile`}
                                            />
                                            <AvatarFallback className={`text-lg md:text-xl font-bold ${
                                                isDark 
                                                    ? 'bg-[#8b5cf6] text-white' 
                                                    : 'bg-gradient-to-br from-purple-400 to-purple-600 text-white'
                                            }`}>
                                                <User className="w-6 h-6 md:w-8 md:h-8" />
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <h2 className={`text-lg md:text-xl font-semibold mb-1 truncate ${
                                                isDark ? 'text-white' : 'text-gray-800'
                                            }`}>
                                                {profileHeaderData.displayName}
                                            </h2>
                                            <p className={`text-sm md:text-base mb-2 ${
                                                isDark ? 'text-gray-400' : 'text-gray-600'
                                            }`}>
                                                Welcome to your fitness journey!
                                            </p>
                                            <div className="flex items-center">
                                                <div className="w-3 h-3 bg-green-400 rounded-full mr-2 shadow-sm animate-pulse flex-shrink-0"></div>
                                                <span className={`text-xs md:text-sm ${
                                                    isDark ? 'text-gray-400' : 'text-gray-500'
                                                }`}>Last active: Today</span>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}                    {/* Today's Points */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                    >
                        <Card className={`backdrop-blur-sm border-0 hover:shadow-lg transition-all duration-300 rounded-3xl ${
                            isDark 
                                ? 'bg-[#2a2a2a] border border-[#3a3a3a]' 
                                : 'bg-clay-100/70 shadow-clayStrong hover:shadow-xl'
                        }`}>
                            <CardContent className="p-4 md:p-6">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-3 mb-3">
                                            <div className={`w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center shadow-lg animate-scale-in flex-shrink-0 ${
                                                isDark 
                                                    ? 'bg-orange-600' 
                                                    : 'bg-gradient-to-br from-orange-400 to-orange-600'
                                            }`}>
                                                <Star className="w-5 h-5 md:w-6 md:h-6 text-white" />
                                            </div>
                                            <h3 className={`text-base md:text-lg font-semibold ${
                                                isDark ? 'text-white' : 'text-gray-800'
                                            }`}>Today's Points</h3>
                                        </div>
                                        <div className="flex items-baseline space-x-2">
                                            <span className={`text-2xl md:text-3xl font-bold ${
                                                isDark ? 'text-white' : 'text-gray-800'
                                            }`}>
                                                {pointsData?.todayPoints || 0}
                                            </span>
                                            <span className={`text-sm md:text-base ${
                                                isDark ? 'text-gray-400' : 'text-gray-500'
                                            }`}>/100</span>
                                        </div>
                                        <p className={`text-xs md:text-sm mt-1 ${
                                            isDark ? 'text-gray-400' : 'text-gray-600'
                                        }`}>Points earned today</p>
                                    </div>
                                    <div className={`backdrop-blur-sm rounded-2xl p-3 md:p-4 shadow-lg text-center sm:text-right ${
                                        isDark 
                                            ? 'bg-[#3a3a3a] border border-[#8b5cf6]/20' 
                                            : 'bg-clay-100/40'
                                    }`}>
                                        <p className={`text-xs md:text-sm ${
                                            isDark ? 'text-gray-400' : 'text-gray-600'
                                        }`}>Total Points</p>
                                        <p className={`text-xl md:text-2xl font-bold ${isDark ? 'text-[#8b5cf6]' : 'text-purple-600'}`}>
                                            {pointsData?.totalPoints || 0}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>                    {/* Weekly Progress */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                    >
                        <Card className={`backdrop-blur-sm border-0 hover:shadow-lg transition-all duration-300 rounded-3xl ${
                            isDark 
                                ? 'bg-[#2a2a2a] border border-[#3a3a3a]' 
                                : 'bg-clay-100/70 shadow-clayStrong hover:shadow-xl'
                        }`}>
                            <CardHeader className="pb-2 md:pb-3">
                                <div className="flex items-center space-x-3">
                                    <div className={`w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center shadow-lg animate-scale-in flex-shrink-0 ${
                                        isDark 
                                            ? 'bg-blue-600' 
                                            : 'bg-gradient-to-br from-blue-400 to-blue-600'
                                    }`}>
                                        <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-white" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <CardTitle className={`text-lg md:text-xl ${
                                            isDark ? 'text-white' : 'text-gray-800'
                                        }`}>Weekly Progress</CardTitle>
                                        <p className={`text-xs md:text-sm ${
                                            isDark ? 'text-gray-400' : 'text-gray-600'
                                        }`}>Track your consistency and goals</p>
                                    </div>
                                </div>
                            </CardHeader>                            <CardContent className="space-y-4 md:space-y-6">
                                {/* Weekly Goals Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                                    <div className={`p-3 md:p-4 rounded-2xl shadow-lg backdrop-blur-sm transition-all duration-300 ${
                                        isDark 
                                            ? 'bg-[#3a3a3a] border border-green-500/30' 
                                            : 'bg-gradient-to-br from-green-50 to-green-100'
                                    }`}>
                                        <div className="flex items-center space-x-2 md:space-x-3 mb-2 md:mb-3">
                                            <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0 ${
                                                isDark 
                                                    ? 'bg-green-600' 
                                                    : 'bg-gradient-to-br from-green-400 to-green-600'
                                            }`}>
                                                <Target className="w-4 h-4 md:w-5 md:h-5 text-white" />
                                            </div>
                                            <h4 className={`text-sm md:text-base font-semibold ${
                                                isDark ? 'text-green-400' : 'text-green-800'
                                            }`}>Weekly Goals</h4>
                                        </div>
                                        <div className={`text-xl md:text-2xl font-bold mb-1 ${
                                            isDark ? 'text-green-400' : 'text-green-600'
                                        }`}>
                                            {weeklyActivitySummary?.totalWorkouts || 0}/5
                                        </div>
                                        <p className={`text-xs mb-1 md:mb-2 ${
                                            isDark ? 'text-green-400' : 'text-gray-600'
                                        }`}>Workouts</p>
                                        <p className={`text-xs ${
                                            isDark ? 'text-green-400' : 'text-gray-500'
                                        }`}>
                                            {weeklyActivitySummary && weeklyActivitySummary.totalWorkouts >= 5 
                                                ? "🎉 Weekly goal achieved!" 
                                                : `${5 - (weeklyActivitySummary?.totalWorkouts || 0)} more to reach weekly goal!`
                                            }
                                        </p>
                                    </div>
                                    
                                    <div className={`p-3 md:p-4 rounded-2xl shadow-lg backdrop-blur-sm transition-all duration-300 ${
                                        isDark 
                                            ? 'bg-[#3a3a3a] border border-orange-500/30' 
                                            : 'bg-gradient-to-br from-orange-50 to-orange-100'
                                    }`}>
                                        <div className="flex items-center space-x-2 md:space-x-3 mb-2 md:mb-3">
                                            <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0 ${
                                                isDark 
                                                    ? 'bg-orange-600' 
                                                    : 'bg-gradient-to-br from-orange-400 to-orange-600'
                                            }`}>
                                                <Zap className="w-4 h-4 md:w-5 md:h-5 text-white" />
                                            </div>
                                            <h4 className={`text-sm md:text-base font-semibold ${
                                                isDark ? 'text-orange-400' : 'text-orange-800'
                                            }`}>Activity Streak</h4>
                                        </div>
                                        <div className={`text-xl md:text-2xl font-bold mb-1 ${
                                            isDark ? 'text-orange-400' : 'text-orange-600'
                                        }`}>
                                            {weeklyActivitySummary ? Math.min(weeklyActivitySummary.totalWorkouts, 7) : 0}
                                        </div>
                                        <p className={`text-xs mb-1 md:mb-2 ${
                                            isDark ? 'text-orange-400' : 'text-gray-600'
                                        }`}>days this week</p>
                                        <p className={`text-xs ${
                                            isDark ? 'text-orange-400' : 'text-gray-500'
                                        }`}>
                                            {weeklyActivitySummary && weeklyActivitySummary.totalWorkouts > 0 
                                                ? "Keep the momentum going! 🔥" 
                                                : "Start today to build your streak!"
                                            }
                                        </p>
                                    </div>
                                </div>                                {/* Quick Stats */}
                                <div>
                                    <h4 className={`text-sm md:text-base font-semibold mb-2 md:mb-3 ${
                                        isDark ? 'text-white' : 'text-gray-800'
                                    }`}>Quick Stats</h4>
                                    <div className={`rounded-2xl p-3 md:p-4 shadow-lg backdrop-blur-sm ${
                                        isDark 
                                            ? 'bg-[#3a3a3a] border border-[#8b5cf6]/20' 
                                            : 'bg-clay-100/60'
                                    }`}>
                                        <div className="grid grid-cols-2 gap-3 md:gap-4">
                                            <div className="text-center">
                                                <div className={`text-lg md:text-2xl font-bold mb-1 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                                                    {weeklyActivitySummary?.totalCaloriesBurned || 0}
                                                </div>
                                                <div className={`text-xs ${
                                                    isDark ? 'text-gray-400' : 'text-gray-600'
                                                }`}>Calories burned</div>
                                            </div>
                                            <div className="text-center">
                                                <div className={`text-lg md:text-2xl font-bold mb-1 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                                                    {weeklyActivitySummary?.strengthWorkouts || 0}
                                                </div>
                                                <div className={`text-xs ${
                                                    isDark ? 'text-gray-400' : 'text-gray-600'
                                                }`}>Strength sessions</div>
                                            </div>
                                            <div className="text-center">
                                                <div className={`text-lg md:text-2xl font-bold mb-1 ${isDark ? 'text-[#8b5cf6]' : 'text-purple-600'}`}>
                                                    {weeklyActivitySummary?.cardioWorkouts || 0}
                                                </div>
                                                <div className={`text-xs ${
                                                    isDark ? 'text-gray-400' : 'text-gray-600'
                                                }`}>Cardio sessions</div>
                                            </div>
                                            <div className="text-center">
                                                <div className={`text-lg md:text-2xl font-bold mb-1 ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                                                    {weeklyActivitySummary && weeklyActivitySummary.totalWorkouts > 0 
                                                        ? Math.round(weeklyActivitySummary.totalCaloriesBurned / weeklyActivitySummary.totalWorkouts)
                                                        : 0
                                                    }
                                                </div>
                                                <div className={`text-xs ${
                                                    isDark ? 'text-gray-400' : 'text-gray-600'
                                                }`}>Avg per workout</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>{/* Recommended Actions */}
                                <div>
                                    <h4 className={`text-sm md:text-base font-semibold mb-2 md:mb-3 ${
                                        isDark ? 'text-white' : 'text-gray-800'
                                    }`}>Recommended Actions</h4>
                                    <div className={`p-3 md:p-4 rounded-2xl shadow-lg border backdrop-blur-sm ${
                                        isDark 
                                            ? 'bg-[#3a3a3a] border border-blue-500/30' 
                                            : 'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-100'
                                    }`}>
                                        <div className="flex items-center space-x-2 md:space-x-3">
                                            <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0 ${
                                                isDark 
                                                    ? 'bg-blue-600' 
                                                    : 'bg-gradient-to-br from-blue-400 to-blue-600'
                                            }`}>
                                                <Target className="w-4 h-4 md:w-5 md:h-5 text-white" />
                                            </div>
                                            <span className={`text-xs md:text-sm font-medium ${
                                                isDark ? 'text-blue-400' : 'text-blue-800'
                                            }`}>
                                                {weeklyActivitySummary && weeklyActivitySummary.totalWorkouts >= 5
                                                    ? "Excellent work! Consider adding recovery or flexibility sessions"
                                                    : weeklyActivitySummary && weeklyActivitySummary.totalWorkouts >= 3
                                                    ? "Great progress! Keep up the consistency"
                                                    : "Focus on consistency - aim for at least 3 workouts this week!"
                                                }
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>                    {/* Today's Fitness Tip */}
                    {randomTip && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.4 }}
                        >
                            <Card className={`backdrop-blur-sm border-0 hover:shadow-lg transition-all duration-300 rounded-3xl ${
                                isDark 
                                    ? 'bg-[#2a2a2a] border border-[#3a3a3a]' 
                                    : 'bg-clay-100/70 shadow-clayStrong hover:shadow-xl'
                            }`}>
                                <CardContent className="p-4 md:p-6">
                                    <div className="flex items-center space-x-2 md:space-x-3 mb-3 md:mb-4">
                                        <div className={`w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center shadow-lg animate-scale-in flex-shrink-0 ${
                                            isDark 
                                                ? 'bg-[#8b5cf6]' 
                                                : 'bg-gradient-to-br from-purple-400 to-purple-600'
                                        }`}>
                                            <Heart className="w-5 h-5 md:w-6 md:h-6 text-white" />
                                        </div>
                                        <h3 className={`text-base md:text-lg font-semibold ${
                                            isDark ? 'text-white' : 'text-gray-800'
                                        }`}>Today's Fitness Tip</h3>
                                    </div>
                                    <div className={`backdrop-blur-sm rounded-2xl p-3 md:p-4 shadow-lg ${
                                        isDark 
                                            ? 'bg-[#3a3a3a] border border-[#8b5cf6]/20' 
                                            : 'bg-clay-100/40'
                                    }`}>
                                        <div className="flex items-start space-x-2 md:space-x-3">
                                            <div className={`w-5 h-5 md:w-6 md:h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 shadow-lg ${
                                                isDark 
                                                    ? 'bg-green-600' 
                                                    : 'bg-gradient-to-br from-green-400 to-green-600'
                                            }`}>
                                                <CheckCircle className="w-3 h-3 md:w-4 md:h-4 text-white" />
                                            </div>
                                            <p className={`text-sm md:text-base ${
                                                isDark ? 'text-gray-400' : 'text-gray-700'
                                            }`}>{randomTip.text}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}                    {/* Goals Cards */}
                    <motion.div 
                        className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.5 }}
                    >
                        <Card className={`backdrop-blur-sm border-0 hover:shadow-lg transition-all duration-300 rounded-3xl ${
                            isDark 
                                ? 'bg-[#2a2a2a] border border-[#3a3a3a]' 
                                : 'bg-clay-100/70 shadow-clayStrong hover:shadow-xl'
                        }`}>
                            <CardContent className="p-4 md:p-6">
                                <div className="flex items-center space-x-2 md:space-x-3 mb-3 md:mb-4">
                                    <div className={`w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0 ${
                                        isDark 
                                            ? 'bg-[#8b5cf6]/80' 
                                            : 'bg-gradient-to-br from-purple-100 to-purple-200'
                                    }`}>
                                        <Heart className={`w-5 h-5 md:w-6 md:h-6 ${
                                            isDark ? 'text-[#8b5cf6]' : 'text-purple-600'
                                        }`} />
                                    </div>
                                    <h3 className={`text-sm md:text-base font-semibold ${
                                        isDark ? 'text-white' : 'text-gray-800'
                                    }`}>Sleep Goals</h3>
                                </div>
                                <div className={`backdrop-blur-sm rounded-2xl p-3 md:p-4 shadow-lg ${
                                    isDark 
                                        ? 'bg-[#3a3a3a] border border-[#8b5cf6]/20' 
                                        : 'bg-clay-100/40'
                                }`}>
                                    <div className="space-y-2">
                                        <div className="flex items-center space-x-2">
                                            <div className={`w-3 h-3 rounded-full flex-shrink-0 ${isDark ? 'bg-[#8b5cf6]' : 'bg-purple-400'}`}></div>
                                            <span className={`text-xs md:text-sm ${
                                                isDark ? 'text-gray-400' : 'text-gray-700'
                                            }`}>Target: 7-9 hours</span>
                                        </div>
                                        <p className={`text-xs ${
                                            isDark ? 'text-gray-400' : 'text-gray-500'
                                        }`}>Quality sleep supports recovery and metabolism</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className={`backdrop-blur-sm border-0 hover:shadow-lg transition-all duration-300 rounded-3xl ${
                            isDark 
                                ? 'bg-[#2a2a2a] border border-[#3a3a3a]' 
                                : 'bg-clay-100/70 shadow-clayStrong hover:shadow-xl'
                        }`}>
                            <CardContent className="p-4 md:p-6">
                                <div className="flex items-center space-x-2 md:space-x-3 mb-3 md:mb-4">
                                    <div className={`w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0 ${
                                        isDark 
                                            ? 'bg-blue-600/80' 
                                            : 'bg-gradient-to-br from-blue-100 to-blue-200'
                                    }`}>
                                        <Zap className={`w-5 h-5 md:w-6 md:h-6 ${
                                            isDark ? 'text-blue-400' : 'text-blue-600'
                                        }`} />
                                    </div>
                                    <h3 className={`text-sm md:text-base font-semibold ${
                                        isDark ? 'text-white' : 'text-gray-800'
                                    }`}>Hydration</h3>
                                </div>
                                <div className={`backdrop-blur-sm rounded-2xl p-3 md:p-4 shadow-lg ${
                                    isDark 
                                        ? 'bg-[#3a3a3a] border border-[#8b5cf6]/20' 
                                        : 'bg-clay-100/40'
                                }`}>
                                    <div className="space-y-2">
                                        <div className="flex items-center space-x-2">
                                            <div className={`w-3 h-3 rounded-full flex-shrink-0 ${isDark ? 'bg-blue-400' : 'bg-blue-400'}`}></div>
                                            <span className={`text-xs md:text-sm ${
                                                isDark ? 'text-gray-400' : 'text-gray-700'
                                            }`}>Target: 3L daily</span>
                                        </div>
                                        <p className={`text-xs ${
                                            isDark ? 'text-gray-400' : 'text-gray-500'
                                        }`}>Stay hydrated for optimal performance</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
