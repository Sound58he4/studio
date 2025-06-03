"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef, Suspense, lazy } from 'react';
import { useRouter } from 'next/navigation';
import { format, parseISO, startOfDay, endOfDay, startOfWeek, endOfWeek, getDay, isWithinInterval, differenceInCalendarDays, isSameDay, subDays } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { usePerformanceMonitor, useFirebasePerformance } from '@/hooks/use-performance';
import {
  getUserProfile, saveUserProfile, getFoodLogs, getExerciseLogs,
  addExerciseLog, deleteLogEntry, saveWorkoutPlan, getWorkoutPlan,
  getCompletedWorkoutsForDate, saveCompletedWorkout, deleteCompletedWorkout, 
  getDailyNutritionSummaries
} from '@/services/firestore'; // Use combined service
import { createFirestoreServiceError } from '@/services/firestore/utils';
import { db } from '@/lib/firebase/exports';
import {
  doc, getDoc, setDoc, collection, query, where, getDocs, orderBy, runTransaction, serverTimestamp
} from 'firebase/firestore';


import { calculateDailyTargets, CalculateTargetsInput, CalculateTargetsOutput } from '@/ai/flows/dashboard-update';
import { generateWorkoutPlan, WeeklyWorkoutPlan as AIWeeklyWorkoutPlan, ExerciseDetail as AIExerciseDetail } from '@/ai/flows/generate-workout-plan';
import { estimateCaloriesBurned, EstimateCaloriesBurnedInput } from '@/ai/flows/estimate-calories-burned';
import { suggestCalorieAdjustment } from '@/ai/flows/suggest-calorie-adjustment';
import type { SuggestCalorieAdjustmentInput, SuggestCalorieAdjustmentOutput } from '@/app/dashboard/types';

import DashboardMainContent from './DashboardMainContent';
import DashboardSidebar from './DashboardSidebar';
import DashboardLoadingSkeleton from './DashboardLoadingSkeleton';
import DashboardErrorState from '@/components/dashboard/DashboardErrorState'; // Corrected alias path

// Types
import type {
    StoredUserProfile, PeriodTotals, CompletedWorkouts, FitnessTipData,
    StoredFoodLogEntry, StoredExerciseLogEntry, DailyNutritionSummary,
    CompletedWorkoutEntry, WeeklyWorkoutPlan, ExerciseDetail
} from './types';
import { useToast } from "@/hooks/use-toast";
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedWrapper from '@/components/ui/animated-wrapper';

// Dashboard data interfaces for batch operations
export interface DashboardData {
  userProfile: StoredUserProfile | null;
  dailyNutritionSummary: DailyNutritionSummary | null;
  weeklyNutritionSummaries: DailyNutritionSummary[];
  dailyFoodLogs: StoredFoodLogEntry[];
  dailyExerciseLogs: StoredExerciseLogEntry[];
  weeklyExerciseLogs: StoredExerciseLogEntry[];
  completedWorkouts: CompletedWorkouts;
  workoutPlan: WeeklyWorkoutPlan | null;
  pointsData: any;
}

export interface BatchDataRequest {
  userId: string;
  selectedDate: Date;
  includeDailyLogs: boolean;
  includeWeeklyData: boolean;
  includeWorkoutData: boolean;
  includePointsData: boolean;
}

/**
 * Helper to safely extract value from Promise.allSettled result
 */
function extractFulfilledValue<T>(result: PromiseSettledResult<T>): T | null {
  return result.status === 'fulfilled' ? result.value : null;
}

const LOCAL_STORAGE_KEYS = {
  PROFILE_PREFIX: 'bago-user-profile-',
  WORKOUT_PLAN_PREFIX: 'bago-workout-plan-',
  COMPLETED_WORKOUTS_PREFIX: 'bago-completed-workouts-',
  DAILY_FOOD_LOGS_PREFIX: 'bago-daily-food-logs-',
  DAILY_EXERCISE_LOGS_PREFIX: 'bago-daily-exercise-logs-',
};

// Optimized Dashboard Service Functions - integrated directly into dashboard
const getUserProfileData = async (userId: string): Promise<StoredUserProfile | null> => {
  try {
    const userProfileRef = doc(db, 'users', userId);
    const userProfileSnap = await getDoc(userProfileRef);
    
    if (userProfileSnap.exists()) {
      return userProfileSnap.data() as StoredUserProfile;
    }
    return null;
  } catch (error: any) {
    console.error("[Dashboard] Error fetching user profile:", error);
    return null;
  }
};

const getFoodLogsForDay = async (userId: string, date: Date): Promise<StoredFoodLogEntry[]> => {
  try {
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);

    const foodLogsSnap = await getDocs(query(
      collection(db, 'users', userId, 'foodLog'),
      where('timestamp', '>=', dayStart.toISOString()),
      where('timestamp', '<=', dayEnd.toISOString()),
      orderBy('timestamp', 'desc')
    ));

    return foodLogsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as StoredFoodLogEntry));
  } catch (error: any) {
    console.error("[Dashboard] Error fetching food logs:", error);
    return [];
  }
};

const getExerciseLogsForDay = async (userId: string, date: Date): Promise<StoredExerciseLogEntry[]> => {
  try {
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);

    const exerciseLogsSnap = await getDocs(query(
      collection(db, 'users', userId, 'exerciseLog'),
      where('timestamp', '>=', dayStart.toISOString()),
      where('timestamp', '<=', dayEnd.toISOString()),
      orderBy('timestamp', 'desc')
    ));

    return exerciseLogsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as StoredExerciseLogEntry));
  } catch (error: any) {
    console.error("[Dashboard] Error fetching exercise logs:", error);
    return [];
  }
};

const getDailyNutritionSummaryData = async (userId: string, dateStr: string): Promise<DailyNutritionSummary | null> => {
  try {
    const summarySnap = await getDoc(doc(db, 'users', userId, 'dailyNutritionSummaries', dateStr));
    
    if (summarySnap.exists()) {
      return summarySnap.data() as DailyNutritionSummary;
    }
    return null;
  } catch (error: any) {
    console.error("[Dashboard] Error fetching daily nutrition summary:", error);
    return null;
  }
};

const getWeeklyExerciseLogsData = async (userId: string, date: Date): Promise<StoredExerciseLogEntry[]> => {
  try {
    const weekStart = startOfWeek(date, { weekStartsOn: 0 });
    const weekEnd = endOfWeek(date, { weekStartsOn: 0 });

    const exerciseLogsSnap = await getDocs(query(
      collection(db, 'users', userId, 'exerciseLog'),
      where('timestamp', '>=', weekStart.toISOString()),
      where('timestamp', '<=', weekEnd.toISOString()),
      orderBy('timestamp', 'desc')
    ));

    return exerciseLogsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as StoredExerciseLogEntry));
  } catch (error: any) {
    console.error("[Dashboard] Error fetching weekly exercise logs:", error);
    return [];
  }
};

const getWeeklyNutritionSummariesData = async (userId: string, date: Date): Promise<DailyNutritionSummary[]> => {
  try {
    const weekStart = startOfWeek(date, { weekStartsOn: 0 });
    const weekEnd = endOfWeek(date, { weekStartsOn: 0 });

    // Generate all dates in the week
    const weekDates: string[] = [];
    const current = new Date(weekStart);
    while (current <= weekEnd) {
      weekDates.push(format(current, 'yyyy-MM-dd'));
      current.setDate(current.getDate() + 1);
    }

    // Batch get all daily summaries for the week
    const summariesSnaps = await Promise.all(weekDates.map(dateStr => 
      getDoc(doc(db, 'users', userId, 'dailyNutritionSummaries', dateStr))
    ));

    const summaries = summariesSnaps
      .map((snap, index) => snap.exists() ? { 
        ...snap.data() as DailyNutritionSummary, 
        id: weekDates[index],
        date: weekDates[index] 
      } : null)
      .filter(Boolean) as DailyNutritionSummary[];

    return summaries;
  } catch (error: any) {
    console.error("[Dashboard] Error fetching weekly nutrition summaries:", error);
    return [];
  }
};

