"use client";

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CalendarCheck2, RefreshCw, CheckSquare, Square, ExternalLink, Loader2, Flame, Youtube, Info, ChevronDown, ChevronUp, Edit, RotateCcw } from 'lucide-react';
import { getDay } from 'date-fns';
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { CompletedWorkouts, ExerciseDetail, WeeklyWorkoutPlan } from './types';
import { motion } from 'framer-motion';

interface DashboardSidebarProps {
    weeklyWorkoutPlan: WeeklyWorkoutPlan | null;
    isGeneratingPlan: boolean;
    completedWorkouts: CompletedWorkouts;
    handleToggleWorkoutComplete: (exerciseName: string, currentStatus: boolean) => void;
    handleLogCompletedWorkout: (exercise: ExerciseDetail, burnedCalories?: number, isEstimated?: boolean) => void;
    handleRegenerateWorkoutPlan: () => void;
    canRegenerateWorkoutPlan: boolean;
    isEstimatingCalories?: string | null;
    estimateAndLogCalories: (exercise: ExerciseDetail) => Promise<void>;
    isDark: boolean; // Add dark theme prop
}

const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
    weeklyWorkoutPlan,
    isGeneratingPlan,
    completedWorkouts,
    handleToggleWorkoutComplete,
    handleLogCompletedWorkout,
    handleRegenerateWorkoutPlan,
    canRegenerateWorkoutPlan,
    isEstimatingCalories,
    estimateAndLogCalories,
    isDark,
}) => {
    const todayIndexRaw = getDay(new Date());
    const todayIndex = todayIndexRaw === 0 ? 6 : todayIndexRaw - 1;
    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;
    const today = daysOfWeek[todayIndex];
    const todaysPlan = useMemo(() => weeklyWorkoutPlan ? weeklyWorkoutPlan[today] : [], [weeklyWorkoutPlan, today]);

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

    const completedExercises = useMemo(() => {
        return todaysPlan.filter(exercise => safeCompletedWorkouts[exercise.exercise]?.completed).map(ex => ex.exercise);
    }, [todaysPlan, safeCompletedWorkouts]);

    const workoutProgress = useMemo(() => {
        if (!todaysPlan.length) return 0;
        return Math.round((completedExercises.length / todaysPlan.length) * 100);
    }, [completedExercises.length, todaysPlan.length]);

    // Keyboard navigation for workout list - disabled on mobile for better touch experience
    const handleKeyDown = (event: React.KeyboardEvent, exerciseName: string, isCompleted: boolean) => {
        if (!isMobile && (event.key === 'Enter' || event.key === ' ')) {
            event.preventDefault();
            handleToggleWorkoutComplete(exerciseName, isCompleted);
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
                handleLogCompletedWorkout(exerciseToLog, validBurnedCalories, false);
            }
        }
        setIsLogModalOpen(false);
        setExerciseToLog(null);
        setCaloriesBurnedInput("");
    };    const handleExerciseToggle = (exerciseName: string) => {
        const exercise = todaysPlan.find(ex => ex.exercise === exerciseName);
        if (exercise) {
            const isCompleted = safeCompletedWorkouts[exerciseName]?.completed || false;
            handleToggleWorkoutComplete(exerciseName, isCompleted);
        }
    };

    return (
        <div className="space-y-6 md:space-y-8">
            {/* Today's Workout Section - Calisthenics Design */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
            >
                <div className={`backdrop-blur-sm rounded-3xl shadow-lg border-0 p-4 sm:p-6 md:p-8 lg:sticky lg:top-6 animate-slide-up transition-all duration-500 ${isDark ? 'bg-[#2a2a2a] border-[#3a3a3a]' : 'bg-white/70 border border-blue-100/50'} shadow-lg`}>
                    <div className="flex flex-col sm:flex-row lg:flex-col gap-4 sm:items-center lg:items-start sm:justify-between lg:justify-start mb-4 sm:mb-6">
                        <div>                            <h3 className={`text-lg sm:text-xl font-semibold mb-1 ${isDark ? 'text-white' : 'text-gray-800'}`}>Today's Workout</h3>
                            <p className={`text-sm sm:text-base ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Your personalized plan</p>
                        </div>                        {canRegenerateWorkoutPlan && (                            <Button 
                                variant="outline" 
                                size="sm" 
                                className={`self-start sm:self-auto lg:self-start border shadow-lg transition-all duration-300 ${isDark ? 'border-[#3a3a3a] bg-[#1a1a1a] hover:bg-[#333] text-gray-300' : 'border-gray-300 bg-white hover:bg-gray-50 text-gray-800 hover:text-gray-900'}`} 
                                onClick={handleRegenerateWorkoutPlan}
                                disabled={isGeneratingPlan}
                            >
                                <RotateCcw size={14} className={`mr-2 ${isGeneratingPlan ? 'animate-spin' : ''}`} />
                                Regenerate
                            </Button>
                        )}
                    </div>
                    
                    {isGeneratingPlan ? (
                        <div className="space-y-4">
                            <Skeleton className="h-8 w-full rounded-2xl" />
                            <Skeleton className="h-20 w-full rounded-2xl" />
                            <Skeleton className="h-20 w-full rounded-2xl" />
                        </div>
                    ) : todaysPlan.length > 0 ? (
                        <>
                            {/* Progress - Mobile Optimized */}
                            <div className="mb-4 sm:mb-6">
                                <div className="flex justify-between items-center mb-3">                                    <span className={`text-sm sm:text-base ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                        {completedExercises.length}/{todaysPlan.length} exercises
                                    </span>
                                    <span className={`text-base sm:text-lg font-medium ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>
                                        {workoutProgress}%
                                    </span>
                                </div>                                <div className={`w-full rounded-full h-2.5 sm:h-3 shadow-lg ${isDark ? 'bg-[#333]' : 'bg-purple-200/50'}`}>
                                    {/* eslint-disable-next-line react/forbid-dom-props */}
                                    <div 
                                        className={`${isDark ? 'bg-gradient-to-r from-purple-400 to-purple-500' : 'bg-gradient-to-r from-purple-400 to-purple-500'} h-2.5 sm:h-3 rounded-full transition-all duration-500 shadow-lg`} 
                                        style={{ width: `${workoutProgress}%` }}
                                    />
                                </div>
                            </div>

                            {/* Exercises - Mobile Optimized */}
                            {todaysPlan.map((exercise, index) => {
                                const isCompleted = safeCompletedWorkouts[exercise.exercise]?.completed || false;
                                const estimatingThis = isEstimatingCalories === exercise.exercise;
                                const currentLog = safeCompletedWorkouts[exercise.exercise];
                                
                                return (
                                    <div key={`${exercise.exercise}-${index}`} className="space-y-3 sm:space-y-4">                                            <div className={`backdrop-blur-sm rounded-2xl p-4 sm:p-6 border shadow-lg transition-all duration-300 ${isDark ? 'bg-[#1a1a1a] border-[#3a3a3a]' : 'bg-white/50 border-white/30'}`}>
                                            <div className="flex items-start space-x-3 sm:space-x-4">
                                                <button
                                                    onClick={() => handleExerciseToggle(exercise.exercise)}
                                                    onKeyDown={(e) => handleKeyDown(e, exercise.exercise, isCompleted)}
                                                    className="mt-1 flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-purple-500 rounded"
                                                    tabIndex={isMobile ? -1 : 0}
                                                    aria-label={`Mark ${exercise.exercise} as ${isCompleted ? 'incomplete' : 'complete'}`}
                                                >
                                                    {isCompleted ? (
                                                        <CheckSquare className="h-5 w-5 text-purple-600" />
                                                    ) : (
                                                        <Square className="h-5 w-5 text-gray-400" />
                                                    )}
                                                </button>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-2">                                                        <h4 className={`font-semibold text-sm sm:text-base truncate pr-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                                                            {exercise.exercise}
                                                        </h4><div className="flex items-center gap-2 flex-shrink-0">
                                                            {exercise.youtubeLink && (
                                                                <TooltipProvider>
                                                                    <Tooltip>                                                        <TooltipTrigger asChild>
                                                            <a 
                                                                href={exercise.youtubeLink} 
                                                                target="_blank" 
                                                                rel="noopener noreferrer" 
                                                                aria-label={`Watch ${exercise.exercise} tutorial on YouTube`}
                                                                className="flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-primary rounded transition-colors duration-200 text-red-500 hover:text-red-600"
                                                            >
                                                                <Youtube className="w-4 h-4 sm:w-5 sm:h-5" />
                                                            </a>
                                                        </TooltipTrigger>
                                                                        <TooltipContent>
                                                                            <p>Watch tutorial</p>
                                                                        </TooltipContent>
                                                                    </Tooltip>
                                                                </TooltipProvider>
                                                            )}
                                                        </div>
                                                    </div>                                                    <div className={`flex flex-wrap gap-2 mb-2 text-xs sm:text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                                        {exercise.sets && <span className={`px-2 py-1 rounded ${isDark ? 'bg-blue-600/30' : 'bg-blue-100/50'}`}>{exercise.sets} sets</span>}
                                                        {exercise.reps && <span className={`px-2 py-1 rounded ${isDark ? 'bg-green-600/30' : 'bg-green-100/50'}`}>{exercise.reps}</span>}
                                                    </div>
                                                    {exercise.notes && (                                                        <p className={`text-xs sm:text-sm leading-relaxed mb-3 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                                                            {exercise.notes}
                                                        </p>
                                                    )}
                                                    {currentLog?.loggedCalories && (                                                        <div className={`flex items-center gap-2 text-xs mb-2 ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>
                                                            <Flame className="w-3 h-3" />
                                                            <span>{currentLog.loggedCalories} calories logged</span>
                                                            {currentLog.isEstimated && <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>(estimated)</span>}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>                                        
                                        <div className="flex gap-2">                                            <Button 
                                                variant="outline" 
                                                className={`flex-1 rounded-2xl text-sm shadow-lg transition-all duration-200 hover:scale-[1.02] ${isDark ? 'text-purple-400 border-[#3a3a3a] bg-[#1a1a1a] hover:bg-[#333]' : 'text-purple-600 border-purple-200/50 bg-white/40 backdrop-blur-sm hover:bg-white/60'}`} 
                                                onClick={() => handleOpenLogModal(exercise)}
                                                disabled={estimatingThis}
                                            >
                                                {estimatingThis ? (
                                                    <>
                                                        <Loader2 size={16} className="mr-2 animate-spin" />
                                                        Estimating...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Flame size={16} className="mr-2" />
                                                        Log Calories
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                );                            })}                            {/* Edit Plan Button at the bottom */}                            <div className={`mt-6 pt-4 border-t ${isDark ? 'border-[#3a3a3a]' : 'border-gray-200/50'}`}>
                                <Link href="/workout-plans" className="block">
                                    <Button 
                                        variant="outline" 
                                        className={`w-full rounded-2xl text-sm shadow-lg ${isDark ? 'text-blue-400 border-[#3a3a3a] bg-[#1a1a1a]' : 'text-blue-600 border-blue-200/50 bg-white/40 backdrop-blur-sm'}`} 
                                    >
                                        <Edit size={16} className="mr-2" />
                                        Edit Plan
                                    </Button>
                                </Link>
                            </div>
                        </>
                    ) : (                        <div className="text-center py-8">
                            <CalendarCheck2 className={`mx-auto h-12 w-12 mb-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                            <p className={`mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>No workout planned for today</p>
                            {canRegenerateWorkoutPlan && (
                                <Button 
                                    onClick={handleRegenerateWorkoutPlan}
                                    className="rounded-2xl bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                                    disabled={isGeneratingPlan}
                                >
                                    <RefreshCw className={`w-4 h-4 mr-2 ${isGeneratingPlan ? 'animate-spin' : ''}`} />
                                    Generate Workout Plan
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </motion.div>            {/* Log Workout Modal - Calisthenics Theme */}
            <AlertDialog open={isLogModalOpen} onOpenChange={setIsLogModalOpen}>
                <AlertDialogContent className={`rounded-3xl border-0 shadow-2xl backdrop-blur-sm max-w-md mx-auto ${isDark ? 'bg-[#2a2a2a] border-[#3a3a3a]' : 'bg-gradient-to-br from-white/95 via-blue-50/80 to-purple-50/80'}`}>
                    {/* Header with Flame Icon */}
                    <AlertDialogHeader className="text-center space-y-4 pt-6">
                        <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-r from-orange-400 to-red-500 flex items-center justify-center shadow-lg">
                            <Flame className="w-8 h-8 text-white" />
                        </div>                        <AlertDialogTitle className={`text-2xl font-bold ${isDark ? 'text-white' : 'bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent'}`}>
                            Log Workout Calories
                        </AlertDialogTitle>
                        <AlertDialogDescription className={`leading-relaxed px-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            {exerciseToLog && (
                                <div className="space-y-2">                                    <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>{exerciseToLog.exercise}</p>
                                    <p className={`text-sm ${isDark ? 'text-gray-400' : ''}`}>Track your calorie burn to monitor your fitness progress</p>
                                </div>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    
                    {/* Input Section with Enhanced Design */}
                    <div className="py-6 px-6">
                        <div className="relative">                            <Label htmlFor="calories" className={`text-sm font-semibold mb-3 block ${isDark ? 'text-white' : 'text-gray-700'}`}>
                                Calories Burned 🔥
                            </Label>
                            <div className="relative">
                                <Input
                                    id="calories"
                                    type="number"
                                    placeholder="Enter calories (leave empty for AI estimate)"
                                    value={caloriesBurnedInput}
                                    onChange={(e) => setCaloriesBurnedInput(e.target.value)}
                                    className={`rounded-2xl border-2 backdrop-blur-sm focus:ring-2 focus:ring-opacity-20 pl-4 pr-16 py-3 text-lg font-medium transition-all duration-300 shadow-sm ${isDark ? 'border-[#3a3a3a] bg-[#1a1a1a] focus:border-purple-500 focus:ring-purple-500 placeholder:text-gray-500 text-white' : 'border-gray-200/50 bg-white/70 focus:border-purple-400 focus:ring-purple-400 placeholder:text-gray-400 text-gray-800'}`}
                                />
                                <div className={`absolute right-4 top-1/2 transform -translate-y-1/2 font-medium text-sm ${isDark ? 'text-gray-400' : 'text-gray-400'}`}>
                                    kcal
                                </div>
                            </div>
                            {/* Helpful hint */}                            <div className={`mt-3 p-3 rounded-xl border ${isDark ? 'bg-[#1a1a1a] border-[#3a3a3a]' : 'bg-blue-50/50 border-blue-200/30'}`}>
                                <div className="flex items-start gap-2">
                                    <Info className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isDark ? 'text-blue-400' : 'text-blue-500'}`} />
                                    <p className={`text-xs leading-relaxed ${isDark ? 'text-gray-400' : 'text-blue-700'}`}>
                                        <strong>Tip:</strong> Leave empty to let our AI estimate calories based on your exercise intensity and duration
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Footer with Enhanced Buttons */}
                    <AlertDialogFooter className="flex gap-3 px-6 pb-6">                        <AlertDialogCancel className={`rounded-2xl border-2 backdrop-blur-sm font-medium px-6 py-3 transition-all duration-200 flex-1 ${isDark ? 'border-[#3a3a3a] bg-[#1a1a1a] hover:bg-[#333] text-gray-300' : 'border-gray-200 bg-white/70 hover:bg-gray-50/80 text-gray-700'}`}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={handleConfirmLogWorkout}
                            className="rounded-2xl bg-gradient-to-r from-purple-500 via-purple-600 to-blue-500 hover:from-purple-600 hover:via-purple-700 hover:to-blue-600 text-white font-semibold px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-200 flex-1 transform hover:scale-[1.02]"
                        >
                            <Flame className="w-4 h-4 mr-2" />
                            {caloriesBurnedInput ? 'Log Calories' : 'AI Estimate & Log'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default DashboardSidebar;
