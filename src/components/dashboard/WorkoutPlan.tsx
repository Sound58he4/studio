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
    const [isMobile, setIsMobile] = useState(false);

    // Detect mobile device
    React.useEffect(() => {
        const checkIsMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        
        checkIsMobile();
        window.addEventListener('resize', checkIsMobile);
        return () => window.removeEventListener('resize', checkIsMobile);
    }, []);

    const safeCompletedWorkouts = useMemo(() => completedWorkouts || {}, [completedWorkouts]);

    // Keyboard navigation for workout list - disabled on mobile for better touch experience
    const handleKeyDown = (event: React.KeyboardEvent, exerciseName: string, isCompleted: boolean) => {
        if (!isMobile && (event.key === 'Enter' || event.key === ' ')) {
            event.preventDefault();
            onToggleComplete(exerciseName, isCompleted);
        }
    };

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
         <CardContent className="p-4 space-y-4">
             <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-accent mr-3"/>
                  <p className="text-sm text-muted-foreground">Generating your plan...</p>
             </div>
         </CardContent>
     );

     const renderNoPlan = () => (
         <CardContent className="p-4 space-y-4">
              <div className="text-center py-8 text-muted-foreground">
                  <p className="mb-2 text-sm">No workout plan found for today.</p>
                  {canRegenerate && (
                    <Button 
                        variant="outline" 
                        onClick={onRegenerate} 
                        className="mt-2 text-primary border-primary/50 hover:bg-primary/10" 
                        disabled={isLoading}
                        size={isMobile ? "default" : "sm"}
                    >
                        Generate Plan Now
                    </Button>
                  )}
              </div>
         </CardContent>
     );

     const renderRestDay = () => (
         <CardContent className="p-4 space-y-4">
             <div className="flex flex-col items-center justify-center text-center py-8 text-green-600 dark:text-green-400 gap-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800"> 
                <CalendarCheck2 className="h-8 w-8"/>
                <p className="text-lg font-semibold">Rest Day!</p>
                <p className="text-sm text-muted-foreground">Enjoy your recovery. Consider light stretching or a walk.</p>
             </div>
         </CardContent>
     );

     const renderWorkoutList = () => {
         const completedCount = todaysPlan.filter(item => safeCompletedWorkouts[item.exercise]?.completed).length;
         const totalCount = todaysPlan.length;
         const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

         // Mobile-optimized render
         if (isMobile) {
             return (
                 <CardContent className="p-3"> 
                     {/* Mobile Progress Bar */}
                     <div className="mb-4">
                         <div className="flex justify-between items-center mb-2">
                             <span className="text-xs font-medium text-muted-foreground">
                                 {completedCount}/{totalCount} exercises
                             </span>
                             <span className="text-xs font-medium text-primary">
                                 {Math.round(progressPercentage)}%
                             </span>
                         </div>
                         <div className="w-full bg-muted rounded-full h-2">
                             <div 
                                 className="bg-primary h-2 rounded-full transition-all duration-500"
                                 style={{ width: `${progressPercentage}%` }}
                             />
                         </div>
                         {progressPercentage === 100 && (
                             <div className="mt-2 text-center">
                                 <span className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-1 rounded-full font-medium">
                                     Complete! 🎉
                                 </span>
                             </div>
                         )}
                     </div>

                     {/* Mobile Exercise List */}
                     <div className="space-y-3">
                         {todaysPlan.map((item, index) => {
                             const completedEntry = safeCompletedWorkouts[item.exercise];
                             const isCompleted = !!completedEntry?.completed; 
                             const loggedCalories = completedEntry?.loggedCalories;
                             const isEstimated = !!completedEntry?.isEstimated; 
                             const isCurrentlyEstimating = isEstimatingCalories === item.exercise;
                             const isRestOrWarmup = item.exercise.toLowerCase() === 'rest' || 
                                                   item.exercise.toLowerCase().includes('stretch') || 
                                                   item.exercise.toLowerCase().includes('warm-up') || 
                                                   item.exercise.toLowerCase().includes('cool-down');

                             return (
                                 <div 
                                     key={index} 
                                     className={cn(
                                         "flex flex-col gap-3 p-4 border rounded-lg transition-colors duration-200",
                                         isCompleted ? "bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700" : "bg-card",
                                         isRestOrWarmup && !isCompleted && "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
                                         isRestOrWarmup && isCompleted && "bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700"
                                     )}
                                 >
                                     {/* Exercise Header */}
                                     <div className="flex items-start gap-3">
                                         <button
                                            onClick={() => onToggleComplete(item.exercise, isCompleted)}
                                            className="mt-1 flex-shrink-0"
                                            disabled={isCurrentlyEstimating}
                                            aria-label={`${isCompleted ? "Mark as incomplete" : "Mark as complete"}: ${item.exercise}`}
                                         >
                                            <div className={cn(
                                                "h-6 w-6 rounded border-2 flex items-center justify-center transition-colors duration-200", 
                                                isCompleted && !isRestOrWarmup && "bg-green-500 border-green-600",
                                                isCompleted && isRestOrWarmup && "bg-blue-500 border-blue-600",
                                                !isCompleted && "bg-background border-muted-foreground",
                                                isCurrentlyEstimating && "opacity-50"
                                            )}>
                                                {isCompleted && <CheckSquare className="h-4 w-4 text-white"/>}
                                                {isCurrentlyEstimating && <Loader2 className="h-3 w-3 animate-spin text-primary"/>}
                                            </div>
                                         </button>

                                         <div className="flex-1 min-w-0">
                                             <div className="flex justify-between items-start gap-2">
                                                 <h3 className={cn(
                                                     "font-semibold text-base leading-tight", 
                                                     isCompleted && "line-through text-muted-foreground",
                                                     isRestOrWarmup && "text-blue-800 dark:text-blue-200"
                                                 )}>
                                                     {item.exercise}
                                                 </h3>
                                                 {item.youtubeLink && (
                                                     <a 
                                                         href={item.youtubeLink} 
                                                         target="_blank" 
                                                         rel="noopener noreferrer" 
                                                         className="flex-shrink-0"
                                                     >
                                                         <Button 
                                                             variant="ghost" 
                                                             size="sm" 
                                                             className="h-8 w-8 p-0 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30"
                                                         >
                                                             <Youtube className="h-4 w-4"/>
                                                         </Button>
                                                     </a>
                                                 )}
                                             </div>

                                             {(item.sets || item.reps) && (
                                                 <p className={cn(
                                                     "text-sm text-muted-foreground mt-1", 
                                                     isCompleted && "line-through"
                                                 )}>
                                                     {item.sets ? <span className="font-medium">{item.sets} sets</span> : ''}
                                                     {item.sets && item.reps ? ' × ' : ''}
                                                     {item.reps ? <span className="font-medium">{item.reps}</span> : ''}
                                                     {typeof item.reps === 'string' && (item.reps.includes('min') || item.reps.includes('sec') || item.reps.includes('s')) ? '' : (item.reps ? ' reps' : '')}
                                                 </p>
                                             )}

                                             {item.notes && (
                                                 <p className="text-xs text-muted-foreground italic mt-1 flex items-center gap-1">
                                                     <Info size={12}/> {item.notes}
                                                 </p>
                                             )}
                                         </div>
                                     </div>

                                     {/* Calories Section for Mobile */}
                                     {isCompleted && !isRestOrWarmup && (
                                         <div className="pt-2 border-t border-dashed border-muted-foreground/20">
                                             {isCurrentlyEstimating ? (
                                                <div className="flex items-center justify-center gap-2 py-2">
                                                    <Loader2 size={16} className="animate-spin text-primary"/>
                                                    <span className="text-sm text-primary font-medium">Estimating calories...</span>
                                                </div>
                                             ) : (
                                                <div className="flex items-center justify-between gap-2">
                                                    {loggedCalories !== undefined ? (
                                                        <div className={cn(
                                                            "text-sm font-medium flex items-center gap-1 px-2 py-1 rounded", 
                                                            isEstimated ? "text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/30" : "text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/30"
                                                        )}>
                                                            <Flame size={14}/> 
                                                            {isEstimated ? 'Est.' : 'Logged'}: {loggedCalories} kcal
                                                        </div>
                                                    ) : (
                                                        <span className="text-sm text-muted-foreground italic">No calories logged</span>
                                                    )}
                                                    <Button 
                                                        variant="outline" 
                                                        size="sm" 
                                                        onClick={() => handleOpenLogModal(item)}
                                                        className="text-xs"
                                                    >
                                                        {loggedCalories !== undefined ? 'Edit' : 'Log Calories'}
                                                    </Button>
                                                </div>
                                             )}
                                         </div>
                                     )}
                                 </div>
                             );
                         })}
                     </div>
                 </CardContent>
             );
         }

         // Desktop render (simplified from original)
         return (
             <CardContent className="p-4"> 
                 {/* Desktop Progress indicator */}
                 <div className="mb-4">
                     <div className="flex justify-between items-center mb-2">
                         <span className="text-sm font-medium text-muted-foreground">
                             Progress: {completedCount}/{totalCount} exercises
                         </span>
                         <div className="flex items-center gap-2">
                             <span className="text-sm font-medium text-primary">
                                 {Math.round(progressPercentage)}%
                             </span>
                             {progressPercentage === 100 && (
                                 <span className="text-sm bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-1 rounded-full font-medium">
                                     Complete! 🎉
                                 </span>
                             )}
                         </div>
                     </div>
                     <div className="w-full bg-muted rounded-full h-2">
                         <div 
                             className="bg-gradient-to-r from-primary to-accent h-2 rounded-full transition-all duration-500"
                             style={{ width: `${progressPercentage}%` }}
                         />
                     </div>
                 </div>

                 <div className="max-h-[60vh] overflow-y-auto space-y-3">
                     <TooltipProvider delayDuration={200}>
                        {todaysPlan.map((item, index) => {
                           const completedEntry = safeCompletedWorkouts[item.exercise];
                           const isCompleted = !!completedEntry?.completed; 
                           const loggedCalories = completedEntry?.loggedCalories;
                           const isEstimated = !!completedEntry?.isEstimated; 
                           const isCurrentlyEstimating = isEstimatingCalories === item.exercise;
                           const isRestOrWarmup = item.exercise.toLowerCase() === 'rest' || item.exercise.toLowerCase().includes('stretch') || item.exercise.toLowerCase().includes('warm-up') || item.exercise.toLowerCase().includes('cool-down');

                           return (
                               <div key={index} className={cn(
                                   "flex items-start gap-3 p-4 border rounded-lg transition-all duration-200 hover:shadow-md",
                                   isCompleted ? "bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700" : "bg-card hover:bg-muted/30",
                                   isRestOrWarmup && !isCompleted && "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
                                   isRestOrWarmup && isCompleted && "bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700"
                               )}>
                                   <button
                                      onClick={() => onToggleComplete(item.exercise, isCompleted)}
                                      onKeyDown={(e) => handleKeyDown(e, item.exercise, isCompleted)}
                                      className="mt-0.5 flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded" 
                                      disabled={isCurrentlyEstimating}
                                      title={isCompleted ? "Mark as incomplete" : "Mark as complete"}
                                      aria-label={`${isCompleted ? "Mark as incomplete" : "Mark as complete"}: ${item.exercise}`}
                                   >
                                      <div className={cn("h-5 w-5 rounded border-2 flex items-center justify-center transition-all duration-200", 
                                         isCompleted && !isRestOrWarmup && "bg-green-500 border-green-600",
                                         isCompleted && isRestOrWarmup && "bg-blue-500 border-blue-600",
                                         !isCompleted && "bg-background border-muted-foreground hover:border-primary",
                                         isCurrentlyEstimating && "opacity-50 cursor-not-allowed"
                                      )}>
                                          {isCompleted && <CheckSquare className="h-3.5 w-3.5 text-white"/>}
                                          {isCurrentlyEstimating && <Loader2 className="h-3 w-3 animate-spin text-primary"/>}
                                      </div>
                                   </button>

                                   <div className="flex-1 min-w-0">
                                       <div className="flex justify-between items-start gap-2">
                                           <p className={cn(
                                               "font-semibold text-base leading-tight", 
                                               isCompleted && "line-through text-muted-foreground",
                                               isRestOrWarmup && "text-blue-800 dark:text-blue-200"
                                           )}>
                                               {item.exercise}
                                           </p>
                                           {item.youtubeLink && (
                                               <Tooltip>
                                                   <TooltipTrigger asChild>
                                                       <a href={item.youtubeLink} target="_blank" rel="noopener noreferrer" className="flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 rounded-full">
                                                           <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-red-600 hover:bg-red-100/50 dark:hover:bg-red-900/30 rounded-full">
                                                               <Youtube className="h-4 w-4"/>
                                                           </Button>
                                                       </a>
                                                   </TooltipTrigger>
                                                   <TooltipContent side="top" className="text-xs">
                                                       Watch Tutorial
                                                   </TooltipContent>
                                               </Tooltip>
                                           )}
                                       </div>

                                       {(item.sets || item.reps) && (
                                           <p className={cn(
                                               "text-sm text-muted-foreground mt-0.5", 
                                               isCompleted && "line-through"
                                           )}>
                                               {item.sets ? <span className="font-medium">{item.sets} sets</span> : ''}
                                               {item.sets && item.reps ? ' × ' : ''}
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
                                                 <TooltipContent side="bottom" className="text-xs max-w-[250px] whitespace-normal">
                                                     {item.notes}
                                                 </TooltipContent>
                                            </Tooltip>
                                        )}

                                         {isCompleted && !isRestOrWarmup && (
                                           <div className="mt-2 flex items-center justify-between flex-wrap gap-2">
                                                {isCurrentlyEstimating ? (
                                                   <p className="text-xs text-primary font-medium flex items-center gap-1 animate-pulse">
                                                       <Loader2 size={12} className="animate-spin"/> Estimating calories...
                                                   </p>
                                                ) : loggedCalories !== undefined ? (
                                                   <p className={cn(
                                                        "text-xs font-medium flex items-center gap-1 px-1.5 py-0.5 rounded", 
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
                               </div>
                           );
                        })}
                     </TooltipProvider>
                 </div>
             </CardContent>
         );
     };


    return (
        <Card className={cn(
            "shadow-lg border border-accent/30 bg-card overflow-hidden transition-all duration-200",
            isMobile ? "mx-2" : "hover:shadow-xl",
            className 
        )}>
            <CardHeader className={cn(
                "flex flex-row items-center justify-between border-b pb-3 pt-4 px-4 bg-gradient-to-r from-accent/10 to-card",
                isMobile ? "gap-2" : "gap-4"
            )}> 
                <div className="flex-1 min-w-0">
                    <CardTitle className={cn(
                        "flex items-center gap-2 text-accent",
                        isMobile ? "text-lg" : "text-xl"
                    )}>
                        <CalendarCheck2 className="h-5 w-5 flex-shrink-0"/> 
                        <span className="truncate">Today's Workout ({today})</span>
                    </CardTitle>
                    <CardDescription className="text-sm mt-1">Your personalized gym plan for today.</CardDescription>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                     {canRegenerate && (
                        <Button 
                            variant="outline" 
                            size={isMobile ? "sm" : "default"}
                            onClick={onRegenerate} 
                            disabled={isLoading || !!isEstimatingCalories} 
                            className="text-accent border-accent/50 hover:bg-accent/20 hover:text-accent shadow-sm"
                        >
                            <RefreshCw className={cn("mr-1 h-3 w-3", isLoading && "animate-spin")}/> 
                            {isMobile ? "Regen" : "Regenerate"}
                        </Button>
                     )}
                </div>
            </CardHeader>

            {isLoading ? renderSkeleton()
            : !plan ? renderNoPlan()
            : todaysPlan.length > 0 && todaysPlan[0].exercise.toLowerCase() === 'rest' ? renderRestDay()
            : todaysPlan.length > 0 ? renderWorkoutList()
            : renderNoPlan()
            }
            
            {(plan || !isLoading) && ( 
                <CardFooter className="p-3 bg-muted/30 border-t justify-end">
                    <Link href="/workout-plans">
                        <Button 
                            variant="outline" 
                            size={isMobile ? "default" : "sm"}
                            className="shadow-sm bg-card hover:bg-accent/10 hover:border-accent group transition-colors duration-200"
                        >
                            <Edit className="mr-1.5 h-4 w-4 text-accent"/> 
                            {isMobile ? "Edit Plan" : "Edit Full Plan"}
                        </Button>
                    </Link>
                </CardFooter>
             )}

            <AlertDialog open={isLogModalOpen} onOpenChange={setIsLogModalOpen}>
                <AlertDialogContent className={isMobile ? "mx-4 max-w-[calc(100vw-2rem)]" : ""}>
                    <AlertDialogHeader>
                        <AlertDialogTitle className={isMobile ? "text-lg" : ""}>
                            Log Calories for "{exerciseToLog?.exercise}"
                        </AlertDialogTitle>
                        <AlertDialogDescription className={isMobile ? "text-sm" : ""}>
                            Enter calories burned or leave blank for AI estimation.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="py-4">
                        <Label htmlFor="calories-burned-input" className="mb-2 block text-sm">Calories Burned (kcal)</Label>
                         <Input
                            id="calories-burned-input"
                            type="number"
                            placeholder="Leave empty for AI estimate"
                            value={caloriesBurnedInput}
                            onChange={(e) => setCaloriesBurnedInput(e.target.value)}
                            min="0"
                            className={isMobile ? "text-base" : ""} // Prevent zoom on iOS
                         />
                    </div>
                    <AlertDialogFooter className={isMobile ? "flex-col gap-2" : ""}>
                        <AlertDialogCancel 
                            onClick={() => { setExerciseToLog(null); setCaloriesBurnedInput(""); }}
                            className={isMobile ? "w-full" : ""}
                        >
                            Cancel
                        </AlertDialogCancel>
                         <AlertDialogAction 
                            onClick={handleConfirmLogWorkout} 
                            className={cn("bg-primary hover:bg-primary/90", isMobile && "w-full")}
                        >
                            Confirm & Log
                         </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card>
    );
};

export default WorkoutPlan;
