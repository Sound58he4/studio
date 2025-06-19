// src/app/history/page.tsx
"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { History as HistoryIcon, Trash2, CalendarDays, Search, X, Filter, SortAsc, SortDesc, Loader2, Utensils, Dumbbell, Clock, Route, Repeat, Weight, ListChecks, Droplet, Info, Target, Flame, SlidersHorizontal } from 'lucide-react';
import { format, parseISO, startOfDay, endOfDay, differenceInCalendarDays } from 'date-fns';
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { buttonVariants } from "@/components/ui/button";
import { useAuth } from '@/context/AuthContext';
import { getFoodLogs, getExerciseLogs, deleteLogEntry, clearAllLogs } from '@/services/firestore';
import { useRouter } from 'next/navigation';
import { Separator } from '@/components/ui/separator';

// Import types from dashboard types
import type { StoredFoodLogEntry, StoredExerciseLogEntry } from '@/app/dashboard/types';

type LogType = 'food' | 'exercise';
type GroupingOption = 'day' | 'none';
type SortOption = 'newest' | 'oldest';

export default function HistoryPage() {
  const { toast } = useToast();
  const { user, userId, loading: authLoading } = useAuth();
  const router = useRouter();
  const [allFoodLogs, setAllFoodLogs] = useState<StoredFoodLogEntry[]>([]);
  const [allExerciseLogs, setAllExerciseLogs] = useState<StoredExerciseLogEntry[]>([]);
  const [filteredFoodLogs, setFilteredFoodLogs] = useState<StoredFoodLogEntry[]>([]);
  const [filteredExerciseLogs, setFilteredExerciseLogs] = useState<StoredExerciseLogEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<LogType>('food');
  const [sortOrder, setSortOrder] = useState<SortOption>('newest');
  const [isLoading, setIsLoading] = useState(true);
  const grouping: GroupingOption = 'day';

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
    <div className="min-h-screen pb-20 md:pb-0 bg-gradient-to-br from-slate-100 via-blue-50 to-slate-200 transition-all duration-500">
      <div className="p-3 md:p-4">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <motion.div
            className="mb-6"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="backdrop-blur-sm shadow-lg border-0 p-6 rounded-xl transition-all duration-300 bg-white/70 shadow-lg">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 flex items-center justify-center shadow-lg rounded-xl bg-gradient-to-br from-purple-500 to-purple-600">
                  <HistoryIcon className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                    Log History
                  </h1>
                  <p className="text-gray-600 md:text-base leading-relaxed text-sm">
                    Review your past food and exercise entries.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Search Controls */}
          <motion.div
            className="mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <div className="backdrop-blur-sm shadow-lg border-0 p-4 rounded-xl transition-all duration-300 bg-white/70 shadow-lg">
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                {/* Search */}
                <div className="relative flex-1 w-full md:w-auto">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-purple-600" />
                  <Input
                    type="text"
                    placeholder={activeTab === 'food' ? 'Search food entries...' : 'Search exercise entries...'}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-11 rounded-lg text-base transition-all duration-300 bg-white/80 border-gray-200 text-gray-800 focus:border-purple-400"
                  />
                  {searchTerm && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8"
                      onClick={() => setSearchTerm('')}
                    >
                      <X className="h-4 w-4 text-gray-500" />
                    </Button>
                  )}
                </div>

                {/* Sort */}
                <div className="flex items-center space-x-2">
                  <SlidersHorizontal className="w-4 h-4 text-purple-600" />
                  <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as SortOption)}>
                    <SelectTrigger className="w-[130px] h-11 rounded-lg transition-all duration-300 bg-white/80 border-gray-200 text-gray-800 focus:border-purple-400">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-200">
                      <SelectItem value="newest">Newest</SelectItem>
                      <SelectItem value="oldest">Oldest</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Clear History */}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-11 px-4 rounded-lg transition-all duration-300 hover:scale-105 bg-white/80 border-gray-200 text-gray-600 hover:text-red-500 hover:bg-red-50"
                      disabled={(activeTab === 'food' && allFoodLogs.length === 0) || (activeTab === 'exercise' && allExerciseLogs.length === 0)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Clear
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Clear {activeTab === 'food' ? 'Food' : 'Exercise'} History?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete all your {activeTab} log entries from the database.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => clearAllHistory(activeTab)} className={buttonVariants({ variant: "destructive" })}>
                        Yes, Clear All
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </motion.div>

          {/* Tab Navigation */}
          <motion.div
            className="mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="backdrop-blur-sm rounded-xl shadow-lg border-0 transition-all duration-300 bg-white/70 shadow-lg border border-gray-200">
              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as LogType)} className="w-full">
                <TabsList className="w-full h-auto p-1 bg-gray-100/80">
                  <TabsTrigger
                    value="food"
                    className="flex-1 py-3 px-6 transition-all duration-300 rounded-lg data-[state=active]:bg-white/90 data-[state=active]:text-blue-700 data-[state=active]:shadow-lg"
                  >
                    <Utensils className="w-4 h-4 mr-2" />
                    Food History
                  </TabsTrigger>
                  <TabsTrigger
                    value="exercise"
                    className="flex-1 py-3 px-6 transition-all duration-300 rounded-lg data-[state=active]:bg-white/90 data-[state=active]:text-blue-700 data-[state=active]:shadow-lg"
                  >
                    <Dumbbell className="w-4 h-4 mr-2" />
                    Exercise History
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </motion.div>

          {/* Content */}
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className="backdrop-blur-sm rounded-xl shadow-lg border-0 p-4 transition-all duration-300 bg-white/70 shadow-lg border border-gray-200">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center mr-3 shadow-lg bg-blue-100">
                  <Target className="w-4 h-4 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">Today's Entries</h3>
              </div>

              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as LogType)}>
                <TabsContent value="food" className="space-y-3">
                  <LogDisplay logs={groupedLogs} logType="food" isLoading={isLoading} searchTerm={searchTerm} handleDelete={handleDeleteLog} formatDateGroup={formatDateGroup} />
                </TabsContent>

                <TabsContent value="exercise" className="space-y-3">
                  <LogDisplay logs={groupedLogs} logType="exercise" isLoading={isLoading} searchTerm={searchTerm} handleDelete={handleDeleteLog} formatDateGroup={formatDateGroup} />
                </TabsContent>
              </Tabs>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
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
    <ScrollArea className="h-[calc(100vh-500px)] min-h-[40vh]">
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
                {/* Date Header */}
                <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm px-4 py-3 border-b border-gray-200 shadow-sm rounded-lg mb-3">
                  <h3 className="font-semibold text-blue-700 text-base tracking-wide">{formatDateGroup(group.date)}</h3>
                </div>
                {group.logs.length > 0 ? (
                  <div className="space-y-3">
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
                            index={logIndex}
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
                            index={logIndex}
                          />
                        </motion.div>
                      )
                    ))}
                  </div>
                ) : (
                  <p className="px-4 py-6 text-base text-gray-500 text-center italic">No {logType} logs found for this day.</p>
                )}
              </motion.div>
            ))
          ) : (
            // Empty state
            <motion.div
              className="flex flex-col items-center justify-center min-h-[40vh] text-center text-gray-500 p-6"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              <HistoryIcon className="h-20 w-20 mb-6 text-gray-300" />
              <p className="font-semibold text-xl text-gray-700 mb-3">No {logType === 'food' ? 'Food' : 'Exercise'} History Yet</p>
              <p className="text-base max-w-sm mb-6">
                {searchTerm
                  ? "No logs match your search. Try different keywords."
                  : `Your logged ${logType === 'food' ? 'meals' : 'workouts'} will appear here. Start logging to build your history!`}
              </p>
              {!searchTerm && (
                <Link href={logType === 'food' ? '/log' : '/log-exercise'}>
                  <Button variant="outline" size="lg" className="h-12 px-8 text-base rounded-lg">
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
interface FoodLogItemProps { log: StoredFoodLogEntry; onDelete: () => void; index: number; }
function FoodLogItem({ log, onDelete, index }: FoodLogItemProps) {
  return (
    <Card className="backdrop-blur-sm border-0 rounded-xl transition-all duration-300 hover:scale-[1.01] bg-white/80 border border-gray-200 hover:shadow-lg shadow-md" 
          style={{ animationDelay: `${index * 100}ms` }}>
      <CardContent className="p-4">
        <div className="flex items-start space-x-4">
          {/* Icon */}
          <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg bg-blue-100">
            <Utensils className="w-5 h-5 text-blue-600" />
          </div>
          {/* Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold truncate text-gray-800">{log.foodItem}</h4>
              <div className="flex items-center gap-2">
                {log.logMethod && (
                  <span className="text-xs px-2 py-1 rounded-full shadow-sm text-blue-600 bg-blue-100">
                    {log.logMethod}
                  </span>
                )}
                {/* Delete Button */}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors duration-150">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>Delete log for "{log.foodItem}"?</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={onDelete} className={buttonVariants({ variant: "destructive" })}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
            <div className="flex items-center space-x-4 text-sm mb-3 text-gray-600">
              <span className="flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                {format(parseISO(log.timestamp), 'p')}
              </span>
              <span className="flex items-center font-semibold text-orange-500">
                <Flame className="w-3 h-3 mr-1" />
                {log.calories?.toFixed(0) ?? 'N/A'} kcal
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="flex items-center space-x-1 px-2 py-1 rounded-lg shadow-sm bg-blue-100">
                <span className="font-medium text-blue-700">P: {log.protein?.toFixed(1) ?? 'N/A'}g</span>
              </div>
              <div className="flex items-center space-x-1 px-2 py-1 rounded-lg shadow-sm bg-purple-100">
                <span className="font-medium text-purple-700">C: {log.carbohydrates?.toFixed(1) ?? 'N/A'}g</span>
              </div>
              <div className="flex items-center space-x-1 px-2 py-1 rounded-lg shadow-sm bg-green-100">
                <span className="font-medium text-green-700">F: {log.fat?.toFixed(1) ?? 'N/A'}g</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface ExerciseLogItemProps { log: StoredExerciseLogEntry; onDelete: () => void; index: number; }
function ExerciseLogItem({ log, onDelete, index }: ExerciseLogItemProps) {
  return (
    <Card className="backdrop-blur-sm border-0 rounded-xl transition-all duration-300 hover:scale-[1.01] bg-white/80 border border-gray-200 hover:shadow-lg shadow-md" 
          style={{ animationDelay: `${index * 100}ms` }}>
      <CardContent className="p-4">
        <div className="flex items-start space-x-4">
          {/* Icon */}
          <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg bg-purple-100">
            <Dumbbell className="w-5 h-5 text-purple-600" />
          </div>
          {/* Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-gray-800">{log.exerciseName}</h4>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-1 rounded-full shadow-sm text-purple-600 bg-purple-100">
                  {log.exerciseType}
                </span>
                {/* Delete Button */}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors duration-150">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>Delete log for "{log.exerciseName}"?</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={onDelete} className={buttonVariants({ variant: "destructive" })}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
            <div className="flex items-center space-x-4 text-sm mb-3 text-gray-600">
              <span className="flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                {format(parseISO(log.timestamp), 'p')}
              </span>
              {log.estimatedCaloriesBurned && (
                <span className="flex items-center font-semibold text-orange-500">
                  <Flame className="w-3 h-3 mr-1" />
                  {log.estimatedCaloriesBurned.toFixed(0)} kcal
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm mb-3">
              {log.duration !== undefined && (
                <div className="flex items-center space-x-2 px-3 py-2 rounded-lg shadow-sm bg-purple-100">
                  <Clock className="w-3 h-3 text-purple-500" />
                  <span className="font-medium text-purple-700">{log.duration} min</span>
                </div>
              )}
              {log.sets !== undefined && (
                <div className="flex items-center space-x-2 px-3 py-2 rounded-lg shadow-sm bg-blue-100">
                  <Target className="w-3 h-3 text-blue-500" />
                  <span className="font-medium text-blue-700">{log.sets} sets</span>
                </div>
              )}
            </div>
            {log.notes && (
              <div className="text-sm p-3 rounded-xl shadow-sm text-gray-600 bg-gray-100">
                <span className="font-medium text-gray-700">Notes:</span> {log.notes}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

