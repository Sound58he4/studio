// src/app/history/page.tsx
"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link'; // Import Link component
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { History as HistoryIcon, Trash2, CalendarDays, Search, X, Filter, SortAsc, SortDesc, Loader2, Utensils, Dumbbell, Clock, Route, Repeat, Weight, ListChecks, Droplet, Info } from 'lucide-react';
import { format, parseISO, startOfDay, endOfDay, differenceInCalendarDays } from 'date-fns';
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { buttonVariants } from "@/components/ui/button";
import { useAuth } from '@/context/AuthContext'; // Import useAuth
import { getFoodLogs, getExerciseLogs, deleteLogEntry, clearAllLogs } from '@/services/firestore'; // Import Firestore service functions
import { useRouter } from 'next/navigation';
import { Separator } from '@/components/ui/separator'; // Import Separator
import { useAnalytics } from '@/hooks/useAnalytics';

// Import types from dashboard types
import type { StoredFoodLogEntry, StoredExerciseLogEntry } from '@/app/dashboard/types';

type LogType = 'food' | 'exercise';
type GroupingOption = 'day' | 'none'; // Keeping grouping option, default to day
type SortOption = 'newest' | 'oldest';

export default function HistoryPage() {
  const { toast } = useToast();
  const { user, userId, loading: authLoading } = useAuth();
  const router = useRouter();
  const analytics = useAnalytics();
  const [allFoodLogs, setAllFoodLogs] = useState<StoredFoodLogEntry[]>([]);
  const [allExerciseLogs, setAllExerciseLogs] = useState<StoredExerciseLogEntry[]>([]);
  const [filteredFoodLogs, setFilteredFoodLogs] = useState<StoredFoodLogEntry[]>([]);
  const [filteredExerciseLogs, setFilteredExerciseLogs] = useState<StoredExerciseLogEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<LogType>('food');
  const [sortOrder, setSortOrder] = useState<SortOption>('newest');
  const [isLoading, setIsLoading] = useState(true);
  const grouping: GroupingOption = 'day'; // Force grouping by day for cleaner UI

  // Fetch logs from Firestore using the service
  const fetchLogs = useCallback(async () => {
    if (!userId) {
        console.log("[History Page] No user ID, cannot fetch logs.");
        setIsLoading(false);
        return;
    }
    console.log("[History Page] Fetching logs via Firestore Service for user:", userId);
    setIsLoading(true);
    try {
        // Fetch all logs (no specific date range needed for history page initially)
        const veryStartDate = new Date(2000, 0, 1); // Far past date
        const veryEndDate = new Date(2100, 0, 1); // Far future date

        const [foodData, exerciseData] = await Promise.all([
             getFoodLogs(userId, veryStartDate, veryEndDate),
             getExerciseLogs(userId, veryStartDate, veryEndDate)
        ]);

        setAllFoodLogs(foodData);
        console.log(`[History Page] Fetched ${foodData.length} food logs via Service.`);
        setAllExerciseLogs(exerciseData);
        console.log(`[History Page] Fetched ${exerciseData.length} exercise logs via Service.`);

    } catch (error) {
        console.error("[History Page] Error fetching logs via service:", error);
        toast({ variant: "destructive", title: "Error Loading History", description: "Could not load log data." });
        setAllFoodLogs([]);
        setAllExerciseLogs([]);
    } finally {
        setIsLoading(false);
    }
  }, [userId, toast]);

  // Fetch logs when userId is available
  useEffect(() => {
    if (!authLoading && userId) {
      fetchLogs();
    } else if (!authLoading && !userId) {
        toast({ variant: "destructive", title: "Access Denied", description: "Please log in." });
        setIsLoading(false);
        router.replace('/authorize');
    }
  }, [authLoading, userId, fetchLogs, router, toast]);

  // Filter and Sort Logs
  useEffect(() => {
    let tempFoodLogs = [...allFoodLogs];
    if (searchTerm) tempFoodLogs = tempFoodLogs.filter(log => log.foodItem.toLowerCase().includes(searchTerm.toLowerCase()));
    tempFoodLogs.sort((a, b) => sortOrder === 'oldest' ? new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime() : new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    setFilteredFoodLogs(tempFoodLogs);

    let tempExerciseLogs = [...allExerciseLogs];
    if (searchTerm) tempExerciseLogs = tempExerciseLogs.filter(log => log.exerciseName.toLowerCase().includes(searchTerm.toLowerCase()));
    tempExerciseLogs.sort((a, b) => sortOrder === 'oldest' ? new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime() : new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    setFilteredExerciseLogs(tempExerciseLogs);

  }, [allFoodLogs, allExerciseLogs, searchTerm, sortOrder]);

  // Group logs for display
  const groupedLogs = useMemo(() => {
    const logsToGroup = activeTab === 'food' ? filteredFoodLogs : filteredExerciseLogs;

    const groups: { [key: string]: (StoredFoodLogEntry | StoredExerciseLogEntry)[] } = {};
    logsToGroup.forEach(log => {
        try {
            const dateKey = format(startOfDay(parseISO(log.timestamp)), 'yyyy-MM-dd');
            if (!groups[dateKey]) groups[dateKey] = [];
            groups[dateKey].push(log);
        } catch (e) {
            console.error("Error grouping log:", log.timestamp, e);
        }
    });
    // Sort groups by date (newest first)
    return Object.entries(groups).map(([date, logs]) => ({ date, logs })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [filteredFoodLogs, filteredExerciseLogs, activeTab]); // Removed grouping dependency

  // Delete log entry using the service
  const handleDeleteLog = async (idToDelete: string, type: LogType) => {
       if (!userId) { toast({ variant: "destructive", title: "Error", description: "User not authenticated." }); return; }
       
       analytics.trackFeatureClick('delete_log_entry', 'history_page');
       analytics.trackUserAction('delete_log', { log_type: type, log_id: idToDelete });
       
       const collectionName = type === 'food' ? 'foodLog' : 'exerciseLog';
       console.log(`[History Page] Attempting to delete ${type} log via Service - ID: ${idToDelete}, User: ${userId}`);
       try {
           await deleteLogEntry(userId, collectionName, idToDelete); // Use service function
           toast({ title: `${type.charAt(0).toUpperCase() + type.slice(1)} Log Entry Deleted` });
           fetchLogs(); // Refetch logs to update the UI
       } catch (error) {
           console.error(`[History Page] Failed to delete ${type} log entry via Service:`, error);
           toast({ variant: "destructive", title: "Deletion Failed", description: `Could not delete the ${type} log entry.` });
       }
   };

   // Clear all history using the service
   const clearAllHistory = async (type: LogType) => {
      if (!userId) { toast({ variant: "destructive", title: "Error", description: "User not authenticated." }); return; }
      
      analytics.trackFeatureClick('clear_all_history', 'history_page');
      analytics.trackUserAction('clear_all_logs', { log_type: type });
      
      const collectionName = type === 'food' ? 'foodLog' : 'exerciseLog';
      console.log(`[History Page] Attempting to clear all ${type} history via Service for user: ${userId}`);
      try {
          await clearAllLogs(userId, collectionName); // Use service function
          toast({ title: `${type.charAt(0).toUpperCase() + type.slice(1)} History Cleared`, description: `All ${type} log entries deleted.` });
          if (type === 'food') setAllFoodLogs([]); else setAllExerciseLogs([]);
      } catch (error) {
          console.error(`[History Page] Failed to clear ${type} history via Service:`, error);
          toast({ variant: "destructive", title: "Clear Failed", description: `Could not clear ${type} history.` });
      }
   }

   // Format date group header
   const formatDateGroup = (dateString: string): string => {
      if (dateString === 'All Logs') return dateString;
      try { const date = parseISO(dateString); const today = startOfDay(new Date()); const diff = differenceInCalendarDays(today, date); if (diff === 0) return 'Today'; if (diff === 1) return 'Yesterday'; return format(date, 'eeee, MMMM d, yyyy'); } catch { return 'Invalid Date'; }
   };

    const getPlaceholderText = () => activeTab === 'food' ? 'Search by food name...' : 'Search by exercise name...';

    if (authLoading || isLoading) {
        return ( <div className="flex justify-center items-center min-h-[calc(100vh-200px)] p-4"> <Loader2 className="h-12 w-12 animate-spin text-primary" /> </div> );
    }

  return (
    <motion.div 
      className="max-w-4xl mx-auto my-2 md:my-8 px-2 md:px-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/5 pointer-events-none -z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2 }}
      />
      <Card className="shadow-xl border border-border/20 overflow-hidden bg-card/95 backdrop-blur-sm relative">
        {/* Header */}
        <CardHeader className="bg-gradient-to-r from-primary/10 via-card to-card border-b p-3 sm:p-4 md:p-6">
          <div className="flex flex-col gap-4">
             <div className="text-center sm:text-left">
                 <CardTitle className="text-xl sm:text-2xl md:text-3xl font-bold text-primary flex items-center justify-center sm:justify-start gap-2"> <HistoryIcon className="h-6 w-6 sm:h-7 sm:w-7" /> Log History </CardTitle>
                 <CardDescription className="text-sm md:text-base mt-2"> Review your past food and exercise entries. </CardDescription>
             </div>
             {/* Clear History Button - Full width on mobile */}
             <AlertDialog>
               <AlertDialogTrigger asChild>
                 <Button
                   variant="destructive"
                   size="default"
                   className="w-full h-12 text-base font-medium"
                   disabled={ (activeTab === 'food' && allFoodLogs.length === 0) || (activeTab === 'exercise' && allExerciseLogs.length === 0) }>
                   <Trash2 className="mr-2 h-5 w-5" /> Clear {activeTab === 'food' ? 'Food' : 'Exercise'} History
                 </Button>
               </AlertDialogTrigger>
               <AlertDialogContent>
                 <AlertDialogHeader>
                   <AlertDialogTitle>Clear {activeTab === 'food' ? 'Food' : 'Exercise'} History?</AlertDialogTitle>
                   <AlertDialogDescription> This action cannot be undone. This will permanently delete all your {activeTab} log entries from the database. </AlertDialogDescription>
                 </AlertDialogHeader>
                 <AlertDialogFooter>
                   <AlertDialogCancel>Cancel</AlertDialogCancel>
                   <AlertDialogAction onClick={() => clearAllHistory(activeTab)} className={buttonVariants({ variant: "destructive" })}> Yes, Clear All </AlertDialogAction>
                 </AlertDialogFooter>
               </AlertDialogContent>
             </AlertDialog>
          </div>
        </CardHeader>
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as LogType)} className="w-full">
            <TabsList className="grid w-full grid-cols-2 rounded-none bg-muted/80 border-b shadow-inner h-14 sm:h-16"> 
              <TabsTrigger value="food" className="flex items-center gap-2 py-3 text-base sm:text-lg data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:font-semibold">
                <Utensils className="h-5 w-5 sm:h-6 sm:w-6"/>
                <span className="hidden xs:inline">Food Logs</span>
                <span className="xs:hidden">Food</span>
              </TabsTrigger> 
              <TabsTrigger value="exercise" className="flex items-center gap-2 py-3 text-base sm:text-lg data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:font-semibold">
                <Dumbbell className="h-5 w-5 sm:h-6 sm:w-6"/>
                <span className="hidden xs:inline">Exercise Logs</span>
                <span className="xs:hidden">Exercise</span>
              </TabsTrigger> 
            </TabsList>
            {/* Controls */}
            <CardContent className="p-3 sm:p-4 md:p-6 border-b bg-muted/20">
                <div className="flex flex-col gap-4">
                    {/* Search Input */}
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                            type="text"
                            placeholder={getPlaceholderText()}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-12 pr-12 w-full h-12 text-base border-2 focus:border-primary"
                            aria-label="Search logs"
                        />
                        {searchTerm && (
                         <Button variant="ghost" size="icon" className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8" onClick={() => setSearchTerm('')} aria-label="Clear search">
                            <X className="h-5 w-5 text-muted-foreground" />
                         </Button>
                        )}
                    </div>
                     {/* Sort Select */}
                    <div className="flex flex-col gap-2">
                         <Label htmlFor="sort-select" className="text-sm font-medium text-muted-foreground">Sort Order:</Label>
                         <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as SortOption)}>
                             <SelectTrigger id="sort-select" className="w-full h-12 text-base shadow-sm border-2 bg-card focus:border-primary">
                                <SelectValue placeholder="Sort order" />
                             </SelectTrigger>
                             <SelectContent>
                                <SelectItem value="newest" className="text-base py-3">Newest First</SelectItem>
                                <SelectItem value="oldest" className="text-base py-3">Oldest First</SelectItem>
                             </SelectContent>
                         </Select>
                    </div>
                </div>
            </CardContent>
            {/* Log Content */}
            <TabsContent value="food" className="p-0 m-0">
                <LogDisplay logs={groupedLogs} logType="food" isLoading={isLoading} searchTerm={searchTerm} handleDelete={handleDeleteLog} formatDateGroup={formatDateGroup} />
            </TabsContent>
            <TabsContent value="exercise" className="p-0 m-0">
                <LogDisplay logs={groupedLogs} logType="exercise" isLoading={isLoading} searchTerm={searchTerm} handleDelete={handleDeleteLog} formatDateGroup={formatDateGroup} />
            </TabsContent>
        </Tabs>
      </Card>
    </motion.div>
  );
}

