// src/app/points/page.tsx
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Trophy, 
  TrendingUp, 
  Calendar, 
  Target, 
  Apple, 
  Zap, 
  Award,
  AlertCircle,
  Minus
} from 'lucide-react';
import { getUserProfile, getFoodLogs } from '@/services/firestore';
import { StoredUserProfile, StoredFoodLogEntry } from '@/app/dashboard/types';
import { db } from '@/lib/firebase/exports';
import { 
  doc, getDoc, setDoc, writeBatch, collection, 
  query, where, orderBy, limit, getDocs, runTransaction,
  serverTimestamp, increment
} from 'firebase/firestore';
import { createFirestoreServiceError } from '@/services/firestore/utils';
import { startOfDay, endOfDay, format } from 'date-fns';
import { cn } from '@/lib/utils';
import { fadeInVariants, staggerContainer, optimizedSlideVariants } from '@/lib/animations';
import { usePerformanceMonitor, useFirebasePerformance } from '@/hooks/use-performance';

interface PointsData {
  todayPoints: number;
  totalPoints: number;
  lastUpdated: string;
}

interface DailyNutritionTargets {
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
}

interface TodayProgress {
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
}

// Points service functions - integrated directly into points page
const pointsCache = new Map<string, { data: PointsData; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const getUserPointsData = async (userId: string): Promise<PointsData | null> => {
  if (!userId) throw createFirestoreServiceError("User ID is required to get points.", "invalid-argument");

  // Check cache first
  const cached = pointsCache.get(userId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`[Points Service] Cache hit for user: ${userId}`);
    return cached.data;
  }

  console.log(`[Points Service] Fetching points for user: ${userId}`);
  
  try {
    const pointsDocRef = doc(db, 'users', userId, 'points', 'current');
    const pointsSnap = await getDoc(pointsDocRef);
    
    if (pointsSnap.exists()) {
      const pointsData = pointsSnap.data() as PointsData;
      
      // Update cache
      pointsCache.set(userId, {
        data: pointsData,
        timestamp: Date.now()
      });
      
      console.log(`[Points Service] Points found for user ${userId}:`, pointsData);
      return pointsData;
    } else {
      console.log(`[Points Service] No points data found for user ${userId}`);
      return null;
    }
  } catch (error: any) {
    console.error("[Points Service] Error fetching user points:", error);
    throw createFirestoreServiceError(`Failed to fetch user points. Reason: ${error.message}`, "fetch-failed");
  }
};

const updateUserPointsData = async (userId: string, pointsData: PointsData): Promise<void> => {
  if (!userId) throw createFirestoreServiceError("User ID is required to update points.", "invalid-argument");

  console.log(`[Points Service] Updating points for user: ${userId}`, pointsData);
  
  try {
    const pointsDocRef = doc(db, 'users', userId, 'points', 'current');
    await setDoc(pointsDocRef, pointsData, { merge: true });
    
    // Update cache
    pointsCache.set(userId, {
      data: pointsData,
      timestamp: Date.now()
    });
    
    console.log(`[Points Service] Points updated successfully for user: ${userId}`);
  } catch (error: any) {
    console.error("[Points Service] Error updating user points:", error);
    throw createFirestoreServiceError(`Failed to update user points. Reason: ${error.message}`, "update-failed");
  }
};

// Helper functions for unhealthy food detection
const countUnhealthyFoods = (foodLogs: StoredFoodLogEntry[]): number => {
  const unhealthyKeywords = [
    'fried', 'deep fried', 'chips', 'fries', 'burger', 'pizza', 'soda', 'soft drink',
    'candy', 'chocolate', 'ice cream', 'cake', 'cookies', 'donuts', 'pastry',
    'fast food', 'junk food', 'processed', 'instant noodles', 'energy drink'
  ];
  
  return foodLogs.filter(log => {
    const foodName = log.foodItem.toLowerCase();
    return unhealthyKeywords.some(keyword => foodName.includes(keyword));
  }).length;
};

