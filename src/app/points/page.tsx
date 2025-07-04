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
  Minus,
  CheckCircle,
  Star,
  TrendingDown,
  ThumbsUp,
  Flame,
  Dumbbell,
  Activity
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
import { countUnhealthyFoods, calculateUnhealthyFoodPenalty } from '@/data/food-categories';
import { startOfDay, endOfDay, format } from 'date-fns';
import { cn } from '@/lib/utils';
import { fadeInVariants, staggerContainer, optimizedSlideVariants } from '@/lib/animations';
import { usePerformanceMonitor, useFirebasePerformance } from '@/hooks/use-performance';
import { formatPoints } from '@/lib/utils/pointsFormatter';
import { 
  calculateTodayProgress, 
  calculatePointsFromProgress, 
  calculateCurrentPoints, 
  processPointsForNewDay,
  type TodayProgress,
  type DailyNutritionTargets,
  type PointsData
} from '@/lib/utils/pointsCalculator';

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
    const currentSnap = await getDoc(pointsDocRef);
    
    let finalData = pointsData;
    
    if (currentSnap.exists()) {
      const currentData = currentSnap.data() as PointsData;
      
      // Check if it's a new day and transfer points
      const today = format(new Date(), 'yyyy-MM-dd');
      if (currentData.lastUpdated !== today) {
        // Transfer yesterday's points to total and reset bonus
        finalData = {
          ...pointsData,
          totalPoints: currentData.totalPoints + currentData.todayPoints,
          lastUpdated: today,
          perfectDayBonusClaimed: false // Reset bonus for new day
        };
        console.log(`[Points Service] Transferred ${currentData.todayPoints} points to total for new day`);
      } else {
        // Ensure total points never decrease
        if (pointsData.totalPoints < currentData.totalPoints) {
          finalData = {
            ...pointsData,
            totalPoints: currentData.totalPoints
          };
          console.log(`[Points Service] Prevented total points decrease for user: ${userId}`);
        }
      }
    }
    
    await setDoc(pointsDocRef, finalData, { merge: true });
    
    // Update cache
    pointsCache.set(userId, {
      data: finalData,
      timestamp: Date.now()
    });
    
    console.log(`[Points Service] Points updated successfully for user: ${userId}`);
  } catch (error: any) {
    console.error("[Points Service] Error updating user points:", error);
    throw createFirestoreServiceError(`Failed to update user points. Reason: ${error.message}`, "update-failed");
  }
};

