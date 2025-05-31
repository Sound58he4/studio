"use client";

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';

// Import dashboard components used here
import GoalsCard from '@/components/dashboard/GoalsCard';
import WorkoutPlan from '@/components/dashboard/WorkoutPlan';
import QuickActions from '@/components/dashboard/QuickActions';

// Import types
import type {
    StoredUserProfile, // Renamed to reflect source (Firestore)
    PeriodTotals, // Add for future enhancements
    WeeklyWorkoutPlan, // For workout plans
    CompletedWorkouts, // For tracking completed workouts
    ExerciseDetail // Adding this to avoid type issues later
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
    isEstimatingCalories?: string | null; // Optional loading state for calorie estimation
    maintenanceCalories: number | null; // Add maintenance calories prop
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
    isEstimatingCalories,
    maintenanceCalories, // Destructure new prop
}) => {
    return (
        // Apply spacing within the component itself for better control
        <div className="space-y-6 md:space-y-8">
            {error && userProfile && ( // Show non-critical errors (e.g., plan generation failure) at the top
                <Card className="border-destructive bg-destructive/10">
                    <CardHeader className="flex flex-row items-center space-x-3 space-y-0 p-4">
                        <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
                        <div>
                            <CardTitle className="text-sm font-medium text-destructive">Dashboard Issue</CardTitle>
                            <CardDescription className="text-xs text-destructive/90">{error}</CardDescription>
                        </div>
                    </CardHeader>
                </Card>
            )}

            {/* Goals Card */}
            {dailyTargets ? (
                <GoalsCard
                    userProfile={userProfile}
                    periodTotals={periodTotals}
                    dailyTargets={dailyTargets}
                    activePeriodTab={activePeriodTab}
                    setActivePeriodTab={setActivePeriodTab}
                    onRecalculateAiTargets={handleRecalculateAiTargets}
                    isLoadingTargets={isCalculatingTargets || isLoadingTotals}
                />
            ) : (
                 <Card className="shadow-lg border border-primary/20 overflow-hidden">
                    <CardHeader className="p-5 md:p-6">
                        <Skeleton className="h-6 w-1/2 mb-2 rounded" />
                        <Skeleton className="h-4 w-3/4 rounded" />
                    </CardHeader>
                     <CardContent className="p-5 md:p-6 space-y-5">
                        <Skeleton className="h-12 w-full rounded" />
                        <Skeleton className="h-12 w-full rounded" />
                        <Skeleton className="h-12 w-full rounded" />
                        <Skeleton className="h-12 w-full rounded" />
                     </CardContent>
                </Card>
            )}

            {/* Workout Plan */}
            <WorkoutPlan
                plan={weeklyWorkoutPlan}
                isLoading={isGeneratingPlan} // Use dedicated loading state
                completedWorkouts={completedWorkouts}
                onToggleComplete={handleToggleWorkoutComplete}
                onLogWorkout={handleLogCompletedWorkout}
                onRegenerate={handleRegenerateWorkoutPlan}
                isEstimatingCalories={isEstimatingCalories} // Pass down estimating state
            />

            {/* Quick Actions */}
            <QuickActions />
        </div>
    );
};

export default DashboardMainContent;
