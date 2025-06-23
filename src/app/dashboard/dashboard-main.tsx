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
} from '@/services/firestore';
import { createFirestoreServiceError } from '@/services/firestore/utils';
import { db } from '@/lib/firebase/exports';
import {
  doc, getDoc, setDoc, collection, query, where, getDocs, orderBy, runTransaction, serverTimestamp
} from 'firebase/firestore';

import { calculateDailyTargets, CalculateTargetsInput, CalculateTargetsOutput } from '@/ai/flows/dashboard-update';
import { generateWorkoutPlan, WeeklyWorkoutPlan as AIWeeklyWorkoutPlan, ExerciseDetail as AIExerciseDetail } from '@/ai/flows/generate-workout-plan';
import { estimateCaloriesBurned, EstimateCaloriesBurnedInput } from '@/ai/flows/estimate-calories-burned';
import type { SuggestCalorieAdjustmentInput, SuggestCalorieAdjustmentOutput } from '@/app/dashboard/types';

import DashboardMainContent from './DashboardMainContent';
import DashboardSidebar from './DashboardSidebar';
import DashboardLoadingSkeleton from './DashboardLoadingSkeleton';
import DashboardErrorState from '@/components/dashboard/DashboardErrorState';
import { logAccessDeniedError, clearAuthCookies, handleImmediateAccessDeniedRedirect } from '@/services/error-logging';

