// src/app/quick-log/page.tsx
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Trash2, Edit3, ListChecks, Loader2, XCircle, Save, Flame, Dumbbell, Zap, Leaf, CheckCircle, History, BrainCircuit, AlertTriangle, Edit, BookmarkPlus, Plus, Clock, Sparkles, Hash, TrendingUp, Battery, Droplets } from "lucide-react";
import { useAuth } from '@/context/AuthContext';
import {
  getQuickLogItems, addQuickLogItem, deleteQuickLogItem, updateQuickLogItem,
} from '@/services/firestore/quickLogService';
import { addFoodLog, getFoodLogs } from '@/services/firestore/logService';
import { optimizedFoodLogging, OptimizedFoodLoggingInput, OptimizedFoodLoggingOutput } from '@/ai/flows/optimized-food-logging';
import { foodLogCache } from '@/lib/food-log-cache';
import type { StoredQuickLogItem, FirestoreQuickLogData, StoredFoodLogEntry, FirestoreFoodLogData } from '@/app/dashboard/types';
import { cn } from '@/lib/utils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from '@/components/ui/skeleton';
import { format, isToday, parseISO, startOfDay, endOfDay, subDays } from 'date-fns';
import { Separator } from '@/components/ui/separator';

type FormState = Omit<FirestoreQuickLogData, 'createdAt' | 'timestamp' | 'logMethod' | 'originalDescription'> & {
    id?: string;
    foodName: string;
    servingSizeDescription?: string;
    timestamp?: string | Date;
    logMethod?: 'image' | 'voice' | 'manual' | 'quick_log' | 'history';
    originalDescription?: string;
};

const initialFormState: Omit<FormState, 'id'> = {
  foodName: "", calories: 0, protein: 0, carbohydrates: 0, fat: 0, servingSizeDescription: ""
};

const LOCAL_STORAGE_QUICKLOG_KEY_PREFIX = 'bago-quicklog-items-';
const LOCAL_STORAGE_DAILY_FOOD_LOGS_PREFIX = 'bago-daily-food-logs-';

