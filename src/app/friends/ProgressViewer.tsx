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
// ChatHeader is now handled by the parent FriendsPage

interface ProgressViewerProps {
    friend: UserFriend | null;
    currentUserId: string | null;
    // onClose is handled by parent through ChatHeader
}

const formatLabel = (value?: string) => value?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Not Set';

const WorkoutStatusIcon = ({ status }: { status: 'completed' | 'pending' | 'skipped' }) => {
    switch (status) {
        case 'completed': return <CheckCircle size={16} className="text-green-500" />;
        case 'skipped': return <XCircle size={16} className="text-red-500" />;
        case 'pending': default: return <Hourglass size={16} className="text-muted-foreground/70" />;
    }
};

const ProgressViewer: React.FC<ProgressViewerProps> = ({ friend, currentUserId }) => {
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

    const renderLoading = () => ( <div className="flex justify-center items-center h-60"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div> );
    const renderError = () => ( <div className="p-6 text-center"><AlertCircle className="mx-auto h-10 w-10 text-destructive mb-2" /><p className="text-destructive font-semibold">Error Loading Progress</p><p className="text-sm text-muted-foreground mt-1">{error || "Could not load friend's progress data."}</p></div> );

    const renderDailySummarySection = () => (
        <div className="p-4 sm:p-5 border rounded-lg bg-card/50 shadow-sm animate-in fade-in duration-500">
            <h3 className="text-lg font-semibold text-primary flex items-center justify-between mb-3">
                <span>{activeTab === 'today' ? "Today's Summary" : activeTab === 'yesterday' ? "Yesterday's Summary" : "Weekly Summary"}</span>
            </h3>
            <p className="text-xs text-muted-foreground mb-4">Progress against targets</p>
            <div className="space-y-5">
                <div className="flex flex-col items-center gap-2">
                    <ProgressRing value={dailySummaryData.consumed.calories} max={dailySummaryData.targets.calories} size={110} strokeWidth={10} color="hsl(var(--primary))" label="Calories" unit="kcal" className="transition-transform duration-300 hover:scale-105" />
                    <p className="text-xs text-muted-foreground font-medium"> {dailySummaryData.consumed.calories.toFixed(0)} / {dailySummaryData.targets.calories > 0 ? dailySummaryData.targets.calories.toFixed(0) : '-'} kcal </p>
                </div>
                <div className="space-y-4 pt-4 border-t mt-4">
                    <MacroProgressBar label="Protein" value={dailySummaryData.consumed.protein} target={dailySummaryData.targets.protein} unit="g" color="red" />
                    <MacroProgressBar label="Carbs" value={dailySummaryData.consumed.carbs} target={dailySummaryData.targets.carbs} unit="g" color="yellow" />
                    <MacroProgressBar label="Fat" value={dailySummaryData.consumed.fat} target={dailySummaryData.targets.fat} unit="g" color="green" />
                </div>
                <div className="text-center text-sm pt-4 border-t mt-4"> <p className="font-medium text-orange-600 dark:text-orange-400 flex items-center justify-center gap-1.5"> <Flame size={16}/> {dailySummaryData.burned} kcal Burned </p> </div>
            </div>
        </div>
    );

    const renderWorkoutStatusSection = () => (
        <div className="p-4 sm:p-5 border rounded-lg bg-card/50 shadow-sm animate-in fade-in duration-500 delay-100">
            <h3 className="text-base font-semibold flex items-center gap-1.5 text-accent mb-3"> <Dumbbell size={16}/> {activeTab === 'today' ? "Today's Workout" : activeTab === 'yesterday' ? "Yesterday's Workout" : "Workout Plan"} </h3>
            <div className="text-sm max-h-60 overflow-y-auto">
                {todaysPlanExercises.length > 0 && todaysPlanExercises[0].exercise.toLowerCase() === 'rest' ? (
                    <p className="text-blue-600 dark:text-blue-400 italic flex items-center gap-1.5"><CalendarDays size={14}/> Rest Day</p>
                ) : todaysPlanExercises.length > 0 ? (
                    <ul className="space-y-3 text-foreground/90">
                        {todaysPlanExercises.map((ex, i) => (
                            <li key={i} className="flex items-center justify-between gap-2 group border-b border-dashed pb-2 last:border-b-0">
                                 <div className="flex items-center gap-2"> <WorkoutStatusIcon status={getWorkoutStatus()} /> <span className="font-medium">{ex.exercise}</span> </div>
                                 <span className="text-muted-foreground text-xs whitespace-nowrap"> {(ex.sets || ex.reps) && `(${ex.sets ? `${ex.sets}x` : ''}${ex.reps || ''}${typeof ex.reps !== 'string' || !ex.reps.includes('min') ? ' reps' : ''})`} </span>
                            </li>
                        ))}
                    </ul>
                ) : ( <p className="text-muted-foreground italic text-center py-3">No plan set for this day.</p> )}
            </div>
        </div>
    );

    const renderActivityLogSection = () => {
        const dateKey = format(displayDate, 'yyyy-MM-dd');
        const logs = friendLogs[dateKey] || { food: [], exercise: [] };
        return (
           <div className="p-0 border rounded-lg bg-card/50 shadow-sm animate-in fade-in duration-500 delay-200 overflow-hidden">
                <Tabs defaultValue="nutrition" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 h-11 rounded-t-lg rounded-b-none bg-muted/60">
                        <TabsTrigger value="nutrition" className="text-sm flex items-center gap-1"><Utensils size={14} /> Nutrition</TabsTrigger>
                        <TabsTrigger value="exercise" className="text-sm flex items-center gap-1"><Dumbbell size={14} /> Exercise</TabsTrigger>
                    </TabsList>
                    <TabsContent value="nutrition" className="px-3 sm:px-4 pb-4 mt-0 max-h-60 overflow-y-auto">
                        {logs.food.length > 0 ? logs.food.map(log => (
                            <div key={`food-${log.id}`} className="text-sm p-2 border-b border-dashed last:border-none flex justify-between items-center hover:bg-muted/30 rounded gap-2">
                                <span className="font-medium text-foreground/90 truncate flex-grow">{log.foodItem}</span>
                                <span className="text-muted-foreground flex-shrink-0 whitespace-nowrap text-xs">{format(parseISO(log.timestamp), 'p')} - {log.calories.toFixed(0)} kcal</span>
                            </div>
                        )) : <p className="text-muted-foreground italic text-center py-6 text-sm">No food logged.</p>}
                    </TabsContent>
                    <TabsContent value="exercise" className="px-3 sm:px-4 pb-4 mt-0 max-h-60 overflow-y-auto">
                        {logs.exercise.length > 0 ? logs.exercise.map(log => (
                            <div key={`ex-${log.id}`} className="text-sm p-2 border-b border-dashed last:border-none flex justify-between items-center hover:bg-muted/30 rounded gap-2">
                                <span className="font-medium text-foreground/90 truncate flex-grow">{log.exerciseName}</span>
                                <span className="text-muted-foreground flex-shrink-0 whitespace-nowrap text-xs">{format(parseISO(log.timestamp), 'p')}{log.estimatedCaloriesBurned ? ` - ${log.estimatedCaloriesBurned.toFixed(0)} kcal` : ''}</span>
                            </div>
                        )) : <p className="text-muted-foreground italic text-center py-6 text-sm">No exercise logged.</p>}
                    </TabsContent>
                </Tabs>
           </div>
        );
    };

    // ChatHeader is now rendered by the parent FriendsPage
    return (
        <div className="flex flex-col h-full bg-background">
            {friend && !friend.isAI ? (
                <>
                    {/* Friend's Goal/Status Sub-header (Optional, if ChatHeader isn't enough) */}
                    <div className="p-3 border-b bg-muted/40 text-xs text-center md:text-left">
                        <span className="font-medium">Goal:</span> {formatLabel(friendProfile?.fitnessGoal)}
                        <span className="mx-2 text-border">|</span>
                        <span className="font-medium">Friend since:</span> {friendSince}
                    </div>

                    <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="flex-shrink-0 border-b">
                        <TabsList className="grid w-full grid-cols-3 h-10 bg-muted/60 rounded-none">
                             <TabsTrigger value="today" className="text-xs"><CalendarDays size={14} className="mr-1"/> Today</TabsTrigger>
                             <TabsTrigger value="yesterday" className="text-xs"><HistoryIcon size={14} className="mr-1"/> Yesterday</TabsTrigger>
                             <TabsTrigger value="weekly" className="text-xs"><Calendar size={14} className="mr-1"/> This Week</TabsTrigger>
                        </TabsList>
                    </Tabs>
                    <ScrollArea className="flex-grow bg-gradient-to-b from-background to-muted/10">
                         <div className="p-3 sm:p-4 space-y-5">
                             {isLoading && renderLoading()} {error && renderError()}
                             {!isLoading && !error && friendProfile && (
                                 <>
                                     { (activeTab === 'today' || activeTab === 'yesterday') && ( <> {renderDailySummarySection()} {renderWorkoutStatusSection()} {renderActivityLogSection()} </> )}
                                     {activeTab === 'weekly' && ( <div className="p-4 border rounded-lg bg-card/50 shadow-sm"><h3 className="text-lg font-semibold">Weekly View (Coming Soon)</h3><p className="text-muted-foreground">Detailed weekly summary and trends will be here.</p></div> )}
                                 </>
                             )}
                              {!isLoading && !error && !friendProfile && ( <p className="text-muted-foreground text-center py-6">Could not load friend's profile details to show progress.</p> )}
                         </div>
                    </ScrollArea>
                </>
            ) : (
                // This fallback should ideally not be reached if parent manages selection
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground italic p-6 text-center bg-muted/20">
                     <Eye size={48} className="mb-4 opacity-40"/>
                    Loading progress view...
                </div>
            )}
        </div>
    );
};

interface MacroProgressBarProps { label: string; value: number; target: number; unit: string; color: 'red' | 'yellow' | 'green' | 'blue' | 'purple'; }
const MacroProgressBar: React.FC<MacroProgressBarProps> = ({ label, value, target, unit, color }) => {
    const progressPercent = target > 0 ? Math.min(100, Math.round((value / target) * 100)) : 0;
    const colorClasses = { red: { text: 'text-red-600 dark:text-red-400', bg: 'bg-red-500' }, yellow: { text: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-500' }, green: { text: 'text-green-600 dark:text-green-400', bg: 'bg-green-500' }, blue: { text: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500' }, purple: { text: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-500' }, };
    const currentColors = colorClasses[color];
    return ( <div className="text-xs sm:text-sm"> <div className="flex justify-between items-baseline mb-1"> <span className={cn("font-medium", currentColors.text)}>{label}</span> <span className="text-muted-foreground font-mono">{value.toFixed(1)} / {target > 0 ? target.toFixed(1) : '-'}{unit}</span> </div> <Progress value={progressPercent} indicatorClassName={cn(currentColors.bg)} className="h-1.5 sm:h-2" /> </div> );
};

export default ProgressViewer;