// Types
import type {
    StoredUserProfile, PeriodTotals, CompletedWorkouts, FitnessTipData,
    StoredFoodLogEntry, StoredExerciseLogEntry, DailyNutritionSummary,
    CompletedWorkoutEntry, WeeklyWorkoutPlan, ExerciseDetail
} from './types';
import { useToast } from "@/hooks/use-toast";
import { Card } from '@/components/ui/card';
import { Loader2, Calendar, User } from 'lucide-react';
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
    // Detect dark mode via HTML class (from settings page)
    const [isDark, setIsDark] = useState<boolean>(false);
    useEffect(() => {
        const updateDark = () => setIsDark(document.documentElement.classList.contains('dark'));
        updateDark();
        const observer = new MutationObserver(updateDark);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

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
    const [activePeriodTab, setActivePeriodTab] = useState<'daily' | 'weekly' | 'ai-targets'>('daily');
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

    // Get day name for display
    const getDayName = () => {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return days[new Date().getDay()];
    };

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
          console.log("[Dashboard] First time target calculation initiated.");
          setIsFirstTimeAITargetCalculation(true);
        }

        if (fetchedProfile.useAiTargets && targetsNeedRecalculation) {
           if (profileSufficientForAI) {
              console.log("[Dashboard] Calculating nutritional targets...");
              setIsCalculatingAiTargets(true);
              const targetInput: CalculateTargetsInput = { 
                  height: fetchedProfile.height!, weight: fetchedProfile.weight!, age: fetchedProfile.age!, 
                  gender: fetchedProfile.gender!, activityLevel: fetchedProfile.activityLevel!, fitnessGoal: fetchedProfile.fitnessGoal!, 
                  foodPreferences: fetchedProfile.foodPreferences, localFoodStyle: fetchedProfile.localFoodStyle,
              };
              try {
                  const calculatedTargetsResult = await calculateDailyTargets(targetInput);
                  console.log("[Dashboard] Nutritional targets calculated:", calculatedTargetsResult);
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
                  toast({ title: "Targets Calculated!", description: "Personalized daily goals have been set (BMR/TDEE-based)." });
              } catch (aiError: any) {
                  console.error("[Dashboard] Target calculation error:", aiError);
                  const errorMessage = `Target calculation failed: ${aiError.message || 'Unknown error.'}.`;
                  setUiError(`${errorMessage} ${fetchedProfile.targetCalories ? 'Using previous goals.' : 'Using default goals.'}`);
                  currentDailyTargets = (fetchedProfile.targetCalories && fetchedProfile.targetProtein && fetchedProfile.targetCarbs && fetchedProfile.targetFat && fetchedProfile.targetActivityCalories !== undefined)
                      ? {targetCalories: fetchedProfile.targetCalories, targetProtein: fetchedProfile.targetProtein, targetCarbs: fetchedProfile.targetCarbs, targetFat: fetchedProfile.targetFat, targetActivityCalories: fetchedProfile.targetActivityCalories || 0 } 
                      : { targetCalories: 2000, targetProtein: 100, targetCarbs: 250, targetFat: 70, targetActivityCalories: 300 };
              } finally { setIsCalculatingAiTargets(false); setIsFirstTimeAITargetCalculation(false); }
           } else {
              setUiError("Profile incomplete. Cannot calculate nutritional targets. Please complete your profile.");
              currentDailyTargets = null; if(isFirstTimeSetup) setIsFirstTimeAITargetCalculation(false);
           }
        } else if (fetchedProfile.useAiTargets && fetchedProfile.targetCalories && fetchedProfile.targetProtein && fetchedProfile.targetCarbs && fetchedProfile.targetFat && (fetchedProfile.targetActivityCalories !== undefined)) {
            console.log("[Dashboard] Using existing calculated targets from profile.");
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
      setIsClient(true);
    }, []);

    const handleAccessDeniedNavigation = useCallback(async (reason: string) => {
      try {
        // This will clear cookies, navigate immediately, and refresh in 0.1s
        await logAccessDeniedError(userId, reason, {
          authLoading,
          hasUserId: !!userId,
          currentPath: typeof window !== 'undefined' ? window.location.pathname : undefined,
          timestamp: new Date().toISOString(),
          userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
        });
      } catch (error) {
        console.error('[Dashboard] Error during access denied handling:', error);
        // Fallback: still clear cookies and navigate immediately
        clearAuthCookies();
        handleImmediateAccessDeniedRedirect();
      }
    }, [userId, authLoading]);

    useEffect(() => {
      if (!authLoading && userId && !hasLoadedInitialData && isClient) {
        loadInitialDashboardData(false);
      } else if (!authLoading && !userId && isClient) {
        setIsLoadingInitialData(false);
        const reason = "User not authenticated";
        setCriticalError("Access Denied. Please log in.");
        // Immediate redirect without waiting for user interaction
        handleAccessDeniedNavigation(reason);
      }
    }, [authLoading, userId, hasLoadedInitialData, loadInitialDashboardData, isClient, handleAccessDeniedNavigation]);

    useEffect(() => {
      if (!hasLoadedInitialData || isLoadingInitialData || !isClient || !userProfile) return;      console.log(`[Dashboard] Active tab or date changed to: ${activePeriodTab}. User profile available.`);
      if (activePeriodTab === 'daily' || activePeriodTab === 'ai-targets') {
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
    
    const getRandomMotivationalTip = useCallback(() => {
      const tips = [
        "Stay hydrated! Water helps boost metabolism and curbs appetite.",
        "Small consistent steps lead to big results. Keep going!",
        "Focus on whole foods - they're more filling and nutritious.",
        "Remember: progress, not perfection. You're doing great!",
        "Every healthy choice you make is an investment in yourself.",
        "Listen to your body - eat when hungry, stop when satisfied.",
        "Protein at every meal helps maintain muscle and keeps you full.",
        "A 10-minute walk can boost energy and improve mood.",
        "Plan your meals ahead to stay on track with your goals.",
        "Celebrate small wins - they add up to major changes!",        "Quality sleep supports weight management and recovery.",
        "Don't skip meals - consistent eating supports metabolism.",
        "Find physical activities you enjoy - make fitness fun!",
        "Mindful eating helps you tune into hunger and fullness cues.",
        "Consistency beats perfection every single time.",
        "Your health journey is unique - compare only to yesterday's you.",
        "Stress management is key - try deep breathing or meditation.",
        "Add color to your plate with fruits and vegetables.",
        "Rest days are just as important as workout days for recovery."
      ];
      return tips[Math.floor(Math.random() * tips.length)];
    }, []);

    const fetchCalorieSuggestion = useCallback(async () => {
      if (!userId || !userProfile || !dailyTargets || (activePeriodTab !== 'daily' && activePeriodTab !== 'ai-targets') || isFetchingSuggestionRef.current) return;
      
      isFetchingSuggestionRef.current = true; setIsLoadingSuggestion(true); setUiError(null); 
      
      // Use hardcoded suggestion logic instead of AI
      const currentCaloriesConsumed = userProfile.todayCalories ?? 0;
      const currentCaloriesBurned = periodTotals.caloriesBurned;
      const targetCalories = dailyTargets.targetCalories;
      const netCaloriesConsumed = currentCaloriesConsumed - currentCaloriesBurned;
      const calorieBalance = netCaloriesConsumed - targetCalories;
      
      let suggestion: SuggestCalorieAdjustmentOutput;
      
      if (Math.abs(calorieBalance) <= 50) {
        // On track
        suggestion = {
          actionTitle: "Perfect Balance!",
          actionValue: null,
          actionUnit: null,
          statusMessage: "You're right on track with your calorie goal today.",
          motivationalTip: getRandomMotivationalTip()
        };
      } else if (calorieBalance > 0) {
        // Over target
        suggestion = {
          actionTitle: "Consider Lighter Options",
          actionValue: Math.round(calorieBalance),
          actionUnit: "kcal over target",
          statusMessage: "You've exceeded your calorie target for today.",
          motivationalTip: getRandomMotivationalTip()
        };
      } else {
        // Under target
        const remainingCalories = Math.abs(calorieBalance);
        suggestion = {
          actionTitle: "Room for More Nutrition",
          actionValue: Math.round(remainingCalories),
          actionUnit: "kcal remaining for target",
          statusMessage: "You have room for more calories to reach your goal.",
          motivationalTip: getRandomMotivationalTip()
        };
      }
      
      setCalorieAdjustmentSuggestion(suggestion);
      setIsLoadingSuggestion(false); 
      isFetchingSuggestionRef.current = false;
    }, [userId, userProfile, dailyTargets, periodTotals.caloriesBurned, activePeriodTab, getRandomMotivationalTip]); 

    useEffect(() => {
      if (hasLoadedInitialData && !isLoadingInitialData && isClient && (activePeriodTab === 'daily' || activePeriodTab === 'ai-targets') && userProfile && dailyTargets) {
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
        if(!isProfileDataSufficientForAI(userProfile) && router) { router.replace('/profile'); // Use replace to avoid auth page in history
      console.log("[ Page] Navigation to /profile initiated.");
      
      // Refresh page after 100ms to ensure auth state is updated
      setTimeout(() => {
        console.log("[ Page] Refreshing page after navigation...");
        window.location.reload();
      }, 100);}
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
              const updatedLogs = [...prev, newStoredLog].sort((a,b) => parseISO(b.timestamp).getTime() - parseISO(a.timestamp).getTime());              if(isClient) localStorage.setItem(dailyExerciseLogsCacheKey, JSON.stringify(updatedLogs));
              // Trigger re-processing for daily tab if it's active
              if((activePeriodTab === 'daily' || activePeriodTab === 'ai-targets') && userProfile) {
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
        else toast({ variant: "destructive", title: "Error", description: "User weight needed for calorie estimation." });
        return;
      }
      setIsEstimatingCalories(exercise.exercise);
      try {
        // Parse reps with validation to prevent unrealistic values
        let parsedReps: number | undefined = undefined;
        if (typeof exercise.reps === 'string' && exercise.reps.match(/^\d+(-\d+)?$/)) {
          const repsValue = parseInt(exercise.reps.split('-')[0]);
          // Cap reps at reasonable maximum (1-100) to prevent unrealistic calorie calculations
          parsedReps = Math.min(Math.max(repsValue, 1), 100);
          if (repsValue !== parsedReps) {
            console.warn(`[Calorie Estimation] Unrealistic reps value capped: ${repsValue} -> ${parsedReps} for ${exercise.exercise}`);
          }
        }
        
        // Parse duration with validation
        let parsedDuration: number | undefined = undefined;
        if (typeof exercise.reps === 'string' && exercise.reps.includes('min')) {
          const durationValue = parseInt(exercise.reps);
          // Cap duration at reasonable maximum (1-180 minutes)
          parsedDuration = Math.min(Math.max(durationValue, 1), 180);
          if (durationValue !== parsedDuration) {
            console.warn(`[Calorie Estimation] Unrealistic duration capped: ${durationValue} -> ${parsedDuration} minutes for ${exercise.exercise}`);
          }
        }
        
        // Parse sets with validation
        const parsedSets = exercise.sets ? Math.min(Math.max(exercise.sets, 1), 20) : undefined;
        if (exercise.sets && exercise.sets !== parsedSets) {
          console.warn(`[Calorie Estimation] Unrealistic sets value capped: ${exercise.sets} -> ${parsedSets} for ${exercise.exercise}`);
        }

        const input: EstimateCaloriesBurnedInput = { 
          exerciseName: exercise.exercise, 
          exerciseType: "strength", // Default, can be refined
          duration: parsedDuration,
          sets: parsedSets,
          reps: parsedReps,
          userWeight: userProfile.weight 
        };
        const result = await estimateCaloriesBurned(input);
        handleLogCompletedWorkout(exercise, result.estimatedCalories, true);
        toast({ title: "Calories Calculated!", description: `${result.estimatedCalories} kcal for ${exercise.exercise} (MET-based).` });
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
          // First delete the completed workout status
          await deleteCompletedWorkout(userId, todayDateKey, exerciseName);
          console.log(`[Dashboard] Successfully deleted completed workout status for ${exerciseName}`);
          
          // Then delete the associated exercise log if it exists
          if (completedEntry?.logId) {
            console.log(`[Dashboard] Attempting to delete exercise log with ID: ${completedEntry.logId}`);
            try {
              await deleteLogEntry(userId, 'exerciseLog', completedEntry.logId);
              console.log(`[Dashboard] Successfully deleted exercise log for ${exerciseName}`);
              
              // Update local state only after successful deletion
              if (isClient && isSameDay(parseISO(completedEntry.timestamp), selectedDate)) {
                setDailyExerciseLogsState(prev => { 
                    const updatedLogs = prev.filter(log => log.id !== completedEntry.logId);                    localStorage.setItem(dailyExerciseLogsCacheKey, JSON.stringify(updatedLogs));
                    // Trigger re-processing for daily tab if it's active
                    if((activePeriodTab === 'daily' || activePeriodTab === 'ai-targets') && userProfile) {
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
            } catch (logDeleteError: any) {
              console.warn(`[Dashboard] Failed to delete exercise log ${completedEntry.logId}: ${logDeleteError.message}. Workout status still deleted.`);
              // Don't throw here - the workout status was successfully deleted
            }
          } else {
            console.log(`[Dashboard] No exercise log ID found for ${exerciseName}, only workout status deleted`);
          }
          
          toast({ title: "Workout Unchecked" });
        } catch (e: any) {
          console.error(`[Dashboard] Error deleting workout completion for ${exerciseName}:`, e);
          toast({ variant: "destructive", title: "Update Error", description: `Failed to delete ${exerciseName}: ${e.message}` });
          // Restore the completed workout status since deletion failed
          if (completedEntry) {
            setCompletedWorkouts(prev => { 
              const updated = { ...prev, [exerciseName]: completedEntry }; 
              if(isClient) localStorage.setItem(completedWorkoutsCacheKey, JSON.stringify(updated)); 
              return updated; 
            });
          }
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
    if (!userId && !authLoading && isClient) {
      // This should rarely be reached due to immediate redirect in useEffect
      handleAccessDeniedNavigation("User clicked retry on access denied error");
      return <DashboardLoadingSkeleton />;
    }
    if (isLoadingInitialData && !hasLoadedInitialData) return <DashboardLoadingSkeleton />;
    if (criticalError) {
      return (
        <DashboardErrorState 
          message={criticalError} 
          onRetry={() => { 
            if (criticalError.includes("Access Denied")) {
              handleAccessDeniedNavigation("User clicked retry on critical access denied error");
            } else {
              setCriticalError(null); 
              setUiError(null); 
              setHasLoadedInitialData(false); 
              loadInitialDashboardData();
            }
          }} 
          isProfileError={criticalError.includes("profile")} 
        />
      );
    }

    const targetActivityCaloriesToday = dailyTargets?.targetCalories ? Math.round(dailyTargets.targetCalories / 4) : null;
    const actualBurnForDisplay = (activePeriodTab === 'daily' || activePeriodTab === 'ai-targets') ? periodTotals.caloriesBurned : allWeeklyExerciseLogs.reduce((sum, log) => sum + (Number(log.estimatedCaloriesBurned) || 0), 0);    return (
        <div className={`min-h-screen pb-20 md:pb-0 transition-all duration-500 ${isDark ? 'bg-[#1a1a1a]' : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 text-gray-800'}`}>
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    className={`absolute -top-40 -right-40 w-80 h-80 rounded-full blur-3xl ${isDark ? 'bg-gradient-to-br from-purple-400/10 to-blue-400/10' : 'bg-gradient-to-br from-blue-400/10 to-purple-400/10'}`}
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
                    className={`absolute -bottom-40 -left-40 w-80 h-80 rounded-full blur-3xl ${isDark ? 'bg-gradient-to-tr from-blue-400/10 to-indigo-400/10' : 'bg-gradient-to-tr from-indigo-400/10 to-blue-400/10'}`}
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
            </div>            <AnimatePresence>
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
                            <Card className={`backdrop-blur-lg p-6 sm:p-8 rounded-3xl text-center max-w-sm mx-4 border transition-all duration-500 ${isDark ? 'bg-[#2a2a2a] border-[#3a3a3a]' : 'bg-clay-100/95 border-white/50 text-gray-800'}`}>
                                <motion.div 
                                    className="flex justify-center items-center mb-5"
                                    initial={{ rotate: 0 }}
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                >
                                    <Loader2 className={`h-12 w-12 ${isDark ? 'text-purple-400' : 'text-blue-500'}`} />
                                </motion.div>                                <motion.p 
                                    className={`text-lg sm:text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                >
                                    Personalizing Your Targets...
                                </motion.p>
                                <motion.p 
                                    className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                >
                                    Bago AI is crafting your optimal daily goals.
                                </motion.p>
                            </Card>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Content with New Design */}
            <div className="p-3 sm:p-4 md:p-6 relative z-10">
                <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
                    {/* Header Section with New Design */}
                    <motion.div 
                        className="mb-6 pt-2 sm:pt-4 md:pt-6"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >                        <div className={`backdrop-blur-sm rounded-3xl border-0 p-4 sm:p-6 md:p-8 transition-all duration-500 ${isDark ? 'bg-[#2a2a2a] border-[#3a3a3a]' : 'bg-white/70 border border-blue-100/50 shadow-lg'}`}>
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div className="flex items-center space-x-3 sm:space-x-4">
                                    <div className="relative">
                                        <div className={`w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center shadow-lg ${isDark ? 'bg-[#8b5cf6] text-white' : 'bg-gradient-to-br from-blue-400 to-purple-500'}`}>
                                            <User className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" />
                                        </div>
                                        <div className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-emerald-400 rounded-full border-2 border-white animate-pulse shadow-sm"></div>
                                    </div>
                                    <div>
                                        <h1 className={`text-2xl sm:text-3xl md:text-4xl font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                                            Dashboard
                                        </h1>
                                        <div className={`flex items-center space-x-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                            <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
                                            <span className="text-sm sm:text-base md:text-lg">Track your daily progress</span>
                                        </div>
                                    </div>                                </div>
                                
                                <div className="text-left sm:text-right">
                                    <div className={`text-lg sm:text-xl font-semibold mb-1 ${isDark ? 'text-white' : 'text-gray-700'}`}>{getDayName()}</div>
                                    <div className={`text-xs sm:text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{new Date().toLocaleDateString()}</div>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Main Content Grid */}
                    <motion.div 
                        className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                    >
                        {/* Left Column - Main Content */}
                        <motion.div 
                            className="lg:col-span-2"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6, delay: 0.3 }}
                        >                            <DashboardMainContent
                                error={uiError} userProfile={userProfile} dailyTargets={dailyTargets}
                                periodTotals={periodTotals} activePeriodTab={activePeriodTab} setActivePeriodTab={setActivePeriodTab}
                                handleRecalculateAiTargets={handleRecalculateAiTargets} isCalculatingTargets={isCalculatingAiTargets}
                                isLoadingTotals={isLoadingInitialData}
                                calorieAdjustmentSuggestion={calorieAdjustmentSuggestion} isLoadingSuggestion={isLoadingSuggestion}
                                targetActivityCaloriesToday={targetActivityCaloriesToday ?? 0}
                                isDark={isDark}
                            />
                        </motion.div>
                        
                        {/* Right Column - Sidebar */}
                        <motion.div 
                            className="lg:col-span-1"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6, delay: 0.4 }}
                        >                            <DashboardSidebar 
                                weeklyWorkoutPlan={weeklyWorkoutPlan}
                                isGeneratingPlan={isGeneratingPlan} 
                                completedWorkouts={completedWorkouts}
                                handleToggleWorkoutComplete={handleToggleWorkoutComplete} 
                                handleLogCompletedWorkout={handleLogCompletedWorkout}
                                handleRegenerateWorkoutPlan={handleRegenerateWorkoutPlan} 
                                canRegenerateWorkoutPlan={canRegenerateWorkoutPlan}
                                isEstimatingCalories={isEstimatingCalories} 
                                estimateAndLogCalories={estimateAndLogCalories}
                                isDark={isDark}
                            />
                        </motion.div>
                    </motion.div>
                </div>
            </div>
              <motion.footer 
                className={`mt-12 pt-8 text-center text-xs border-t relative z-10 ${isDark ? 'text-gray-400 border-[#3a3a3a]' : 'text-gray-500 border-blue-100/30'}`}
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
        </div>
    );
}