export default function PointsPage() {
  const { userId, loading: authLoading } = useAuth();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<StoredUserProfile | null>(null);
  const [pointsData, setPointsData] = useState<PointsData | null>(null);
  const [todayProgress, setTodayProgress] = useState<TodayProgress | null>(null);
  const [todayFoodLogs, setTodayFoodLogs] = useState<StoredFoodLogEntry[]>([]);
  const [dailyTargets, setDailyTargets] = useState<DailyNutritionTargets | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [isClaimingBonus, setIsClaimingBonus] = useState(false);

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

  // ...existing code...

  // Memoized calculation for points to prevent unnecessary recalculations
  const calculatedPoints = useMemo(() => {
    if (!todayProgress || !dailyTargets || !todayFoodLogs) return 0;
    return calculateCurrentPoints(todayProgress, dailyTargets, todayFoodLogs, pointsData?.perfectDayBonusClaimed || false);
  }, [todayProgress, dailyTargets, todayFoodLogs, pointsData?.perfectDayBonusClaimed]);

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
        icon: Flame,
        color: 'text-orange-500',
        bgColor: 'bg-orange-500',
      },
      {
        name: 'Protein',
        points: getPointsForGoal(proteinPercent, 25),
        maxPoints: 25,
        percentage: Math.min(proteinPercent, 100),
        icon: Dumbbell,
        color: 'text-blue-500',
        bgColor: 'bg-blue-500',
      },
      {
        name: 'Carbs',
        points: getPointsForGoal(carbsPercent, 15),
        maxPoints: 15,
        percentage: Math.min(carbsPercent, 100),
        icon: Activity,
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
      
      // Calculate today's nutrition progress using shared utility
      const todayNutrition = calculateTodayProgress(todayFoodLogs);
      setTodayProgress(todayNutrition);      // Use profile's daily targets (this would come from your existing target calculation)
      const targets: DailyNutritionTargets = {
        calories: profileData?.targetCalories || 2000,
        protein: profileData?.targetProtein || 150,
        carbohydrates: profileData?.targetCarbs || 250,
        fat: profileData?.targetFat || 65,
      };      setDailyTargets(targets);

      // Get existing points or initialize using shared utility
      let currentPointsData = processPointsForNewDay(existingPoints);

      setPointsData(currentPointsData);

    } catch (err: any) {
      console.error("[Points Page] Error fetching data:", err);
      setError("Could not load points data. " + err.message);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);
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
      const timeoutId = setTimeout(async () => {
        try {
          await updateUserPointsData(userId, updatedPointsData);
          
          // Update streak when points are updated
          const { updateUserStreak } = await import('@/services/firestore/streakService');
          const today = format(new Date(), 'yyyy-MM-dd');
          await updateUserStreak(userId, today, calculatedPoints);
          
        } catch (error) {
          console.error("[Points Page] Error updating points and streak:", error);
        }
      }, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [calculatedPoints, pointsData, userId]);

  // Function to claim the Perfect Day Bonus
  const claimPerfectDayBonus = useCallback(async () => {
    if (!userId || !pointsData || isClaimingBonus) return;
    
    setIsClaimingBonus(true);
    
    try {
      // Update points data to mark bonus as claimed
      const updatedPointsData = {
        ...pointsData,
        perfectDayBonusClaimed: true,
        todayPoints: pointsData.todayPoints + 10 // Add the bonus points
      };
      
      await updateUserPointsData(userId, updatedPointsData);
      setPointsData(updatedPointsData);
      
      console.log(`[Points Page] Perfect Day Bonus claimed for user: ${userId}`);
    } catch (error) {
      console.error("[Points Page] Error claiming Perfect Day Bonus:", error);
    } finally {
      setIsClaimingBonus(false);
    }
  }, [userId, pointsData, isClaimingBonus]);

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
    const penalty = calculateUnhealthyFoodPenalty(unhealthyFoodCount);    const breakdown = [
      {
        label: 'Calories',
        achieved: caloriesPercent >= 100,
        points: getPointsForGoal(caloriesPercent, 30),
        maxPoints: 30,
        progress: caloriesPercent,
        current: Math.round(todayProgress.calories),
        target: dailyTargets.calories,
        unit: 'kcal',
        icon: Flame,
        color: 'text-orange-500',
        bgColor: 'bg-orange-500',
      },
      {
        label: 'Protein',
        achieved: proteinPercent >= 100,
        points: getPointsForGoal(proteinPercent, 25),
        maxPoints: 25,
        progress: proteinPercent,
        current: Math.round(todayProgress.protein),
        target: dailyTargets.protein,        unit: 'g',
        icon: Dumbbell,
        color: 'text-blue-500',
        bgColor: 'bg-blue-500',
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
        icon: Activity,
        color: 'text-green-500',
        bgColor: 'bg-green-500',
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
        bgColor: 'bg-purple-500',
      },
      ...(penalty > 0 ? [{
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
        bgColor: 'bg-red-500',
      }] : []),
    ];

    return breakdown;
  };
  if (isLoading || authLoading) {
    return (
      <div className={`min-h-screen pb-20 md:pb-0 animate-fade-in transition-all duration-500 ${
        isDark 
          ? 'bg-[#0f0f0f]' 
          : 'bg-gradient-to-br from-clay-100 via-clay-200 to-clay-300'
      }`}>
        <div className="p-3 md:p-6">
          <div className="max-w-4xl mx-auto space-y-4 md:space-y-6 animate-pulse">
            <div className="space-y-2">
              <Skeleton className={`h-8 w-48 ${isDark ? 'bg-[#3a3a3a]' : ''}`} />
              <Skeleton className={`h-4 w-96 ${isDark ? 'bg-[#3a3a3a]' : ''}`} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className={`backdrop-blur-sm border-0 shadow-lg rounded-3xl ${
                isDark 
                  ? 'bg-[#1a1a1a] border-[#2a2a2a]' 
                  : 'bg-clayGlass shadow-clay'
              }`}>
                <CardHeader>
                  <Skeleton className={`h-6 w-32 ${isDark ? 'bg-[#3a3a3a]' : ''}`} />
                </CardHeader>
                <CardContent>
                  <Skeleton className={`h-16 w-full ${isDark ? 'bg-[#3a3a3a]' : ''}`} />
                </CardContent>
              </Card>
              <Card className={`backdrop-blur-sm border-0 shadow-lg rounded-3xl ${
                isDark 
                  ? 'bg-[#1a1a1a] border-[#2a2a2a]' 
                  : 'bg-clayGlass shadow-clay'
              }`}>
                <CardHeader>
                  <Skeleton className={`h-6 w-32 ${isDark ? 'bg-[#3a3a3a]' : ''}`} />
                </CardHeader>
                <CardContent>
                  <Skeleton className={`h-16 w-full ${isDark ? 'bg-[#3a3a3a]' : ''}`} />
                </CardContent>
              </Card>
            </div>
            <Card className={`backdrop-blur-sm border-0 shadow-lg rounded-3xl ${
              isDark 
                ? 'bg-[#1a1a1a] border-[#2a2a2a]' 
                : 'bg-clayGlass shadow-clay'
            }`}>
              <CardHeader>
                <Skeleton className={`h-6 w-48 ${isDark ? 'bg-[#3a3a3a]' : ''}`} />
              </CardHeader>
              <CardContent className="space-y-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="flex items-center justify-between">
                    <Skeleton className={`h-8 w-32 ${isDark ? 'bg-[#3a3a3a]' : ''}`} />
                    <Skeleton className={`h-6 w-16 ${isDark ? 'bg-[#3a3a3a]' : ''}`} />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className={`min-h-screen pb-20 md:pb-0 ${
        isDark 
          ? 'bg-[#0f0f0f]' 
          : 'bg-gradient-to-br from-clay-100 via-clay-200 to-clay-300'
      }`}>
        <div className="p-3 md:p-6">
          <div className="max-w-xl mx-auto text-center">
            <Card className={`backdrop-blur-sm border-0 shadow-lg rounded-3xl border-destructive ${
              isDark 
                ? 'bg-[#1a1a1a] border-red-800' 
                : 'bg-clayGlass shadow-clay'
            }`}>
              <CardHeader>
                <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
                <CardTitle className={`text-destructive ${isDark ? 'text-red-400' : ''}`}>Error Loading Points</CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`mb-4 ${
                  isDark ? 'text-gray-400' : 'text-muted-foreground'
                }`}>{error}</p>
                <Button onClick={fetchData} variant="outline" className="rounded-2xl">Try Again</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  const breakdown = getPointsBreakdown();
  const totalPossibleToday = 100;
  const achievedAllGoals = breakdown.every(item => item.achieved);
  return (
    <div className={`min-h-screen pb-20 md:pb-0 animate-fade-in transition-all duration-500 ${
      isDark 
        ? 'bg-[#0f0f0f]' 
        : 'bg-gradient-to-br from-clay-100 via-clay-200 to-clay-300'
    }`}>
      <div className="p-3 md:p-6">
        <div className="max-w-4xl mx-auto space-y-4 md:space-y-6">
          {/* Header */}
          <motion.div 
            className="mb-6 md:mb-8 animate-slide-down"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className={`backdrop-blur-sm rounded-3xl shadow-lg border-0 p-4 md:p-6 text-center transition-all duration-500 ${
              isDark 
                ? 'bg-[#1a1a1a] border-[#2a2a2a]' 
                : 'bg-clayGlass shadow-clay'
            }`}>
              <h1 className={`text-2xl md:text-3xl lg:text-4xl font-bold mb-2 flex items-center justify-center gap-2 ${
                isDark ? 'text-white' : 'text-gray-800'
              }`}>
                <motion.div
                  animate={{ 
                    rotate: [0, 10, -5, 0],
                    scale: [1, 1.2, 1]
                  }}
                  transition={{ 
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                    repeatType: "reverse"
                  }}
                >
                  <Trophy className="h-8 w-8 text-yellow-500 drop-shadow-md" />
                </motion.div>
                Your Points
              </h1>
              <p className={`text-sm md:text-base ${
                isDark ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Earn up to 100 points daily by achieving your nutrition goals!
              </p>
            </div>
          </motion.div>

          {/* Today's Points Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            whileHover={{ scale: 1.02, y: -2 }}
          >
            <Card className={`backdrop-blur-sm border-0 hover:shadow-lg transition-all duration-300 rounded-3xl animate-fade-in ${
              isDark 
                ? 'bg-[#1a1a1a] border-[#2a2a2a] hover:border-[#3a3a3a]' 
                : 'bg-clayGlass shadow-clay hover:shadow-clayStrong'
            }`}>
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg animate-scale-in ${
                    isDark 
                      ? 'bg-gradient-to-br from-orange-600/80 to-orange-700/80' 
                      : 'bg-gradient-to-br from-orange-400 to-orange-600 shadow-clayInset'
                  }`}>
                    <Award className="w-6 h-6 text-white" />
                  </div>
                  <h2 className={`text-xl font-bold ${
                    isDark ? 'text-white' : 'text-gray-800'
                  }`}>Today's Points</h2>
                </div>
                
                <div className="flex items-center justify-between mb-6">
                  <div className={`text-5xl font-bold ${
                    isDark ? 'text-orange-400' : 'text-orange-600'
                  }`}>{pointsData?.todayPoints || 0}</div>
                  <div className="text-right">
                    <div className={`text-sm font-medium ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>{pointsData?.todayPoints || 0}/{totalPossibleToday}</div>
                    <div className={`text-xs ${
                      isDark ? 'text-gray-500' : 'text-gray-500'
                    }`}>Daily Goal</div>
                  </div>
                </div>
                
                <div className="relative">
                  <div className={`w-full h-4 rounded-full ${
                    isDark ? 'bg-[#2a2a2a]' : 'bg-gray-200 shadow-clayInset'
                  }`}>
                    <motion.div 
                      className={`h-4 rounded-full transition-all duration-500 shadow-sm ${
                        isDark 
                          ? 'bg-gradient-to-r from-orange-600 to-orange-500' 
                          : 'bg-gradient-to-r from-orange-400 to-orange-500'
                      }`}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(((pointsData?.todayPoints || 0) / totalPossibleToday) * 100, 100)}%` }}
                      transition={{ duration: 1.5, delay: 0.7, ease: "easeOut" }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Total Points Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            whileHover={{ scale: 1.02, y: -2 }}
          >
            <Card className={`backdrop-blur-sm border-0 hover:shadow-lg transition-all duration-300 rounded-3xl animate-fade-in ${
              isDark 
                ? 'bg-[#1a1a1a] border-[#2a2a2a] hover:border-[#3a3a3a]' 
                : 'bg-clayGlass shadow-clay hover:shadow-clayStrong'
            }`} style={{ animationDelay: '100ms' }}>
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg animate-scale-in ${
                    isDark 
                      ? 'bg-gradient-to-br from-blue-600/80 to-blue-700/80' 
                      : 'bg-gradient-to-br from-blue-400 to-blue-600 shadow-clayInset'
                  }`}>
                    <Star className="w-6 h-6 text-white" />
                  </div>
                  <h2 className={`text-xl font-bold ${
                    isDark ? 'text-white' : 'text-gray-800'
                  }`}>Total Points</h2>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className={`text-5xl font-bold ${
                    isDark ? 'text-blue-400' : 'text-blue-600'
                  }`}>{formatPoints(pointsData?.totalPoints || 0)}</div>
                  <div className={`backdrop-blur-sm px-4 py-2 rounded-2xl shadow-lg ${
                    isDark 
                      ? 'bg-[#2a2a2a] border border-[#3a3a3a]' 
                      : 'bg-white/40 shadow-clayInset'
                  }`}>
                    <span className={`text-sm font-bold ${
                      isDark ? 'text-gray-400' : 'text-gray-700'
                    }`}>All Time</span>
                  </div>
                </div>
                <p className={`text-sm mt-3 font-medium ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>Keep building your streak!</p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Today's Progress Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <Card className={`backdrop-blur-sm border-0 hover:shadow-lg transition-all duration-300 rounded-3xl animate-fade-in ${
              isDark 
                ? 'bg-[#1a1a1a] border-[#2a2a2a] hover:border-[#3a3a3a]' 
                : 'bg-clayGlass shadow-clay hover:shadow-clayStrong'
            }`} style={{ animationDelay: '200ms' }}>
              <CardHeader className="pb-2 md:pb-3">
                <div className="flex items-center space-x-3">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg animate-scale-in ${
                    isDark 
                      ? 'bg-gradient-to-br from-purple-600/80 to-purple-700/80' 
                      : 'bg-gradient-to-br from-purple-400 to-purple-600 shadow-clayInset'
                  }`}>
                    <Target className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className={`text-xl ${
                      isDark ? 'text-white' : 'text-gray-800'
                    }`}>Today's Progress</CardTitle>
                    <p className={`text-sm font-medium ${
                      isDark ? 'text-gray-400' : 'text-gray-700'
                    }`}>Track your nutrition goals and earn points</p>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
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
                      scale: 1.02,
                      y: -2,
                      transition: { type: "spring", stiffness: 400, damping: 25 }
                    }}
                    whileTap={{ scale: 0.98 }}
                    className="group relative animate-stagger-in"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className={`backdrop-blur-sm border rounded-2xl p-5 shadow-lg transition-all duration-500 ${
                      isDark 
                        ? 'bg-[#252525] border-[#3a3a3a]' 
                        : 'bg-clayGlass border-white/40'
                    }`}>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <div className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center mr-4 shadow-lg",
                            item.achieved 
                              ? isDark ? "bg-green-900/80 ring-2 ring-green-600/50" : "bg-green-100 ring-2 ring-green-200"
                              : item.color === 'text-orange-500' ? isDark ? "bg-orange-900/30" : "bg-orange-50" :
                                item.color === 'text-blue-500' ? isDark ? "bg-blue-900/30" : "bg-blue-50" :
                                item.color === 'text-green-500' ? isDark ? "bg-green-900/30" : "bg-green-50" :
                                item.color === 'text-purple-500' ? isDark ? "bg-purple-900/30" : "bg-purple-50" :
                                item.color === 'text-red-500' ? isDark ? "bg-red-900/30" : "bg-red-50" :
                                isDark ? "bg-gray-800" : "bg-gray-50"
                          )}>
                            <item.icon className={cn(
                              "w-6 h-6",
                              item.achieved ? isDark ? "text-green-400" : "text-green-600" : item.color
                            )} />
                          </div>
                          <div>
                            <h3 className={`font-bold text-lg ${
                              isDark ? 'text-white' : 'text-gray-800'
                            }`}>{item.label}</h3>
                            <p className={`text-sm font-medium ${
                              isDark ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                              {item.points < 0 ? `${item.current} ${item.unit}` : `${item.current}/${item.target} ${item.unit}`}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`backdrop-blur-sm px-3 py-2 rounded-xl shadow-lg ${
                            isDark 
                              ? 'bg-[#2a2a2a] border border-[#3a3a3a]' 
                              : 'bg-white/60 shadow-clayInset'
                          }`}>
                            <span className={`text-sm font-bold ${
                              isDark ? 'text-gray-300' : 'text-gray-700'
                            }`}>{item.points > 0 ? '+' : ''}{item.points} pts</span>
                          </div>
                          <div className={`text-sm mt-1 font-medium ${
                            isDark ? 'text-gray-400' : 'text-gray-600'
                          }`}>{Math.round(item.progress)}%</div>
                        </div>
                      </div>
                      
                      {item.points >= 0 && (
                        <div className="mb-4">
                          <div className={`w-full h-3 rounded-full ${
                            isDark ? 'bg-[#2a2a2a]' : 'bg-gray-200 shadow-clayInset'
                          }`}>
                            <motion.div 
                              className={cn(
                                item.achieved ? isDark ? "bg-green-500" : "bg-green-400" : 
                                item.color === 'text-orange-500' ? isDark ? "bg-orange-500" : "bg-orange-400" :
                                item.color === 'text-blue-500' ? isDark ? "bg-blue-500" : "bg-blue-400" :
                                item.color === 'text-green-500' ? isDark ? "bg-green-500" : "bg-green-400" :
                                item.color === 'text-purple-500' ? isDark ? "bg-purple-500" : "bg-purple-400" :
                                isDark ? "bg-gray-500" : "bg-gray-400",
                                "h-3 rounded-full transition-all duration-500 shadow-sm"
                              )}
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.max(Math.min(item.progress, 100), 3)}%` }}
                              transition={{ 
                                duration: 1.5, 
                                delay: 1 + index * 0.1,
                                ease: "easeOut"
                              }}
                            />
                          </div>
                        </div>
                      )}
                      
                      <div className={`flex justify-between items-center text-sm ${
                        isDark ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        <div className="flex items-center font-medium">
                          <span>📈 {Math.round(100 - item.progress)}% to go</span>
                          <span className="ml-4">Max: {item.maxPoints} pts</span>
                        </div>
                      </div>
                      
                      <div className="flex justify-between mt-3 text-sm">
                        <div>
                          <div className={`text-xs font-medium ${
                            isDark ? 'text-gray-500' : 'text-gray-500'
                          }`}>Current</div>
                          <div className={cn("font-bold text-lg", item.color)}>{item.current} {item.unit}</div>
                        </div>
                        <div className="text-right">
                          <div className={`text-xs font-medium ${
                            isDark ? 'text-gray-500' : 'text-gray-500'
                          }`}>Target</div>
                          <div className={`font-bold text-lg ${
                            isDark ? 'text-gray-300' : 'text-gray-700'
                          }`}>{item.target} {item.unit}</div>
                        </div>
                      </div>
                      
                      {item.points < 0 && (
                        <div className={`mt-4 backdrop-blur-sm rounded-xl p-3 shadow-lg ${
                          isDark 
                            ? 'bg-red-900/20 border border-red-800/30' 
                            : 'bg-red-50/80 shadow-clayInset'
                        }`}>
                          <p className={`text-sm text-center font-medium ${
                            isDark ? 'text-red-400' : 'text-red-600'
                          }`}>Penalty for unhealthy choices</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </CardContent>            </Card>          </motion.div>          {/* Perfect Day Bonus */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              duration: 0.6, 
              delay: 1.1 + breakdown.length * 0.1
            }}
            whileHover={{ scale: 1.02, y: -2 }}
            className="animate-fade-in"
            style={{ animationDelay: '400ms' }}
          >
              <Card className={cn(
                "backdrop-blur-sm border-0 transition-all duration-500 rounded-3xl shadow-lg animate-fade-in",
                achievedAllGoals 
                  ? isDark 
                    ? "bg-gradient-to-r from-green-900/40 via-emerald-900/40 to-green-900/40 border-green-600/50" 
                    : "bg-gradient-to-r from-green-50 via-emerald-50 to-green-50 border-green-300 shadow-clayStrong"
                  : isDark 
                    ? "bg-[#1a1a1a] border-[#2a2a2a] hover:border-[#3a3a3a]" 
                    : "bg-clayGlass shadow-clay hover:shadow-clayStrong"
              )} style={{ animationDelay: '400ms' }}>
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center mr-4 shadow-lg",
                        achievedAllGoals 
                          ? isDark 
                            ? "bg-gradient-to-br from-yellow-500/80 to-yellow-600/80" 
                            : "bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-clayInset"
                          : isDark 
                            ? "bg-gradient-to-br from-gray-700 to-gray-800" 
                            : "bg-gradient-to-br from-gray-100 to-gray-200 shadow-clayInset"
                      )}>
                        {achievedAllGoals ? (
                          pointsData?.perfectDayBonusClaimed ? (
                            <CheckCircle className="w-6 h-6 text-white" />
                          ) : (
                            <Star className="w-6 h-6 text-white" />
                          )
                        ) : (
                          <Trophy className={`w-6 h-6 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                        )}
                      </div>
                      <div>
                        <h3 className={`font-bold ${
                          isDark ? 'text-white' : 'text-gray-800'
                        }`}>Perfect Day Bonus</h3>
                        <p className={`text-sm font-medium ${
                          isDark ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {achievedAllGoals 
                            ? pointsData?.perfectDayBonusClaimed
                              ? "✅ Bonus claimed! +10 points added to today's total"
                              : "🎉 All goals completed! Claim your bonus!"
                            : "Complete all goals to earn bonus"
                          }
                        </p>
                      </div>
                    </div>
                    
                    {/* Show claim button or points display */}
                    {achievedAllGoals && !pointsData?.perfectDayBonusClaimed ? (
                      <Button
                        onClick={claimPerfectDayBonus}
                        disabled={isClaimingBonus}
                        className={cn(
                          "px-4 py-2 rounded-2xl shadow-lg font-bold text-sm transition-all duration-300",
                          "bg-gradient-to-r from-green-400 to-green-500 hover:from-green-500 hover:to-green-600",
                          "text-white border-0"
                        )}
                      >
                        {isClaimingBonus ? "Claiming..." : "Claim +10 pts"}
                      </Button>
                    ) : (
                      <div className={cn(
                        "px-4 py-2 rounded-2xl shadow-lg",
                        achievedAllGoals && pointsData?.perfectDayBonusClaimed
                          ? "bg-gradient-to-r from-green-400 to-green-500 text-white" 
                          : achievedAllGoals 
                            ? "bg-gradient-to-r from-yellow-400 to-yellow-500 text-white"
                            : isDark 
                              ? "backdrop-blur-sm bg-[#2a2a2a] border border-[#3a3a3a] text-gray-500" 
                              : "backdrop-blur-sm bg-white/60 shadow-clayInset text-gray-500"
                      )}>
                        <span className="text-sm font-bold">
                          +{achievedAllGoals ? 10 : 0} pts
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
        </div>
      </div>
    </div>
  );
}