const getWorkoutPlanData = async (userId: string): Promise<WeeklyWorkoutPlan | null> => {
  try {
    const workoutPlanSnap = await getDoc(doc(db, 'users', userId, 'workoutPlan', 'current'));
    
    if (workoutPlanSnap.exists()) {
      return workoutPlanSnap.data() as WeeklyWorkoutPlan;
    }
    return null;
  } catch (error: any) {
    console.error("[Dashboard] Error fetching workout plan:", error);
    return null;
  }
};

const getCompletedWorkoutsForDateData = async (userId: string, date: Date): Promise<CompletedWorkouts> => {
  try {
    const dateKey = format(date, 'yyyy-MM-dd');
    const completedWorkoutsSnap = await getDoc(doc(db, 'users', userId, 'completedWorkouts', dateKey));

    const completedWorkouts: CompletedWorkouts = {};
    if (completedWorkoutsSnap.exists()) {
      const data = completedWorkoutsSnap.data();
      if (data) {
        for (const exerciseName in data) {
          completedWorkouts[exerciseName] = {
            completed: data[exerciseName]?.completed ?? false,
            timestamp: data[exerciseName]?.timestamp ?? new Date().toISOString(),
            logId: data[exerciseName]?.logId ?? null,
            loggedCalories: data[exerciseName]?.loggedCalories ?? null,
            isEstimated: data[exerciseName]?.isEstimated ?? null,
          };
        }
      }
    }

    return completedWorkouts;
  } catch (error: any) {
    console.error("[Dashboard] Error fetching completed workouts:", error);
    return {};
  }
};

const getPointsData = async (userId: string): Promise<any> => {
  try {
    const pointsSnap = await getDoc(doc(db, 'users', userId, 'points', 'current'));
    return pointsSnap.exists() ? pointsSnap.data() : null;
  } catch (error: any) {
    console.error("[Dashboard] Error fetching points data:", error);
    return null;
  }
};

const batchGetDashboardData = async (request: BatchDataRequest): Promise<DashboardData> => {
  const { userId, selectedDate, includeDailyLogs, includeWeeklyData, includeWorkoutData, includePointsData } = request;

  if (!userId) {
    throw createFirestoreServiceError("User ID is required for dashboard data.", "invalid-argument");
  }

  console.log(`[Dashboard] Batch fetching data for user: ${userId}`);

  try {
    // Initialize all promises
    const operations: Promise<any>[] = [];
    
    // Always get user profile
    operations.push(getUserProfileData(userId)); // 0

    // Add conditional operations based on request
    if (includeDailyLogs) {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      operations.push(
        getFoodLogsForDay(userId, selectedDate), // 1
        getExerciseLogsForDay(userId, selectedDate), // 2
        getDailyNutritionSummaryData(userId, dateStr) // 3
      );
    }

    if (includeWeeklyData) {
      operations.push(
        getWeeklyExerciseLogsData(userId, selectedDate), // 4 or varies
        getWeeklyNutritionSummariesData(userId, selectedDate) // 5 or varies
      );
    }

    if (includeWorkoutData) {
      operations.push(
        getWorkoutPlanData(userId), // varies
        getCompletedWorkoutsForDateData(userId, selectedDate) // varies
      );
    }

    if (includePointsData) {
      operations.push(getPointsData(userId)); // varies
    }

    // Execute all operations in parallel
    const results = await Promise.allSettled(operations);

    // Initialize result object
    const dashboardData: DashboardData = {
      userProfile: extractFulfilledValue(results[0]),
      dailyNutritionSummary: null,
      weeklyNutritionSummaries: [],
      dailyFoodLogs: [],
      dailyExerciseLogs: [],
      weeklyExerciseLogs: [],
      completedWorkouts: {},
      workoutPlan: null,
      pointsData: null
    };

    // Extract results based on what was requested
    let operationIndex = 1;

    if (includeDailyLogs) {
      dashboardData.dailyFoodLogs = extractFulfilledValue(results[operationIndex]) || [];
      operationIndex++;
      dashboardData.dailyExerciseLogs = extractFulfilledValue(results[operationIndex]) || [];
      operationIndex++;
      dashboardData.dailyNutritionSummary = extractFulfilledValue(results[operationIndex]);
      operationIndex++;
    }

    if (includeWeeklyData) {
      dashboardData.weeklyExerciseLogs = extractFulfilledValue(results[operationIndex]) || [];
      operationIndex++;
      dashboardData.weeklyNutritionSummaries = extractFulfilledValue(results[operationIndex]) || [];
      operationIndex++;
    }

    if (includeWorkoutData) {
      dashboardData.workoutPlan = extractFulfilledValue(results[operationIndex]);
      operationIndex++;
      dashboardData.completedWorkouts = extractFulfilledValue(results[operationIndex]) || {};
      operationIndex++;
    }

    if (includePointsData) {
      dashboardData.pointsData = extractFulfilledValue(results[operationIndex]);
    }

    console.log(`[Dashboard] Successfully fetched dashboard data for user: ${userId}`);
    return dashboardData;

  } catch (error: any) {
    console.error("[Dashboard] Error in batch operation:", error);
    throw createFirestoreServiceError(`Failed to fetch dashboard data: ${error.message}`, "fetch-failed");
  }
};

