// src/components/dashboard/types.ts
import type { 
    StoredUserProfile as CoreStoredUserProfile, 
    PeriodTotals as CorePeriodTotals, 
    WeeklyWorkoutPlan as CoreWeeklyWorkoutPlan, 
    CompletedWorkouts as CoreCompletedWorkouts, 
    FitnessTipData as CoreFitnessTipData, 
    StoredFoodLogEntry as CoreStoredFoodLogEntry, 
    StoredExerciseLogEntry as CoreStoredExerciseLogEntry,
    ExerciseDetail as CoreExerciseDetail, 
    SuggestCalorieAdjustmentOutput as CoreSuggestCalorieAdjustmentOutput 
} from '@/app/dashboard/types';

import type { CalculateTargetsOutput as CoreCalculateTargetsOutput } from '@/ai/flows/dashboard-update';


// Re-export core types from app/dashboard/types for components
export type StoredUserProfile = CoreStoredUserProfile;
export type PeriodTotals = CorePeriodTotals;
export type WeeklyWorkoutPlan = CoreWeeklyWorkoutPlan; 
export type CompletedWorkouts = CoreCompletedWorkouts;
export type FitnessTipData = CoreFitnessTipData;
export type StoredFoodLogEntry = CoreStoredFoodLogEntry;
export type StoredExerciseLogEntry = CoreStoredExerciseLogEntry;
export type CalculateTargetsOutput = CoreCalculateTargetsOutput;
export type ExerciseDetail = CoreExerciseDetail; 
export type SuggestCalorieAdjustmentOutput = CoreSuggestCalorieAdjustmentOutput; 


// Define props specifically for dashboard components if they differ or need extension

export interface GoalsCardProps {
  userProfile: StoredUserProfile | null;
  periodTotals: PeriodTotals;
  dailyTargets: CalculateTargetsOutput | null; 
  activePeriodTab: 'daily' | 'weekly';
  setActivePeriodTab: (tab: 'daily' | 'weekly') => void;
  onRecalculateAiTargets: () => void;
  isLoadingTargets: boolean;
  className?: string; 
  targetActivityCaloriesToday: number | null; // Updated prop name
  actualBurnForDisplay: number;
  isLoadingSuggestion: boolean;
  calorieAdjustmentSuggestion: SuggestCalorieAdjustmentOutput | null;
}


export interface WorkoutPlanProps {
    plan: WeeklyWorkoutPlan | null; 
    isLoading: boolean;
    completedWorkouts: CompletedWorkouts; 
    onToggleComplete: (exerciseName: string, currentStatus: boolean) => void; 
    onLogWorkout: (exercise: ExerciseDetail, burnedCalories?: number, isEstimated?: boolean) => void; 
    onRegenerate: () => void; 
    canRegenerate: boolean;
    isEstimatingCalories?: string | null; 
    estimateAndLogCalories: (exercise: ExerciseDetail) => Promise<void>; 
    className?: string; 
}


export interface FitnessTipProps {
    tip: FitnessTipData | null;
}

export interface WeeklyExerciseSummaryData { 
    totalWorkouts: number;
    strengthWorkouts: number;
    cardioWorkouts: number;
    flexibilityWorkouts: number;
    otherWorkouts: number;
    mostFrequentType: string | null;
    totalCaloriesBurned: number;
}

export interface WeeklyExerciseSummaryProps {
    summary: WeeklyExerciseSummaryData;
    isLoading: boolean;
}

export interface RecentFoodLogsProps {
    logs: StoredFoodLogEntry[];
    isLoading: boolean;
}

// TodaysWorkoutSummaryCardProps is removed as the component itself is removed.
