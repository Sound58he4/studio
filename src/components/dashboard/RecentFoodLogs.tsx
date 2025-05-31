
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { List, Utensils, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from "@/lib/utils";
import { getFoodLogs } from '@/services/firestore/logService';
import type { StoredFoodLogEntry } from '@/app/dashboard/types';
import { startOfDay, endOfDay, parseISO, format } from 'date-fns'; // Added format
import { useAuth } from '@/context/AuthContext'; 

const LOCAL_STORAGE_RECENT_FOOD_LOGS_PREFIX = 'bago-recent-food-logs-'; // Key for localStorage

interface RecentFoodLogsProps {
    // No props needed as it fetches its own data
}

const RecentFoodLogs: React.FC<RecentFoodLogsProps> = () => {
    const { userId } = useAuth();
    const [recentLogs, setRecentLogs] = useState<StoredFoodLogEntry[]>([]);
    const [isLoadingLogs, setIsLoadingLogs] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [isClient, setIsClient] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false); // Add collapsible state

    useEffect(() => {
        setIsClient(true);
    }, []);

    const getLocalStorageKey = useCallback(() => {
        if (!userId) return null;
        const todayDateKey = format(startOfDay(new Date()), 'yyyy-MM-dd');
        return `${LOCAL_STORAGE_RECENT_FOOD_LOGS_PREFIX}${userId}-${todayDateKey}`;
    }, [userId]);

    const fetchRecentLogsData = useCallback(async () => {
        if (!userId || !isClient) {
            setIsLoadingLogs(false);
            setRecentLogs([]);
            return;
        }

        setIsLoadingLogs(true);
        setFetchError(null);
        const storageKey = getLocalStorageKey();

        // Attempt to load from localStorage first
        if (storageKey) {
            try {
                const cachedLogsRaw = localStorage.getItem(storageKey);
                if (cachedLogsRaw) {
                    const cachedLogs = JSON.parse(cachedLogsRaw) as StoredFoodLogEntry[];
                    setRecentLogs(cachedLogs.slice(0, 3)); // Use cached data for initial display
                    // console.log("[RecentFoodLogs] Loaded recent logs from localStorage.");
                    // Don't set isLoadingLogs to false yet, as we'll fetch from server
                }
            } catch (e) {
                console.error("[RecentFoodLogs] Error parsing cached recent logs:", e);
                // Proceed to fetch from Firestore
            }
        }
        
        // Always fetch from Firestore to get the latest data
        try {
            const todayStart = startOfDay(new Date());
            const todayEnd = endOfDay(new Date());
            const todaysLogs = await getFoodLogs(userId, todayStart, todayEnd);
            const sortedLogs = todaysLogs.sort((a, b) => parseISO(b.timestamp).getTime() - parseISO(a.timestamp).getTime());
            setRecentLogs(sortedLogs.slice(0, 3)); // Update state with fresh data

            // Update localStorage with fresh data
            if (storageKey) {
                localStorage.setItem(storageKey, JSON.stringify(sortedLogs)); // Store all fetched for today
                // console.log("[RecentFoodLogs] Synced recent logs to localStorage.");
            }
        } catch (error: any) {
            console.error("[RecentFoodLogs] Error fetching logs:", error);
            setFetchError("Could not load recent logs.");
            if (!localStorage.getItem(storageKey || '')) { // If cache also failed or was empty
                 setRecentLogs([]);
            }
        } finally {
            setIsLoadingLogs(false);
        }
    }, [userId, isClient, getLocalStorageKey]);

    useEffect(() => {
        fetchRecentLogsData();
    }, [fetchRecentLogsData]);

    const renderSkeleton = () => (
         <CardContent className="animate-pulse space-y-3 p-4 sm:p-5">
             {[...Array(3)].map((_, i) => (
                 <div key={i} className="flex justify-between items-center border-b border-dashed pb-2 last:border-b-0">
                     <Skeleton className="h-4 w-2/3 rounded" />
                     <Skeleton className="h-3 w-12 rounded" />
                 </div>
             ))}
         </CardContent>
     );

     const renderContent = () => {
        if (fetchError && recentLogs.length === 0) { // Only show error if no cached data
            return (
                <CardContent className="p-4 sm:p-5 text-center text-destructive text-xs flex items-center justify-center gap-2">
                    <AlertCircle size={14} /> {fetchError}
                </CardContent>
            );
        }
        return (
             <CardContent className="p-4 sm:p-5">
                 {recentLogs.length > 0 ? (
                     <ul className="text-sm text-muted-foreground space-y-1">
                         {recentLogs.map((log) => (
                             <li key={log.id} className={cn(
                                 "flex justify-between items-center border-b border-dashed py-1.5 last:border-b-0",
                                 "hover:bg-muted/50 rounded px-1 -mx-1 transition-colors duration-150"
                               )}>
                                 <span className="font-medium text-foreground/90 truncate mr-2 flex items-center gap-1 sm:gap-1.5">
                                     <Utensils size={14} className="text-primary/70 flex-shrink-0"/>
                                     <span className="truncate">{log.foodItem}</span>
                                 </span>
                                 <span className="text-xs text-right whitespace-nowrap font-mono flex-shrink-0">
                                    {log.calories.toFixed(0)} kcal
                                 </span>
                             </li>
                         ))}
                     </ul>
                 ) : (
                     <p className="text-sm text-center text-muted-foreground italic py-4">No meals logged yet today.</p>
                 )}
             </CardContent>
        );
     }

    return (
        <Card className="shadow-sm border border-border/30 bg-card/80 backdrop-blur-sm hover:shadow-md transition-shadow animate-in fade-in slide-in-from-bottom-4 duration-500 card-interactive">
            <CardHeader 
                className="p-3 sm:p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <CardTitle className="text-sm sm:text-base font-semibold flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <List className="h-4 w-4 sm:h-5 sm:w-5 text-primary"/> Recent Food Logs (Today)
                    </div>
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </CardTitle>
            </CardHeader>

            {isExpanded && (
                <>
                    {isLoadingLogs && recentLogs.length === 0 ? renderSkeleton() : renderContent()}

                    <CardFooter className="pt-2 sm:pt-3 pb-3 sm:pb-4 px-3 sm:px-4 flex justify-end">
                       <Link href="/history?tab=food">
                           <Button variant="link" size="sm" className="text-xs h-auto p-0 text-primary hover:underline underline-offset-4">View All Food History</Button>
                       </Link>
                    </CardFooter>
                </>
            )}
        </Card>
    );
};

export default RecentFoodLogs;
