// src/components/dashboard/PDFWorkoutPlan.tsx
"use client";

import React, { useState, useMemo } from 'react';
import Link from 'next/link'; 
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"; 
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CalendarCheck2, CheckSquare, Square, Loader2, Flame, Youtube, Info, ChevronDown, ChevronUp, Edit, FileText, Zap } from 'lucide-react'; 
import { getDay } from 'date-fns';
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { CompletedWorkouts, ExerciseDetail } from '@/app/dashboard/types';
import { PDFWorkoutItem } from '@/app/workout-plans/page';
import { getPowerWorkoutByDay, convertPowerWorkoutToExercises } from '@/data/workouts/power-workout-plan';
import WorkoutQuoteDisplay from '@/components/workout/WorkoutQuoteDisplay';
import YouTubeWorkoutExplanation from '@/components/workout/YouTubeWorkoutExplanation';

export interface PDFWorkoutPlanProps {
    pdfWorkouts: Record<string, PDFWorkoutItem[]>;
    isLoading: boolean;
    completedWorkouts: CompletedWorkouts; 
    onToggleComplete: (exerciseName: string, currentStatus: boolean) => void; 
    onLogWorkout: (exercise: ExerciseDetail, burnedCalories?: number, isEstimated?: boolean) => void; 
    isEstimatingCalories?: string | null; 
    estimateAndLogCalories: (exercise: ExerciseDetail) => Promise<void>; 
    className?: string; 
}