// --- Child Component for Log Display ---
interface LogDisplayProps {
    logs: { date: string; logs: (StoredFoodLogEntry | StoredExerciseLogEntry)[] }[];
    logType: LogType;
    isLoading: boolean;
    searchTerm: string;
    handleDelete: (id: string, type: LogType) => void;
    formatDateGroup: (dateString: string) => string;
}
function LogDisplay({ logs, logType, isLoading, searchTerm, handleDelete, formatDateGroup }: LogDisplayProps) {
    const hasLogs = logs.some(group => group.logs.length > 0);

    return (
        <ScrollArea className="h-[calc(100vh-400px)] min-h-[60vh]">
             <div className="pb-4">
                <AnimatePresence mode="wait">
                    {hasLogs ? (
                        logs.map((group, groupIndex) => (
                            <motion.div 
                                key={group.date} 
                                className="mb-4 last:mb-0"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.3, delay: groupIndex * 0.05 }}
                            >
                             {/* Sticky Date Header */}
                             <div className="sticky top-0 z-10 bg-gradient-to-b from-card via-card to-transparent px-4 py-4 border-b border-t border-border/50 shadow-sm">
                                <h3 className="font-semibold text-primary text-base sm:text-lg tracking-wide">{formatDateGroup(group.date)}</h3>
                             </div>
                            {group.logs.length > 0 ? (
                                <div className="space-y-2 p-2 sm:p-3">
                                {group.logs.map((log, logIndex) => (
                                    logType === 'food' ? (
                                        <motion.div
                                            key={log.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 20 }}
                                            transition={{ duration: 0.3, delay: logIndex * 0.05 }}
                                        >
                                            <FoodLogItem
                                                log={log as StoredFoodLogEntry}
                                                onDelete={() => handleDelete(log.id, 'food')}
                                            />
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key={log.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 20 }}
                                            transition={{ duration: 0.3, delay: logIndex * 0.05 }}
                                        >
                                            <ExerciseLogItem
                                                log={log as StoredExerciseLogEntry}
                                                onDelete={() => handleDelete(log.id, 'exercise')}
                                            />
                                        </motion.div>
                                    )
                                ))}
                                </div>
                            ) : (
                                <p className="px-4 py-6 text-base text-muted-foreground text-center italic">No {logType} logs found for this day.</p>
                            )}
                        </motion.div>
                    ))
                ) : (
                     // Improved empty state
                    <motion.div 
                        className="flex flex-col items-center justify-center min-h-[50vh] text-center text-muted-foreground p-6"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3 }}
                    >
                        <HistoryIcon className="h-20 w-20 mb-6 text-muted-foreground/30" />
                        <p className="font-semibold text-xl text-foreground/80 mb-3">No {logType === 'food' ? 'Food' : 'Exercise'} History Yet</p>
                        <p className="text-base max-w-sm mb-6">
                            {searchTerm
                                ? "No logs match your search. Try different keywords."
                                : `Your logged ${logType === 'food' ? 'meals' : 'workouts'} will appear here. Start logging to build your history!`}
                        </p>
                         {!searchTerm && (
                           <Link href={logType === 'food' ? '/log' : '/log-exercise'}>
                               <Button variant="outline" size="lg" className="h-12 px-8 text-base">
                                    Log {logType === 'food' ? 'Food' : 'Exercise'}
                               </Button>
                           </Link>
                         )}
                    </motion.div>
                )}
                </AnimatePresence>
             </div>
        </ScrollArea>
    );
}

