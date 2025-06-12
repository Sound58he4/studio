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
import { PlusCircle, Trash2, Edit3, ListChecks, Loader2, XCircle, Save, Flame, Dumbbell, Zap, Leaf, CheckCircle, History, BrainCircuit, AlertTriangle, Edit, BookmarkPlus } from "lucide-react";
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
      const fetchedItems = await getQuickLogItems(userId);
      setItems(fetchedItems);
      if (storageKey) localStorage.setItem(storageKey, JSON.stringify(fetchedItems));
      console.log("[QuickLog Page] Synced quick log items with server and updated localStorage.");
    } catch (error: any) {
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

      const uniqueItemsMap = new Map<string, StoredFoodLogEntry>();
      allLogs.forEach(log => {
        const key = log.foodItem.toLowerCase();
        if (!uniqueItemsMap.has(key)) {
          uniqueItemsMap.set(key, log);
        }
      });
      const uniqueSortedLogs = Array.from(uniqueItemsMap.values())
                                   .sort((a,b) => parseISO(b.timestamp).getTime() - parseISO(a.timestamp).getTime())
                                   .slice(0, 20);
      setHistoryLogItems(uniqueSortedLogs);
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
      await deleteQuickLogItem(userId, itemId);
      setItems(prevItems => {
        const updated = prevItems.filter(item => item.id !== itemId);
        if (storageKey) localStorage.setItem(storageKey, JSON.stringify(updated));
        return updated;
      });
      if (isClient) toast({ title: "Quick Item Deleted" });
    } catch (error: any) {
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
    return <div className="flex justify-center items-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin text-primary"/></div>;
  }
  if (!userId && !authLoading && isClient) {
    // This case should ideally be handled by middleware redirecting to /authorize
    // However, if client-side routing somehow lands here, provide a fallback.
    return <div className="text-center p-10">Please log in to access this page.</div>;
  }

  return (
    <motion.div 
      className="max-w-sm sm:max-w-md md:max-w-2xl lg:max-w-3xl xl:max-w-4xl mx-auto my-2 sm:my-4 md:my-8 px-3 py-4 sm:px-4 pb-12 sm:pb-8"
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
      <Card className="shadow-xl border border-border/20 bg-card/95 backdrop-blur-sm relative">
        <CardHeader className="bg-gradient-to-r from-primary/10 via-card to-card border-b p-3 sm:p-5 md:p-6">
          <CardTitle className="text-xl sm:text-2xl md:text-3xl font-bold text-primary flex items-center gap-2">
            <ListChecks className="h-6 w-6 sm:h-7 sm:w-7" /> Quick Log
          </CardTitle>
          <CardDescription className="text-sm sm:text-base mt-1 text-muted-foreground">
            Manage frequently eaten foods or log from your history.
            {isSyncing && <span className="ml-2 text-xs text-primary animate-pulse">(Syncing...)</span>}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
          <div className="mb-4 sm:mb-6 grid grid-cols-1 gap-2 sm:gap-3">
            <Button onClick={() => { setShowForm(!showForm); setShowHistoryLogSection(false); setEditingItemId(null); setFormState(initialFormState); }} variant={showForm ? "outline" : "default"} className="shadow-sm w-full"> <PlusCircle className="mr-2 h-4 w-4"/>{showForm ? "Cancel New" : "Add New Quick Item"} </Button>
            <Button onClick={() => { setShowHistoryLogSection(!showHistoryLogSection); setShowForm(false); }} variant={showHistoryLogSection ? "outline" : "secondary"} className="shadow-sm w-full"> <History className="mr-2 h-4 w-4"/>{showHistoryLogSection ? "Hide History" : "Log from History"} </Button>
          </div>

          {showForm && (
            <Card className="mb-6 sm:mb-8 p-3 sm:p-4 md:p-6 shadow-lg border border-primary/20 animate-in fade-in slide-in-from-top-4 duration-300">
              <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                <h3 className="text-base sm:text-lg font-semibold text-primary mb-2 sm:mb-3 flex items-center gap-2">
                  {editingItemId ? <Edit3 size={16} className="sm:w-[18px] sm:h-[18px]"/> : <BrainCircuit size={16} className="sm:w-[18px] sm:h-[18px]"/>}
                  {editingItemId ? "Edit" : "Add New"} Quick Log Item
                </h3>
                <div>
                  <Label htmlFor="foodName">Food Name *</Label>
                  <Input ref={foodNameInputRef} id="foodName" name="foodName" value={formState.foodName} onChange={handleInputChange} onBlur={handleFoodNameBlur} placeholder="e.g., Apple, Chicken Breast" required className="mt-1"/>
                  {isEstimatingNutrition && <p className="text-xs text-primary mt-1 flex items-center gap-1"><Loader2 size={12} className="animate-spin"/> AI estimating nutrition...</p>}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
                  <div><Label htmlFor="calories" className="text-xs">Calories *</Label><Input Icon={Flame} id="calories" name="calories" type="number" value={formState.calories} onChange={handleInputChange} placeholder="0" required className="mt-1 text-xs h-9"/></div>
                  <div><Label htmlFor="protein" className="text-xs">Protein (g) *</Label><Input Icon={Dumbbell} id="protein" name="protein" type="number" step="0.1" value={formState.protein} onChange={handleInputChange} placeholder="0" required className="mt-1 text-xs h-9"/></div>
                  <div><Label htmlFor="carbohydrates" className="text-xs">Carbs (g) *</Label><Input Icon={Zap} id="carbohydrates" name="carbohydrates" type="number" step="0.1" value={formState.carbohydrates} onChange={handleInputChange} placeholder="0" required className="mt-1 text-xs h-9"/></div>
                  <div><Label htmlFor="fat" className="text-xs">Fat (g) *</Label><Input Icon={Leaf} id="fat" name="fat" type="number" step="0.1" value={formState.fat} onChange={handleInputChange} placeholder="0" required className="mt-1 text-xs h-9"/></div>
                </div>
                <div>
                  <Label htmlFor="servingSizeDescription">Serving Size (Optional)</Label>
                  <Input id="servingSizeDescription" name="servingSizeDescription" value={formState.servingSizeDescription || ''} onChange={handleInputChange} placeholder="e.g., 1 cup, 100g" className="mt-1"/>
                </div>
                <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditingItemId(null); setFormState(initialFormState); }} disabled={isSubmitting || isEstimatingNutrition} className="w-full sm:w-auto">Cancel</Button>
                  <Button type="submit" disabled={isSubmitting || isEstimatingNutrition} className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto">
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>}
                    {editingItemId ? "Update Item" : "Save Item"}
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {showHistoryLogSection && (
             <Card className="mb-8 p-4 md:p-6 shadow-lg border-accent/20 animate-in fade-in duration-300">
                <CardHeader className="p-0 mb-3">
                    <CardTitle className="text-lg font-semibold text-accent flex items-center gap-2"><History size={18}/> Log from Your History</CardTitle>
                    <CardDescription className="text-sm">Select a past meal to log it for today or save as a new quick item.</CardDescription>
                </CardHeader>
                <CardContent className="p-0 max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
                    {isLoadingHistory ? (
                        <div className="space-y-2"><Skeleton className="h-16 w-full"/><Skeleton className="h-16 w-full"/><Skeleton className="h-16 w-full"/></div>
                    ) : historyError ? (
                        <p className="text-center text-destructive py-4">{historyError}</p>
                    ) : historyLogItems.length === 0 ? (
                        <p className="text-center text-muted-foreground py-6 italic">No recent food history found to log from.</p>
                    ) : (
                        <div className="pr-2">
                            <ul className="space-y-2">
                                {historyLogItems.map(log => (
                                    <li key={log.id} className="p-2.5 border rounded-md bg-background hover:bg-muted/30 transition-colors flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                                        <div className="flex-grow">
                                            <p className="font-medium text-sm">{log.identifiedFoodName || log.foodItem}</p>
                                            <p className="text-xs text-muted-foreground tabular-nums">
                                                {log.calories.toFixed(0)} kcal &bull; P:{log.protein.toFixed(1)}g &bull; C:{log.carbohydrates.toFixed(1)}g &bull; F:{log.fat.toFixed(1)}g
                                                {log.originalDescription && <span className="italic"> ({log.originalDescription})</span>}
                                            </p>
                                            <p className="text-xs text-muted-foreground/70">Logged: {format(parseISO(log.timestamp), "MMM d, p")}</p>
                                        </div>
                                        <div className="flex gap-1.5 sm:ml-auto mt-2 sm:mt-0 flex-shrink-0">
                                            <Button variant="outline" size="sm" onClick={() => triggerLogFromHistoryDialog(log)} disabled={isSubmitting} className="h-7 px-2 text-xs">Log Now</Button>
                                            <Button variant="outline" size="sm" onClick={() => handleAddHistoryItemToQuickLog(log)} disabled={isSubmitting} className="h-7 px-2 text-xs"><BookmarkPlus size={12} className="mr-1"/>Save to Quick</Button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </CardContent>
             </Card>
          )}

          {!showForm && !showHistoryLogSection && (
             isLoading && items.length === 0 ? (
                <div className="space-y-3 mt-6">
                    {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
                </div>
             ) : items.length === 0 ? (
                <p className="text-center text-muted-foreground py-8 mt-6">You haven't added any quick log items yet. Click "Add New Quick Item" to start!</p>
             ) : items.length > 0 ? (
                <div className="space-y-3 mt-4 sm:mt-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm sm:text-md font-semibold text-foreground/80">Your Saved Quick Log Items ({items.length})</h3>
                        {items.length > 5 && (
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                                className="text-xs text-muted-foreground hover:text-primary"
                            >
                                ↑ Top
                            </Button>
                        )}
                    </div>
                    <div className="max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent pr-2 space-y-3">
                        {items.map((item, index) => (
                            <Card key={item.id} className={cn("p-3 sm:p-4 group hover:shadow-md transition-shadow border-border/50", loggedTodayMap[item.id] && "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700")}>
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                                    <div className="flex-grow min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className="font-medium text-sm sm:text-base truncate">{item.foodName}</p>
                                            <span className="text-xs text-muted-foreground/50 font-mono">#{index + 1}</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground tabular-nums">
                                            {item.calories.toFixed(0)} kcal &bull; P:{item.protein.toFixed(1)}g &bull; C:{item.carbohydrates.toFixed(1)}g &bull; F:{item.fat.toFixed(1)}g
                                            {item.servingSizeDescription && <span className="italic block sm:inline"> ({item.servingSizeDescription})</span>}
                                        </p>
                                    </div>
                                    <div className="flex gap-2 flex-shrink-0 w-full sm:w-auto sm:ml-auto">
                                       <Button variant={loggedTodayMap[item.id] ? "secondary" : "default"} size="sm" onClick={() => handleLogForTodayFromPreset(item)} disabled={isSubmitting || loggedTodayMap[item.id]} className="h-8 px-3 text-xs sm:text-sm shadow-sm hover:scale-105 transition-transform flex-1 sm:flex-none">
                                           {loggedTodayMap[item.id] ? <CheckCircle size={14} className="mr-1.5 text-green-600"/> : <PlusCircle size={14} className="mr-1.5"/>}
                                           {loggedTodayMap[item.id] ? "Logged Today" : "Log Today"}
                                       </Button>
                                        <div className="flex gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-150">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-7 sm:w-7 text-muted-foreground hover:text-primary" onClick={() => handleEdit(item)} title="Edit Item"><Edit3 size={14}/></Button>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" title="Delete Item"><Trash2 size={14}/></Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader><AlertDialogTitle>Delete Quick Item?</AlertDialogTitle><AlertDialogDescription>Delete "{item.foodName}" from your quick log presets?</AlertDialogDescription></AlertDialogHeader>
                                                    <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(item.id)} className={buttonVariants({ variant: "destructive" })}>Delete</AlertDialogAction></AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                        {items.length > 10 && (
                            <div className="flex justify-center pt-4 pb-2">
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                                    className="text-xs text-muted-foreground hover:text-primary"
                                >
                                    ↑ Back to Top
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
             ) : null
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showLogFromHistoryDialog} onOpenChange={setShowLogFromHistoryDialog}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Log "{itemToLogFromHistory?.identifiedFoodName || itemToLogFromHistory?.foodItem}" for Today?</AlertDialogTitle>
                <AlertDialogDescription>
                    Review and edit nutritional details if needed before logging.
                </AlertDialogDescription>
            </AlertDialogHeader>
            {itemToLogFromHistory && (
                <div className="space-y-3 py-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div><Label htmlFor="dialog-foodName" className="text-xs">Food Name</Label><Input id="dialog-foodName" name="foodName" value={editableHistoryLogDetails.foodName || ''} onChange={handleDialogInputChange} className="mt-1 h-9 text-sm"/></div>
                        <div><Label htmlFor="dialog-calories" className="text-xs">Calories (kcal)</Label><Input Icon={Flame} id="dialog-calories" name="calories" type="number" value={editableHistoryLogDetails.calories || 0} onChange={handleDialogInputChange} className="mt-1 h-9 text-sm"/></div>
                    </div>
                     <div className="grid grid-cols-3 gap-3">
                        <div><Label htmlFor="dialog-protein" className="text-xs">Protein (g)</Label><Input Icon={Dumbbell} id="dialog-protein" name="protein" type="number" step="0.1" value={editableHistoryLogDetails.protein || 0} onChange={handleDialogInputChange} className="mt-1 h-9 text-sm"/></div>
                        <div><Label htmlFor="dialog-carbohydrates" className="text-xs">Carbs (g)</Label><Input Icon={Zap} id="dialog-carbohydrates" name="carbohydrates" type="number" step="0.1" value={editableHistoryLogDetails.carbohydrates || 0} onChange={handleDialogInputChange} className="mt-1 h-9 text-sm"/></div>
                        <div><Label htmlFor="dialog-fat" className="text-xs">Fat (g)</Label><Input Icon={Leaf} id="dialog-fat" name="fat" type="number" step="0.1" value={editableHistoryLogDetails.fat || 0} onChange={handleDialogInputChange} className="mt-1 h-9 text-sm"/></div>
                    </div>
                    <div><Label htmlFor="dialog-servingSizeDescription" className="text-xs">Serving/Notes</Label><Input id="dialog-servingSizeDescription" name="servingSizeDescription" value={editableHistoryLogDetails.servingSizeDescription || ''} onChange={handleDialogInputChange} placeholder="e.g., 1 bowl, as eaten" className="mt-1 h-9 text-sm"/></div>
                </div>
            )}
            <AlertDialogFooter className="mt-2">
                <AlertDialogCancel onClick={() => setShowLogFromHistoryDialog(false)} disabled={isSubmitting}>Cancel</AlertDialogCancel>
                <Button onClick={() => confirmLogFromHistory(true)} disabled={isSubmitting} variant="outline">Log As Is</Button>
                <Button onClick={() => confirmLogFromHistory(false)} disabled={isSubmitting} className="bg-primary text-primary-foreground hover:bg-primary/90">
                     {isSubmitting ? <Loader2 size={16} className="animate-spin mr-1.5"/> : <Save size={16} className="mr-1.5"/>} Log Edited Values
                </Button>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
