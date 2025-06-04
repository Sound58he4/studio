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
import { Flame, Dumbbell, TrendingUp, AlertCircle, Star, Trophy, Activity, Clock, Zap } from 'lucide-react';
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

                {/* This Week's Activity */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.3 }}
                >
                    <Card className="border border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-card/80">
                        <CardHeader>
                            <CardTitle className="text-xl font-semibold text-blue-700 dark:text-blue-400 flex items-center gap-2">
                                <TrendingUp size={22} />
                                This Week's Activity
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                            {weeklyActivitySummary ? (
                                <>
                                    {[
                                        { icon: Dumbbell, color: "blue", label: "Total Workouts", value: weeklyActivitySummary.totalWorkouts },
                                        { icon: Flame, color: "orange", label: "Calories Burned", value: `${weeklyActivitySummary.totalCaloriesBurned} kcal` },
                                        { icon: Activity, color: "green", label: "Strength Workouts", value: weeklyActivitySummary.strengthWorkouts },
                                        { icon: Zap, color: "purple", label: "Cardio Workouts", value: weeklyActivitySummary.cardioWorkouts }
                                    ].map((item, index) => (
                                        <div key={item.label} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border">
                                            <item.icon className={cn(
                                                "h-6 w-6",
                                                item.color === "blue" && "text-blue-500",
                                                item.color === "orange" && "text-orange-500",
                                                item.color === "green" && "text-green-500",
                                                item.color === "purple" && "text-purple-500"
                                            )} />
                                            <div>
                                                <p className="text-muted-foreground">{item.label}</p>
                                                <p className="font-bold text-lg">{item.value}</p>
                                            </div>
                                        </div>
                                    ))}
                                </>
                            ) : (
                                <p className="text-muted-foreground italic col-span-full text-center py-4">
                                    No workout data for this week yet.
                                </p>
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