// --- Individual Log Item Components ---
interface FoodLogItemProps { log: StoredFoodLogEntry; onDelete: () => void; }
function FoodLogItem({ log, onDelete }: FoodLogItemProps) {
    return (
        <div className="bg-card border border-border/50 rounded-lg p-4 hover:bg-muted/30 transition-colors duration-150 group shadow-sm">
            <div className="flex items-start gap-3">
                {/* Icon */}
                <div className="bg-primary/10 p-3 rounded-full flex-shrink-0">
                    <Utensils className="h-5 w-5 text-primary" />
                </div>
                {/* Details */}
                <div className="flex-1 space-y-2 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-foreground text-base leading-tight">{log.foodItem}</p>
                        {/* Delete Button - Always visible on mobile */}
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-150 flex-shrink-0" aria-label={`Delete log for ${log.foodItem}`}>
                                    <Trash2 className="h-5 w-5" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>Delete log for "{log.foodItem}"?</AlertDialogDescription></AlertDialogHeader>
                                <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={onDelete} className={buttonVariants({ variant: "destructive" })}>Delete</AlertDialogAction></AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                        <div className="flex items-center gap-2">
                            <span>{format(parseISO(log.timestamp), 'p')}</span>
                            <span className="text-orange-600 dark:text-orange-400 font-semibold">{log.calories?.toFixed(0) ?? 'N/A'} kcal</span>
                        </div>
                        <div className="flex flex-wrap gap-x-3 gap-y-1">
                            <span>Protein: {log.protein?.toFixed(1) ?? 'N/A'}g</span>
                            <span>Carbs: {log.carbohydrates?.toFixed(1) ?? 'N/A'}g</span>
                            <span>Fat: {log.fat?.toFixed(1) ?? 'N/A'}g</span>
                        </div>
                        {log.logMethod && <div className="capitalize text-primary/80 text-xs">Method: {log.logMethod}</div>}
                    </div>
                </div>
            </div>
        </div>
    );
}

