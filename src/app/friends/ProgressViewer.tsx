// src/app/friends/ProgressViewer.tsx
"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Eye, Loader2, AlertCircle, Target, CalendarDays, Dumbbell, Utensils, CheckCircle, XCircle, Hourglass, Calendar, LineChart, Flame, History as HistoryIcon, Bot, ArrowLeft
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getFriendLatestLogs, getFriendWorkoutPlan, getFriendProfile } from '@/services/firestore/progressService';
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { UserFriend, StoredFoodLogEntry, StoredExerciseLogEntry, WeeklyWorkoutPlan, ExerciseDetail, StoredUserProfile } from '@/app/dashboard/types';
import { format, parseISO, startOfDay, endOfDay, startOfWeek, endOfWeek, isToday, isYesterday, formatDistanceToNow, subDays } from 'date-fns';
import ProgressRing from '@/components/ui/ProgressRing';
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';

interface ProgressViewerProps {
    friend: UserFriend | null;
    currentUserId: string | null;
    isDark?: boolean;
}

const formatLabel = (value?: string | null) => value?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Not Set';

const WorkoutStatusIcon = ({ status }: { status: 'completed' | 'pending' | 'skipped' }) => {
    switch (status) {
        case 'completed': return <CheckCircle size={16} className="text-green-500" />;
        case 'skipped': return <XCircle size={16} className="text-red-500" />;
        case 'pending': default: return <Hourglass size={16} className="text-muted-foreground/70" />;
    }
};

