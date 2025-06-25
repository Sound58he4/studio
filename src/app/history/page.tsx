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
  const [isClient, setIsClient] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const grouping: GroupingOption = 'day';

  useEffect(() => { setIsClient(true); }, []);

  // Detect theme from HTML class (consistent with Overview page)
  useEffect(() => {
    const updateDark = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };

    updateDark(); // Initial check
    
    // Watch for theme changes
    const observer = new MutationObserver(updateDark);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

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
        return ( 
          <div className={`min-h-screen pb-20 md:pb-0 animate-fade-in transition-all duration-500 flex justify-center items-center ${
            isDark 
              ? 'bg-[#1a1a1a]' 
              : 'bg-gradient-to-br from-slate-100 via-blue-50 to-slate-200'
          }`}> 
            <Loader2 className={`h-12 w-12 animate-spin ${
              isDark ? 'text-purple-400' : 'text-primary'
            }`} /> 
          </div> 
        );
    }

  return (
    <div className={`min-h-screen pb-20 md:pb-0 animate-fade-in transition-all duration-500 ${
      isDark 
        ? 'bg-[#1a1a1a]' 
        : 'bg-gradient-to-br from-slate-100 via-blue-50 to-slate-200'
    }`}>
      <div className="p-3 md:p-4">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <motion.div
            className="mb-6"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className={`backdrop-blur-sm shadow-lg border-0 p-6 rounded-xl transition-all duration-300 ${
              isDark 
                ? 'bg-[#2a2a2a] border-[#3a3a3a]' 
                : 'bg-white/70'
            } shadow-lg`}>
              <div className="flex items-center space-x-4">
                <div className={`w-14 h-14 flex items-center justify-center shadow-lg rounded-xl ${
                  isDark 
                    ? 'bg-[#8b5cf6]' 
                    : 'bg-gradient-to-br from-purple-500 to-purple-600'
                }`}>
                  <HistoryIcon className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className={`text-2xl md:text-3xl font-bold ${
                    isDark ? 'text-white' : 'text-gray-800'
                  }`}>
                    Log History
                  </h1>
                  <p className={`md:text-base leading-relaxed text-sm ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>
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
            <div className={`backdrop-blur-sm shadow-lg border-0 p-4 rounded-xl transition-all duration-300 ${
              isDark 
                ? 'bg-[#2a2a2a] border-[#3a3a3a]' 
                : 'bg-white/70'
            } shadow-lg`}>
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                {/* Search */}
                <div className="relative flex-1 w-full md:w-auto">
                  <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                    isDark ? 'text-purple-400' : 'text-purple-600'
                  }`} />
                  <Input
                    type="text"
                    placeholder={activeTab === 'food' ? 'Search food entries...' : 'Search exercise entries...'}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`pl-10 h-11 rounded-lg text-base transition-all duration-300 border-0 ${
                      isDark 
                        ? 'bg-[#1a1a1a] text-white placeholder-gray-400 border border-[#3a3a3a] focus:border-purple-400' 
                        : 'bg-white/80 border-gray-200 text-gray-800 focus:border-purple-400'
                    }`}
                  />
                  {searchTerm && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8"
                      onClick={() => setSearchTerm('')}
                    >
                      <X className={`h-4 w-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                    </Button>
                  )}
                </div>                {/* Sort and Clear Controls */}
                <div className="flex items-center space-x-2">
                  <SlidersHorizontal className={`w-4 h-4 ${
                    isDark ? 'text-purple-400' : 'text-purple-600'
                  }`} />
                  <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as SortOption)}>
                    <SelectTrigger className={`w-[130px] h-11 rounded-lg transition-all duration-300 border-0 ${
                      isDark 
                        ? 'bg-[#1a1a1a] text-white border border-[#3a3a3a] focus:border-purple-400' 
                        : 'bg-white/80 border-gray-200 text-gray-800 focus:border-purple-400'
                    }`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className={isDark ? 'bg-[#2a2a2a] border-[#3a3a3a] text-white' : 'bg-white border-gray-200'}>
                      <SelectItem value="newest">Newest</SelectItem>
                      <SelectItem value="oldest">Oldest</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {/* Clear History */}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className={`h-11 px-4 rounded-lg transition-all duration-300 hover:scale-105 border-0 ${
                          isDark 
                            ? 'bg-[#1a1a1a] text-gray-400 hover:text-red-400 hover:bg-red-900/20 border border-[#3a3a3a]' 
                            : 'bg-white/80 border-gray-200 text-gray-600 hover:text-red-500 hover:bg-red-50'
                        }`}
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
            </div>
          </motion.div>

          {/* Tab Navigation */}
          <motion.div
            className="mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className={`backdrop-blur-sm rounded-xl shadow-lg border-0 transition-all duration-300 ${
              isDark 
                ? 'bg-[#2a2a2a] border-[#3a3a3a]' 
                : 'bg-white/70 border border-gray-200'
            } shadow-lg`}>
              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as LogType)} className="w-full">
                <TabsList className={`w-full h-auto p-1 ${
                  isDark ? 'bg-[#1a1a1a]' : 'bg-gray-100/80'
                }`}>
                  <TabsTrigger
                    value="food"
                    className={`flex-1 py-3 px-6 transition-all duration-300 rounded-lg ${
                      isDark 
                        ? 'data-[state=active]:bg-[#2a2a2a] data-[state=active]:text-blue-400 data-[state=active]:shadow-lg text-gray-400' 
                        : 'data-[state=active]:bg-white/90 data-[state=active]:text-blue-700 data-[state=active]:shadow-lg'
                    }`}
                  >
                    <Utensils className="w-4 h-4 mr-2" />
                    Food History
                  </TabsTrigger>
                  <TabsTrigger
                    value="exercise"
                    className={`flex-1 py-3 px-6 transition-all duration-300 rounded-lg ${
                      isDark 
                        ? 'data-[state=active]:bg-[#2a2a2a] data-[state=active]:text-blue-400 data-[state=active]:shadow-lg text-gray-400' 
                        : 'data-[state=active]:bg-white/90 data-[state=active]:text-blue-700 data-[state=active]:shadow-lg'
                    }`}
                  >
                    <Dumbbell className="w-4 h-4 mr-2" />
                    Exercise History
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </motion.div>          {/* Content */}
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className={`backdrop-blur-sm rounded-xl shadow-lg border-0 p-3 md:p-4 transition-all duration-300 ${
              isDark 
                ? 'bg-[#2a2a2a] border-[#3a3a3a]' 
                : 'bg-white/70 border border-gray-200'
            } shadow-lg`}>
              <div className="flex items-center mb-3 md:mb-4">
                <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center mr-3 shadow-lg ${
                  isDark ? 'bg-[#8b5cf6]' : 'bg-blue-100'
                }`}>
                  <Target className={`w-4 h-4 md:w-5 md:h-5 ${
                    isDark ? 'text-white' : 'text-blue-600'
                  }`} />
                </div>
                <h3 className={`text-base md:text-lg font-semibold ${
                  isDark ? 'text-white' : 'text-gray-800'
                }`}>Your History</h3>
              </div>

              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as LogType)}>
                <TabsContent value="food" className="space-y-3">
                  <LogDisplay logs={groupedLogs} logType="food" isLoading={isLoading} searchTerm={searchTerm} handleDelete={handleDeleteLog} formatDateGroup={formatDateGroup} isDark={isDark} />
                </TabsContent>

                <TabsContent value="exercise" className="space-y-3">
                  <LogDisplay logs={groupedLogs} logType="exercise" isLoading={isLoading} searchTerm={searchTerm} handleDelete={handleDeleteLog} formatDateGroup={formatDateGroup} isDark={isDark} />
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
  isDark: boolean;
}

