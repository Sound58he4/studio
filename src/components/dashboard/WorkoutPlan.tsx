// src/components/dashboard/WorkoutPlan.tsx
"use client";

import React, { useState, useMemo } from 'react';
import Link from 'next/link'; 
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"; 
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CalendarCheck2, RefreshCw, CheckSquare, Square, ExternalLink, Loader2, Flame, Youtube, Info, ChevronDown, ChevronUp, Edit } from 'lucide-react'; 
import { getDay } from 'date-fns';
import type { WeeklyWorkoutPlan as CoreWeeklyWorkoutPlan, ExerciseDetail as CoreExerciseDetail } from '@/ai/flows/generate-workout-plan'; // Use original types
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { CompletedWorkouts } from '@/app/dashboard/types';

// Use core types directly or alias them if component-specific structure is identical
type WeeklyWorkoutPlan = CoreWeeklyWorkoutPlan;
type ExerciseDetail = CoreExerciseDetail;


export interface WorkoutPlanProps { // Make interface exportable
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

const WorkoutPlan: React.FC<WorkoutPlanProps> = ({
    plan,
    isLoading,
    completedWorkouts, 
    onToggleComplete, 
    onLogWorkout, 
    onRegenerate, 
    canRegenerate, 
    isEstimatingCalories, 
    estimateAndLogCalories, 
    className, 
}) => {
    const todayIndexRaw = getDay(new Date()); 
    const todayIndex = todayIndexRaw === 0 ? 6 : todayIndexRaw - 1; 
    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;
    const today = daysOfWeek[todayIndex];
    const todaysPlan = useMemo(() => plan ? plan[today] : [], [plan, today]);

    const [isLogModalOpen, setIsLogModalOpen] = useState(false);
    const [exerciseToLog, setExerciseToLog] = useState<ExerciseDetail | null>(null);
    const [caloriesBurnedInput, setCaloriesBurnedInput] = useState<string>("");
    const [isExpanded, setIsExpanded] = useState(false); 

    const safeCompletedWorkouts = useMemo(() => completedWorkouts || {}, [completedWorkouts]);

    const handleOpenLogModal = (exercise: ExerciseDetail) => {
        setExerciseToLog(exercise);
        const currentLog = safeCompletedWorkouts[exercise.exercise];
        setCaloriesBurnedInput(currentLog?.loggedCalories?.toString() ?? "");
        setIsLogModalOpen(true);
    };

    const handleConfirmLogWorkout = () => {
        if (exerciseToLog) {
            const burnedCalories = caloriesBurnedInput ? parseInt(caloriesBurnedInput) : undefined;
            const validBurnedCalories = burnedCalories && !isNaN(burnedCalories) && burnedCalories > 0 ? burnedCalories : undefined;

            if (validBurnedCalories === undefined) {
                 estimateAndLogCalories(exerciseToLog);
             } else {
                 onLogWorkout(exerciseToLog, validBurnedCalories, false);
             }
        }
        setIsLogModalOpen(false);
        setExerciseToLog(null);
        setCaloriesBurnedInput("");
    };

    const renderSkeleton = () => (
         <CardContent className="p-4 sm:p-5 space-y-4">
             <div className="flex justify-center items-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin text-accent"/>
                  <p className="ml-3 text-muted-foreground animate-pulse">Generating your personalized plan...</p>
             </div>
         </CardContent>
     );

     const renderNoPlan = () => (
         <CardContent className="p-4 sm:p-5 space-y-4">
              <div className="text-center py-10 text-muted-foreground">
                  <p className="mb-2">No workout plan found for today.</p>
                  {canRegenerate && (
                    <Button variant="link" onClick={onRegenerate} className="mt-2 text-primary hover:underline" disabled={isLoading}>Generate Plan Now?</Button>
                  )}
              </div>
         </CardContent>
     );

     const renderRestDay = () => (
         <CardContent className="p-4 sm:p-5 space-y-4">
             <div className="flex flex-col items-center justify-center text-center py-10 text-green-600 dark:text-green-400 gap-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 transition-transform duration-300 hover:scale-[1.02]"> 
                <CalendarCheck2 className="h-10 w-10 sm:h-12 sm:w-12"/>
                <p className="text-lg sm:text-xl font-semibold">Rest Day!</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Enjoy your recovery. Consider light stretching or a walk.</p>
             </div>
         </CardContent>
     );

     const renderWorkoutList = () => (
         <CardContent className="p-0 sm:p-1 md:p-2"> 
             <ul className="space-y-2 sm:space-y-3 p-2 sm:p-3"> 
                  <TooltipProvider delayDuration={200}>
                  {todaysPlan.map((item, index) => {
                     const completedEntry = safeCompletedWorkouts[item.exercise];
                     const isCompleted = !!completedEntry?.completed; 
                     const loggedCalories = completedEntry?.loggedCalories;
                     const isEstimated = !!completedEntry?.isEstimated; 
                     const isCurrentlyEstimating = isEstimatingCalories === item.exercise;
                     const isRestOrWarmup = item.exercise.toLowerCase() === 'rest' || item.exercise.toLowerCase().includes('stretch') || item.exercise.toLowerCase().includes('warm-up') || item.exercise.toLowerCase().includes('cool-down');

                     return (
                         <li key={index} className={cn(
                             "flex items-start gap-2 sm:gap-3 p-2.5 sm:p-3.5 border rounded-lg transition-all duration-300 shadow-sm group relative overflow-hidden hover:shadow-md hover:border-primary/30",
                             "animate-in fade-in slide-in-from-bottom-2 duration-500 ease-out", 
                             isCompleted ? "bg-green-100/50 dark:bg-green-900/30 border-green-300 dark:border-green-700" : "bg-card hover:bg-muted/30",
                             isRestOrWarmup && !isCompleted && "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
                             isRestOrWarmup && isCompleted && "bg-blue-100/70 dark:bg-blue-900/40 border-blue-300 dark:border-blue-700"
                         )}
                         style={{ animationDelay: `${index * 50}ms` }} 
                         >
                             <button
                                onClick={() => onToggleComplete(item.exercise, isCompleted)}
                                className="mt-0.5 flex-shrink-0 z-10 group focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded" 
                                disabled={isCurrentlyEstimating}
                                title={isCompleted ? "Mark as incomplete" : "Mark as complete"}
                             >
                                <div className={cn("h-5 w-5 rounded border-2 flex items-center justify-center transition-all duration-200 ease-in-out transform group-hover:scale-110", 
                                   isCompleted && !isRestOrWarmup && "bg-green-500 border-green-600 scale-110",
                                   isCompleted && isRestOrWarmup && "bg-blue-500 border-blue-600 scale-110",
                                   !isCompleted && "bg-background border-muted-foreground group-hover:border-primary",
                                   isCurrentlyEstimating && "opacity-50 cursor-not-allowed"
                                )}>
                                    {isCompleted && <CheckSquare className="h-3.5 w-3.5 text-white transition-transform duration-200 group-hover:scale-125"/>}
                                    {isCurrentlyEstimating && <Loader2 className="h-3 w-3 animate-spin text-primary"/>}
                                    {!isCompleted && !isCurrentlyEstimating && <Square className="h-3 w-3 text-transparent transition-colors group-hover:text-primary/50" />}
                                </div>
                             </button>

                             <div className="flex-1 min-w-0">
                                 <div className="flex justify-between items-start gap-2">
                                     <p className={cn(
                                         "font-semibold text-sm sm:text-base leading-tight break-words transition-colors", 
                                         isCompleted && "line-through text-muted-foreground",
                                         isRestOrWarmup && "text-blue-800 dark:text-blue-200"
                                     )}>
                                         {item.exercise}
                                     </p>
                                     {item.youtubeLink && (
                                         <Tooltip>
                                             <TooltipTrigger asChild>
                                                 <a href={item.youtubeLink} target="_blank" rel="noopener noreferrer" title="Watch Tutorial" className="flex-shrink-0 z-10 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 rounded-full">
                                                     <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-red-600 -mt-1 -mr-1 hover:bg-red-100/50 dark:hover:bg-red-900/30 rounded-full transform hover:scale-110 transition-transform">
                                                         <Youtube className="h-4 w-4"/>
                                                     </Button>
                                                 </a>
                                             </TooltipTrigger>
                                             <TooltipContent side="top" className="text-xs p-1.5 bg-foreground text-background rounded shadow-lg">
                                                 Watch Tutorial
                                             </TooltipContent>
                                         </Tooltip>
                                     )}
                                 </div>

                                 {(item.sets || item.reps) && (
                                     <p className={cn(
                                         "text-xs sm:text-sm text-muted-foreground mt-0.5 transition-colors", 
                                         isCompleted && "line-through"
                                     )}>
                                         {item.sets ? <span className="font-medium">{item.sets} sets</span> : ''}
                                         {item.sets && item.reps ? ' x ' : ''}
                                         {item.reps ? <span className="font-medium">{item.reps}</span> : ''}
                                         {typeof item.reps === 'string' && (item.reps.includes('min') || item.reps.includes('sec') || item.reps.includes('s')) ? '' : (item.reps ? ' reps' : '')}
                                     </p>
                                 )}

                                  {item.notes && (
                                      <Tooltip>
                                          <TooltipTrigger asChild>
                                               <p className="text-xs text-muted-foreground italic pt-1 truncate flex items-center gap-1 cursor-default hover:text-foreground transition-colors">
                                                  <Info size={12}/> {item.notes}
                                               </p>
                                          </TooltipTrigger>
                                           <TooltipContent side="bottom" className="text-xs p-1.5 max-w-[250px] whitespace-normal bg-foreground text-background rounded shadow-lg">
                                               {item.notes}
                                           </TooltipContent>
                                      </Tooltip>
                                  )}

                                   {isCompleted && !isRestOrWarmup && (
                                     <div className="mt-2 flex items-center justify-between flex-wrap gap-2 animate-in fade-in duration-300 delay-100">
                                          {isCurrentlyEstimating ? (
                                             <p className="text-xs text-primary font-medium flex items-center gap-1 animate-pulse">
                                                 <Loader2 size={12} className="animate-spin"/> Estimating calories...
                                             </p>
                                          ) : loggedCalories !== undefined ? (
                                             <p className={cn(
                                                  "text-xs font-medium flex items-center gap-1 px-1.5 py-0.5 rounded transition-colors duration-200", 
                                                   isEstimated ? "text-purple-700 dark:text-purple-300 bg-purple-200/50 dark:bg-purple-800/30 border border-purple-300 dark:border-purple-700" : "text-green-700 dark:text-green-300 bg-green-200/50 dark:bg-green-800/30 border border-green-300 dark:border-green-700"
                                                 )}>
                                                 <Flame size={12}/> {isEstimated ? 'Est.' : 'Logged'}: {loggedCalories} kcal burned
                                             </p>
                                          ) : (
                                             <p className="text-xs text-muted-foreground italic bg-muted/50 px-1.5 py-0.5 rounded border border-dashed">Calories not logged</p>
                                          )}
                                         <Button variant="link" size="sm" className="h-auto p-0 text-xs text-primary hover:underline focus:outline-none focus:ring-1 focus:ring-primary rounded" onClick={() => handleOpenLogModal(item)}>
                                              {loggedCalories !== undefined ? 'Edit Logged Calories' : 'Log/Estimate Calories'}
                                          </Button>
                                     </div>
                                  )}
                             </div>

                            <div className={cn(
                                "absolute inset-y-0 left-0 w-1 sm:w-1.5 transition-colors duration-300 rounded-l-md",
                                isCompleted ? "bg-green-400 dark:bg-green-600" : "bg-muted group-hover:bg-primary/20",
                                isRestOrWarmup && !isCompleted && "bg-blue-300 dark:bg-blue-700 group-hover:bg-primary/20",
                                isRestOrWarmup && isCompleted && "bg-blue-500 dark:bg-blue-600"
                            )}></div>
                         </li>
                     );
                  })}
                  </TooltipProvider>
             </ul>
         </CardContent>
     );


    return (
        <Card className={cn(
            "shadow-xl border border-accent/30 bg-gradient-to-br from-accent/5 via-card to-card backdrop-blur-sm overflow-hidden group transition-shadow hover:shadow-lg",
            className 
        )}>
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b pb-3 sm:pb-4 pt-4 sm:pt-5 px-4 sm:px-5 bg-gradient-to-r from-accent/10 to-card gap-2 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}> 
                <div className="flex-1">
                    <CardTitle className="text-base sm:text-lg md:text-xl flex items-center gap-2 text-accent">
                        <CalendarCheck2 className="h-4 w-4 sm:h-5 sm:w-5"/> Today's Workout ({today})
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm mt-1">Your personalized gym plan for today.</CardDescription>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-center">
                     {canRegenerate && (
                        <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); onRegenerate(); }} disabled={isLoading || !!isEstimatingCalories} className="text-xs text-accent border-accent/50 hover:bg-accent/20 hover:text-accent flex-shrink-0 shadow-sm hover:scale-105 transition-transform">
                            <RefreshCw className={cn("mr-1 h-3 w-3", isLoading && "animate-spin")}/> Regenerate
                        </Button>
                     )}
                    <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8 text-accent">
                        {isExpanded ? <ChevronUp className="h-4 w-4 sm:h-5 sm:w-5" /> : <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5" />}
                    </Button>
                </div>
            </CardHeader>

            <div className={cn(
                 "transition-all duration-500 ease-out overflow-hidden",
                 isExpanded ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0" 
            )}>
                {isLoading ? renderSkeleton()
                : !plan ? renderNoPlan()
                : todaysPlan.length > 0 && todaysPlan[0].exercise.toLowerCase() === 'rest' ? renderRestDay()
                : todaysPlan.length > 0 ? renderWorkoutList()
                : renderNoPlan()
                }
                 {(plan || !isLoading) && ( 
                    <CardFooter className="p-3 sm:p-4 bg-muted/30 border-t justify-end">
                        <Link href="/workout-plans">
                            <Button variant="outline" size="sm" className="shadow-sm bg-card hover:bg-accent/10 hover:border-accent group hover:scale-105 transition-transform duration-200 text-xs sm:text-sm">
                                <Edit className="mr-1.5 h-4 w-4 text-accent"/> Edit Full Plan
                            </Button>
                        </Link>
                    </CardFooter>
                 )}
            </div>

            <AlertDialog open={isLogModalOpen} onOpenChange={setIsLogModalOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Log Calories Burned for "{exerciseToLog?.exercise}"?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Enter the estimated calories burned. Leave blank for AI estimation.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="py-4">
                        <Label htmlFor="calories-burned-input" className="mb-2 block">Calories Burned (kcal)</Label>
                         <Input
                            id="calories-burned-input"
                            type="number"
                            placeholder="Leave empty for AI estimate"
                            value={caloriesBurnedInput}
                            onChange={(e) => setCaloriesBurnedInput(e.target.value)}
                            min="0"
                         />
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => { setExerciseToLog(null); setCaloriesBurnedInput(""); }}>Cancel</AlertDialogCancel>
                         <AlertDialogAction onClick={handleConfirmLogWorkout} className="bg-primary hover:bg-primary/90">
                            Confirm & Log Workout
                         </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card>
    );
};

export default WorkoutPlan;