export default function QuickLogPage() {
  // Detect dark mode via HTML class (from settings page)
  const [isDark, setIsDark] = useState<boolean>(false);
  useEffect(() => {
    const updateDark = () => setIsDark(document.documentElement.classList.contains('dark'));
    updateDark();
    const observer = new MutationObserver(updateDark);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const { toast } = useToast();
  const { userId, loading: authLoading } = useAuth();
  const [items, setItems] = useState<StoredQuickLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formState, setFormState] = useState<FormState>(initialFormState);
  const [showForm, setShowForm] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [loggedTodayMap, setLoggedTodayMap] = useState<Record<string, boolean>>({});

  const [showHistoryLogSection, setShowHistoryLogSection] = useState(false);
  const [historyLogItems, setHistoryLogItems] = useState<StoredFoodLogEntry[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const [isEstimatingNutrition, setIsEstimatingNutrition] = useState(false);
  const foodNameInputRef = useRef<HTMLInputElement>(null);

  const [itemToLogFromHistory, setItemToLogFromHistory] = useState<StoredFoodLogEntry | null>(null);
  const [editableHistoryLogDetails, setEditableHistoryLogDetails] = useState<Partial<FormState>>({});
  const [showLogFromHistoryDialog, setShowLogFromHistoryDialog] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => { setIsClient(true); }, []);

  const getLocalStorageKey = useCallback(() => {
    if (!userId) return null;
    return `${LOCAL_STORAGE_QUICKLOG_KEY_PREFIX}${userId}`;
  }, [userId]);

  const getDailyFoodLogCacheKey = useCallback(() => {
    if (!userId) return null;
    const todayDateKey = format(startOfDay(new Date()), 'yyyy-MM-dd');
    return `${LOCAL_STORAGE_DAILY_FOOD_LOGS_PREFIX}${userId}-${todayDateKey}`;
  }, [userId]);

  const syncItemsWithServer = useCallback(async () => {
    if (!userId || !isClient) return;
    setIsSyncing(true);
    const storageKey = getLocalStorageKey();
    try {
      console.log("[QuickLog] Syncing items with server...");
      const fetchedItems = await getQuickLogItems(userId);
      console.log(`[QuickLog] Fetched ${fetchedItems.length} items from server:`, fetchedItems.map(item => ({ id: item.id, name: item.foodName })));
      setItems(fetchedItems);
      if (storageKey) localStorage.setItem(storageKey, JSON.stringify(fetchedItems));
      console.log("[QuickLog] Synced quick log items with server and updated localStorage.");
    } catch (error: any) {
      console.error("[QuickLog] Sync error:", error);
      toast({ variant: "destructive", title: "Sync Error", description: `Could not sync quick log items: ${error.message}` });
    } finally {
      setIsSyncing(false);
    }
  }, [userId, toast, isClient, getLocalStorageKey]);

  const fetchHistoryLogItems = useCallback(async () => {
    if (!userId || !isClient) return;
    setIsLoadingHistory(true);
    setHistoryError(null);
    try {
      const endDate = endOfDay(new Date());
      const startDate = startOfDay(subDays(endDate, 6));
      const allLogs = await getFoodLogs(userId, startDate, endDate);

      // Replace dedupe logic with showing all logs sorted by timestamp
      const sortedLogs = allLogs
        .sort((a, b) => parseISO(b.timestamp).getTime() - parseISO(a.timestamp).getTime())
        .slice(0, 20);
      setHistoryLogItems(sortedLogs);
    } catch (error:any) {
      setHistoryError("Failed to load food history.");
      if(isClient) toast({ variant: "destructive", title: "History Error", description: error.message });
    } finally {
      setIsLoadingHistory(false);
    }
  }, [userId, toast, isClient]);

  useEffect(() => {
    if (!authLoading && userId && isClient) {
      setIsLoading(true);
      const storageKey = getLocalStorageKey();
      if (storageKey) {
        const cachedItemsRaw = localStorage.getItem(storageKey);
        if (cachedItemsRaw) {
          try {
            setItems(JSON.parse(cachedItemsRaw));
          } catch (e) {
            if (isClient) localStorage.removeItem(storageKey);
          }
        }
      }
      syncItemsWithServer();
      setIsLoading(false);
    } else if (!authLoading && !userId) {
      setIsLoading(false);
    }
  }, [authLoading, userId, syncItemsWithServer, isClient, getLocalStorageKey]);

  useEffect(() => {
    if (isClient && showHistoryLogSection && historyLogItems.length === 0 && !isLoadingHistory && userId) {
      fetchHistoryLogItems();
    }
  }, [showHistoryLogSection, historyLogItems.length, isLoadingHistory, userId, fetchHistoryLogItems, isClient]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const isNumericField = ['calories', 'protein', 'carbohydrates', 'fat'].includes(name);
    setFormState(prev => ({ ...prev, [name]: isNumericField ? parseFloat(value) || 0 : value }));
  };

  const handleFoodNameBlur = async () => {
    if (formState.foodName.trim() && !editingItemId && showForm) {
      setIsEstimatingNutrition(true);
      
      try {
        // Check cache first
        const cachedResult = await foodLogCache.getCachedAIEstimate(formState.foodName);
        if (cachedResult) {
          setFormState(prev => ({
            ...prev,
            calories: Math.round(cachedResult.nutrition.calories),
            protein: parseFloat(cachedResult.nutrition.protein.toFixed(1)),
            carbohydrates: parseFloat(cachedResult.nutrition.carbohydrates.toFixed(1)),
            fat: parseFloat(cachedResult.nutrition.fat.toFixed(1)),
          }));
          if (isClient) toast({ title: "Nutrition Estimated (Cached)", description: "Using cached AI suggestions.", variant: "default" });
          return;
        }

        // Use optimized AI flow
        const input: OptimizedFoodLoggingInput = { foodDescription: formState.foodName };
        const result: OptimizedFoodLoggingOutput = await optimizedFoodLogging(input);
        
        // Handle the first food item from the array
        if (!result.foodItems || result.foodItems.length === 0) {
          if (isClient) toast({ title: "No Results", description: "Could not estimate nutrition for this food.", variant: "destructive" });
          return;
        }

        const firstItem = result.foodItems[0];
        
        // Cache the result
        await foodLogCache.cacheAIEstimate(formState.foodName, {
          identifiedFoodName: firstItem.identifiedFoodName,
          nutrition: firstItem.nutrition,
          confidence: firstItem.confidence
        });
        
        setFormState(prev => ({
          ...prev,
          calories: Math.round(firstItem.nutrition.calories),
          protein: parseFloat(firstItem.nutrition.protein.toFixed(1)),
          carbohydrates: parseFloat(firstItem.nutrition.carbohydrates.toFixed(1)),
          fat: parseFloat(firstItem.nutrition.fat.toFixed(1)),
        }));
        if (isClient) toast({ title: "Nutrition Estimated", description: "AI suggested values for your item.", variant: "default" });
      } catch (err: any) {
        if (isClient) toast({ variant: "destructive", title: "AI Error", description: `Could not estimate nutrition: ${err.message}` });
      } finally {
        setIsEstimatingNutrition(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !isClient) return;
    if (!formState.foodName.trim()) {
      if (isClient) toast({ variant: "destructive", title: "Validation Error", description: "Food name is required." });
      return;
    }
    setIsSubmitting(true);
    const storageKey = getLocalStorageKey();
    try {
      const dataToSave: Omit<FirestoreQuickLogData, 'createdAt'> = {
        foodName: formState.foodName,
        calories: formState.calories, protein: formState.protein,
        carbohydrates: formState.carbohydrates, fat: formState.fat,
        servingSizeDescription: formState.servingSizeDescription,
      };

      if (editingItemId) {
        await updateQuickLogItem(userId, editingItemId, dataToSave);
        setItems(prevItems => {
          const updated = prevItems.map(item => item.id === editingItemId ? { ...item, ...dataToSave } : item);
          if (storageKey) localStorage.setItem(storageKey, JSON.stringify(updated));
          return updated;
        });
        if (isClient) toast({ title: "Quick Item Updated" });
      } else {
        await addQuickLogItem(userId, dataToSave);
        if (isClient) toast({ title: "Quick Item Added" });
        await syncItemsWithServer();
      }
      setFormState(initialFormState);
      setShowForm(false);
      setEditingItemId(null);
    } catch (error: any) {
      if (isClient) toast({ variant: "destructive", title: "Error", description: `Failed to save quick item: ${error.message}` });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (item: StoredQuickLogItem) => {
    setFormState({ ...item });
    setEditingItemId(item.id);
    setShowForm(true);
    setShowHistoryLogSection(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (itemId: string) => {
    if (!userId || !isClient) return;
    const storageKey = getLocalStorageKey();
    try {
      // Delete from Firestore first
      await deleteQuickLogItem(userId, itemId);
      console.log(`[QuickLog] Successfully deleted item ${itemId} from Firestore`);
      
      // Update local state and localStorage
      setItems(prevItems => {
        const updated = prevItems.filter(item => item.id !== itemId);
        if (storageKey) {
          localStorage.setItem(storageKey, JSON.stringify(updated));
          console.log(`[QuickLog] Updated localStorage after deletion`);
        }
        return updated;
      });
      
      if (isClient) toast({ title: "Quick Item Deleted" });
    } catch (error: any) {
      console.error(`[QuickLog] Error deleting item ${itemId}:`, error);
      if (isClient) toast({ variant: "destructive", title: "Error", description: `Failed to delete quick item: ${error.message}` });
    }
  };

  const handleLogForTodayFromPreset = async (item: StoredQuickLogItem) => {
    if (!userId || !isClient) return;
    setIsSubmitting(true);
    const dailyLogsCacheKey = getDailyFoodLogCacheKey();

    try {
      const logData: FirestoreFoodLogData = {
        foodItem: item.foodName, calories: item.calories, protein: item.protein,
        carbohydrates: item.carbohydrates, fat: item.fat, timestamp: new Date().toISOString(),
        logMethod: 'quick_log', originalDescription: item.servingSizeDescription || `Logged from Quick Log: ${item.foodName}`
      };
      const newLogId = await addFoodLog(userId, logData);

      const newStoredLog: StoredFoodLogEntry = { ...logData, id: newLogId, timestamp: logData.timestamp as string };

      if (dailyLogsCacheKey) {
        const cachedDailyLogsRaw = localStorage.getItem(dailyLogsCacheKey);
        let existingLogs: StoredFoodLogEntry[] = [];
        if (cachedDailyLogsRaw) {
          try { existingLogs = JSON.parse(cachedDailyLogsRaw); } catch (e) { console.error("Error parsing cached daily logs", e); }
        }
        const updatedLogs = [...existingLogs, newStoredLog].sort((a,b) => parseISO(b.timestamp).getTime() - parseISO(a.timestamp).getTime());
        localStorage.setItem(dailyLogsCacheKey, JSON.stringify(updatedLogs));
        console.log("[QuickLog Page] Updated daily food log cache in localStorage after quick log.");
      }

      setLoggedTodayMap(prev => ({ ...prev, [item.id]: true }));
      if (isClient) toast({ title: `${item.foodName} Logged!`, description: "Added to your daily intake." });
    } catch (error: any) {
      if (isClient) toast({ variant: "destructive", title: "Logging Error", description: `Could not log item: ${error.message}` });
    } finally {
      setIsSubmitting(false);
    }
  };

  const triggerLogFromHistoryDialog = (historyItem: StoredFoodLogEntry) => {
    setItemToLogFromHistory(historyItem);
    setEditableHistoryLogDetails({
      foodName: historyItem.identifiedFoodName || historyItem.foodItem,
      calories: historyItem.calories, protein: historyItem.protein,
      carbohydrates: historyItem.carbohydrates, fat: historyItem.fat,
      servingSizeDescription: historyItem.originalDescription || "",
    });
    setShowLogFromHistoryDialog(true);
  };

  const handleDialogInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditableHistoryLogDetails(prev => ({
      ...prev,
      [name]: ['calories', 'protein', 'carbohydrates', 'fat'].includes(name) ? parseFloat(value) || 0 : value
    }));
  };

  const confirmLogFromHistory = async (logAsIs: boolean) => {
    if (!itemToLogFromHistory || !userId || !isClient) return;
    setIsSubmitting(true);
    const dailyLogsCacheKey = getDailyFoodLogCacheKey();

    try {
      const detailsToLog = logAsIs ? itemToLogFromHistory : editableHistoryLogDetails;
      const logData: FirestoreFoodLogData = {
        foodItem: logAsIs 
          ? (itemToLogFromHistory.identifiedFoodName || itemToLogFromHistory.foodItem).trim()
          : (editableHistoryLogDetails.foodName || itemToLogFromHistory.identifiedFoodName || itemToLogFromHistory.foodItem).trim(),
        calories: Math.round(Number(detailsToLog.calories || 0)),
        protein: parseFloat(Number(detailsToLog.protein || 0).toFixed(1)),
        carbohydrates: parseFloat(Number(detailsToLog.carbohydrates || 0).toFixed(1)),
        fat: parseFloat(Number(detailsToLog.fat || 0).toFixed(1)),
        timestamp: new Date().toISOString(),
        logMethod: 'history',
        originalDescription: logAsIs 
          ? (itemToLogFromHistory.originalDescription || `Logged from history: ${itemToLogFromHistory.identifiedFoodName || itemToLogFromHistory.foodItem}`)
          : (editableHistoryLogDetails.servingSizeDescription || itemToLogFromHistory.originalDescription || `Logged from history: ${editableHistoryLogDetails.foodName || itemToLogFromHistory.identifiedFoodName || itemToLogFromHistory.foodItem}`)
      };
      const newLogId = await addFoodLog(userId, logData);

      const newStoredLog: StoredFoodLogEntry = { ...logData, id: newLogId, timestamp: logData.timestamp as string };
      if (dailyLogsCacheKey) {
          const cachedDailyLogsRaw = localStorage.getItem(dailyLogsCacheKey);
          let existingLogs: StoredFoodLogEntry[] = [];
          if (cachedDailyLogsRaw) { try { existingLogs = JSON.parse(cachedDailyLogsRaw); } catch (e) { console.error("Error parsing cached daily logs", e); } }
          const updatedLogs = [...existingLogs, newStoredLog].sort((a,b) => parseISO(b.timestamp).getTime() - parseISO(a.timestamp).getTime());
          localStorage.setItem(dailyLogsCacheKey, JSON.stringify(updatedLogs));
      }
      if (isClient) toast({ title: `"${logData.foodItem}" Logged!`, description: "Added to your daily intake." });
    } catch (error: any) {
      if (isClient) toast({ variant: "destructive", title: "Logging Error", description: error.message });
    } finally {
      setIsSubmitting(false);
      setShowLogFromHistoryDialog(false);
      setItemToLogFromHistory(null);
    }
  };

  const handleAddHistoryItemToQuickLog = async (historyItem: StoredFoodLogEntry) => {
    if (!userId || !isClient) return;
    setIsSubmitting(true);
    try {
      const dataToSave: Omit<FirestoreQuickLogData, 'createdAt'> = {
        foodName: historyItem.identifiedFoodName || historyItem.foodItem,
        calories: historyItem.calories, protein: historyItem.protein,
        carbohydrates: historyItem.carbohydrates, fat: historyItem.fat,
        servingSizeDescription: historyItem.originalDescription || "",
      };
      await addQuickLogItem(userId, dataToSave);
      if (isClient) toast({ title: "Added to Quick Log", description: `"${dataToSave.foodName}" is now a quick log item.` });
      await syncItemsWithServer();
    } catch (error: any) {
      if (isClient) toast({ variant: "destructive", title: "Error", description: `Failed to add to quick log: ${error.message}` });
    } finally {
      setIsSubmitting(false);
    }
  };


  if (authLoading && !isClient) {
    return (
      <div className="min-h-screen pb-20 md:pb-0 bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100 flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600"/>
      </div>
    );
  }
  if (!userId && !authLoading && isClient) {
    return (
      <div className="min-h-screen pb-20 md:pb-0 bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100 flex items-center justify-center">
        <div className="text-center p-10">Please log in to access this page.</div>
      </div>
    );
  }
  return (
    <motion.div 
      className={`min-h-screen pb-20 md:pb-0 transition-all duration-500 ${
        isDark 
          ? 'bg-[#1a1a1a]' 
          : 'bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100'
      }`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="p-3 md:p-4">
        <div className="max-w-3xl mx-auto">
          {/* Quick Log Header Card */}          <motion.div 
            className="mb-6"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <Card className={`backdrop-blur-sm border-0 shadow-lg rounded-3xl transition-all duration-300 ${
              isDark 
                ? 'bg-[#2a2a2a] border border-[#3a3a3a]' 
                : 'bg-white/60 shadow-lg'
            }`}>
              <CardContent className="p-6">                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${
                      isDark 
                        ? 'bg-gradient-to-r from-[#8b5cf6] to-[#a855f7]' 
                        : 'bg-gradient-to-r from-purple-500 to-purple-600'
                    }`}>
                      <Zap className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className={`text-xl md:text-2xl font-bold ${
                        isDark ? 'text-white' : 'text-gray-800'
                      }`}>
                        Quick Log
                      </h2>
                      <p className={`text-sm ${
                        isDark ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        Log your meals and workouts instantly
                        {isSyncing && <span className={`ml-2 text-xs animate-pulse ${
                          isDark ? 'text-[#8b5cf6]' : 'text-purple-600'
                        }`}>(Syncing...)</span>}
                      </p>
                    </div>
                  </div>
                </div>                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button 
                    onClick={() => { setShowForm(!showForm); setShowHistoryLogSection(false); setEditingItemId(null); setFormState(initialFormState); }}
                    className={`w-full font-semibold px-6 py-4 rounded-2xl shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 ${
                      isDark 
                        ? 'bg-gradient-to-br from-[#8b5cf6] to-[#a855f7] hover:from-[#7c3aed] hover:to-[#9333ea] text-white' 
                        : 'bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white'
                    }`}
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    {showForm ? "Cancel New" : "Add New Quick Item"}
                  </Button>
                  
                  <Button 
                    onClick={() => { setShowHistoryLogSection(!showHistoryLogSection); setShowForm(false); }}
                    variant="outline"
                    className={`w-full font-semibold px-6 py-4 rounded-2xl shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 ${
                      isDark 
                        ? 'bg-[#3a3a3a] border-[#8b5cf6]/20 text-gray-300 hover:text-white hover:bg-[#4a4a4a]' 
                        : 'bg-white/60 border-gray-200 text-gray-700 hover:text-gray-800 hover:bg-white/80'
                    }`}
                  >
                    <Clock className="w-5 h-5 mr-2" />
                    {showHistoryLogSection ? "Hide History" : "Log from History"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Add New Form */}
          <AnimatePresence>
            {showForm && (
              <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="mb-6"
              >                <Card className={`backdrop-blur-sm border-0 shadow-lg rounded-3xl transition-all duration-300 ${
                  isDark 
                    ? 'bg-[#2a2a2a] border border-[#3a3a3a]' 
                    : 'bg-white/60 shadow-lg'
                }`}>
                  <CardContent className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg ${
                          isDark 
                            ? 'bg-gradient-to-r from-[#8b5cf6] to-[#a855f7]' 
                            : 'bg-gradient-to-r from-purple-500 to-purple-600'
                        }`}>
                          {editingItemId ? <Edit3 className="w-5 h-5 text-white"/> : <BrainCircuit className="w-5 h-5 text-white"/>}
                        </div>
                        <h3 className={`text-lg font-bold ${
                          isDark ? 'text-white' : 'text-gray-800'
                        }`}>
                          {editingItemId ? "Edit" : "Add New"} Quick Log Item
                        </h3>
                      </div>                      <div>
                        <Label htmlFor="foodName" className={isDark ? 'text-gray-300' : 'text-gray-700'}>Food Name *</Label>
                        <Input 
                          ref={foodNameInputRef} 
                          id="foodName" 
                          name="foodName" 
                          value={formState.foodName} 
                          onChange={handleInputChange} 
                          onBlur={handleFoodNameBlur} 
                          placeholder="e.g., Apple, Chicken Breast" 
                          required 
                          className={`mt-2 rounded-2xl ${
                            isDark 
                              ? 'bg-[#3a3a3a] border-[#8b5cf6]/20 text-white placeholder:text-gray-500 focus:border-[#8b5cf6]' 
                              : 'border-gray-200 bg-white/80 focus:border-purple-400 focus:ring-purple-200'
                          }`}
                        />
                        {isEstimatingNutrition && (
                          <p className={`text-xs mt-2 flex items-center gap-1 ${
                            isDark ? 'text-[#8b5cf6]' : 'text-purple-600'
                          }`}>
                            <Loader2 size={12} className="animate-spin"/> AI estimating nutrition...
                          </p>
                        )}
                      </div>                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        <div>
                          <Label htmlFor="calories" className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Calories *</Label>
                          <div className="relative mt-1">
                            <Flame className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-orange-500" />
                            <Input 
                              id="calories" 
                              name="calories" 
                              type="number" 
                              value={formState.calories} 
                              onChange={handleInputChange} 
                              placeholder="0" 
                              required 
                              className={`pl-10 rounded-2xl h-12 ${
                                isDark 
                                  ? 'bg-[#3a3a3a] border-[#8b5cf6]/20 text-white placeholder:text-gray-500 focus:border-[#8b5cf6]' 
                                  : 'border-gray-200 bg-white/80 focus:border-purple-400'
                              }`}
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="protein" className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Protein (g) *</Label>
                          <div className="relative mt-1">
                            <Dumbbell className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-blue-500" />
                            <Input 
                              id="protein" 
                              name="protein" 
                              type="number" 
                              step="0.1" 
                              value={formState.protein} 
                              onChange={handleInputChange} 
                              placeholder="0" 
                              required 
                              className={`pl-10 rounded-2xl h-12 ${
                                isDark 
                                  ? 'bg-[#3a3a3a] border-[#8b5cf6]/20 text-white placeholder:text-gray-500 focus:border-[#8b5cf6]' 
                                  : 'border-gray-200 bg-white/80 focus:border-purple-400'
                              }`}
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="carbohydrates" className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Carbs (g) *</Label>
                          <div className="relative mt-1">
                            <Battery className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-yellow-500" />
                            <Input 
                              id="carbohydrates" 
                              name="carbohydrates" 
                              type="number" 
                              step="0.1" 
                              value={formState.carbohydrates} 
                              onChange={handleInputChange} 
                              placeholder="0" 
                              required 
                              className={`pl-10 rounded-2xl h-12 ${
                                isDark 
                                  ? 'bg-[#3a3a3a] border-[#8b5cf6]/20 text-white placeholder:text-gray-500 focus:border-[#8b5cf6]' 
                                  : 'border-gray-200 bg-white/80 focus:border-purple-400'
                              }`}
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="fat" className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Fat (g) *</Label>
                          <div className="relative mt-1">
                            <Droplets className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-green-500" />
                            <Input 
                              id="fat" 
                              name="fat" 
                              type="number" 
                              step="0.1" 
                              value={formState.fat} 
                              onChange={handleInputChange} 
                              placeholder="0" 
                              required 
                              className={`pl-10 rounded-2xl h-12 ${
                                isDark 
                                  ? 'bg-[#3a3a3a] border-[#8b5cf6]/20 text-white placeholder:text-gray-500 focus:border-[#8b5cf6]' 
                                  : 'border-gray-200 bg-white/80 focus:border-purple-400'
                              }`}
                            />
                          </div>
                        </div>
                      </div>                      <div>
                        <Label htmlFor="servingSizeDescription" className={isDark ? 'text-gray-300' : 'text-gray-700'}>Serving Size (Optional)</Label>
                        <Input 
                          id="servingSizeDescription" 
                          name="servingSizeDescription" 
                          value={formState.servingSizeDescription || ''} 
                          onChange={handleInputChange} 
                          placeholder="e.g., 1 cup, 100g" 
                          className={`mt-2 rounded-2xl ${
                            isDark 
                              ? 'bg-[#3a3a3a] border-[#8b5cf6]/20 text-white placeholder:text-gray-500 focus:border-[#8b5cf6]' 
                              : 'border-gray-200 bg-white/80 focus:border-purple-400'
                          }`}
                        />
                      </div>

                      <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => { setShowForm(false); setEditingItemId(null); setFormState(initialFormState); }} 
                          disabled={isSubmitting || isEstimatingNutrition} 
                          className={`rounded-2xl px-6 py-3 ${
                            isDark 
                              ? 'bg-[#3a3a3a] border-[#8b5cf6]/20 text-gray-300 hover:text-white hover:bg-[#4a4a4a]' 
                              : 'bg-white/60 border-gray-200 text-gray-700 hover:bg-white/80'
                          }`}
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={isSubmitting || isEstimatingNutrition} 
                          className={`rounded-2xl px-6 py-3 shadow-lg ${
                            isDark 
                              ? 'bg-gradient-to-br from-[#8b5cf6] to-[#a855f7] hover:from-[#7c3aed] hover:to-[#9333ea] text-white' 
                              : 'bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-lg'
                          }`}
                        >
                          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>}
                          {editingItemId ? "Update Item" : "Save Item"}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* History Section */}
          <AnimatePresence>
            {showHistoryLogSection && (
              <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="mb-6"
              >                <Card className={`backdrop-blur-sm border-0 shadow-lg rounded-3xl transition-all duration-300 ${
                  isDark 
                    ? 'bg-[#2a2a2a] border border-[#3a3a3a]' 
                    : 'bg-white/60 shadow-lg'
                }`}>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg ${
                        isDark 
                          ? 'bg-gradient-to-r from-[#8b5cf6] to-[#a855f7]' 
                          : 'bg-gradient-to-r from-purple-500 to-purple-600'
                      }`}>
                        <History className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className={`text-lg font-bold ${
                          isDark ? 'text-white' : 'text-gray-800'
                        }`}>Log from Your History</h3>
                        <p className={`text-sm ${
                          isDark ? 'text-gray-400' : 'text-gray-600'
                        }`}>Select a past meal to log it for today or save as a new quick item.</p>
                      </div>
                    </div>

                    <div className="max-h-80 overflow-y-auto">
                      {isLoadingHistory ? (
                        <div className="space-y-3">
                          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}
                        </div>                      ) : historyError ? (
                        <p className={`text-center py-6 font-medium ${
                          isDark ? 'text-red-400' : 'text-red-600'
                        }`}>{historyError}</p>
                      ) : historyLogItems.length === 0 ? (
                        <p className={`text-center py-8 italic ${
                          isDark ? 'text-gray-500' : 'text-gray-500'
                        }`}>No recent food history found to log from.</p>
                      ) : (
                        <div className="space-y-3">
                          {historyLogItems.map((log, index) => (
                            <motion.div
                              key={log.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.3, delay: index * 0.05 }}                              className={`p-4 backdrop-blur-sm rounded-2xl shadow-lg transition-all duration-200 flex flex-col sm:flex-row sm:items-center gap-3 ${
                                isDark 
                                  ? 'bg-[#3a3a3a] hover:bg-[#4a4a4a] border border-[#8b5cf6]/20' 
                                  : 'bg-white/40 hover:bg-white/60'
                              }`}
                            >
                              <div className="flex-grow">
                                <p className={`font-semibold text-sm ${
                                  isDark ? 'text-white' : 'text-gray-800'
                                }`}>{log.identifiedFoodName || log.foodItem}</p>
                                <div className="flex flex-wrap gap-2 mt-2">
                                  <span className={`inline-flex items-center space-x-1 backdrop-blur-sm px-2 py-1 rounded-full shadow-sm text-xs ${
                                    isDark 
                                      ? 'bg-[#4a4a4a] border border-orange-500/30' 
                                      : 'bg-white/30'
                                  }`}>
                                    <Flame className="w-3 h-3 text-orange-500" />
                                    <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>{log.calories.toFixed(0)} kcal</span>
                                  </span>
                                  <span className={`inline-flex items-center space-x-1 backdrop-blur-sm px-2 py-1 rounded-full shadow-sm text-xs ${
                                    isDark 
                                      ? 'bg-[#4a4a4a] border border-blue-500/30' 
                                      : 'bg-white/30'
                                  }`}>
                                    <Dumbbell className="w-3 h-3 text-blue-500" />
                                    <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>P:{log.protein.toFixed(1)}g</span>
                                  </span>
                                  <span className={`inline-flex items-center space-x-1 backdrop-blur-sm px-2 py-1 rounded-full shadow-sm text-xs ${
                                    isDark 
                                      ? 'bg-[#4a4a4a] border border-yellow-500/30' 
                                      : 'bg-white/30'
                                  }`}>
                                    <Battery className="w-3 h-3 text-yellow-500" />
                                    <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>C:{log.carbohydrates.toFixed(1)}g</span>
                                  </span>
                                  <span className={`inline-flex items-center space-x-1 backdrop-blur-sm px-2 py-1 rounded-full shadow-sm text-xs ${
                                    isDark 
                                      ? 'bg-[#4a4a4a] border border-green-500/30' 
                                      : 'bg-white/30'
                                  }`}>
                                    <Droplets className="w-3 h-3 text-green-500" />
                                    <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>F:{log.fat.toFixed(1)}g</span>
                                  </span>
                                </div>
                                <p className={`text-xs mt-1 ${
                                  isDark ? 'text-gray-500' : 'text-gray-500'
                                }`}>Logged: {format(parseISO(log.timestamp), "MMM d, p")}</p>
                              </div>                              <div className="flex gap-2 sm:ml-auto">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => triggerLogFromHistoryDialog(log)} 
                                  disabled={isSubmitting} 
                                  className={`rounded-2xl px-3 py-2 text-xs ${
                                    isDark 
                                      ? 'bg-[#3a3a3a] border-[#8b5cf6]/20 text-gray-300 hover:text-white hover:bg-[#4a4a4a]' 
                                      : 'bg-white/60 border-gray-200 hover:bg-white/80'
                                  }`}
                                >
                                  Log Now
                                </Button>                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => handleAddHistoryItemToQuickLog(log)} 
                                  disabled={isSubmitting} 
                                  className={`rounded-2xl px-3 py-2 text-xs ${
                                    isDark 
                                      ? 'bg-[#3a3a3a] border-[#8b5cf6]/20 text-gray-300 hover:text-white hover:bg-[#4a4a4a]' 
                                      : 'bg-white/60 border-gray-200 hover:bg-white/80'
                                  }`}
                                >
                                  <BookmarkPlus size={12} className="mr-1"/>Save to Quick
                                </Button>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Your Saved Quick Log Items */}
          {!showForm && !showHistoryLogSection && (
            <>
              {/* Header */}
              <motion.div 
                className="mb-6"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >                <div className={`backdrop-blur-sm rounded-3xl shadow-lg p-6 border-0 transition-all duration-300 ${
                  isDark 
                    ? 'bg-[#2a2a2a] border border-[#3a3a3a]' 
                    : 'bg-white/60 shadow-lg'
                }`}>
                  <div className="flex items-center space-x-3 mb-2">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg ${
                      isDark 
                        ? 'bg-gradient-to-r from-[#8b5cf6] to-[#a855f7]' 
                        : 'bg-gradient-to-r from-purple-500 to-purple-600'
                    }`}>
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <h2 className={`md:text-2xl font-bold text-base ${
                      isDark ? 'text-white' : 'text-gray-800'
                    }`}>
                      Your Saved Quick Log Items
                    </h2>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <TrendingUp className={`w-4 h-4 ${isDark ? 'text-[#8b5cf6]' : 'text-purple-600'}`} />
                    <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>{items.length} items ready to log</span>
                  </div>
                </div>
              </motion.div>

              {/* Items List */}
              {isLoading && items.length === 0 ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-3xl" />)}
                </div>
              ) : items.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="text-center py-12"                >
                  <div className={`w-20 h-20 mx-auto mb-6 rounded-3xl flex items-center justify-center shadow-lg ${
                    isDark 
                      ? 'bg-gradient-to-r from-[#8b5cf6] to-[#a855f7]' 
                      : 'bg-gradient-to-r from-purple-500 to-purple-600'
                  }`}>
                    <Sparkles className="w-10 h-10 text-white" />
                  </div>
                  <p className={`text-lg mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>You haven't added any quick log items yet.</p>
                  <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Click "Add New Quick Item" to start!</p>
                </motion.div>
              ) : (
                <div className="space-y-4">
                  {items.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}                      className={cn(
                        `backdrop-blur-sm border-0 shadow-lg rounded-3xl transition-all duration-300 hover:scale-[1.01] ${
                          isDark 
                            ? 'bg-[#2a2a2a] border border-[#3a3a3a] hover:shadow-[#8b5cf6]/20' 
                            : 'bg-white/60 shadow-lg'
                        }`,
                        loggedTodayMap[item.id] && (isDark ? "bg-green-900/50 border-green-700/50" : "bg-green-100/60 border-green-200")
                      )}
                    >
                      <div className="p-5 md:p-6">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                          <div className="flex-1">                            <div className="flex items-start lg:items-center justify-between mb-3">
                              <h3 className={`text-lg md:text-xl font-bold flex-1 mr-3 ${
                                isDark ? 'text-white' : 'text-gray-800'
                              }`}>
                                {item.foodName}
                              </h3>
                              <div className={`flex items-center space-x-1 backdrop-blur-sm px-3 py-1 rounded-full shadow-lg ${
                                isDark 
                                  ? 'bg-[#3a3a3a] border border-[#8b5cf6]/30' 
                                  : 'bg-white/40'
                              }`}>
                                <Hash className={`w-3 h-3 ${isDark ? 'text-[#8b5cf6]' : 'text-purple-600'}`} />
                                <span className={`text-sm font-bold ${isDark ? 'text-[#8b5cf6]' : 'text-purple-600'}`}>
                                  {index + 1}
                                </span>
                              </div>
                            </div>
                              <div className="flex flex-wrap items-center gap-3 text-sm mb-3">
                              <div className={`flex items-center space-x-2 backdrop-blur-sm px-3 py-2 rounded-full shadow-lg ${
                                isDark 
                                  ? 'bg-[#3a3a3a] border border-orange-500/30' 
                                  : 'bg-white/30'
                              }`}>
                                <Flame className="w-4 h-4 text-orange-500" />
                                <span className={`font-semibold ${
                                  isDark ? 'text-gray-300' : 'text-gray-600'
                                }`}>{item.calories.toFixed(0)} kcal</span>
                              </div>
                              <div className={`flex items-center space-x-2 backdrop-blur-sm px-3 py-2 rounded-full shadow-lg ${
                                isDark 
                                  ? 'bg-[#3a3a3a] border border-blue-500/30' 
                                  : 'bg-white/30'
                              }`}>
                                <Dumbbell className="w-4 h-4 text-blue-500" />
                                <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>P: {item.protein.toFixed(1)}g</span>
                              </div>
                              <div className={`flex items-center space-x-2 backdrop-blur-sm px-3 py-2 rounded-full shadow-lg ${
                                isDark 
                                  ? 'bg-[#3a3a3a] border border-yellow-500/30' 
                                  : 'bg-white/30'
                              }`}>
                                <Battery className="w-4 h-4 text-yellow-500" />
                                <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>C: {item.carbohydrates.toFixed(1)}g</span>
                              </div>
                              <div className={`flex items-center space-x-2 backdrop-blur-sm px-3 py-2 rounded-full shadow-lg ${
                                isDark 
                                  ? 'bg-[#3a3a3a] border border-green-500/30' 
                                  : 'bg-white/30'
                              }`}>
                                <Droplets className="w-4 h-4 text-green-500" />
                                <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>F: {item.fat.toFixed(1)}g</span>
                              </div>
                            </div>
                              {item.servingSizeDescription && (
                              <p className={`text-sm backdrop-blur-sm rounded-2xl px-4 py-2 inline-block shadow-lg ${
                                isDark 
                                  ? 'text-gray-400 bg-[#3a3a3a] border border-[#8b5cf6]/20' 
                                  : 'text-gray-500 bg-white/40'
                              }`}>
                                {item.servingSizeDescription}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center justify-between lg:justify-end space-x-3 lg:ml-6">                            <div className="flex items-center space-x-2">
                              <Button 
                                size="sm" 
                                variant="ghost"
                                className={`backdrop-blur-sm border-0 shadow-lg transition-all duration-200 hover:scale-110 h-10 w-10 rounded-2xl ${
                                  isDark 
                                    ? 'bg-[#3a3a3a] text-gray-400 hover:text-white hover:bg-[#4a4a4a] border border-[#8b5cf6]/20' 
                                    : 'bg-white/60 text-gray-600 hover:text-gray-800 hover:bg-white/80'
                                }`} 
                                onClick={() => handleEdit(item)}
                                title="Edit Item"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button 
                                    size="sm" 
                                    variant="ghost"
                                    className={`backdrop-blur-sm border-0 shadow-lg transition-all duration-200 hover:scale-110 h-10 w-10 rounded-2xl ${
                                      isDark 
                                        ? 'bg-[#3a3a3a] text-gray-400 hover:text-red-400 hover:bg-red-900/50 border border-[#8b5cf6]/20' 
                                        : 'bg-white/60 text-gray-600 hover:text-red-500 hover:bg-red-50'
                                    }`}
                                    title="Delete Item"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Quick Item?</AlertDialogTitle>
                                    <AlertDialogDescription>Delete "{item.foodName}" from your quick log presets?</AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete(item.id)} className={buttonVariants({ variant: "destructive" })}>Delete</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                              <Button 
                              className={cn(
                                "font-semibold px-6 py-3 rounded-2xl shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 text-sm",
                                loggedTodayMap[item.id] 
                                  ? "bg-green-500 hover:bg-green-600 text-white" 
                                  : isDark 
                                    ? "bg-gradient-to-br from-[#8b5cf6] to-[#a855f7] hover:from-[#7c3aed] hover:to-[#9333ea] text-white" 
                                    : "bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white"
                              )}
                              onClick={() => handleLogForTodayFromPreset(item)} 
                              disabled={isSubmitting || loggedTodayMap[item.id]}
                            >
                              {loggedTodayMap[item.id] ? (
                                <>
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Logged Today
                                </>
                              ) : (
                                <>
                                  <Plus className="w-4 h-4 mr-2" />
                                  Log Today
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Log from History Dialog */}
      <AlertDialog open={showLogFromHistoryDialog} onOpenChange={setShowLogFromHistoryDialog}>        <AlertDialogContent className={`rounded-3xl backdrop-blur-lg ${
          isDark 
            ? 'bg-[#2a2a2a]/95 border border-[#3a3a3a]' 
            : 'bg-white/95'
        }`}>
          <AlertDialogHeader>
            <AlertDialogTitle className={isDark ? 'text-white' : undefined}>Log "{itemToLogFromHistory?.identifiedFoodName || itemToLogFromHistory?.foodItem}" for Today?</AlertDialogTitle>
            <AlertDialogDescription className={isDark ? 'text-gray-400' : undefined}>
              Review and edit nutritional details if needed before logging.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {itemToLogFromHistory && (
            <div className="space-y-4 py-4">              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="dialog-foodName" className={`text-xs ${isDark ? 'text-gray-300' : ''}`}>Food Name</Label>
                  <Input 
                    id="dialog-foodName" 
                    name="foodName" 
                    value={editableHistoryLogDetails.foodName || ''} 
                    onChange={handleDialogInputChange} 
                    className={`mt-1 h-10 text-sm rounded-2xl ${
                      isDark 
                        ? 'bg-[#3a3a3a] border-[#8b5cf6]/20 text-white' 
                        : 'bg-white/80'
                    }`}
                  />
                </div>
                <div>
                  <Label htmlFor="dialog-calories" className={`text-xs ${isDark ? 'text-gray-300' : ''}`}>Calories (kcal)</Label>
                  <div className="relative mt-1">
                    <Flame className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-orange-500" />
                    <Input 
                      id="dialog-calories" 
                      name="calories" 
                      type="number" 
                      value={editableHistoryLogDetails.calories || 0} 
                      onChange={handleDialogInputChange} 
                      className={`pl-10 h-10 text-sm rounded-2xl ${
                        isDark 
                          ? 'bg-[#3a3a3a] border-[#8b5cf6]/20 text-white' 
                          : 'bg-white/80'
                      }`}
                    />
                  </div>
                </div>
              </div>              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="dialog-protein" className={`text-xs ${isDark ? 'text-gray-300' : ''}`}>Protein (g)</Label>
                  <div className="relative mt-1">
                    <Dumbbell className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-blue-500" />
                    <Input 
                      id="dialog-protein" 
                      name="protein" 
                      type="number" 
                      step="0.1" 
                      value={editableHistoryLogDetails.protein || 0} 
                      onChange={handleDialogInputChange} 
                      className={`pl-10 h-10 text-sm rounded-2xl ${
                        isDark 
                          ? 'bg-[#3a3a3a] border-[#8b5cf6]/20 text-white' 
                          : 'bg-white/80'
                      }`}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="dialog-carbohydrates" className={`text-xs ${isDark ? 'text-gray-300' : ''}`}>Carbs (g)</Label>
                  <div className="relative mt-1">
                    <Battery className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-yellow-500" />
                    <Input 
                      id="dialog-carbohydrates" 
                      name="carbohydrates" 
                      type="number" 
                      step="0.1" 
                      value={editableHistoryLogDetails.carbohydrates || 0} 
                      onChange={handleDialogInputChange} 
                      className={`pl-10 h-10 text-sm rounded-2xl ${
                        isDark 
                          ? 'bg-[#3a3a3a] border-[#8b5cf6]/20 text-white' 
                          : 'bg-white/80'
                      }`}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="dialog-fat" className={`text-xs ${isDark ? 'text-gray-300' : ''}`}>Fat (g)</Label>
                  <div className="relative mt-1">
                    <Droplets className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-green-500" />
                    <Input 
                      id="dialog-fat" 
                      name="fat" 
                      type="number" 
                      step="0.1" 
                      value={editableHistoryLogDetails.fat || 0} 
                      onChange={handleDialogInputChange} 
                      className={`pl-10 h-10 text-sm rounded-2xl ${
                        isDark 
                          ? 'bg-[#3a3a3a] border-[#8b5cf6]/20 text-white' 
                          : 'bg-white/80'
                      }`}
                    />
                  </div>
                </div>
              </div>              <div>
                <Label htmlFor="dialog-servingSizeDescription" className={`text-xs ${isDark ? 'text-gray-300' : ''}`}>Serving/Notes</Label>
                <Input 
                  id="dialog-servingSizeDescription" 
                  name="servingSizeDescription" 
                  value={editableHistoryLogDetails.servingSizeDescription || ''} 
                  onChange={handleDialogInputChange} 
                  placeholder="e.g., 1 bowl, as eaten" 
                  className={`mt-1 h-10 text-sm rounded-2xl ${
                    isDark 
                      ? 'bg-[#3a3a3a] border-[#8b5cf6]/20 text-white placeholder:text-gray-500' 
                      : 'bg-white/80'
                  }`}
                />
              </div>
            </div>
          )}          <AlertDialogFooter className="mt-2">
            <AlertDialogCancel 
              onClick={() => setShowLogFromHistoryDialog(false)} 
              disabled={isSubmitting}
              className={`rounded-2xl ${
                isDark 
                  ? 'bg-[#3a3a3a] border-[#8b5cf6]/20 text-gray-300 hover:text-white hover:bg-[#4a4a4a]' 
                  : ''
              }`}
            >
              Cancel
            </AlertDialogCancel>
            <Button 
              onClick={() => confirmLogFromHistory(true)} 
              disabled={isSubmitting} 
              variant="outline"
              className={`rounded-2xl ${
                isDark 
                  ? 'bg-[#3a3a3a] border-[#8b5cf6]/20 text-gray-300 hover:text-white hover:bg-[#4a4a4a]' 
                  : ''
              }`}
            >
              Log As Is
            </Button>
            <Button 
              onClick={() => confirmLogFromHistory(false)} 
              disabled={isSubmitting} 
              className={`rounded-2xl ${
                isDark 
                  ? 'bg-gradient-to-br from-[#8b5cf6] to-[#a855f7] hover:from-[#7c3aed] hover:to-[#9333ea] text-white' 
                  : 'bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white'
              }`}
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin mr-1.5"/> : <Save size={16} className="mr-1.5"/>} 
              Log Edited Values
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