function LogDisplay({ logs, logType, isLoading, searchTerm, handleDelete, formatDateGroup, isDark }: LogDisplayProps) {
  const hasLogs = logs.some(group => group.logs.length > 0);

  return (
    <ScrollArea className="h-[calc(100vh-450px)] md:h-[calc(100vh-500px)] min-h-[50vh]">
      <div className="pb-4">
        <AnimatePresence mode="wait">
          {hasLogs ? (
            logs.map((group, groupIndex) => (
              <motion.div
                key={group.date}
                className="mb-3 md:mb-4 last:mb-0"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, delay: groupIndex * 0.05 }}
              >
                {/* Date Header */}
                <div className={`sticky top-0 z-10 backdrop-blur-sm px-3 md:px-4 py-2 md:py-3 border-b shadow-sm rounded-lg mb-2 md:mb-3 ${
                  isDark 
                    ? 'bg-[#1a1a1a]/95 border-[#3a3a3a]' 
                    : 'bg-white/95 border-gray-200'
                }`}>
                  <h3 className={`font-semibold text-sm md:text-base tracking-wide ${
                    isDark ? 'text-blue-400' : 'text-blue-700'
                  }`}>{formatDateGroup(group.date)}</h3>
                </div>                {group.logs.length > 0 ? (
                  <div className="space-y-2 md:space-y-3">
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
                            isDark={isDark}
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
                            isDark={isDark}
                          />
                        </motion.div>
                      )
                    ))}
                  </div>
                ) : (
                  <p className={`px-3 md:px-4 py-4 md:py-6 text-sm md:text-base text-center italic ${
                    isDark ? 'text-gray-400' : 'text-gray-500'
                  }`}>No {logType} logs found for this day.</p>
                )}
              </motion.div>
            ))
          ) : (            // Empty state
            <motion.div
              className={`flex flex-col items-center justify-center min-h-[50vh] text-center p-4 md:p-6 ${
                isDark ? 'text-gray-400' : 'text-gray-500'
              }`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              <HistoryIcon className={`h-16 w-16 md:h-20 md:w-20 mb-4 md:mb-6 ${
                isDark ? 'text-gray-600' : 'text-gray-300'
              }`} />
              <p className={`font-semibold text-lg md:text-xl mb-2 md:mb-3 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>No {logType === 'food' ? 'Food' : 'Exercise'} History Yet</p>
              <p className="text-sm md:text-base max-w-sm mb-4 md:mb-6 leading-relaxed">
                {searchTerm
                  ? "No logs match your search. Try different keywords."
                  : `Your logged ${logType === 'food' ? 'meals' : 'workouts'} will appear here. Start logging to build your history!`}
              </p>
              {!searchTerm && (
                <Link href={logType === 'food' ? '/log' : '/log-exercise'}>
                  <Button variant="outline" size="lg" className="h-10 md:h-12 px-6 md:px-8 text-sm md:text-base rounded-lg">
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
interface FoodLogItemProps { log: StoredFoodLogEntry; onDelete: () => void; index: number; isDark: boolean; }
function FoodLogItem({ log, onDelete, index, isDark }: FoodLogItemProps) {
  return (
    <Card className={`backdrop-blur-sm border-0 rounded-xl transition-all duration-300 hover:scale-[1.01] border shadow-md hover:shadow-lg ${
      isDark 
        ? 'bg-[#2a2a2a] border-[#3a3a3a]' 
        : 'bg-white/80 border-gray-200'
    }`} 
          style={{ animationDelay: `${index * 100}ms` }}>
      <CardContent className="p-3 md:p-4">
        <div className="flex items-start space-x-3 md:space-x-4">
          {/* Icon */}
          <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg ${
            isDark ? 'bg-[#8b5cf6]' : 'bg-blue-100'
          }`}>
            <Utensils className={`w-4 h-4 md:w-5 md:h-5 ${
              isDark ? 'text-white' : 'text-blue-600'
            }`} />
          </div>
          {/* Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <h4 className={`font-semibold text-sm md:text-base leading-tight pr-2 ${
                isDark ? 'text-white' : 'text-gray-800'
              }`}>{log.foodItem}</h4>
              <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
                {log.logMethod && (
                  <span className={`text-xs px-2 py-1 rounded-full shadow-sm hidden sm:inline-block ${
                    isDark 
                      ? 'text-blue-400 bg-blue-900/30' 
                      : 'text-blue-600 bg-blue-100'
                  }`}>
                    {log.logMethod}
                  </span>
                )}
                {/* Delete Button */}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className={`h-7 w-7 md:h-8 md:w-8 transition-colors duration-150 ${
                      isDark 
                        ? 'text-gray-500 hover:text-red-400 hover:bg-red-900/20' 
                        : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                    }`}>
                      <Trash2 className="h-3 w-3 md:h-4 md:w-4" />
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
            <div className={`flex items-center space-x-3 md:space-x-4 text-xs md:text-sm mb-2 md:mb-3 ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              <span className="flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                {format(parseISO(log.timestamp), 'p')}
              </span>
              <span className={`flex items-center font-semibold ${
                isDark ? 'text-orange-400' : 'text-orange-500'
              }`}>
                <Flame className="w-3 h-3 mr-1" />
                {log.calories?.toFixed(0) ?? 'N/A'} kcal
              </span>
              {log.logMethod && (
                <span className={`text-xs px-2 py-1 rounded-full shadow-sm sm:hidden ${
                  isDark 
                    ? 'text-blue-400 bg-blue-900/30' 
                    : 'text-blue-600 bg-blue-100'
                }`}>
                  {log.logMethod}
                </span>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2 md:gap-3 text-xs md:text-sm">
              <div className={`flex items-center justify-center px-2 py-1 rounded-lg shadow-sm ${
                isDark ? 'bg-blue-900/30' : 'bg-blue-100'
              }`}>
                <span className={`font-medium ${
                  isDark ? 'text-blue-400' : 'text-blue-700'
                }`}>P: {log.protein?.toFixed(1) ?? 'N/A'}g</span>
              </div>
              <div className={`flex items-center justify-center px-2 py-1 rounded-lg shadow-sm ${
                isDark ? 'bg-purple-900/30' : 'bg-purple-100'
              }`}>
                <span className={`font-medium ${
                  isDark ? 'text-purple-400' : 'text-purple-700'
                }`}>C: {log.carbohydrates?.toFixed(1) ?? 'N/A'}g</span>
              </div>
              <div className={`flex items-center justify-center px-2 py-1 rounded-lg shadow-sm ${
                isDark ? 'bg-green-900/30' : 'bg-green-100'
              }`}>
                <span className={`font-medium ${
                  isDark ? 'text-green-400' : 'text-green-700'
                }`}>F: {log.fat?.toFixed(1) ?? 'N/A'}g</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface ExerciseLogItemProps { log: StoredExerciseLogEntry; onDelete: () => void; index: number; isDark: boolean; }
function ExerciseLogItem({ log, onDelete, index, isDark }: ExerciseLogItemProps) {
  return (
    <Card className={`backdrop-blur-sm border-0 rounded-xl transition-all duration-300 hover:scale-[1.01] border shadow-md hover:shadow-lg ${
      isDark 
        ? 'bg-[#2a2a2a] border-[#3a3a3a]' 
        : 'bg-white/80 border-gray-200'
    }`} 
          style={{ animationDelay: `${index * 100}ms` }}>
      <CardContent className="p-3 md:p-4">
        <div className="flex items-start space-x-3 md:space-x-4">
          {/* Icon */}
          <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg ${
            isDark ? 'bg-[#8b5cf6]' : 'bg-purple-100'
          }`}>
            <Dumbbell className={`w-4 h-4 md:w-5 md:h-5 ${
              isDark ? 'text-white' : 'text-purple-600'
            }`} />
          </div>
          {/* Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <h4 className={`font-semibold text-sm md:text-base leading-tight pr-2 ${
                isDark ? 'text-white' : 'text-gray-800'
              }`}>{log.exerciseName}</h4>
              <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
                <span className={`text-xs px-2 py-1 rounded-full shadow-sm hidden sm:inline-block ${
                  isDark 
                    ? 'text-purple-400 bg-purple-900/30' 
                    : 'text-purple-600 bg-purple-100'
                }`}>
                  {log.exerciseType}
                </span>
                {/* Delete Button */}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className={`h-7 w-7 md:h-8 md:w-8 transition-colors duration-150 ${
                      isDark 
                        ? 'text-gray-500 hover:text-red-400 hover:bg-red-900/20' 
                        : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                    }`}>
                      <Trash2 className="h-3 w-3 md:h-4 md:w-4" />
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
            <div className={`flex items-center space-x-3 md:space-x-4 text-xs md:text-sm mb-2 md:mb-3 ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              <span className="flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                {format(parseISO(log.timestamp), 'p')}
              </span>
              {log.estimatedCaloriesBurned && (
                <span className={`flex items-center font-semibold ${
                  isDark ? 'text-orange-400' : 'text-orange-500'
                }`}>
                  <Flame className="w-3 h-3 mr-1" />
                  {log.estimatedCaloriesBurned.toFixed(0)} kcal
                </span>
              )}
              <span className={`text-xs px-2 py-1 rounded-full shadow-sm sm:hidden ${
                isDark 
                  ? 'text-purple-400 bg-purple-900/30' 
                  : 'text-purple-600 bg-purple-100'
              }`}>
                {log.exerciseType}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 md:gap-3 text-xs md:text-sm mb-2 md:mb-3">
              {log.duration !== undefined && (
                <div className={`flex items-center justify-center space-x-1 md:space-x-2 px-2 md:px-3 py-1 md:py-2 rounded-lg shadow-sm ${
                  isDark ? 'bg-purple-900/30' : 'bg-purple-100'
                }`}>
                  <Clock className={`w-3 h-3 ${
                    isDark ? 'text-purple-400' : 'text-purple-500'
                  }`} />
                  <span className={`font-medium ${
                    isDark ? 'text-purple-400' : 'text-purple-700'
                  }`}>{log.duration} min</span>
                </div>
              )}
              {log.sets !== undefined && (
                <div className={`flex items-center justify-center space-x-1 md:space-x-2 px-2 md:px-3 py-1 md:py-2 rounded-lg shadow-sm ${
                  isDark ? 'bg-blue-900/30' : 'bg-blue-100'
                }`}>
                  <Target className={`w-3 h-3 ${
                    isDark ? 'text-blue-400' : 'text-blue-500'
                  }`} />
                  <span className={`font-medium ${
                    isDark ? 'text-blue-400' : 'text-blue-700'
                  }`}>{log.sets} sets</span>
                </div>
              )}
            </div>
            {log.notes && (
              <div className={`text-xs md:text-sm p-2 md:p-3 rounded-xl shadow-sm ${
                isDark 
                  ? 'text-gray-300 bg-[#1a1a1a]' 
                  : 'text-gray-600 bg-gray-100'
              }`}>
                <span className={`font-medium ${
                  isDark ? 'text-gray-200' : 'text-gray-700'
                }`}>Notes:</span> {log.notes}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

