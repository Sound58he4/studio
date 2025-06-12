// src/app/overview/page.tsx
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import DashboardProfileHeader from '@/components/dashboard/DashboardProfileHeader';
import { StoredUserProfile, StoredExerciseLogEntry } from '@/app/dashboard/types';
import { getOverviewData } from '@/services/firestore/overviewService';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { Flame, Dumbbell, TrendingUp, AlertCircle, Star, Trophy, Activity, Clock, Zap, ClipboardList } from 'lucide-react';
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

    useEffect(() => { setIsClient(true); }, []);

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
        };
    }, [userProfile]);

    if (isLoading || authLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
                <div className="max-w-4xl mx-auto p-4 md:p-6 lg:p-8 space-y-6">
                    {/* Simplified Profile Header Skeleton */}
                    <Card className="bg-card/80 border-border/50">
                        <CardHeader>
                            <div className="flex items-center gap-4">
                                <Skeleton className="h-20 w-20 sm:h-24 sm:w-24 rounded-full" />
                                <div className="space-y-2">
                                    <Skeleton className="h-6 w-48" />
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-4 w-24" />
                                </div>
                            </div>
                        </CardHeader>
                    </Card>

                    {/* Simplified Stats Cards Skeleton */}
                    <Card className="bg-card/80 border-border/50">
                        <CardHeader>
                            <Skeleton className="h-6 w-1/2" />
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 gap-4">
                            {[...Array(4)].map((_, i) => (
                                <Skeleton key={i} className="h-16 w-full rounded-lg" />
                            ))}
                        </CardContent>
                    </Card>

                    {/* Additional Cards Skeleton */}
                    {[...Array(3)].map((_, i) => (
                        <Card key={i} className="bg-card/80 border-border/50">
                            <CardHeader>
                                <Skeleton className="h-6 w-3/4" />
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-3/4" />
                                    <Skeleton className="h-4 w-1/2" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
                <div className="max-w-xl mx-auto my-10 p-4 text-center">
                    <Card className="border-destructive bg-card/80">
                        <CardHeader>
                            <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
                            <CardTitle className="text-destructive">Error Loading Overview</CardTitle>
                            <CardDescription>{error}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button onClick={fetchData} variant="outline">
                                Try Again
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }
    
    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
            <div className="max-w-sm sm:max-w-md md:max-w-2xl lg:max-w-4xl mx-auto px-4 py-4 sm:p-4 md:p-6 lg:p-8 space-y-4 sm:space-y-6 pb-20 sm:pb-8">
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <h1 className="text-2xl sm:text-3xl font-bold text-primary tracking-tight text-center sm:text-left">
                        Activity Overview
                    </h1>
                </motion.div>

                {profileHeaderData && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                    >
                        <Card className="bg-card/80 border-border/50">
                            <CardHeader className="pb-4">
                                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                                    <div className="relative">
                                        <img
                                            src={profileHeaderData.photoURL}
                                            alt={`${profileHeaderData.displayName}'s profile`}
                                            className="h-20 w-20 sm:h-24 sm:w-24 rounded-full object-cover border-4 border-primary/20"
                                            onError={(e) => {
                                                e.currentTarget.src = `https://placehold.co/80x80.png?text=${profileHeaderData.displayName.charAt(0)}`;
                                            }}
                                        />
                                        <div className="absolute -bottom-1 -right-1 h-6 w-6 bg-green-500 rounded-full border-2 border-background" />
                                    </div>
                                    <div className="space-y-1 text-center sm:text-left flex-1">
                                        <h2 className="text-xl sm:text-2xl font-bold text-primary">
                                            {profileHeaderData.displayName}
                                        </h2>
                                        <p className="text-sm sm:text-base text-muted-foreground">
                                            Welcome to your fitness journey!
                                        </p>
                                        <div className="flex items-center justify-center sm:justify-start gap-2 text-xs sm:text-sm text-muted-foreground">
                                            <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                                            <span>Last active: Today</span>
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>
                        </Card>
                    </motion.div>
                )}

                {/* Today's Points */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                >
                    <Card className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/30">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg font-semibold text-yellow-700 dark:text-yellow-400 flex items-center gap-2">
                                <Star className="h-5 w-5 text-yellow-500" />
                                Today's Points
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {pointsData ? (
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                                            {pointsData.todayPoints}<span className="text-lg text-muted-foreground">/100</span>
                                        </p>
                                        <p className="text-sm text-muted-foreground">Points earned today</p>
                                    </div>
                                    <div className="text-right space-y-1">
                                        <div className="flex items-center gap-1">
                                            <Trophy className="h-5 w-5 text-orange-500" />
                                            <span className="text-sm font-medium text-muted-foreground">Total Points</span>
                                        </div>
                                        <p className="text-xl font-semibold text-orange-600 dark:text-orange-400">
                                            {pointsData.totalPoints.toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                                            0<span className="text-lg text-muted-foreground">/100</span>
                                        </p>
                                        <p className="text-sm text-muted-foreground">Points earned today</p>
                                    </div>
                                    <div className="text-right space-y-1">
                                        <div className="flex items-center gap-1">
                                            <Trophy className="h-5 w-5 text-orange-500" />
                                            <span className="text-sm font-medium text-muted-foreground">Total Points</span>
                                        </div>
                                        <p className="text-xl font-semibold text-orange-600 dark:text-orange-400">0</p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Weekly Progress & Goals */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.3 }}
                >
                    <Card className="border border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-card/80">
                        <CardHeader>
                            <CardTitle className="text-xl font-semibold text-blue-700 dark:text-blue-400 flex items-center gap-2">
                                <TrendingUp size={22} />
                                Weekly Progress
                            </CardTitle>
                            <CardDescription>
                                Track your consistency and goal progress
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {weeklyActivitySummary ? (
                                <>
                                    {/* Progress Highlights */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {/* Weekly Goal Progress */}
                                        <div className="p-4 bg-gradient-to-r from-emerald-50/80 to-green-50/80 dark:from-emerald-900/20 dark:to-green-900/20 rounded-lg border border-emerald-200/50 dark:border-emerald-800/50">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Trophy className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                                <span className="font-semibold text-emerald-700 dark:text-emerald-300">Weekly Goals</span>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-muted-foreground">Workouts</span>
                                                    <span className="font-medium">{weeklyActivitySummary.totalWorkouts}/5</span>
                                                </div>
                                                <div className="w-full bg-muted/50 rounded-full h-2">
                                                    <div 
                                                        className="bg-gradient-to-r from-emerald-500 to-green-500 h-2 rounded-full transition-all duration-500"
                                                        style={{ width: `${Math.min(100, (weeklyActivitySummary.totalWorkouts / 5) * 100)}%` }}
                                                    />
                                                </div>
                                                {weeklyActivitySummary.totalWorkouts >= 5 ? (
                                                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">🎉 Weekly goal achieved!</p>
                                                ) : (
                                                    <p className="text-xs text-muted-foreground">{5 - weeklyActivitySummary.totalWorkouts} more to reach weekly goal</p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Activity Streak */}
                                        <div className="p-4 bg-gradient-to-r from-orange-50/80 to-amber-50/80 dark:from-orange-900/20 dark:to-amber-900/20 rounded-lg border border-orange-200/50 dark:border-orange-800/50">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Flame className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                                                <span className="font-semibold text-orange-700 dark:text-orange-300">Activity Streak</span>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                                                        {weeklyActivitySummary.totalWorkouts > 0 ? Math.min(weeklyActivitySummary.totalWorkouts, 7) : 0}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">days this week</span>
                                                </div>
                                                {weeklyActivitySummary.totalWorkouts > 0 ? (
                                                    <p className="text-xs text-orange-600 dark:text-orange-400 font-medium">Keep the momentum going! 🔥</p>
                                                ) : (
                                                    <p className="text-xs text-muted-foreground">Start today to build your streak</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Quick Stats */}
                                    <div className="border-t pt-4">
                                        <h4 className="font-medium text-sm text-muted-foreground mb-3">Quick Stats</h4>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                            <div className="text-center p-2 bg-muted/30 rounded-lg">
                                                <p className="text-lg font-bold text-primary">{weeklyActivitySummary.totalCaloriesBurned}</p>
                                                <p className="text-xs text-muted-foreground">Calories burned</p>
                                            </div>
                                            <div className="text-center p-2 bg-muted/30 rounded-lg">
                                                <p className="text-lg font-bold text-blue-600">{weeklyActivitySummary.strengthWorkouts}</p>
                                                <p className="text-xs text-muted-foreground">Strength sessions</p>
                                            </div>
                                            <div className="text-center p-2 bg-muted/30 rounded-lg">
                                                <p className="text-lg font-bold text-purple-600">{weeklyActivitySummary.cardioWorkouts}</p>
                                                <p className="text-xs text-muted-foreground">Cardio sessions</p>
                                            </div>
                                            <div className="text-center p-2 bg-muted/30 rounded-lg">
                                                <p className="text-lg font-bold text-green-600">
                                                    {weeklyActivitySummary.totalWorkouts > 0 ? 
                                                        Math.round(weeklyActivitySummary.totalCaloriesBurned / weeklyActivitySummary.totalWorkouts) : 0}
                                                </p>
                                                <p className="text-xs text-muted-foreground">Avg per workout</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Next Actions */}
                                    <div className="border-t pt-4">
                                        <h4 className="font-medium text-sm text-muted-foreground mb-3">Recommended Actions</h4>
                                        <div className="space-y-2">
                                            {weeklyActivitySummary.totalWorkouts < 3 && (
                                                <div className="flex items-center gap-2 text-sm p-2 bg-blue-50/50 dark:bg-blue-900/20 rounded border border-blue-200/50 dark:border-blue-800/50">
                                                    <Dumbbell className="h-4 w-4 text-blue-600" />
                                                    <span className="text-blue-700 dark:text-blue-300">Focus on consistency - aim for at least 3 workouts this week</span>
                                                </div>
                                            )}
                                            {weeklyActivitySummary.strengthWorkouts === 0 && weeklyActivitySummary.totalWorkouts > 0 && (
                                                <div className="flex items-center gap-2 text-sm p-2 bg-purple-50/50 dark:bg-purple-900/20 rounded border border-purple-200/50 dark:border-purple-800/50">
                                                    <Activity className="h-4 w-4 text-purple-600" />
                                                    <span className="text-purple-700 dark:text-purple-300">Add strength training to your routine for balanced fitness</span>
                                                </div>
                                            )}
                                            {weeklyActivitySummary.totalWorkouts >= 5 && (
                                                <div className="flex items-center gap-2 text-sm p-2 bg-green-50/50 dark:bg-green-900/20 rounded border border-green-200/50 dark:border-green-800/50">
                                                    <Star className="h-4 w-4 text-green-600" />
                                                    <span className="text-green-700 dark:text-green-300">Excellent work! Consider adding recovery or flexibility sessions</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-8">
                                    <Activity className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                                    <h3 className="font-medium text-muted-foreground mb-2">No activity logged this week</h3>
                                    <p className="text-sm text-muted-foreground mb-4">Start your fitness journey by logging your first workout!</p>
                                    <div className="flex flex-col sm:flex-row gap-2 justify-center">
                                        <Button 
                                            size="sm" 
                                            onClick={() => router.push('/log')}
                                            className="gap-2"
                                        >
                                            <Dumbbell className="h-4 w-4" />
                                            Log Workout
                                        </Button>
                                        <Button 
                                            size="sm" 
                                            variant="outline"
                                            onClick={() => router.push('/workout-plans')}
                                            className="gap-2"
                                        >
                                            <ClipboardList className="h-4 w-4" />
                                            View Plans
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Health Tips and Goals Section */}
                <motion.div 
                    className="space-y-4 sm:space-y-6"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.4 }}
                >
                    {randomTip && (
                        <div>
                            <FitnessTip tip={randomTip} />
                        </div>
                    )}
                    
                    {/* Sleep Goals and Hydration - Ensure proper spacing for mobile */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                        <div className="w-full">
                            <SleepGoals />
                        </div>
                        <div className="w-full">
                            <WaterIntakeTip />
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
