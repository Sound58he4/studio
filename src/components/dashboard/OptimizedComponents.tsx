// Performance-optimized Dashboard components with React.memo and lazy loading
"use client";

import React, { Suspense, lazy, memo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy load heavy components
const WorkoutPlan = lazy(() => import('@/components/dashboard/WorkoutPlan'));
const RecentFoodLogs = lazy(() => import('@/components/dashboard/RecentFoodLogs'));
const ProgressTracker = lazy(() => import('@/components/dashboard/ProgressTracker'));

// Loading skeletons for lazy components
const WorkoutPlanSkeleton = () => (
  <div className="space-y-4">
    <Skeleton className="h-6 w-32" />
    <Skeleton className="h-24 w-full" />
    <Skeleton className="h-24 w-full" />
  </div>
);

const RecentFoodLogsSkeleton = () => (
  <div className="space-y-4">
    <Skeleton className="h-6 w-32" />
    <Skeleton className="h-16 w-full" />
    <Skeleton className="h-16 w-full" />
    <Skeleton className="h-16 w-full" />
  </div>
);

const ProgressTrackerSkeleton = () => (
  <div className="space-y-4">
    <Skeleton className="h-6 w-32" />
    <Skeleton className="h-32 w-full" />
  </div>
);

// Memoized components with performance optimizations
export const OptimizedWorkoutPlan = memo(
  React.forwardRef<HTMLDivElement, React.ComponentProps<typeof WorkoutPlan>>((props, ref) => (
    <Suspense fallback={<WorkoutPlanSkeleton />}>
      <WorkoutPlan {...props} ref={ref} />
    </Suspense>
  ))
);

export const OptimizedRecentFoodLogs = memo(() => (
  <Suspense fallback={<RecentFoodLogsSkeleton />}>
    <RecentFoodLogs />
  </Suspense>
));

export const OptimizedProgressTracker = memo(
  React.forwardRef<HTMLDivElement, React.ComponentProps<typeof ProgressTracker>>((props, ref) => (
    <Suspense fallback={<ProgressTrackerSkeleton />}>
      <ProgressTracker {...props} ref={ref} />
    </Suspense>
  ))
);

OptimizedWorkoutPlan.displayName = 'OptimizedWorkoutPlan';
OptimizedRecentFoodLogs.displayName = 'OptimizedRecentFoodLogs';
OptimizedProgressTracker.displayName = 'OptimizedProgressTracker';
