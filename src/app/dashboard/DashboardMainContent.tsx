// src/app/dashboard/DashboardMainContent.tsx
"use client";

import React, { useMemo } from 'react'; 
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

// Import dashboard components used here
import GoalsCard from '@/components/dashboard/GoalsCard';
import WorkoutPlan from '@/components/dashboard/WorkoutPlan';

// Import types
import type {
    StoredUserProfile,
    PeriodTotals,
    WeeklyWorkoutPlan,
    CompletedWorkouts,
    ExerciseDetail,
    SuggestCalorieAdjustmentOutput 
} from './types';
import type { CalculateTargetsOutput } from '@/ai/flows/dashboard-update';

interface DashboardMainContentProps {
    error: string | null; 
    userProfile: StoredUserProfile | null;
    dailyTargets: CalculateTargetsOutput | null;
    periodTotals: PeriodTotals;
    activePeriodTab: 'daily' | 'weekly';
    setActivePeriodTab: (tab: 'daily' | 'weekly') => void;
    handleRecalculateAiTargets: () => void;
    isCalculatingTargets: boolean; 
    isLoadingTotals: boolean; 
    weeklyWorkoutPlan: WeeklyWorkoutPlan | null;
    isGeneratingPlan: boolean; 
    completedWorkouts: CompletedWorkouts;
    handleToggleWorkoutComplete: (exerciseName: string, currentStatus: boolean) => void;
    handleLogCompletedWorkout: (exercise: ExerciseDetail, burnedCalories?: number, isEstimated?: boolean) => void;
    handleRegenerateWorkoutPlan: () => void;
    canRegenerateWorkoutPlan: boolean; 
    isEstimatingCalories?: string | null; 
    estimateAndLogCalories: (exercise: ExerciseDetail) => Promise<void>; 
    calorieAdjustmentSuggestion: SuggestCalorieAdjustmentOutput | null; 
    isLoadingSuggestion: boolean; 
    targetActivityCaloriesToday: number | null; // New prop
}

const DashboardMainContent: React.FC<DashboardMainContentProps> = ({
    error,
    userProfile,
    dailyTargets,
    periodTotals,
    activePeriodTab,
    setActivePeriodTab,
    handleRecalculateAiTargets,
    isCalculatingTargets,
    isLoadingTotals, 
    weeklyWorkoutPlan,
    isGeneratingPlan, 
    completedWorkouts,
    handleToggleWorkoutComplete,
    handleLogCompletedWorkout,
    handleRegenerateWorkoutPlan,
    canRegenerateWorkoutPlan, 
    isEstimatingCalories, 
    estimateAndLogCalories, 
    calorieAdjustmentSuggestion, 
    isLoadingSuggestion, 
    targetActivityCaloriesToday, // Destructure new prop
}) => {

    const actualBurnForDisplay = useMemo(() => {
        return activePeriodTab === 'daily' ? periodTotals.caloriesBurned : 0;
    }, [activePeriodTab, periodTotals.caloriesBurned]);

    return (
        <div className="space-y-6 md:space-y-8">
            {error && !error.includes("Profile incomplete") && !error.includes("User profile not found") && (
                <Card className="border-destructive bg-destructive/10 animate-in fade-in duration-300 card-interactive">
                    <CardHeader className="flex flex-row items-center space-x-3 space-y-0 p-4">
                        <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
                        <div>
                            <CardTitle className="text-sm font-medium text-destructive">Dashboard Issue</CardTitle>
                            <CardDescription className="text-xs text-destructive/90">{error}</CardDescription>
                        </div>
                    </CardHeader>
                </Card>
            )}

            <GoalsCard
                userProfile={userProfile}
                periodTotals={periodTotals}
                dailyTargets={dailyTargets}
                activePeriodTab={activePeriodTab}
                setActivePeriodTab={setActivePeriodTab}
                onRecalculateAiTargets={handleRecalculateAiTargets}
                isLoadingTargets={isCalculatingTargets || isLoadingTotals}
                className="animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out delay-100 card-interactive"
                targetActivityCaloriesToday={targetActivityCaloriesToday} // Pass the profile-defined burn goal
                actualBurnForDisplay={actualBurnForDisplay}
                isLoadingSuggestion={isLoadingSuggestion}
                calorieAdjustmentSuggestion={calorieAdjustmentSuggestion}
            />

            <WorkoutPlan
                plan={weeklyWorkoutPlan}
                isLoading={isGeneratingPlan} 
                completedWorkouts={completedWorkouts}
                onToggleComplete={handleToggleWorkoutComplete}
                onLogWorkout={handleLogCompletedWorkout} 
                onRegenerate={handleRegenerateWorkoutPlan}
                canRegenerate={canRegenerateWorkoutPlan} 
                isEstimatingCalories={isEstimatingCalories} 
                estimateAndLogCalories={estimateAndLogCalories} 
                className="animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out delay-300 card-interactive"
            />
        </div>
    );
};

export default DashboardMainContent;