export function DashboardMainPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { userId, loading: authLoading } = useAuth();
  
  // Performance monitoring
  const performanceRef = usePerformanceMonitor('Dashboard');
  const firebasePerf = useFirebasePerformance();
  
  const [isClient, setIsClient] = useState(false);

  const [userProfile, setUserProfile] = useState<StoredUserProfile | null>(null);
  const [dailyTargets, setDailyTargets] = useState<CalculateTargetsOutput | null>(null);
  const [weeklyWorkoutPlan, setWeeklyWorkoutPlan] = useState<WeeklyWorkoutPlan | null>(null);
  const [completedWorkouts, setCompletedWorkouts] = useState<CompletedWorkouts>({});
  
  // These store individual logs only for the currently selected 'selectedDate' if it's today, or for 'allWeekly...' if weekly tab.
  const [dailyFoodLogs, setDailyFoodLogs] = useState<StoredFoodLogEntry[]>([]);
  const [dailyExerciseLogsState, setDailyExerciseLogsState] = useState<StoredExerciseLogEntry[]>([]); // Renamed to avoid conflict
  
  const [weeklyNutritionSummaries, setWeeklyNutritionSummaries] = useState<DailyNutritionSummary[]>([]);
  // This will store exercise logs for the entire week when the weekly tab is active and fetched.
  const [allWeeklyExerciseLogs, setAllWeeklyExerciseLogs] = useState<StoredExerciseLogEntry[]>([]);


  const [periodTotals, setPeriodTotals] = useState<PeriodTotals>({ calories: 0, protein: 0, carbohydrates: 0, fat: 0, caloriesBurned: 0 });
  const [activePeriodTab, setActivePeriodTab] = useState<'daily' | 'weekly'>('daily');
  const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(new Date())); 

  const [isLoadingInitialData, setIsLoadingInitialData] = useState(true);
  const [isCalculatingAiTargets, setIsCalculatingAiTargets] = useState(false);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [isLoadingSuggestion, setIsLoadingSuggestion] = useState(false);
  const [isFirstTimeAITargetCalculation, setIsFirstTimeAITargetCalculation] = useState(false);
  
  const [criticalError, setCriticalError] = useState<string | null>(null);
  const [uiError, setUiError] = useState<string | null>(null); 
  const [hasLoadedInitialData, setHasLoadedInitialData] = useState(false);
  
  const [lastFetchedWeeklyRangeKey, setLastFetchedWeeklyRangeKey] = useState<string | null>(null);
  const [isEstimatingCalories, setIsEstimatingCalories] = useState<string | null>(null);
  const [calorieAdjustmentSuggestion, setCalorieAdjustmentSuggestion] = useState<SuggestCalorieAdjustmentOutput | null>(null);

  const isFetchingSuggestionRef = useRef(false);
  const isFetchingWeeklyLogsRef = useRef(false);

  useEffect(() => { setIsClient(true); }, []);

  const getDateRange = useCallback((type: 'daily' | 'weekly', date: Date): { start: Date; end: Date } => {
    switch (type) {
        case 'daily': return { start: startOfDay(date), end: endOfDay(date) };
        case 'weekly': return { start: startOfWeek(date, { weekStartsOn: 0 }), end: endOfWeek(date, { weekStartsOn: 0 }) }; 
        default: return { start: startOfDay(date), end: endOfDay(date) };
    }
  }, []);

  const todayDayName = useMemo(() => {
    const dayIndex = getDay(selectedDate);
    const daysOfWeekMap: (keyof WeeklyWorkoutPlan)[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return daysOfWeekMap[dayIndex];
  }, [selectedDate]);

  const isProfileDataSufficientForAI = useCallback((profile: StoredUserProfile | null): profile is StoredUserProfile & { height: number; weight: number; age: number; gender: NonNullable<StoredUserProfile['gender']>; activityLevel: NonNullable<StoredUserProfile['activityLevel']>; fitnessGoal: NonNullable<StoredUserProfile['fitnessGoal']>; } => {
    return !!profile && !!profile.height && !!profile.weight && !!profile.age && !!profile.gender && !!profile.activityLevel && !!profile.fitnessGoal;
  }, []);
  
  const processLogsAndUpdateState = useCallback((
    periodType: 'daily' | 'weekly',
    currentFoodData: DailyNutritionSummary[], // For daily, this will be a single summary; for weekly, an array of summaries
    currentExerciseLogsForTotals: StoredExerciseLogEntry[]
  ) => {
    console.log(`[Dashboard] Processing logs for ${periodType}. Food summaries: ${currentFoodData.length}, Exercise logs: ${currentExerciseLogsForTotals.length}`);
    const newTotals: PeriodTotals = { calories: 0, protein: 0, carbohydrates: 0, fat: 0, caloriesBurned: 0 };

    currentFoodData.forEach(summary => {
        newTotals.calories += Number(summary.totalCalories) || 0;
        newTotals.protein += Number(summary.totalProtein) || 0;
        newTotals.carbohydrates += Number(summary.totalCarbohydrates) || 0;
        newTotals.fat += Number(summary.totalFat) || 0;
    });

    currentExerciseLogsForTotals.forEach(log => {
      newTotals.caloriesBurned += Number(log.estimatedCaloriesBurned) || 0;
    });

    setPeriodTotals(prevTotals => {
      if ( JSON.stringify(prevTotals) !== JSON.stringify(newTotals) ) {
        console.log("[Dashboard] Period totals updated:", newTotals);
        return newTotals;
      }
      return prevTotals;
    });
  }, []);

  const loadInitialDashboardData = useCallback(async (forceRecalculateAiTargets: boolean = false) => {
    if (!userId || !isClient) { setIsLoadingInitialData(false); return; }
    console.log(`[Dashboard] Starting optimized data load. User: ${userId}, Force AI recalc: ${forceRecalculateAiTargets}`);
    setIsLoadingInitialData(true); setCriticalError(null); setUiError(null);

    try {
      // Use optimized dashboard service for batch data loading
      const dashboardData = await firebasePerf.measureFirebaseOperation(
        'dashboard-batchGetDashboardData',
        () => batchGetDashboardData({
          userId,
          selectedDate,
          includeDailyLogs: true,
          includeWeeklyData: false, // Will be loaded separately when weekly tab is active
          includeWorkoutData: true,
          includePointsData: true
        })
      );

      console.log("[Dashboard] Optimized data loaded successfully");
      
      let fetchedProfile = dashboardData.userProfile;
      if (!fetchedProfile) throw createFirestoreServiceError("User profile not found. Please complete your profile.", "profile-critical-failure");

      setUserProfile(fetchedProfile);

      // Handle AI targets calculation logic (preserved from original)
      let currentDailyTargets: CalculateTargetsOutput | null = null;
      const profileSufficientForAI = isProfileDataSufficientForAI(fetchedProfile);
      let targetsNeedRecalculation = forceRecalculateAiTargets;

      if (fetchedProfile.useAiTargets) {
          const essentialTargetsMissing = !fetchedProfile.targetCalories || !fetchedProfile.targetProtein || !fetchedProfile.targetCarbs || !fetchedProfile.targetFat || fetchedProfile.targetActivityCalories === undefined;
          if (essentialTargetsMissing && !forceRecalculateAiTargets) {
              console.log("[Dashboard] Essential AI targets missing, flagging for recalculation.");
              targetsNeedRecalculation = true; 
          }
      }
      
      const isFirstTimeSetup = targetsNeedRecalculation && (!fetchedProfile.targetCalories || fetchedProfile.targetCalories <= 0);
      if (isFirstTimeSetup && profileSufficientForAI) {
        console.log("[Dashboard] First time AI target calculation initiated.");
        setIsFirstTimeAITargetCalculation(true);
      }

      if (fetchedProfile.useAiTargets && targetsNeedRecalculation) {
         if (profileSufficientForAI) {
            console.log("[Dashboard] Calculating AI targets...");
            setIsCalculatingAiTargets(true);
            const aiInput: CalculateTargetsInput = { 
                height: fetchedProfile.height!, weight: fetchedProfile.weight!, age: fetchedProfile.age!, 
                gender: fetchedProfile.gender!, activityLevel: fetchedProfile.activityLevel!, fitnessGoal: fetchedProfile.fitnessGoal!, 
                foodPreferences: fetchedProfile.foodPreferences, localFoodStyle: fetchedProfile.localFoodStyle,
            };
            try {
                const calculatedTargetsResult = await calculateDailyTargets(aiInput);
                console.log("[Dashboard] AI targets calculated:", calculatedTargetsResult);
                const maintenanceCals = calculatedTargetsResult.targetCalories + (fetchedProfile.fitnessGoal === 'weight_loss' ? 500 : ['weight_gain', 'muscle_building'].includes(fetchedProfile.fitnessGoal!) ? -300 : 0);
                const updatedProfileDataWithAITargets: Partial<StoredUserProfile> = { 
                    targetCalories: calculatedTargetsResult.targetCalories, targetProtein: calculatedTargetsResult.targetProtein, 
                    targetCarbs: calculatedTargetsResult.targetCarbs, targetFat: calculatedTargetsResult.targetFat,
                    targetActivityCalories: calculatedTargetsResult.targetActivityCalories,
                    maintenanceCalories: maintenanceCals, useAiTargets: true, 
                };
                await saveUserProfile(userId, updatedProfileDataWithAITargets);
                setUserProfile(prev => prev ? { ...prev, ...updatedProfileDataWithAITargets } : null);
                currentDailyTargets = calculatedTargetsResult;
                toast({ title: "AI Targets Updated", description: "Personalized daily goals have been set." });
            } catch (aiError: any) {
                console.error("[Dashboard] AI target calculation error:", aiError);
                const errorMessage = `AI target calc failed: ${aiError.message || 'Unknown error.'}.`;
                setUiError(`${errorMessage} ${fetchedProfile.targetCalories ? 'Using previous goals.' : 'Using default goals.'}`);
                currentDailyTargets = (fetchedProfile.targetCalories && fetchedProfile.targetProtein && fetchedProfile.targetCarbs && fetchedProfile.targetFat && fetchedProfile.targetActivityCalories !== undefined)
                    ? {targetCalories: fetchedProfile.targetCalories, targetProtein: fetchedProfile.targetProtein, targetCarbs: fetchedProfile.targetCarbs, targetFat: fetchedProfile.targetFat, targetActivityCalories: fetchedProfile.targetActivityCalories || 0 } 
                    : { targetCalories: 2000, targetProtein: 100, targetCarbs: 250, targetFat: 70, targetActivityCalories: 300 };
            } finally { setIsCalculatingAiTargets(false); if(isFirstTimeSetup) setIsFirstTimeAITargetCalculation(false); }
         } else {
            setUiError("Profile incomplete. Cannot calculate AI targets. Please complete your profile.");
            currentDailyTargets = null; if(isFirstTimeSetup) setIsFirstTimeAITargetCalculation(false);
         }
      } else if (fetchedProfile.useAiTargets && fetchedProfile.targetCalories && fetchedProfile.targetProtein && fetchedProfile.targetCarbs && fetchedProfile.targetFat && (fetchedProfile.targetActivityCalories !== undefined)) {
          console.log("[Dashboard] Using existing AI targets from profile.");
          currentDailyTargets = { targetCalories: fetchedProfile.targetCalories, targetProtein: fetchedProfile.targetProtein, targetCarbs: fetchedProfile.targetCarbs, targetFat: fetchedProfile.targetFat, targetActivityCalories: fetchedProfile.targetActivityCalories || 0 };
      } else if (!fetchedProfile.useAiTargets) {
          currentDailyTargets = (fetchedProfile.manualTargetCalories && fetchedProfile.manualTargetProtein && fetchedProfile.manualTargetCarbs && fetchedProfile.manualTargetFat && (fetchedProfile.manualTargetActivityCalories !== undefined ))
            ? { targetCalories: fetchedProfile.manualTargetCalories, targetProtein: fetchedProfile.manualTargetProtein, targetCarbs: fetchedProfile.manualTargetCarbs, targetFat: fetchedProfile.manualTargetFat, targetActivityCalories: fetchedProfile.manualTargetActivityCalories ?? 0 }
            : null;
          if (!currentDailyTargets) setUiError("Manual targets selected but not set or invalid. Please update your profile.");
          else console.log("[Dashboard] Using manual targets from profile.");
      }
      setDailyTargets(currentDailyTargets);

      // Set optimized data from batch request
      setWeeklyWorkoutPlan(dashboardData.workoutPlan);
      setCompletedWorkouts(dashboardData.completedWorkouts || {});
      setDailyFoodLogs(dashboardData.dailyFoodLogs);
      setDailyExerciseLogsState(dashboardData.dailyExerciseLogs);

      // Handle workout plan generation if needed
      if (!dashboardData.workoutPlan && profileSufficientForAI && fetchedProfile.useAiTargets && !forceRecalculateAiTargets) {
        setIsGeneratingPlan(true); 
        const aiFitnessGoal = fetchedProfile.fitnessGoal === 'stay_fit' ? 'toning' : (fetchedProfile.fitnessGoal as "weight_loss" | "weight_gain" | "muscle_building" | "recomposition" | "toning");
        const planInput = { weight: fetchedProfile.weight!, age: fetchedProfile.age!, activityLevel: fetchedProfile.activityLevel!, fitnessGoal: aiFitnessGoal, preferFewerRestDays: fetchedProfile.preferFewerRestDays ?? false }; 
        try { 
          const newPlan = await generateWorkoutPlan(planInput); 
          const convertedPlan: WeeklyWorkoutPlan = {
            Monday: newPlan.Monday.map(exercise => ({ ...exercise, youtubeLink: exercise.youtubeLink ?? undefined })),
            Tuesday: newPlan.Tuesday.map(exercise => ({ ...exercise, youtubeLink: exercise.youtubeLink ?? undefined })),
            Wednesday: newPlan.Wednesday.map(exercise => ({ ...exercise, youtubeLink: exercise.youtubeLink ?? undefined })),
            Thursday: newPlan.Thursday.map(exercise => ({ ...exercise, youtubeLink: exercise.youtubeLink ?? undefined })),
            Friday: newPlan.Friday.map(exercise => ({ ...exercise, youtubeLink: exercise.youtubeLink ?? undefined })),
            Saturday: newPlan.Saturday.map(exercise => ({ ...exercise, youtubeLink: exercise.youtubeLink ?? undefined })),
            Sunday: newPlan.Sunday.map(exercise => ({ ...exercise, youtubeLink: exercise.youtubeLink ?? undefined }))
          };
          
          await saveWorkoutPlan(userId, newPlan); 
          setWeeklyWorkoutPlan(convertedPlan); 
          toast({ title: "Workout Plan Generated!" }); 
        } catch (planError: any) { 
          console.error("[Dashboard] Error auto-generating workout plan:", planError); 
          setUiError(prev => `${prev ? prev + ' ' : ''}AI plan generation failed: ${planError.message}.`); 
        } finally { setIsGeneratingPlan(false); } 
      }
      
      // Process initial daily data
      if (dashboardData.dailyNutritionSummary) {
        processLogsAndUpdateState('daily', [dashboardData.dailyNutritionSummary], dashboardData.dailyExerciseLogs);
      } else {
        console.warn("[Dashboard] Today's summary not available for initial processing.");
        processLogsAndUpdateState('daily', [], dashboardData.dailyExerciseLogs);
      }

      // Initialize weekly data with today's data
      setWeeklyNutritionSummaries([]);
      setAllWeeklyExerciseLogs(dashboardData.dailyExerciseLogs);
      
      if (!fetchedProfile.height || !fetchedProfile.weight || !fetchedProfile.age || !fetchedProfile.gender || !fetchedProfile.activityLevel || !fetchedProfile.fitnessGoal) {
          setCriticalError("Your profile is incomplete. Please update it for personalized experience.");
      }
      setHasLoadedInitialData(true);
      console.log("[Dashboard] Optimized initial data load finished.");
    } catch (err: any) {
      let errorMsg = err.message || "Could not load dashboard data.";
      if (err.code === "profile-critical-failure" || (err.message && err.message.includes("User profile not found"))) {
          errorMsg = "User profile not found or incomplete. Please complete your profile.";
          setCriticalError(errorMsg);
      } else {
          setCriticalError(errorMsg);
      }
      console.error("[Dashboard] Error loading dashboard data:", err);
      setUserProfile(null); setWeeklyWorkoutPlan(null); setDailyTargets(null);
      setDailyFoodLogs([]); setDailyExerciseLogsState([]); setWeeklyNutritionSummaries([]); setAllWeeklyExerciseLogs([]); setCompletedWorkouts({});
      setHasLoadedInitialData(true); setIsFirstTimeAITargetCalculation(false);
    } finally { setIsLoadingInitialData(false); }
  }, [userId, isClient, toast, router, isProfileDataSufficientForAI, getDateRange, processLogsAndUpdateState]);

  const fetchWeeklyLogsAndProcess = useCallback(async () => {
    if (!userId || !isClient || isFetchingWeeklyLogsRef.current || !hasLoadedInitialData) return;
  
    const currentWeekDateRange = getDateRange('weekly', selectedDate);
    const currentWeekKey = `${format(currentWeekDateRange.start, 'yyyy-MM-dd')}_${format(currentWeekDateRange.end, 'yyyy-MM-dd')}`;
    
    if (lastFetchedWeeklyRangeKey === currentWeekKey && weeklyNutritionSummaries.length > 0 && allWeeklyExerciseLogs.length > 0) {
      console.log("[Dashboard] Using cached weekly nutrition summaries and exercise logs for key:", currentWeekKey);
      processLogsAndUpdateState('weekly', weeklyNutritionSummaries, allWeeklyExerciseLogs);
      return;
    }
    
    console.log("[Dashboard] Fetching weekly data using optimized service for key:", currentWeekKey);
    isFetchingWeeklyLogsRef.current = true; setUiError(null);
    try {
      // Use optimized dashboard service for weekly data
      const weeklyData = await batchGetDashboardData({
        userId,
        selectedDate,
        includeDailyLogs: false,
        includeWeeklyData: true,
        includeWorkoutData: false,
        includePointsData: false
      });

      setWeeklyNutritionSummaries(weeklyData.weeklyNutritionSummaries);
      setAllWeeklyExerciseLogs(weeklyData.weeklyExerciseLogs);
      setLastFetchedWeeklyRangeKey(currentWeekKey);
      processLogsAndUpdateState('weekly', weeklyData.weeklyNutritionSummaries, weeklyData.weeklyExerciseLogs);
      console.log("[Dashboard] Weekly logs fetched and processed for key:", currentWeekKey);
    } catch (err: any) {
      console.error("[Dashboard] Error fetching weekly logs:", err);
      setUiError(prev => `${prev ? prev + ' ' : ''}Could not load weekly data: ${err.message}.`);
      processLogsAndUpdateState('weekly', [], dailyExerciseLogsState); 
    } finally {
      isFetchingWeeklyLogsRef.current = false;
    }
  }, [
      userId, isClient, selectedDate, getDateRange, lastFetchedWeeklyRangeKey, 
      processLogsAndUpdateState, hasLoadedInitialData, dailyExerciseLogsState, weeklyNutritionSummaries, allWeeklyExerciseLogs
  ]);

  useEffect(() => {
    if (!authLoading && userId && !hasLoadedInitialData && isClient) {
      loadInitialDashboardData(false); // Never force recalculate from initial load
    } else if (!authLoading && !userId && isClient) {
      setIsLoadingInitialData(false); setCriticalError("Access Denied. Please log in.");
    }
  }, [authLoading, userId, hasLoadedInitialData, loadInitialDashboardData, isClient, router]);

  useEffect(() => {
    if (!hasLoadedInitialData || isLoadingInitialData || !isClient || !userProfile) return;

    console.log(`[Dashboard] Active tab or date changed to: ${activePeriodTab}. User profile available.`);
    if (activePeriodTab === 'daily') {
        const todayDateKey = format(new Date(), 'yyyy-MM-dd');
        
        // Check if today's data is actually from today and has entries
        const isTodayDataValid = userProfile && 
            userProfile.todayLastUpdated && 
            userProfile.todayEntryCount && 
            userProfile.todayEntryCount > 0 &&
            (() => {
                // Handle both string and Timestamp types
                const lastUpdatedDate = userProfile.todayLastUpdated instanceof Timestamp 
                    ? userProfile.todayLastUpdated.toDate() 
                    : new Date(userProfile.todayLastUpdated);
                return format(lastUpdatedDate, 'yyyy-MM-dd') === todayDateKey;
            })();
        
        const todaysSummary = isTodayDataValid ? {
            id: todayDateKey, totalCalories: userProfile.todayCalories ?? 0, totalProtein: userProfile.todayProtein ?? 0,
            totalCarbohydrates: userProfile.todayCarbohydrates ?? 0, totalFat: userProfile.todayFat ?? 0,
            entryCount: userProfile.todayEntryCount ?? 0, lastUpdated: userProfile.todayLastUpdated ?? new Date().toISOString()
        } : null;
        
        if(todaysSummary) {
            processLogsAndUpdateState('daily', [todaysSummary], dailyExerciseLogsState);
        } else {
            processLogsAndUpdateState('daily', [], dailyExerciseLogsState);
        }
    } else if (activePeriodTab === 'weekly') {
      fetchWeeklyLogsAndProcess();
    }
  }, [activePeriodTab, selectedDate, userProfile, dailyExerciseLogsState, hasLoadedInitialData, isLoadingInitialData, isClient, processLogsAndUpdateState, fetchWeeklyLogsAndProcess]);
  
  const fetchCalorieSuggestion = useCallback(async () => {
    if (!userId || !userProfile || !dailyTargets || activePeriodTab !== 'daily' || isFetchingSuggestionRef.current) return;
    
    isFetchingSuggestionRef.current = true; setIsLoadingSuggestion(true); setUiError(null); 
    try {
      const input: SuggestCalorieAdjustmentInput = {
        userId,
        currentCaloriesConsumed: userProfile.todayCalories ?? 0, // Use today's summary from profile
        currentCaloriesBurned: periodTotals.caloriesBurned, // Still from processed exercise logs for today
        targetCalories: dailyTargets.targetCalories,
        targetActivityCalories: userProfile.useAiTargets ? userProfile.targetActivityCalories ?? 0 : userProfile.manualTargetActivityCalories ?? 0,
        maintenanceCalories: userProfile.maintenanceCalories || dailyTargets.targetCalories, 
        fitnessGoal: userProfile.fitnessGoal!,
        activityLevel: userProfile.activityLevel || undefined,
      };
      const suggestion = await suggestCalorieAdjustment(input);
      setCalorieAdjustmentSuggestion(suggestion);
    } catch (err: any) {
      setUiError(prev => `${prev ? prev + ' ' : ''}Could not get AI action tip: ${err.message}.`);
      setCalorieAdjustmentSuggestion(null);
    } finally { setIsLoadingSuggestion(false); isFetchingSuggestionRef.current = false; }
  }, [userId, userProfile, dailyTargets, periodTotals.caloriesBurned, activePeriodTab]); 

  useEffect(() => {
    if (hasLoadedInitialData && !isLoadingInitialData && isClient && activePeriodTab === 'daily' && userProfile && dailyTargets) {
        // Recalculate periodTotals for daily based on userProfile.today... to ensure suggestion uses most current data
        const currentDailyBurn = dailyExerciseLogsState.reduce((sum, log) => sum + (Number(log.estimatedCaloriesBurned) || 0), 0);
        const updatedPeriodTotalsForSuggestion = {
            calories: userProfile.todayCalories ?? 0,
            protein: userProfile.todayProtein ?? 0,
            carbohydrates: userProfile.todayCarbohydrates ?? 0,
            fat: userProfile.todayFat ?? 0,
            caloriesBurned: currentDailyBurn
        };
        // Directly use updated values for suggestion fetch
        if (!isFetchingSuggestionRef.current) {
            fetchCalorieSuggestion();
        }
    } else {
        setCalorieAdjustmentSuggestion(null);
    }
  }, [userProfile, dailyTargets, dailyExerciseLogsState, activePeriodTab, fetchCalorieSuggestion, hasLoadedInitialData, isLoadingInitialData, isClient]); // Depend on userProfile.today... for suggestion

  const handleRecalculateAiTargets = useCallback(() => {
    if (!userProfile) { toast({ title: "Profile Error", description: "Profile not loaded.", variant: "destructive" }); return; }
    if (userProfile.useAiTargets) { 
      setIsFirstTimeAITargetCalculation(true); 
      loadInitialDashboardData(true); 
    } else { 
      toast({ title: "Manual Targets Active", description: "Switch to AI targets in profile to recalculate." }) 
    }
  }, [userProfile, toast, loadInitialDashboardData]);

  const handleRegenerateWorkoutPlan = useCallback(async () => {
    if (!userId || !userProfile || !isProfileDataSufficientForAI(userProfile)) {
      toast({ variant: "destructive", title: "Cannot Regenerate", description: !isProfileDataSufficientForAI(userProfile) ? "Profile incomplete for AI plan." : "Regeneration conditions not met." });
      if(!isProfileDataSufficientForAI(userProfile) && router) router.push('/profile'); return;
    }
    setIsGeneratingPlan(true); setUiError(null);
    const todayDateKey = format(new Date(), 'yyyy-MM-dd');
    const workoutPlanCacheKey = `${LOCAL_STORAGE_KEYS.WORKOUT_PLAN_PREFIX}${userId}`;
    try {
      // Map user profile fitness goal to AI flow fitness goal
      const aiFitnessGoal = userProfile.fitnessGoal === 'stay_fit' ? 'toning' : userProfile.fitnessGoal!;
      const planInput = { weight: userProfile.weight!, age: userProfile.age!, activityLevel: userProfile.activityLevel!, fitnessGoal: aiFitnessGoal as "weight_loss" | "weight_gain" | "muscle_building" | "recomposition" | "toning", preferFewerRestDays: userProfile.preferFewerRestDays ?? false };
      const aiPlan = await generateWorkoutPlan(planInput);
      
      // Convert AI flow workout plan to dashboard format
      const convertedPlan: WeeklyWorkoutPlan = {
        Monday: aiPlan.Monday.map(exercise => ({ ...exercise, youtubeLink: exercise.youtubeLink ?? undefined })),
        Tuesday: aiPlan.Tuesday.map(exercise => ({ ...exercise, youtubeLink: exercise.youtubeLink ?? undefined })),
        Wednesday: aiPlan.Wednesday.map(exercise => ({ ...exercise, youtubeLink: exercise.youtubeLink ?? undefined })),
        Thursday: aiPlan.Thursday.map(exercise => ({ ...exercise, youtubeLink: exercise.youtubeLink ?? undefined })),
        Friday: aiPlan.Friday.map(exercise => ({ ...exercise, youtubeLink: exercise.youtubeLink ?? undefined })),
        Saturday: aiPlan.Saturday.map(exercise => ({ ...exercise, youtubeLink: exercise.youtubeLink ?? undefined })),
        Sunday: aiPlan.Sunday.map(exercise => ({ ...exercise, youtubeLink: exercise.youtubeLink ?? undefined })),
      };
      
      await saveWorkoutPlan(userId, convertedPlan); 
      setWeeklyWorkoutPlan(convertedPlan);
      if (isClient) localStorage.setItem(workoutPlanCacheKey, JSON.stringify({ date: todayDateKey, plan: convertedPlan }));
      toast({ title: "Workout Plan Regenerated!" });
    } catch (planError: any) { 
      setUiError(`AI plan generation failed: ${planError.message}.`); 
      toast({ variant: "destructive", title: "Plan Error", description: planError.message });
    } finally { setIsGeneratingPlan(false); }
  }, [userId, userProfile, toast, router, isProfileDataSufficientForAI, isClient]);

  const handleLogCompletedWorkout = useCallback(async (exercise: ExerciseDetail, burnedCalories?: number, isEstimated: boolean = false) => {
    if (!userId || !userProfile) return;
    
    let inferredType: "cardio" | "strength" | "flexibility" | "other" = "other";
    const exNameLower = exercise.exercise.toLowerCase();
    if (["running", "cycling", "elliptical", "stair climber", "jump rope"].some(type => exNameLower.includes(type))) inferredType = "cardio";
    else if (["squat", "press", "deadlift", "row", "curl", "pushup", "pullup", "extension"].some(type => exNameLower.includes(type))) inferredType = "strength";
    else if (["stretch", "yoga"].some(type => exNameLower.includes(type))) inferredType = "flexibility";


    const logTimestamp = new Date();
    const todayDateKey = format(logTimestamp, 'yyyy-MM-dd');
    const dailyExerciseLogsCacheKey = `${LOCAL_STORAGE_KEYS.DAILY_EXERCISE_LOGS_PREFIX}${userId}-${todayDateKey}`;
    const completedWorkoutsCacheKey = `${LOCAL_STORAGE_KEYS.COMPLETED_WORKOUTS_PREFIX}${userId}-${todayDateKey}`;

    const newEntryData = {
      exerciseName: exercise.exercise, exerciseType: inferredType, timestamp: logTimestamp.toISOString(),
      duration: typeof exercise.reps === 'string' && exercise.reps.match(/\d+\s*(min|sec|s)/i) ? parseInt(exercise.reps) : undefined, 
      sets: exercise.sets ?? null, reps: exercise.reps ?? null,
      estimatedCaloriesBurned: burnedCalories ? Math.round(burnedCalories) : null,
      notes: `Completed: ${exercise.notes || ''}`.trim()
    };
    try {
      const logId = await addExerciseLog(userId, newEntryData);
      const completedEntryData: CompletedWorkoutEntry = { completed: true, loggedCalories: newEntryData.estimatedCaloriesBurned ?? null, isEstimated: isEstimated, timestamp: logTimestamp.toISOString(), logId: logId };
      await saveCompletedWorkout(userId, todayDateKey, exercise.exercise, completedEntryData);
      
      setCompletedWorkouts(prev => { const updated = { ...prev, [exercise.exercise]: completedEntryData }; if(isClient) localStorage.setItem(completedWorkoutsCacheKey, JSON.stringify(updated)); return updated; });

      const newStoredLog: StoredExerciseLogEntry = { ...newEntryData, id: logId, timestamp: newEntryData.timestamp as string, estimatedCaloriesBurned: newEntryData.estimatedCaloriesBurned ?? undefined };
      
      if (isSameDay(logTimestamp, selectedDate)) {
        setDailyExerciseLogsState(prev => { 
            const updatedLogs = [...prev, newStoredLog].sort((a,b) => parseISO(b.timestamp).getTime() - parseISO(a.timestamp).getTime()); 
            if(isClient) localStorage.setItem(dailyExerciseLogsCacheKey, JSON.stringify(updatedLogs));
            // Trigger re-processing for daily tab if it's active
            if(activePeriodTab === 'daily' && userProfile) {
                 const todaysSummary = {
                    id: todayDateKey, totalCalories: userProfile.todayCalories ?? 0, totalProtein: userProfile.todayProtein ?? 0,
                    totalCarbohydrates: userProfile.todayCarbohydrates ?? 0, totalFat: userProfile.todayFat ?? 0,
                    entryCount: userProfile.todayEntryCount ?? 0, lastUpdated: userProfile.todayLastUpdated ?? new Date().toISOString()
                };
                processLogsAndUpdateState('daily', [todaysSummary], updatedLogs);
            }
            return updatedLogs; 
        });
      }
      const currentWeeklyRange = getDateRange('weekly', selectedDate);
      if (isWithinInterval(logTimestamp, { start: currentWeeklyRange.start, end: currentWeeklyRange.end })) {
          setAllWeeklyExerciseLogs(prev => [...prev, newStoredLog].sort((a,b) => parseISO(b.timestamp).getTime() - parseISO(a.timestamp).getTime()));
          if(activePeriodTab === 'weekly') fetchWeeklyLogsAndProcess(); // Re-process weekly if it's active
      }
      if (!isEstimated) toast({ title: "Workout Logged!" });
    } catch (e: any) { toast({ variant: "destructive", title: "Logging Error", description: e.message }); }
  }, [userId, userProfile, toast, isClient, selectedDate, getDateRange, fetchWeeklyLogsAndProcess, processLogsAndUpdateState, activePeriodTab]);

  const estimateAndLogCalories = useCallback(async (exercise: ExerciseDetail) => {
    if (!userId || !userProfile?.weight) {
      if (userProfile && (!userProfile.weight || userProfile.weight <= 0)) handleLogCompletedWorkout(exercise, undefined, false);
      else toast({ variant: "destructive", title: "Error", description: "User weight needed for AI calorie estimation." });
      return;
    }
    setIsEstimatingCalories(exercise.exercise);
    try {
      const input: EstimateCaloriesBurnedInput = { 
        exerciseName: exercise.exercise, 
        exerciseType: "strength", // Default, can be refined
        duration: typeof exercise.reps === 'string' && exercise.reps.includes('min') ? parseInt(exercise.reps) : undefined,
        sets: exercise.sets ?? undefined,
        reps: typeof exercise.reps === 'string' && exercise.reps.match(/^\d+(-\d+)?$/) ? parseInt(exercise.reps.split('-')[0]) : undefined, // Take first number if range
        userWeight: userProfile.weight 
      };
      const result = await estimateCaloriesBurned(input);
      handleLogCompletedWorkout(exercise, result.estimatedCalories, true);
      toast({ title: "Calories Estimated!", description: `~${result.estimatedCalories} kcal for ${exercise.exercise}.` });
    } catch (error: any) { 
      toast({ variant: "destructive", title: "Estimation Failed", description: `Logging ${exercise.exercise} without calories. ${error.message}` }); 
      handleLogCompletedWorkout(exercise, undefined, false);
    } finally { setIsEstimatingCalories(null); }
  }, [userId, userProfile, toast, handleLogCompletedWorkout]);

  const handleToggleWorkoutComplete = useCallback(async (exerciseName: string, currentStatus: boolean) => {
    if (!userId || !userProfile) { return; }
    
    const todayDateKey = format(new Date(), 'yyyy-MM-dd');
    const exerciseDetail = weeklyWorkoutPlan ? weeklyWorkoutPlan[todayDayName as keyof WeeklyWorkoutPlan]?.find((ex: ExerciseDetail) => ex.exercise === exerciseName) : null;
    const completedEntry = completedWorkouts ? completedWorkouts[exerciseName] : null;
    const completedWorkoutsCacheKey = `${LOCAL_STORAGE_KEYS.COMPLETED_WORKOUTS_PREFIX}${userId}-${todayDateKey}`;
    const dailyExerciseLogsCacheKey = `${LOCAL_STORAGE_KEYS.DAILY_EXERCISE_LOGS_PREFIX}${userId}-${todayDateKey}`;

    if (!currentStatus) { 
      const optimisticEntry: CompletedWorkoutEntry = { completed: true, timestamp: new Date().toISOString(), logId: null, loggedCalories: null, isEstimated: null };
      setCompletedWorkouts(prev => { const updated = { ...prev, [exerciseName]: optimisticEntry }; if(isClient) localStorage.setItem(completedWorkoutsCacheKey, JSON.stringify(updated)); return updated; });
      
      if (exerciseDetail && exerciseName.toLowerCase() !== 'rest') {
        if (userProfile.weight && userProfile.weight > 0) await estimateAndLogCalories(exerciseDetail);
        else { toast({ title: "Weight Needed for AI Estimate", description: "Logging workout without estimated calories." }); await handleLogCompletedWorkout(exerciseDetail, undefined, false); }
      } else if (exerciseDetail) { await saveCompletedWorkout(userId, todayDateKey, exerciseName, optimisticEntry); }
    } else { 
      setCompletedWorkouts(prev => { const updated = { ...prev }; delete updated[exerciseName]; if(isClient) localStorage.setItem(completedWorkoutsCacheKey, JSON.stringify(updated)); return updated; });
      try {
        await deleteCompletedWorkout(userId, todayDateKey, exerciseName);
        if (completedEntry?.logId) {
          await deleteLogEntry(userId, 'exerciseLog', completedEntry.logId);
          if (isClient && isSameDay(parseISO(completedEntry.timestamp), selectedDate)) {
            setDailyExerciseLogsState(prev => { 
                const updatedLogs = prev.filter(log => log.id !== completedEntry.logId); 
                localStorage.setItem(dailyExerciseLogsCacheKey, JSON.stringify(updatedLogs));
                // Trigger re-processing for daily tab if it's active
                if(activePeriodTab === 'daily' && userProfile) {
                    const todaysSummary = {
                        id: todayDateKey, totalCalories: userProfile.todayCalories ?? 0, totalProtein: userProfile.todayProtein ?? 0,
                        totalCarbohydrates: userProfile.todayCarbohydrates ?? 0, totalFat: userProfile.todayFat ?? 0,
                        entryCount: userProfile.todayEntryCount ?? 0, lastUpdated: userProfile.todayLastUpdated ?? new Date().toISOString()
                    };
                    processLogsAndUpdateState('daily', [todaysSummary], updatedLogs);
                }
                return updatedLogs;
            });
          }
          const currentWeeklyRange = getDateRange('weekly', selectedDate);
          if (isWithinInterval(parseISO(completedEntry.timestamp), { start: currentWeeklyRange.start, end: currentWeeklyRange.end })) {
              setAllWeeklyExerciseLogs(prev => prev.filter(log => log.id !== completedEntry.logId));
              if(activePeriodTab === 'weekly') fetchWeeklyLogsAndProcess(); // Re-process weekly if it's active
          }
        }
        toast({ title: "Workout Unchecked" });
      } catch (e: any) {
        toast({ variant: "destructive", title: "Update Error", description: e.message });
        if (completedEntry) setCompletedWorkouts(prev => { const updated = { ...prev, [exerciseName]: completedEntry }; if(isClient) localStorage.setItem(completedWorkoutsCacheKey, JSON.stringify(updated)); return updated; });
      }
    }
  }, [userId, userProfile, toast, weeklyWorkoutPlan, todayDayName, completedWorkouts, isClient, selectedDate, getDateRange, estimateAndLogCalories, handleLogCompletedWorkout, createFirestoreServiceError, fetchWeeklyLogsAndProcess, processLogsAndUpdateState, activePeriodTab]);

  const todayDateKeyForVisibility = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);

  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && userId && isClient && hasLoadedInitialData) {
        console.log("[Dashboard] Tab became visible, refreshing profile and potentially daily data from cache/server.");
        try {
          let freshProfile = await getUserProfile(userId); 
          const profileTodayLastUpdated = freshProfile.todayLastUpdated ? 
            ((typeof freshProfile.todayLastUpdated === 'string') ? parseISO(freshProfile.todayLastUpdated) : (freshProfile.todayLastUpdated as Timestamp).toDate())
            : null;

          if (!profileTodayLastUpdated || !isSameDay(profileTodayLastUpdated, new Date())) {
              console.log("[Dashboard] Profile's todayLastUpdated is stale on visibility change, refreshing today's summary...");
              const dailySummaries = await getDailyNutritionSummaries(userId, startOfDay(new Date()), endOfDay(new Date()));
              const todaysSummaryDoc = dailySummaries.find(s => s.id === todayDateKeyForVisibility);
              const updatedTodayData: Partial<StoredUserProfile> = {
                  todayCalories: todaysSummaryDoc?.totalCalories ?? 0, todayProtein: todaysSummaryDoc?.totalProtein ?? 0,
                  todayCarbohydrates: todaysSummaryDoc?.totalCarbohydrates ?? 0, todayFat: todaysSummaryDoc?.totalFat ?? 0,
                  todayEntryCount: todaysSummaryDoc?.entryCount ?? 0,
              };
              await saveUserProfile(userId, updatedTodayData);
              freshProfile = { ...freshProfile, ...updatedTodayData, todayLastUpdated: new Date().toISOString() };
          }
          setUserProfile(freshProfile);

          // Refresh daily exercise logs from localStorage or server
          const dailyExerciseLogsCacheKey = `${LOCAL_STORAGE_KEYS.DAILY_EXERCISE_LOGS_PREFIX}${userId}-${todayDateKeyForVisibility}`;
          let newDailyExercise: StoredExerciseLogEntry[] = [];
          const cachedEx = localStorage.getItem(dailyExerciseLogsCacheKey);
          if (cachedEx) try {newDailyExercise = JSON.parse(cachedEx)} catch(e) {localStorage.removeItem(dailyExerciseLogsCacheKey)}
          
          if (newDailyExercise.length === 0 || !isSameDay(parseISO(newDailyExercise[0]?.timestamp || '1970-01-01'), new Date())) { // Basic check if cache might be old
            newDailyExercise = await getExerciseLogs(userId, startOfDay(new Date()), endOfDay(new Date()));
            localStorage.setItem(dailyExerciseLogsCacheKey, JSON.stringify(newDailyExercise));
          }
          setDailyExerciseLogsState(newDailyExercise);

        } catch (error) { console.error("[Dashboard] Error refreshing data on visibility change:", error); }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [userId, isClient, hasLoadedInitialData, todayDateKeyForVisibility]);

  const canRegenerateWorkoutPlan = useMemo(() => {
    if (isGeneratingPlan || !weeklyWorkoutPlan || Object.keys(weeklyWorkoutPlan).length === 0) return true;
    const todayWorkoutsList = weeklyWorkoutPlan[todayDayName as keyof WeeklyWorkoutPlan] || [];
    if (todayWorkoutsList.length === 0 || (todayWorkoutsList.length === 1 && todayWorkoutsList[0].exercise.toLowerCase() === 'rest')) return true;
    const safeCompleted = completedWorkouts || {};
    return !todayWorkoutsList.some((ex: ExerciseDetail) => ex.exercise.toLowerCase() !== 'rest' && safeCompleted[ex.exercise]?.completed);
  }, [completedWorkouts, isGeneratingPlan, weeklyWorkoutPlan, todayDayName]);

  if (authLoading && !isClient) return <DashboardLoadingSkeleton />;
  if (!userId && !authLoading && isClient) return <DashboardErrorState message="Access Denied. Please log in." onRetry={() => router ? router.push('/authorize') : window.location.href = '/authorize'} />;
  if (isLoadingInitialData && !hasLoadedInitialData) return <DashboardLoadingSkeleton />;
  if (criticalError) return (<DashboardErrorState message={criticalError} onRetry={() => { setCriticalError(null); setUiError(null); setHasLoadedInitialData(false); loadInitialDashboardData(); }} isProfileError={criticalError.includes("profile")} />);

  const targetActivityCaloriesToday = userProfile?.useAiTargets ? userProfile?.targetActivityCalories : userProfile?.manualTargetActivityCalories;
  const actualBurnForDisplay = activePeriodTab === 'daily' ? periodTotals.caloriesBurned : allWeeklyExerciseLogs.reduce((sum, log) => sum + (Number(log.estimatedCaloriesBurned) || 0), 0);


  return (
    <motion.div 
      className="relative flex flex-col min-h-screen bg-gradient-to-br from-primary/5 via-background to-muted/50 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-primary/15 to-accent/10 rounded-full blur-3xl"
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ 
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-secondary/15 to-primary/10 rounded-full blur-3xl"
          animate={{ 
            scale: [1.2, 1, 1.2],
            rotate: [360, 180, 0],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{ 
            duration: 30,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-gradient-to-r from-accent/10 to-muted/20 rounded-full blur-2xl"
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.1, 0.3, 0.1]
          }}
          transition={{ 
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      <AnimatePresence>
        {isFirstTimeAITargetCalculation && (
          <motion.div 
            className="fixed inset-0 bg-black/60 backdrop-blur-md flex flex-col items-center justify-center z-[100]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 50 }}
              transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <Card className="bg-card/95 backdrop-blur-lg p-6 sm:p-8 rounded-xl shadow-2xl text-center max-w-sm mx-4 border border-border/50">
                <motion.div 
                  className="flex justify-center items-center mb-5"
                  initial={{ rotate: 0 }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <Loader2 className="h-12 w-12 text-primary" />
                </motion.div>
                <motion.p 
                  className="text-lg sm:text-xl font-semibold text-foreground mb-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  Personalizing Your Targets...
                </motion.p>
                <motion.p 
                  className="text-sm text-muted-foreground"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  Bago AI is crafting your optimal daily goals. **This might take a minute for the first time.**
                </motion.p>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        className="p-4 md:p-6 lg:p-8 relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <motion.main 
          className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
        <motion.div 
          className="lg:col-span-2"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <DashboardMainContent
            error={uiError} userProfile={userProfile} dailyTargets={dailyTargets}
            periodTotals={periodTotals} activePeriodTab={activePeriodTab} setActivePeriodTab={setActivePeriodTab}
            handleRecalculateAiTargets={handleRecalculateAiTargets} isCalculatingTargets={isCalculatingAiTargets}
            isLoadingTotals={isLoadingInitialData}
            weeklyWorkoutPlan={weeklyWorkoutPlan}
            isGeneratingPlan={isGeneratingPlan} completedWorkouts={completedWorkouts}
            handleToggleWorkoutComplete={handleToggleWorkoutComplete} handleLogCompletedWorkout={handleLogCompletedWorkout}
            handleRegenerateWorkoutPlan={handleRegenerateWorkoutPlan} canRegenerateWorkoutPlan={canRegenerateWorkoutPlan}
            isEstimatingCalories={isEstimatingCalories} estimateAndLogCalories={estimateAndLogCalories}
            calorieAdjustmentSuggestion={calorieAdjustmentSuggestion} isLoadingSuggestion={isLoadingSuggestion}
            targetActivityCaloriesToday={targetActivityCaloriesToday ?? 0}
          />
        </motion.div>
        <motion.div 
          className="lg:col-span-1"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <DashboardSidebar />
        </motion.div>
        </motion.main>
        
        <motion.footer 
          className="mt-12 pt-8 text-center text-xs text-muted-foreground border-t border-border/30 relative z-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 1 }}
          >
            Bago Fitness AI - Your Personalized Path to Wellness
          </motion.div>
        </motion.footer>
      </motion.div>
    </motion.div>
  );
}