interface ExerciseLogItemProps { log: StoredExerciseLogEntry; onDelete: () => void; }
function ExerciseLogItem({ log, onDelete }: ExerciseLogItemProps) {
    return (
        <div className="bg-card border border-border/50 rounded-lg p-4 hover:bg-muted/30 transition-colors duration-150 group shadow-sm">
            <div className="flex items-start gap-3">
                {/* Icon */}
                <div className="bg-accent/10 p-3 rounded-full flex-shrink-0">
                    <Dumbbell className="h-5 w-5 text-accent" />
                </div>
                {/* Details */}
                <div className="flex-1 space-y-2 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-foreground text-base leading-tight">{log.exerciseName}</p>
                        {/* Delete Button - Always visible on mobile */}
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-150 flex-shrink-0" aria-label={`Delete log for ${log.exerciseName}`}>
                                    <Trash2 className="h-5 w-5" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>Delete log for "{log.exerciseName}"?</AlertDialogDescription></AlertDialogHeader>
                                <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={onDelete} className={buttonVariants({ variant: "destructive" })}>Delete</AlertDialogAction></AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                        <div className="flex items-center gap-2">
                            <span>{format(parseISO(log.timestamp), 'p')}</span>
                            <span className="capitalize font-medium text-accent">{log.exerciseType}</span>
                            {log.estimatedCaloriesBurned && <span className="font-semibold text-orange-600 dark:text-orange-400">{log.estimatedCaloriesBurned.toFixed(0)} kcal</span>}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            {log.duration !== undefined && <span className="flex items-center gap-1"><Clock size={14}/> {log.duration} min</span>}
                            {log.distance !== undefined && <span className="flex items-center gap-1"><Route size={14}/> {log.distance} km/mi</span>}
                            {log.sets !== undefined && <span className="flex items-center gap-1"><Repeat size={14}/> {log.sets} sets</span>}
                            {log.reps !== undefined && <span className="flex items-center gap-1"><ListChecks size={14}/> {log.reps} reps</span>}
                            {log.weight !== undefined && <span className="flex items-center gap-1"><Weight size={14}/> {log.weight} kg/lb</span>}
                        </div>
                        {log.notes && <p className="text-xs text-muted-foreground italic pt-1 flex items-start gap-1"><Info size={12} className="mt-0.5 flex-shrink-0"/> <span className="break-words">Notes: {log.notes}</span></p>}
                    </div>
                </div>
            </div>
        </div>
    );
}

