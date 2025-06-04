// src/components/dashboard/GoalsCard.tsx
"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image'; 
import { Card, CardContent, CardDescription, CardHeader, CardFooter, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import ProgressTracker from '@/components/dashboard/ProgressTracker';
import { RefreshCw, Flame, Leaf, Zap, Dumbbell, Info, Target, Activity, CheckCircle, Percent, Loader2 } from 'lucide-react'; // Added Loader2
import type { CalculateTargetsOutput } from '@/ai/flows/dashboard-update';
import { cn } from "@/lib/utils";
import { Progress } from '@/components/ui/progress'; 

import type { StoredUserProfile, PeriodTotals, SuggestCalorieAdjustmentOutput } from '@/app/dashboard/types';

export interface GoalsCardProps {
  userProfile: StoredUserProfile | null;
  periodTotals: PeriodTotals;
  dailyTargets: CalculateTargetsOutput | null;
  activePeriodTab: 'daily' | 'weekly';
  setActivePeriodTab: (tab: 'daily' | 'weekly') => void;
  onRecalculateAiTargets: () => void;
  isLoadingTargets: boolean;
  className?: string;
  targetActivityCaloriesToday: number | null; // Renamed from targetBurnToday for clarity
  actualBurnForDisplay: number;
  isLoadingSuggestion: boolean;
  calorieAdjustmentSuggestion: SuggestCalorieAdjustmentOutput | null;
}

const GoalsCard: React.FC<GoalsCardProps> = ({
  userProfile,
  periodTotals,
  dailyTargets,
  activePeriodTab,
  setActivePeriodTab,
  onRecalculateAiTargets,
  isLoadingTargets,
  className,
  targetActivityCaloriesToday, // Use new prop name
  actualBurnForDisplay,
  isLoadingSuggestion,
  calorieAdjustmentSuggestion,
}) => {

  const nutritionalTargetBackgroundUrl = "https://firebasestorage.googleapis.com/v0/b/nutritransform-ai.firebasestorage.app/o/5708.jpg?alt=media&token=7c40aa30-88dd-4531-b837-57095cfec22b";


  const renderProgressTrackers = (isWeekly: boolean) => {
    if (!dailyTargets) return null;

    const valueCalories = periodTotals.calories;
    const valueProtein = periodTotals.protein;
    const valueCarbs = periodTotals.carbohydrates;
    const valueFat = periodTotals.fat;

    const numDays = isWeekly ? 7 : 1;
    const targetCalories = (dailyTargets.targetCalories ?? 0) * numDays;
    const targetProtein = (dailyTargets.targetProtein ?? 0) * numDays;
    const targetCarbs = (dailyTargets.targetCarbs ?? 0) * numDays;
    const targetFat = (dailyTargets.targetFat ?? 0) * numDays;

    const trackerColor = 'blue';

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 relative z-10">
            <ProgressTracker
               label={isWeekly ? "Weekly Calories" : "Today's Calories"}
               value={valueCalories} target={targetCalories} unit="kcal"
               icon={<Flame />} color={trackerColor} isAverage={false}
            />
            <ProgressTracker
               label={isWeekly ? "Weekly Protein" : "Today's Protein"}
               value={valueProtein} target={targetProtein} unit="g"
               icon={<Dumbbell />} color={trackerColor} isAverage={false}
            />
            <ProgressTracker
               label={isWeekly ? "Weekly Carbs" : "Today's Carbs"}
               value={valueCarbs} target={targetCarbs} unit="g"
               icon={<Zap />} color={trackerColor} isAverage={false}
            />
            <ProgressTracker
               label={isWeekly ? "Weekly Fat" : "Today's Fat"}
               value={valueFat} target={targetFat} unit="g"
               icon={<Leaf />} color={trackerColor} isAverage={false}
            />
        </div>
    );
  };

  const burnGoalProgress = targetActivityCaloriesToday && targetActivityCaloriesToday > 0 
    ? Math.min(100, (actualBurnForDisplay / targetActivityCaloriesToday) * 100) 
    : 0;
  const burnGoalReached = targetActivityCaloriesToday !== null && actualBurnForDisplay >= targetActivityCaloriesToday;

  return (
    <Card className={cn(
        "shadow-lg border border-primary/15 overflow-hidden group transition-all duration-300 hover:shadow-primary/10 hover:shadow-2xl",
        "relative", 
        className
    )}>
      <Image
          src={nutritionalTargetBackgroundUrl}
          alt="Abstract nutritional background"
          layout="fill"
          objectFit="cover"
          className="absolute inset-0 opacity-0 dark:opacity-30 group-hover:opacity-0 dark:group-hover:opacity-40 transition-opacity duration-700 z-0 blur-sm scale-110"
          data-ai-hint="abstract texture"
          priority
          unoptimized={true}
      />
      <Tabs value={activePeriodTab} onValueChange={(value) => setActivePeriodTab(value as 'daily' | 'weekly')} className="w-full relative z-10">
        <CardHeader className="p-0 border-b border-primary/10">
          <TabsList className="grid w-full grid-cols-2 rounded-none h-11 sm:h-12 bg-muted/60 backdrop-blur-sm">
            <TabsTrigger value="daily" className="text-sm sm:text-base data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:font-semibold data-[state=active]:shadow-inner data-[state=active]:shadow-primary/5 transition-all duration-200">
              Today's Goals
            </TabsTrigger>
            <TabsTrigger value="weekly" className="text-sm sm:text-base data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:font-semibold data-[state=active]:shadow-inner data-[state=active]:shadow-primary/5 transition-all duration-200">
              This Week's Goals
            </TabsTrigger>
          </TabsList>
          <div className="p-4 sm:p-5 bg-card/50 dark:bg-card/30 backdrop-blur-sm rounded-b-lg md:rounded-b-none">
            <CardTitle className="text-md sm:text-lg font-semibold flex items-center gap-2 text-primary mb-1">
                <Target className="h-5 w-5" /> Nutritional Targets
            </CardTitle>
            <CardDescription className="flex items-center justify-between flex-wrap gap-2 text-xs sm:text-sm text-muted-foreground">
               <span>
                 {userProfile?.useAiTargets ? 'AI-driven' : 'Manually set'} nutrition progress.
                 {isLoadingTargets && <span className="ml-1 sm:ml-2 text-xs text-primary animate-pulse"> (Updating...)</span>}
               </span>
              <Button variant="link" size="sm" onClick={onRecalculateAiTargets} className="p-0 h-auto text-xs text-primary hover:text-primary/80" disabled={isLoadingTargets}>
                <RefreshCw className="mr-1 h-3 w-3" /> 
                {userProfile?.useAiTargets ? 'Recalculate AI Targets' : 'Try AI Targets'}
              </Button>
            </CardDescription>
              {userProfile && !userProfile.useAiTargets && (!dailyTargets || (dailyTargets.targetCalories ?? 0) <= 0) && (
                 <p className="text-destructive text-xs sm:text-sm mt-2 flex items-center gap-1"><Info size={14}/>Manual targets missing or invalid. <Link href="/profile" className="underline font-medium">Update profile?</Link></p>
              )}
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-5 min-h-[220px] flex items-center justify-center bg-card/30 dark:bg-card/10 backdrop-blur-sm rounded-lg m-2 md:m-4">
          {isLoadingTargets ? (
            <SkeletonLoader />
          ) : dailyTargets && (dailyTargets.targetCalories ?? 0) > 0 ? (
            <>
                <TabsContent value="daily" className="mt-0 fade-in-up w-full">
                    {renderProgressTrackers(false)}
                </TabsContent>
                <TabsContent value="weekly" className="mt-0 fade-in-up w-full">
                    {renderProgressTrackers(true)}
                </TabsContent>
            </>
          ) : (
             <div className="text-center py-8 sm:py-10 text-muted-foreground italic">
                <p className="text-sm">Set your profile and targets to see progress.</p>
                <Link href="/profile">
                    <Button variant="link" size="sm" className="mt-2 text-primary">Go to Profile</Button>
                </Link>
             </div>
          )}
        </CardContent>
        <CardFooter className="p-3 sm:p-4 bg-muted/30 border-t flex-col items-stretch text-center space-y-2">
             {activePeriodTab === 'daily' && (
                 <div className="w-full space-y-1 group"> 
                     {isLoadingSuggestion && !calorieAdjustmentSuggestion && (
                        <div className="flex items-center justify-center text-xs text-muted-foreground animate-pulse">
                            <Loader2 size={14} className="animate-spin mr-1.5"/> Loading activity guidance...
                        </div>
                     )}
                     {calorieAdjustmentSuggestion && (
                         <>
                             <p className="text-xs font-semibold text-primary flex items-center justify-center gap-1">
                                 <Flame size={14} /> {calorieAdjustmentSuggestion.actionTitle}
                             </p>
                              {/* Display action value if it's about food */}
                              {calorieAdjustmentSuggestion.actionUnit && calorieAdjustmentSuggestion.actionUnit.includes('kcal to eat') && calorieAdjustmentSuggestion.actionValue !== null && (
                                 <p className="text-xs text-muted-foreground">
                                    Target: {calorieAdjustmentSuggestion.actionValue.toFixed(0)} {calorieAdjustmentSuggestion.actionUnit}
                                 </p>
                              )}
                             <p className="text-xs italic text-muted-foreground/80 pt-0.5">{calorieAdjustmentSuggestion.motivationalTip}</p>
                         </>
                     )}

                    {/* Activity Burn Goal Progress - Moved here from TodaysWorkoutSummaryCard */}
                    {targetActivityCaloriesToday !== null && targetActivityCaloriesToday > 0 ? (
                        <div className="mt-2 pt-2 border-t border-border/30">
                            <p className="text-xs font-medium text-foreground/80 mb-1">Today's Exercise Burn Goal:</p>
                            <Progress
                                value={burnGoalProgress}
                                indicatorClassName={burnGoalReached ? "bg-green-500" : "bg-orange-500"}
                                className="h-2 w-full max-w-xs mx-auto rounded-full"
                            />
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    {actualBurnForDisplay.toFixed(0)} / {targetActivityCaloriesToday.toFixed(0)} kcal burned
                                </p>
                                {burnGoalReached && (
                                    <p className="text-xs text-green-600 dark:text-green-400 flex items-center justify-center gap-1 animate-pulse-opacity">
                                        <CheckCircle size={14}/> Burn Goal Reached!
                                    </p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <p className="text-xs text-muted-foreground italic mt-2 pt-2 border-t border-border/30">Set an activity burn goal in your profile.</p>
                    )}
                 </div>
             )}
             {activePeriodTab === 'weekly' && (
                 <p className="text-xs text-muted-foreground italic py-2">Daily activity suggestions available in 'Today's Goals' view.</p>
             )}
            <Link href="/log" className="block pt-1">
                 <Button 
                     variant="outline" 
                     size="sm" 
                     className="shadow-sm bg-yellow-100 hover:bg-yellow-200 border-yellow-300 hover:border-yellow-500 group 
                     hover:scale-105 transition-all duration-300 text-xs sm:text-sm w-full max-w-xs mx-auto
                     relative overflow-hidden animate-pulse-slow"
                 >
                     <span className="absolute inset-0 bg-gradient-to-r from-yellow-200/50 via-yellow-100/30 to-yellow-200/50 
                     opacity-0 group-hover:opacity-100 transition-opacity duration-500 
                     animate-gradient-x"></span>
                     <Activity className="mr-1.5 h-4 w-4 text-yellow-600 group-hover:scale-110 group-hover:rotate-3 
                     transition-transform duration-300"/> 
                     <span className="relative z-10 text-yellow-700 font-medium group-hover:font-semibold 
                     transition-all duration-300">Log Food / Activity</span>
                 </Button>
            </Link>
         </CardFooter>
      </Tabs>
    </Card>
  );
};

function SkeletonLoader() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 animate-pulse w-full">
            {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-2 p-3.5 rounded-lg bg-muted/50 border border-border/20">
                    <Skeleton className="h-5 w-1/3 rounded" />
                    <Skeleton className="h-4 w-full rounded" />
                    <Skeleton className="h-3 w-1/2 rounded" />
                </div>
            ))}
        </div>
    );
}

export default GoalsCard;