const PDFWorkoutPlan: React.FC<PDFWorkoutPlanProps> = ({
    pdfWorkouts,
    isLoading,
    completedWorkouts, 
    onToggleComplete, 
    onLogWorkout, 
    isEstimatingCalories, 
    estimateAndLogCalories, 
    className, 
}) => {
    const todayIndexRaw = getDay(new Date()); 
    const todayIndex = todayIndexRaw === 0 ? 6 : todayIndexRaw - 1; 
    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;
    const today = daysOfWeek[todayIndex];
    
    const [isLogModalOpen, setIsLogModalOpen] = useState(false);
    const [exerciseToLog, setExerciseToLog] = useState<ExerciseDetail | null>(null);
    const [caloriesBurnedInput, setCaloriesBurnedInput] = useState<string>("");
    const [isExpanded, setIsExpanded] = useState(true); 

    const safeCompletedWorkouts = useMemo(() => completedWorkouts || {}, [completedWorkouts]);
    
    // Get today's PDF workouts and convert to exercises
    const todaysPDFWorkouts = useMemo(() => {
        const todayPDFs = pdfWorkouts[today] || [];
        const exercises: ExerciseDetail[] = [];
        
        todayPDFs.forEach(pdfItem => {
            if (pdfItem.pdfWorkout.category === 'POWER') {
                const powerWorkout = getPowerWorkoutByDay(pdfItem.pdfWorkout.day);
                if (powerWorkout) {
                    exercises.push(...convertPowerWorkoutToExercises(powerWorkout));
                }
            }
        });
        
        return {
            pdfItems: todayPDFs,
            exercises
        };
    }, [pdfWorkouts, today]);

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
                 <p className="ml-3 text-muted-foreground animate-pulse">Loading PDF workouts...</p>
            </div>
        </CardContent>
    );

    const renderNoPDFWorkouts = () => (
        <CardContent className="p-4 sm:p-5 space-y-4">
             <div className="text-center py-10 text-muted-foreground">
                 <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                 <p className="mb-2">No PDF workouts found for today.</p>
                 <p className="text-sm text-muted-foreground/70">Add PDF workouts from the workout plans page.</p>
             </div>
        </CardContent>
    );

    const renderPDFWorkoutList = () => {
        const { pdfItems, exercises } = todaysPDFWorkouts;
        
        return (
            <CardContent className="p-0 sm:p-1 md:p-2"> 
                <div className="space-y-4 p-2 sm:p-3">
                    {/* Show workout quotes and YouTube explanations for POWER workouts */}
                    {pdfItems.map(pdfItem => {
                        if (pdfItem.pdfWorkout.category === 'POWER') {
                            const powerWorkout = getPowerWorkoutByDay(pdfItem.pdfWorkout.day);
                            if (powerWorkout) {
                                return (
                                    <div key={pdfItem.id} className="space-y-3">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Zap className="h-5 w-5 text-red-600" />
                                            <h3 className="font-semibold text-red-700 dark:text-red-300">
                                                {powerWorkout.name}
                                            </h3>
                                        </div>
                                        
                                        <WorkoutQuoteDisplay 
                                            quote={powerWorkout.quote}
                                            variant="featured"
                                        />
                                        
                                        <YouTubeWorkoutExplanation
                                            youtubeUrl={powerWorkout.youtubeExplanationUrl}
                                            workoutName={powerWorkout.name}
                                            description={powerWorkout.description}
                                        />
                                    </div>
                                );
                            }
                        }
                        return null;
                    })}
                    
                    {/* Exercise List */}
                    {exercises.length > 0 && (
                        <div className="space-y-2">
                            <h4 className="font-semibold text-sm text-foreground/80 border-b pb-2">
                                Today's Exercises
                            </h4>
                            <ul className="space-y-2 sm:space-y-3"> 
                                <TooltipProvider delayDuration={200}>
                                {exercises.map((item, index) => {
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
                        </div>
                    )}
                </div>
            </CardContent>
        );
    };

    return (
        <Card className={cn(
            "shadow-xl border border-accent/30 bg-gradient-to-br from-accent/5 via-card to-card backdrop-blur-sm overflow-hidden group transition-shadow hover:shadow-lg",
            className 
        )}>
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b pb-3 sm:pb-4 pt-4 sm:pt-5 px-4 sm:px-5 bg-gradient-to-r from-accent/10 to-card gap-2 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}> 
                <div className="flex-1">
                    <CardTitle className="text-base sm:text-lg md:text-xl flex items-center gap-2 text-accent">
                        <FileText className="h-4 w-4 sm:h-5 sm:w-5"/> Today's PDF Workout ({today})
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm mt-1">Your selected PDF workout plan for today.</CardDescription>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-center">
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
                : todaysPDFWorkouts.pdfItems.length === 0 ? renderNoPDFWorkouts()
                : renderPDFWorkoutList()
                }
                 {(todaysPDFWorkouts.pdfItems.length > 0 || !isLoading) && ( 
                    <CardFooter className="p-3 sm:p-4 bg-muted/30 border-t justify-end">
                        <Link href="/workout-plans">
                            <Button variant="outline" size="sm" className="shadow-sm bg-card hover:bg-accent/10 hover:border-accent group hover:scale-105 transition-transform duration-200 text-xs sm:text-sm">
                                <Edit className="mr-1.5 h-4 w-4 text-accent"/> Edit PDF Workouts
                            </Button>
                        </Link>
                    </CardFooter>
                 )}
            </div>

            {/* Calorie Logging Modal */}
            <AlertDialog open={isLogModalOpen} onOpenChange={setIsLogModalOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Log Workout Calories</AlertDialogTitle>
                        <AlertDialogDescription>
                            {exerciseToLog ? `How many calories did you burn doing ${exerciseToLog.exercise}?` : 'Log your workout calories'}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="py-4">
                        <Label htmlFor="calories">Calories Burned</Label>
                        <Input
                            id="calories"
                            type="number"
                            placeholder="Enter calories (optional)"
                            value={caloriesBurnedInput}
                            onChange={(e) => setCaloriesBurnedInput(e.target.value)}
                            className="mt-2"
                        />
                        <p className="text-xs text-muted-foreground mt-2">
                            Leave blank to use AI estimation based on your profile.
                        </p>
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmLogWorkout} className="bg-primary hover:bg-primary/90">
                           Confirm & Log Workout
                        </AlertDialogAction>
                   </AlertDialogFooter>
               </AlertDialogContent>
           </AlertDialog>
        </Card>
    );
};

export default PDFWorkoutPlan;