const calculateUnhealthyFoodPenalty = (unhealthyCount: number): number => {
  // Progressive penalty: 1 item = -2 points, 2 items = -5 points, 3+ items = -10 points
  if (unhealthyCount >= 3) return 10;
  if (unhealthyCount === 2) return 5;
  if (unhealthyCount === 1) return 2;
  return 0;
};

export default function PointsPage() {
  const { userId, loading: authLoading } = useAuth();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<StoredUserProfile | null>(null);
  const [pointsData, setPointsData] = useState<PointsData | null>(null);  const [todayProgress, setTodayProgress] = useState<TodayProgress | null>(null);
  const [todayFoodLogs, setTodayFoodLogs] = useState<StoredFoodLogEntry[]>([]);
  const [dailyTargets, setDailyTargets] = useState<DailyNutritionTargets | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);  const calculatePointsFromProgress = useCallback((progress: TodayProgress, targets: DailyNutritionTargets, foodLogs: StoredFoodLogEntry[]): number => {
    let points = 0;

    // Calculate percentage achievements
    const caloriesPercent = targets.calories > 0 ? (progress.calories / targets.calories) * 100 : 0;
    const proteinPercent = targets.protein > 0 ? (progress.protein / targets.protein) * 100 : 0;
    const carbsPercent = targets.carbohydrates > 0 ? (progress.carbohydrates / targets.carbohydrates) * 100 : 0;
    const fatPercent = targets.fat > 0 ? (progress.fat / targets.fat) * 100 : 0;

    // Progressive points system for each nutrient
    // Calories: 25%=7pts, 50%=15pts, 75%=22pts, 100%=30pts
    if (caloriesPercent >= 25) points += 7;
    if (caloriesPercent >= 50) points += 8; // 15 total
    if (caloriesPercent >= 75) points += 7; // 22 total
    if (caloriesPercent >= 100) points += 8; // 30 total

    // Protein: 25%=6pts, 50%=12pts, 75%=18pts, 100%=25pts
    if (proteinPercent >= 25) points += 6;
    if (proteinPercent >= 50) points += 6; // 12 total
    if (proteinPercent >= 75) points += 6; // 18 total
    if (proteinPercent >= 100) points += 7; // 25 total

    // Carbs: 25%=4pts, 50%=8pts, 75%=11pts, 100%=15pts
    if (carbsPercent >= 25) points += 4;
    if (carbsPercent >= 50) points += 4; // 8 total
    if (carbsPercent >= 75) points += 3; // 11 total
    if (carbsPercent >= 100) points += 4; // 15 total

    // Fat: 25%=3pts, 50%=5pts, 75%=7pts, 100%=10pts
    if (fatPercent >= 25) points += 3;
    if (fatPercent >= 50) points += 2; // 5 total
    if (fatPercent >= 75) points += 2; // 7 total
    if (fatPercent >= 100) points += 3; // 10 total

    // Bonus points for meeting all goals (healthy eating)
    if (caloriesPercent >= 100 && proteinPercent >= 100 && carbsPercent >= 100 && fatPercent >= 100) {
      points += 10;
    }

    // Calculate unhealthy food penalty
    const unhealthyFoodCount = countUnhealthyFoods(foodLogs);
    const penalty = calculateUnhealthyFoodPenalty(unhealthyFoodCount);
    points -= penalty;

    return Math.max(0, Math.min(points, 100)); // Ensure points are between 0 and 100
  }, []);

  // Memoized calculation for points to prevent unnecessary recalculations
  const calculatedPoints = useMemo(() => {
    if (!todayProgress || !dailyTargets || !todayFoodLogs) return 0;
    return calculatePointsFromProgress(todayProgress, dailyTargets, todayFoodLogs);
  }, [todayProgress, dailyTargets, todayFoodLogs, calculatePointsFromProgress]);

  // Memoized points breakdown to prevent unnecessary recalculations
  const pointsBreakdown = useMemo(() => {
    if (!todayProgress || !dailyTargets) return [];

    const caloriesPercent = dailyTargets.calories > 0 ? (todayProgress.calories / dailyTargets.calories) * 100 : 0;
    const proteinPercent = dailyTargets.protein > 0 ? (todayProgress.protein / dailyTargets.protein) * 100 : 0;
    const carbsPercent = dailyTargets.carbohydrates > 0 ? (todayProgress.carbohydrates / dailyTargets.carbohydrates) * 100 : 0;
    const fatPercent = dailyTargets.fat > 0 ? (todayProgress.fat / dailyTargets.fat) * 100 : 0;

    const getPointsForGoal = (percent: number, maxPoints: number) => {
      if (percent >= 100) return maxPoints;
      if (percent >= 75) return Math.round(maxPoints * 0.75);
      if (percent >= 50) return Math.round(maxPoints * 0.5);
      if (percent >= 25) return Math.round(maxPoints * 0.25);
      return 0;
    };

    const unhealthyFoodCount = countUnhealthyFoods(todayFoodLogs);
    const penalty = calculateUnhealthyFoodPenalty(unhealthyFoodCount);    return [
      {
        name: 'Calories',
        points: getPointsForGoal(caloriesPercent, 30),
        maxPoints: 30,
        percentage: Math.min(caloriesPercent, 100),
        icon: Zap,
        color: 'text-orange-500',
        bgColor: 'bg-orange-500',
      },
      {
        name: 'Protein',
        points: getPointsForGoal(proteinPercent, 25),
        maxPoints: 25,
        percentage: Math.min(proteinPercent, 100),
        icon: Target,
        color: 'text-blue-500',
        bgColor: 'bg-blue-500',
      },
      {
        name: 'Carbs',
        points: getPointsForGoal(carbsPercent, 15),
        maxPoints: 15,
        percentage: Math.min(carbsPercent, 100),
        icon: Apple,
        color: 'text-green-500',
        bgColor: 'bg-green-500',
      },
      {
        name: 'Fat',
        points: getPointsForGoal(fatPercent, 10),
        maxPoints: 10,
        percentage: Math.min(fatPercent, 100),
        icon: TrendingUp,
        color: 'text-purple-500',
        bgColor: 'bg-purple-500',
      },
      ...(penalty > 0 ? [{
        name: 'Unhealthy Food Penalty',
        points: -penalty,
        maxPoints: 0,
        percentage: 0,
        icon: Minus,
        color: 'text-red-500',
      }] : []),
    ];
  }, [todayProgress, dailyTargets, todayFoodLogs]);

  const fetchData = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const todayStart = startOfDay(new Date());
      const todayEnd = endOfDay(new Date());      const [profileData, todayFoodLogs, existingPoints] = await Promise.all([
        getUserProfile(userId),
        getFoodLogs(userId, todayStart, todayEnd),
        getUserPointsData(userId),
      ]);

      setUserProfile(profileData);
      setTodayFoodLogs(todayFoodLogs);
      
      // Calculate today's nutrition progress
      const todayNutrition = todayFoodLogs.reduce(
        (totals: TodayProgress, log: StoredFoodLogEntry) => ({
          calories: totals.calories + log.calories,
          protein: totals.protein + log.protein,
          carbohydrates: totals.carbohydrates + log.carbohydrates,
          fat: totals.fat + log.fat,
        }),
        { calories: 0, protein: 0, carbohydrates: 0, fat: 0 }
      );

      setTodayProgress(todayNutrition);      // Use profile's daily targets (this would come from your existing target calculation)
      const targets: DailyNutritionTargets = {
        calories: profileData?.targetCalories || 2000,
        protein: profileData?.targetProtein || 150,
        carbohydrates: profileData?.targetCarbs || 250,
        fat: profileData?.targetFat || 65,
      };      setDailyTargets(targets);

      // Get existing points or initialize
      let currentPointsData = existingPoints || { todayPoints: 0, totalPoints: 0, lastUpdated: format(new Date(), 'yyyy-MM-dd') };

      // Check if we need to update today's points
      const today = format(new Date(), 'yyyy-MM-dd');
      if (currentPointsData.lastUpdated !== today) {
        // New day - reset today's points and add previous day's points to total
        currentPointsData = {
          todayPoints: 0, // Will be calculated by useMemo after state updates
          totalPoints: currentPointsData.totalPoints + currentPointsData.todayPoints,
          lastUpdated: today,
        };
      }

      setPointsData(currentPointsData);

    } catch (err: any) {
      console.error("[Points Page] Error fetching data:", err);
      setError("Could not load points data. " + err.message);
    } finally {
      setIsLoading(false);
    }
  }, [userId, calculatePointsFromProgress]);
  useEffect(() => {
    if (!authLoading && userId) {
      fetchData();
    } else if (!authLoading && !userId) {
      router.replace('/authorize');
    }
  }, [authLoading, userId, fetchData, router]);

  // Update points when calculated value changes
  useEffect(() => {
    if (pointsData && userId && calculatedPoints !== pointsData.todayPoints) {
      const updatedPointsData = {
        ...pointsData,
        todayPoints: calculatedPoints,
      };
      setPointsData(updatedPointsData);      // Debounced update to Firebase to avoid excessive writes
      const timeoutId = setTimeout(() => {
        updateUserPointsData(userId, updatedPointsData).catch(console.error);
      }, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [calculatedPoints, pointsData, userId]);

  const getPointsBreakdown = () => {
    if (!todayProgress || !dailyTargets) return [];

    const caloriesPercent = dailyTargets.calories > 0 ? (todayProgress.calories / dailyTargets.calories) * 100 : 0;
    const proteinPercent = dailyTargets.protein > 0 ? (todayProgress.protein / dailyTargets.protein) * 100 : 0;
    const carbsPercent = dailyTargets.carbohydrates > 0 ? (todayProgress.carbohydrates / dailyTargets.carbohydrates) * 100 : 0;
    const fatPercent = dailyTargets.fat > 0 ? (todayProgress.fat / dailyTargets.fat) * 100 : 0;

    // Simplified points calculation - easier to understand
    const getPointsForGoal = (percent: number, maxPoints: number) => {
      if (percent >= 100) return maxPoints;
      if (percent >= 75) return Math.round(maxPoints * 0.75);
      if (percent >= 50) return Math.round(maxPoints * 0.5);
      if (percent >= 25) return Math.round(maxPoints * 0.25);
      return 0;
    };

    // Calculate unhealthy food penalty
    const unhealthyFoodCount = countUnhealthyFoods(todayFoodLogs);
    const penalty = calculateUnhealthyFoodPenalty(unhealthyFoodCount);

    const breakdown = [
      {
        label: 'Calories',
        achieved: caloriesPercent >= 100,
        points: getPointsForGoal(caloriesPercent, 30),
        maxPoints: 30,
        progress: caloriesPercent,
        current: Math.round(todayProgress.calories),
        target: dailyTargets.calories,
        unit: 'kcal',
        icon: Zap,
        color: 'text-orange-500',
        bgColor: 'bg-orange-500'
      },
      {
        label: 'Protein',
        achieved: proteinPercent >= 100,
        points: getPointsForGoal(proteinPercent, 25),
        maxPoints: 25,
        progress: proteinPercent,
        current: Math.round(todayProgress.protein),
        target: dailyTargets.protein,
        unit: 'g',
        icon: Target,
        color: 'text-blue-500',
        bgColor: 'bg-blue-500'
      },
      {
        label: 'Carbs',
        achieved: carbsPercent >= 100,
        points: getPointsForGoal(carbsPercent, 15),
        maxPoints: 15,
        progress: carbsPercent,
        current: Math.round(todayProgress.carbohydrates),
        target: dailyTargets.carbohydrates,
        unit: 'g',
        icon: Apple,
        color: 'text-green-500',
        bgColor: 'bg-green-500'
      },
      {
        label: 'Fat',
        achieved: fatPercent >= 100,
        points: getPointsForGoal(fatPercent, 10),
        maxPoints: 10,
        progress: fatPercent,
        current: Math.round(todayProgress.fat),
        target: dailyTargets.fat,
        unit: 'g',
        icon: TrendingUp,
        color: 'text-purple-500',
        bgColor: 'bg-purple-500'
      },
    ];

    // Add penalty section if there are unhealthy foods
    if (unhealthyFoodCount > 0) {
      breakdown.push({
        label: 'Unhealthy Foods',
        achieved: false,
        points: -penalty,
        maxPoints: 0,
        progress: 0,
        current: unhealthyFoodCount,
        target: 0,
        unit: 'items',
        icon: Minus,
        color: 'text-red-500',
        bgColor: 'bg-red-500'
      });
    }

    return breakdown;
  };

  if (isLoading || authLoading) {
    return (
      <div className="max-w-4xl mx-auto p-4 md:p-6 lg:p-8 space-y-6 animate-pulse">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-16 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-16 w-full" />
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex items-center justify-between">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto my-10 p-4 text-center">
        <Card className="border-destructive">
          <CardHeader>
            <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
            <CardTitle className="text-destructive">Error Loading Points</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={fetchData} variant="outline">Try Again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const breakdown = getPointsBreakdown();
  const totalPossibleToday = 100;
  const achievedAllGoals = breakdown.every(item => item.achieved);
  return (
    <motion.div 
      className="max-w-4xl mx-auto p-4 md:p-6 lg:p-8 space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 via-orange-500/5 to-red-500/5 pointer-events-none -z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2 }}
      />
      <motion.div 
        className="space-y-2"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <h1 className="text-3xl font-bold text-primary tracking-tight flex items-center gap-2">
          <Trophy className="h-8 w-8 text-yellow-500" />
          Your Points
        </h1>        <p className="text-muted-foreground">
          Earn up to 100 points daily by achieving your nutrition goals!
        </p>
      </motion.div>      {/* Points Overview Cards */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2, staggerChildren: 0.1 }}
      >
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          whileHover={{ scale: 1.02, y: -2 }}
        >
          <Card className="shadow-lg border border-yellow-500/20 bg-gradient-to-br from-yellow-500/5 to-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-yellow-700 dark:text-yellow-400 flex items-center gap-2">
                <motion.div
                  animate={{ 
                    rotate: [0, 360],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ 
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <Calendar className="h-5 w-5" />
                </motion.div>
                Today's Points
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <motion.span 
                  className="text-3xl font-bold text-yellow-600"
                  animate={{ 
                    scale: [1, 1.05, 1]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  {pointsData?.todayPoints || 0}
                </motion.span>
                <Badge variant={pointsData?.todayPoints === totalPossibleToday ? "default" : "secondary"}>
                  {pointsData?.todayPoints || 0}/{totalPossibleToday}
                </Badge>
              </div>
              <motion.div 
                className="mt-2 w-full bg-gray-200 rounded-full h-2"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 1, delay: 0.5 }}
              >
                <motion.div 
                  className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(((pointsData?.todayPoints || 0) / totalPossibleToday) * 100, 100)}%` }}
                  transition={{ duration: 1.5, delay: 0.7, ease: "easeOut" }}
                />
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          whileHover={{ scale: 1.02, y: -2 }}
        >
          <Card className="shadow-lg border border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-blue-700 dark:text-blue-400 flex items-center gap-2">
                <motion.div
                  animate={{ 
                    y: [0, -3, 0],
                    rotate: [0, 10, 0]
                  }}
                  transition={{ 
                    duration: 2.5,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <Award className="h-5 w-5" />
                </motion.div>
                Total Points
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <motion.span 
                  className="text-3xl font-bold text-blue-600"
                  animate={{ 
                    scale: [1, 1.03, 1]
                  }}
                  transition={{ 
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 1
                  }}
                >
                  {pointsData?.totalPoints || 0}
                </motion.span>
                <Badge variant="outline" className="border-blue-500/50 text-blue-600">
                  All Time
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Keep building your streak!
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>      {/* Today's Progress - Simplified and Enhanced */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
      >
        <Card className="shadow-xl border-0 bg-gradient-to-br from-white via-gray-50/50 to-white dark:from-gray-900 dark:via-gray-800/50 dark:to-gray-900 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10 border-b border-gray-200/50 dark:border-gray-700/50">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <CardTitle className="text-2xl font-bold flex items-center gap-3">
                <motion.div
                  animate={{ 
                    rotate: [0, 10, -10, 0],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ 
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30"
                >
                  <Target className="h-6 w-6 text-blue-600" />
                </motion.div>
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Today's Progress
                </span>
              </CardTitle>
              <p className="text-muted-foreground text-base mt-1">
                Track your nutrition goals and earn points for healthy choices
              </p>
            </motion.div>
          </CardHeader>
          
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {breakdown.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ 
                    duration: 0.5,
                    delay: 0.7 + index * 0.1,
                    type: "spring",
                    stiffness: 300,
                    damping: 25
                  }}
                  whileHover={{ 
                    scale: 1.03,
                    y: -5,
                    transition: { type: "spring", stiffness: 400, damping: 25 }
                  }}
                  className="group relative"
                >
                  <div className="relative p-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-md group-hover:shadow-xl transition-all duration-300 overflow-hidden">
                    
                    {/* Background gradient overlay */}
                    <div className={cn(
                      "absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-300",
                      item.achieved ? "bg-gradient-to-br from-green-400 to-green-600" : `bg-gradient-to-br ${item.bgColor.replace('bg-', 'from-')}-400 to-${item.bgColor.replace('bg-', '')}-600`
                    )} />
                    
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4 relative z-10">
                      <div className="flex items-center gap-3">
                        <motion.div
                          whileHover={{ 
                            rotate: 15,
                            scale: 1.2
                          }}
                          transition={{ type: "spring", stiffness: 300 }}
                          className={cn(
                            "p-2 rounded-lg",
                            item.achieved ? "bg-green-100 dark:bg-green-900/30" : "bg-gray-100 dark:bg-gray-700"
                          )}
                        >
                          <item.icon className={cn(
                            "h-5 w-5",
                            item.achieved ? "text-green-600" : item.color
                          )} />
                        </motion.div>
                        <div>
                          <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                            {item.label}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {item.points < 0 ? `${item.current} ${item.unit}` : `${item.current}/${item.target} ${item.unit}`}
                          </p>
                        </div>
                      </div>
                      
                      <motion.div
                        animate={{ 
                          scale: [1, 1.05, 1]
                        }}
                        transition={{ 
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut",
                          delay: index * 0.3
                        }}
                      >
                        <Badge 
                          variant={item.achieved ? "default" : item.points < 0 ? "destructive" : "secondary"} 
                          className="text-base px-3 py-1 font-bold"
                        >
                          {item.points > 0 ? '+' : ''}{item.points} pts
                        </Badge>
                      </motion.div>
                    </div>
                      {/* Progress Section - Only show for non-penalty items */}
                    {item.points >= 0 && (
                      <div className="space-y-3 relative z-10">
                        {/* Progress Bar */}
                        <div className="relative">
                          <motion.div 
                            className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 border border-gray-300 dark:border-gray-600"
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{ duration: 0.8, delay: 0.8 + index * 0.1 }}
                          >                            <motion.div 
                              className={cn(
                                "h-full rounded-full relative overflow-hidden transition-all duration-1000 shadow-inner",
                                item.achieved ? "bg-green-500" : item.bgColor,
                                // Apply opacity based on progress level
                                !item.achieved && item.progress >= 75 ? "opacity-100" :
                                !item.achieved && item.progress >= 50 ? "opacity-90" :
                                !item.achieved && item.progress >= 25 ? "opacity-80" :
                                !item.achieved && item.progress > 0 ? "opacity-60" : "opacity-40"
                              )}
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.max(Math.min(item.progress, 100), 3)}%` }}
                              transition={{ 
                                duration: 1.5, 
                                delay: 1 + index * 0.1,
                                ease: "easeOut"
                              }}
                            >
                              {/* Animated shine effect */}
                              <motion.div
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                                animate={{ 
                                  x: ['-100%', '100%']
                                }}
                                transition={{ 
                                  duration: 2.5,
                                  repeat: Infinity,
                                  ease: "easeInOut",
                                  delay: 2 + index * 0.2
                                }}
                              />
                            </motion.div>
                          </motion.div>
                          
                          {/* Progress percentage - Made more prominent */}
                          <motion.div 
                            className="absolute right-0 -top-7"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1.5 + index * 0.1 }}
                          >
                            <span className={cn(
                              "text-sm font-bold px-2 py-1 rounded-md",
                              item.achieved ? "text-green-600 bg-green-100 dark:bg-green-900/30" :
                              item.progress >= 50 ? `${item.color} bg-white dark:bg-gray-800 shadow-sm border` :
                              "text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700"
                            )}>
                              {Math.round(item.progress)}%
                            </span>
                          </motion.div>
                        </div>                        
                        {/* Status and Points Info */}
                        <div className="flex items-center justify-between text-sm">
                          <motion.span 
                            className={cn(
                              "font-medium flex items-center gap-1",
                              item.achieved ? "text-green-600" : "text-muted-foreground"
                            )}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1.8 + index * 0.1 }}
                          >
                            {item.achieved ? (
                              <>
                                <span className="text-green-500">✅</span>
                                Goal Achieved!
                              </>
                            ) : (
                              <>
                                <span className={item.color}>📊</span>
                                {Math.round(100 - item.progress)}% to go
                              </>
                            )}
                          </motion.span>
                          
                          <motion.span 
                            className="text-muted-foreground text-xs"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 2 + index * 0.1 }}
                          >
                            Max: {item.maxPoints} pts
                          </motion.span>
                        </div>
                        
                        {/* Current/Target Display */}
                        <motion.div 
                          className="flex items-center justify-between text-xs pt-2 border-t border-gray-200 dark:border-gray-700"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 2.2 + index * 0.1 }}
                        >
                          <span className="font-medium text-foreground">
                            Current: <span className={item.color}>{item.current} {item.unit}</span>
                          </span>
                          <span className="font-medium text-muted-foreground">
                            Target: {item.target} {item.unit}
                          </span>                        </motion.div>
                      </div>
                    )}
                    
                    {/* Penalty Item Display */}
                    {item.points < 0 && (
                      <div className="relative z-10">
                        <motion.div 
                          className="flex items-center justify-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 1.5 + index * 0.1 }}
                        >
                          <span className="text-red-600 text-sm font-medium">
                            Penalty applied for unhealthy choices
                          </span>
                        </motion.div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
              {/* Perfect Day Bonus - Mobile Optimized */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                duration: 0.6, 
                delay: 1.1 + breakdown.length * 0.1
              }}
              whileHover={{ scale: 1.02, y: -2 }}
              className="mt-8"
            >
              <div className={cn(
                "relative overflow-hidden rounded-xl border-2 transition-all duration-500",
                "p-4 sm:p-6", // Responsive padding
                achievedAllGoals 
                  ? "bg-gradient-to-r from-green-50 via-emerald-50 to-green-50 border-green-300 dark:from-green-900/20 dark:via-emerald-900/20 dark:to-green-900/20 dark:border-green-700 shadow-lg shadow-green-200/50 dark:shadow-green-900/20" 
                  : "bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200 dark:from-gray-800 dark:to-gray-700 dark:border-gray-600"
              )}>
                
                {/* Celebration effects for completed bonus */}
                {achievedAllGoals && (
                  <>
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-green-400/10 via-emerald-400/10 to-green-400/10"
                      animate={{ 
                        opacity: [0.5, 1, 0.5]
                      }}
                      transition={{ 
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                    {/* Floating sparkles - fewer on mobile */}
                    {[...Array(4)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute w-1.5 h-1.5 sm:w-2 sm:h-2 bg-yellow-400 rounded-full"
                        style={{
                          left: `${25 + i * 15}%`,
                          top: `${30 + (i % 2) * 40}%`,
                        }}
                        animate={{
                          y: [-8, -20, -8],
                          opacity: [0, 1, 0],
                          scale: [0.5, 1, 0.5],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          delay: i * 0.4,
                          ease: "easeInOut"
                        }}
                      />
                    ))}
                  </>
                )}
                
                {/* Mobile-first layout: stacked on small screens, side-by-side on larger */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-10">
                  
                  {/* Left side: Icon and content */}
                  <div className="flex items-center gap-3 sm:gap-4">
                    <motion.div
                      animate={{ 
                        rotate: achievedAllGoals ? [0, 360] : 0,
                        scale: achievedAllGoals ? [1, 1.2, 1] : 1
                      }}
                      transition={{ 
                        duration: achievedAllGoals ? 3 : 0,
                        repeat: achievedAllGoals ? Infinity : 0,
                        ease: "easeInOut"
                      }}
                      className={cn(
                        "p-2 sm:p-3 rounded-full flex-shrink-0",
                        achievedAllGoals 
                          ? "bg-yellow-100 dark:bg-yellow-900/30" 
                          : "bg-gray-100 dark:bg-gray-700"
                      )}
                    >
                      <Trophy className={cn(
                        "h-5 w-5 sm:h-7 sm:w-7", 
                        achievedAllGoals ? "text-yellow-600" : "text-gray-400"
                      )} />
                    </motion.div>
                    
                    <div className="min-w-0 flex-1">
                      <h3 className={cn(
                        "font-bold text-lg sm:text-xl leading-tight",
                        achievedAllGoals ? "text-green-700 dark:text-green-400" : "text-gray-700 dark:text-gray-300"
                      )}>
                        Perfect Day Bonus
                      </h3>
                      <p className={cn(
                        "text-xs sm:text-sm mt-0.5 leading-tight",
                        achievedAllGoals ? "text-green-600 dark:text-green-500" : "text-muted-foreground"
                      )}>
                        {achievedAllGoals 
                          ? "🎉 All nutrition goals completed!" 
                          : "Complete all nutrition goals for bonus"
                        }
                      </p>
                    </div>
                  </div>
                  
                  {/* Right side: Points badge */}
                  <motion.div
                    animate={{ 
                      scale: achievedAllGoals ? [1, 1.1, 1] : 1,
                      rotate: achievedAllGoals ? [0, 5, -5, 0] : 0
                    }}
                    transition={{ 
                      duration: achievedAllGoals ? 2 : 0,
                      repeat: achievedAllGoals ? Infinity : 0,
                      ease: "easeInOut"
                    }}
                    className="relative z-10 self-start sm:self-center"
                  >
                    <Badge 
                      variant={achievedAllGoals ? "default" : "secondary"}
                      className={cn(
                        "text-lg sm:text-xl px-4 py-2 sm:px-6 sm:py-3 font-bold shadow-lg",
                        "min-w-[80px] sm:min-w-[100px] text-center",
                        achievedAllGoals && "bg-green-600 hover:bg-green-700 shadow-green-200 dark:shadow-green-900/20"
                      )}
                    >                      +{achievedAllGoals ? 10 : 0} pts
                    </Badge>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