const ProgressViewer: React.FC<ProgressViewerProps> = ({ friend, currentUserId, isDark = false }) => {
    const [friendProfile, setFriendProfile] = useState<StoredUserProfile | null>(null);
    const [friendLogs, setFriendLogs] = useState<Record<string, { food: StoredFoodLogEntry[], exercise: StoredExerciseLogEntry[] }>>({});
    const [friendPlan, setFriendPlan] = useState<WeeklyWorkoutPlan | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState<'today' | 'yesterday' | 'weekly'>('today');

    const fetchFriendData = useCallback(async (friendId: string) => {
        if (!currentUserId) return;
        setIsLoading(true); setError(null);
        console.log(`[ProgressViewer] Fetching all progress data for friend: ${friendId}`);
        try {
            const [profileResult, planResult, logsResult] = await Promise.allSettled([
                getFriendProfile(friendId),
                getFriendWorkoutPlan(friendId),
                getFriendLatestLogs(friendId, 7)
            ]);

            if (profileResult.status === 'fulfilled') setFriendProfile(profileResult.value);
            else console.error("Error fetching friend profile:", profileResult.reason);

            if (planResult.status === 'fulfilled') setFriendPlan(planResult.value);
            else console.error("Error fetching friend plan:", planResult.reason);

            if (logsResult.status === 'fulfilled') {
                 const logs = logsResult.value;
                 const logsByDate: Record<string, { food: StoredFoodLogEntry[], exercise: StoredExerciseLogEntry[] }> = {};
                 const allLogs = [...logs.food, ...logs.exercise];
                 allLogs.forEach(log => {
                      const dateKey = format(startOfDay(parseISO(log.timestamp)), 'yyyy-MM-dd');
                      if (!logsByDate[dateKey]) logsByDate[dateKey] = { food: [], exercise: [] };
                      if ('foodItem' in log) logsByDate[dateKey].food.push(log);
                      else logsByDate[dateKey].exercise.push(log);
                 });
                 Object.values(logsByDate).forEach(dayLogs => {
                      dayLogs.food.sort((a, b) => parseISO(a.timestamp).getTime() - parseISO(b.timestamp).getTime());
                      dayLogs.exercise.sort((a, b) => parseISO(a.timestamp).getTime() - parseISO(b.timestamp).getTime());
                  });
                 setFriendLogs(logsByDate);
             } else {
                  console.error("Error fetching initial logs:", logsResult.reason);
                  setError("Could not load friend's recent activity.");
              }
        } catch (err) {
            console.error("[ProgressViewer] General error fetching friend data:", err);
            setError("An error occurred while fetching friend's progress.");
        } finally { setIsLoading(false); }
    }, [currentUserId]);

    useEffect(() => {
        if (friend && currentUserId && !friend.isAI) {
            setFriendProfile(null); setFriendLogs({}); setFriendPlan(null); setActiveTab('today');
            fetchFriendData(friend.id);
        } else {
            setFriendProfile(null); setFriendLogs({}); setFriendPlan(null); setError(null);
        }
    }, [friend, currentUserId, fetchFriendData]);

     const displayDate = useMemo(() => {
         const today = startOfDay(new Date());
         if (activeTab === 'today') return today;
         if (activeTab === 'yesterday') return startOfDay(subDays(today, 1));
         return startOfWeek(today, { weekStartsOn: 0 });
     }, [activeTab]);

     const dailySummaryData = useMemo(() => {
         const dateKey = format(displayDate, 'yyyy-MM-dd');
         const logs = friendLogs[dateKey] || { food: [], exercise: [] };
         const profileTargets = friendProfile?.useAiTargets
            ? { cal: friendProfile?.targetCalories, p: friendProfile?.targetProtein, c: friendProfile?.targetCarbs, f: friendProfile?.targetFat }
            : { cal: friendProfile?.manualTargetCalories, p: friendProfile?.manualTargetProtein, c: friendProfile?.manualTargetCarbs, f: friendProfile?.manualTargetFat };

         const consumed = {
             calories: logs.food.reduce((sum, log) => sum + (log.calories || 0), 0),
             protein: logs.food.reduce((sum, log) => sum + (log.protein || 0), 0),
             carbs: logs.food.reduce((sum, log) => sum + (log.carbohydrates || 0), 0),
             fat: logs.food.reduce((sum, log) => sum + (log.fat || 0), 0),
         };
         const burned = logs.exercise.reduce((sum, log) => sum + (log.estimatedCaloriesBurned || 0), 0);
         const net = consumed.calories - burned;

         return {
             consumed, burned: Math.round(burned), net: Math.round(net),
             targets: { calories: profileTargets.cal ?? 0, protein: profileTargets.p ?? 0, carbs: profileTargets.c ?? 0, fat: profileTargets.f ?? 0 }
         };
     }, [displayDate, friendLogs, friendProfile]);

     const todaysPlanExercises: ExerciseDetail[] = useMemo(() => {
         if (!friendPlan) return [];
         const dayName = format(displayDate, 'EEEE') as keyof WeeklyWorkoutPlan;
         return friendPlan[dayName] || [];
     }, [displayDate, friendPlan]);

    const getWorkoutStatus = useCallback((): 'completed' | 'pending' | 'skipped' => 'pending', []);

    const friendSince = useMemo(() => {
        if (friend?.since) {
            try { return formatDistanceToNow(parseISO(friend.since), { addSuffix: true }); }
            catch { return 'N/A'; }
        }
        return 'N/A';
    }, [friend?.since]);

    const renderLoading = () => ( 
        <motion.div 
            className="flex justify-center items-center h-60"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
        >
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
                <Loader2 className={`h-8 w-8 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
            </motion.div>
        </motion.div> 
    );
    
    const renderError = () => ( 
        <motion.div 
            className="p-6 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <AlertCircle className={`mx-auto h-10 w-10 ${isDark ? 'text-red-400' : 'text-red-600'} mb-2`} />
            <p className={`${isDark ? 'text-red-400' : 'text-red-600'} font-semibold`}>Error Loading Progress</p>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mt-1`}>{error || "Could not load friend's progress data."}</p>
        </motion.div> 
    );

    const renderDailySummarySection = () => (
        <motion.div 
            className={`p-4 sm:p-5 border rounded-3xl backdrop-blur-sm shadow-lg border-0 ${
                isDark ? 'bg-[#2a2a2a]' : 'bg-white/90'
            }`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-800'} flex items-center justify-between mb-3`}>
                <span>{activeTab === 'today' ? "Today's Summary" : activeTab === 'yesterday' ? "Yesterday's Summary" : "Weekly Summary"}</span>
            </h3>
            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-4`}>Progress against targets</p>
            <div className="space-y-5">
                <motion.div 
                    className={`flex flex-col items-center gap-2`}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, duration: 0.5, type: "spring" }}
                >
                    <ProgressRing 
                        value={dailySummaryData.consumed.calories} 
                        max={dailySummaryData.targets.calories} 
                        size={110} 
                        strokeWidth={10} 
                        color={isDark ? "#6366f1" : "hsl(var(--primary))"} 
                        label="Calories" 
                        unit="kcal" 
                        className="transition-transform duration-300 hover:scale-105" 
                    />
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'} font-medium`}> 
                        {dailySummaryData.consumed.calories.toFixed(0)} / {dailySummaryData.targets.calories > 0 ? dailySummaryData.targets.calories.toFixed(0) : '-'} kcal 
                    </p>
                </motion.div>
                <motion.div 
                    className="space-y-4 pt-4 border-t mt-4"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.3 }}
                >
                    <MacroProgressBar label="Protein" value={dailySummaryData.consumed.protein} target={dailySummaryData.targets.protein} unit="g" color="red" />
                    <MacroProgressBar label="Carbs" value={dailySummaryData.consumed.carbs} target={dailySummaryData.targets.carbs} unit="g" color="yellow" />
                    <MacroProgressBar label="Fat" value={dailySummaryData.consumed.fat} target={dailySummaryData.targets.fat} unit="g" color="green" />
                </motion.div>
                <motion.div 
                    className="text-center text-sm pt-4 border-t mt-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6, duration: 0.3 }}
                > 
                    <p className={`font-medium ${isDark ? 'text-orange-400' : 'text-orange-600'} flex items-center justify-center gap-1.5`}> 
                        <Flame size={16}/> {dailySummaryData.burned} kcal Burned 
                    </p> 
                </motion.div>
            </div>
        </motion.div>
    );

    const renderWorkoutStatusSection = () => (
        <motion.div 
            className={`p-4 sm:p-5 border rounded-3xl backdrop-blur-sm shadow-lg border-0 ${
                isDark ? 'bg-[#2a2a2a]' : 'bg-white/90'
            }`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
        >
            <h3 className={`text-base font-semibold flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-gray-800'} mb-3`}> 
                <Dumbbell size={16}/> {activeTab === 'today' ? "Today's Workout" : activeTab === 'yesterday' ? "Yesterday's Workout" : "Workout Plan"} 
            </h3>
            <div className="text-sm max-h-60 overflow-y-auto">
                {todaysPlanExercises.length > 0 && todaysPlanExercises[0].exercise.toLowerCase() === 'rest' ? (
                    <motion.p 
                        className={`${isDark ? 'text-blue-400' : 'text-blue-600'} italic flex items-center gap-1.5`}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <CalendarDays size={14}/> Rest Day
                    </motion.p>
                ) : todaysPlanExercises.length > 0 ? (
                    <div className="space-y-3">
                        <AnimatePresence>
                            {todaysPlanExercises.map((ex, i) => (
                                <motion.div 
                                    key={i} 
                                    className={`flex items-center justify-between gap-2 group border-b border-dashed pb-2 last:border-b-0 ${
                                        isDark ? 'text-gray-100' : 'text-gray-800'
                                    }`}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.2 + i * 0.1, duration: 0.3 }}
                                >
                                     <div className="flex items-center gap-2"> 
                                         <WorkoutStatusIcon status={getWorkoutStatus()} /> 
                                         <span className="font-medium">{ex.exercise}</span> 
                                     </div>
                                     <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-xs whitespace-nowrap`}> 
                                         {(ex.sets || ex.reps) && `(${ex.sets ? `${ex.sets}x` : ''}${ex.reps || ''}${typeof ex.reps !== 'string' || !ex.reps.includes('min') ? ' reps' : ''})`} 
                                     </span>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                ) : ( 
                    <motion.p 
                        className={`${isDark ? 'text-gray-400' : 'text-gray-600'} italic text-center py-3`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                    >
                        No plan set for this day.
                    </motion.p> 
                )}
            </div>
        </motion.div>
    );

    const renderActivityLogSection = () => {
        const dateKey = format(displayDate, 'yyyy-MM-dd');
        const logs = friendLogs[dateKey] || { food: [], exercise: [] };
        return (
           <motion.div 
               className={`p-0 border rounded-3xl backdrop-blur-sm shadow-lg border-0 overflow-hidden ${
                   isDark ? 'bg-[#2a2a2a]' : 'bg-white/90'
               }`}
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.5, delay: 0.2 }}
           >
                <Tabs defaultValue="nutrition" className="w-full">
                    <TabsList className={`grid w-full grid-cols-2 h-11 rounded-t-3xl rounded-b-none backdrop-blur-sm border-0 shadow-lg ${
                        isDark ? 'bg-[#3a3a3a]' : 'bg-white/60'
                    }`}>
                        <TabsTrigger value="nutrition" className={`text-sm flex items-center gap-1 transition-colors duration-300 rounded-2xl ${
                            isDark ? 'text-gray-300 hover:text-blue-400' : 'text-gray-700 hover:text-blue-600'
                        }`}>
                            <Utensils size={14} /> Nutrition
                        </TabsTrigger>
                        <TabsTrigger value="exercise" className={`text-sm flex items-center gap-1 transition-colors duration-300 rounded-2xl ${
                            isDark ? 'text-gray-300 hover:text-blue-400' : 'text-gray-700 hover:text-blue-600'
                        }`}>
                            <Dumbbell size={14} /> Exercise
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="nutrition" className="px-3 sm:px-4 pb-4 mt-0 max-h-60 overflow-y-auto">
                        <AnimatePresence>
                            {logs.food.length > 0 ? logs.food.map((log, index) => (
                                <motion.div 
                                    key={`food-${log.id}`} 
                                    className={`text-sm p-2 border-b border-dashed last:border-none flex justify-between items-center rounded gap-2 transition-colors duration-200 ${
                                        isDark ? 'hover:bg-[#3a3a3a]/50' : 'hover:bg-gray-50/50'
                                    }`}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1, duration: 0.3 }}
                                >
                                    <span className={`font-medium truncate flex-grow ${
                                        isDark ? 'text-gray-100' : 'text-gray-800'
                                    }`}>{log.foodItem}</span>
                                    <span className={`flex-shrink-0 whitespace-nowrap text-xs ${
                                        isDark ? 'text-gray-400' : 'text-gray-600'
                                    }`}>
                                        {format(parseISO(log.timestamp), 'p')} - {log.calories.toFixed(0)} kcal
                                    </span>
                                </motion.div>
                            )) : (
                                <motion.p 
                                    className={`${isDark ? 'text-gray-400' : 'text-gray-600'} italic text-center py-6 text-sm`}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                >
                                    No food logged.
                                </motion.p>
                            )}
                        </AnimatePresence>
                    </TabsContent>
                    <TabsContent value="exercise" className="px-3 sm:px-4 pb-4 mt-0 max-h-60 overflow-y-auto">
                        <AnimatePresence>
                            {logs.exercise.length > 0 ? logs.exercise.map((log, index) => (
                                <motion.div 
                                    key={`ex-${log.id}`} 
                                    className={`text-sm p-2 border-b border-dashed last:border-none flex justify-between items-center rounded gap-2 transition-colors duration-200 ${
                                        isDark ? 'hover:bg-[#3a3a3a]/50' : 'hover:bg-gray-50/50'
                                    }`}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1, duration: 0.3 }}
                                >
                                    <span className={`font-medium truncate flex-grow ${
                                        isDark ? 'text-gray-100' : 'text-gray-800'
                                    }`}>{log.exerciseName}</span>
                                    <span className={`flex-shrink-0 whitespace-nowrap text-xs ${
                                        isDark ? 'text-gray-400' : 'text-gray-600'
                                    }`}>
                                        {format(parseISO(log.timestamp), 'p')}{log.estimatedCaloriesBurned ? ` - ${log.estimatedCaloriesBurned.toFixed(0)} kcal` : ''}
                                    </span>
                                </motion.div>
                            )) : (
                                <motion.p 
                                    className={`${isDark ? 'text-gray-400' : 'text-gray-600'} italic text-center py-6 text-sm`}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                >
                                    No exercise logged.
                                </motion.p>
                            )}
                        </AnimatePresence>
                    </TabsContent>
                </Tabs>
           </motion.div>
        );
    };

    return (
        <motion.div 
            className={`flex flex-col h-full ${
                isDark ? 'bg-[#1a1a1a]' : 'bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100'
            }`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            {friend && !friend.isAI ? (
                <>
                    {/* Friend's Goal/Status Sub-header */}
                    <motion.div 
                        className={`p-3 border-b backdrop-blur-sm text-xs text-center md:text-left shadow-lg border-0 ${
                            isDark ? 'bg-[#2a2a2a]' : 'bg-white/90'
                        }`}
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <span className={`font-medium ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>Goal:</span> {formatLabel(friendProfile?.fitnessGoal)}
                        <span className={`mx-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>|</span>
                        <span className={`font-medium ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>Friend since:</span> {friendSince}
                    </motion.div>

                    <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="flex-shrink-0 border-b border-0">
                        <TabsList className={`grid w-full grid-cols-3 h-10 backdrop-blur-sm shadow-lg border-0 rounded-none ${
                            isDark ? 'bg-[#2a2a2a]' : 'bg-white/90'
                        }`}>
                             <TabsTrigger value="today" className={`text-xs transition-colors duration-300 rounded-xl ${
                                 isDark ? 'text-gray-300 hover:text-blue-400' : 'text-gray-700 hover:text-blue-600'
                             }`}>
                                 <CalendarDays size={14} className="mr-1"/> Today
                             </TabsTrigger>
                             <TabsTrigger value="yesterday" className={`text-xs transition-colors duration-300 rounded-xl ${
                                 isDark ? 'text-gray-300 hover:text-blue-400' : 'text-gray-700 hover:text-blue-600'
                             }`}>
                                 <HistoryIcon size={14} className="mr-1"/> Yesterday
                             </TabsTrigger>
                             <TabsTrigger value="weekly" className={`text-xs transition-colors duration-300 rounded-xl ${
                                 isDark ? 'text-gray-300 hover:text-blue-400' : 'text-gray-700 hover:text-blue-600'
                             }`}>
                                 <Calendar size={14} className="mr-1"/> This Week
                             </TabsTrigger>
                        </TabsList>
                    </Tabs>
                    <ScrollArea className="flex-1 bg-transparent">
                         <div className="p-3 sm:p-4 space-y-5">
                             {isLoading && renderLoading()} 
                             {error && renderError()}
                             {!isLoading && !error && friendProfile && (
                                 <>
                                     { (activeTab === 'today' || activeTab === 'yesterday') && ( 
                                         <> 
                                             {renderDailySummarySection()} 
                                             {renderWorkoutStatusSection()} 
                                             {renderActivityLogSection()} 
                                         </> 
                                     )}
                                     {activeTab === 'weekly' && ( 
                                         <motion.div 
                                             className={`p-4 border rounded-3xl backdrop-blur-sm shadow-lg border-0 ${
                                                 isDark ? 'bg-[#2a2a2a]' : 'bg-white/90'
                                             }`}
                                             initial={{ opacity: 0, y: 20 }}
                                             animate={{ opacity: 1, y: 0 }}
                                             transition={{ duration: 0.5 }}
                                         >
                                             <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>Weekly View (Coming Soon)</h3>
                                             <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>Detailed weekly summary and trends will be here.</p>
                                         </motion.div> 
                                     )}
                                 </>
                             )}
                              {!isLoading && !error && !friendProfile && ( 
                                  <motion.p 
                                      className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-center py-6`}
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: 1 }}
                                      transition={{ delay: 0.3 }}
                                  >
                                      Could not load friend's profile details to show progress.
                                  </motion.p> 
                              )}
                         </div>
                    </ScrollArea>
                </>
            ) : (
                <motion.div 
                    className={`flex flex-col items-center justify-center h-full text-center rounded-3xl shadow-lg m-4 ${
                        isDark ? 'text-gray-400 bg-[#2a2a2a]/40' : 'text-gray-600 bg-white/40'
                    } backdrop-blur-sm`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                >
                     <motion.div
                         animate={{ rotate: 360 }}
                         transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                     >
                         <Eye size={48} className="mb-4 opacity-40"/>
                     </motion.div>
                    Loading progress view...
                </motion.div>
            )}
        </motion.div>
    );
};

interface MacroProgressBarProps { 
    label: string; 
    value: number; 
    target: number; 
    unit: string; 
    color: 'red' | 'yellow' | 'green' | 'blue'; 
}

const MacroProgressBar: React.FC<MacroProgressBarProps> = ({ label, value, target, unit, color }) => {
    const progressPercent = target > 0 ? Math.min(100, Math.round((value / target) * 100)) : 0;
    const colorClasses = { 
        red: { text: 'text-red-600', bg: 'bg-red-500' }, 
        yellow: { text: 'text-yellow-600', bg: 'bg-yellow-500' }, 
        green: { text: 'text-green-600', bg: 'bg-green-500' }, 
        blue: { text: 'text-blue-600', bg: 'bg-blue-500' }, 
    };
    const currentColors = colorClasses[color];
    
    return ( 
        <motion.div 
            className="text-xs sm:text-sm"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
        > 
            <div className="flex justify-between items-baseline mb-1"> 
                <span className={cn("font-medium", currentColors.text)}>{label}</span> 
                <span className="text-gray-600 font-mono">{value.toFixed(1)} / {target > 0 ? target.toFixed(1) : '-'}{unit}</span> 
            </div> 
            <Progress value={progressPercent} indicatorClassName={cn(currentColors.bg)} className="h-1.5 sm:h-2" /> 
        </motion.div> 
    );
};

export default ProgressViewer;
