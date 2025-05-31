// src/app/report/page.tsx
"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from "@/components/ui/card";
import { Tabs } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/context/AuthContext';
import { getUserProfile, getFoodLogs, getExerciseLogs } from '@/services/firestore';

import {
    generateProgressReport,
    ProgressReportInput,
    ProgressReportOutput,
} from '@/ai/flows/weekly-progress-report';

// Import components using alias paths
import ReportHeader from '@/components/report/ReportHeader';
import ReportTabs from '@/components/report/ReportTabs';
import ReportContentArea from '@/components/report/ReportContentArea';
import ReportLoadingSkeleton from '@/components/report/ReportLoadingSkeleton';
import ReportErrorState from '@/components/report/ReportErrorState';
import type { StoredUserProfile, StoredFoodLogEntry, StoredExerciseLogEntry, TranslatePreference } from '@/app/dashboard/types';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

export type ReportType = 'daily' | 'weekly' | 'monthly';

interface FetchedLogsData {
    food: StoredFoodLogEntry[];
    exercise: StoredExerciseLogEntry[];
}

export type PeriodData = {
    logs: FetchedLogsData | null;
    report: ProgressReportOutput | null;
    error: string | null;
    isLoadingLogs: boolean;
    isLoadingReport: boolean;
};

export default function ReportPage() {
    const { toast } = useToast();
    const { userId, loading: authLoading } = useAuth();
    const [userProfile, setUserProfile] = useState<StoredUserProfile | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [activeTab, setActiveTab] = useState<ReportType>('daily');
    const reportContentRef = useRef<HTMLDivElement | null>(null);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isFetchingProfile, setIsFetchingProfile] = useState(true);
    const [periodDataMap, setPeriodDataMap] = useState<Record<string, PeriodData>>({});
    const [hasLoadedInitialProfile, setHasLoadedInitialProfile] = useState(false);

    const getDateRangeKey = useCallback((type: ReportType, date: Date): string => {
        switch (type) {
            case 'daily': return `${type}-${format(date, 'yyyy-MM-dd')}`;
            case 'weekly': return `${type}-${format(startOfWeek(date, { weekStartsOn: 0 }), 'yyyy-MM-dd')}`;
            case 'monthly': return `${type}-${format(startOfMonth(date), 'yyyy-MM')}`;
        }
    }, []);

    const getDateRange = useCallback((type: ReportType, date: Date): { start: Date; end: Date } => {
        switch (type) {
            case 'daily': return { start: startOfDay(date), end: endOfDay(date) };
            case 'weekly': return { start: startOfWeek(date, { weekStartsOn: 0 }), end: endOfWeek(date, { weekStartsOn: 0 }) };
            case 'monthly': return { start: startOfMonth(date), end: endOfMonth(date) };
        }
    }, []);

    const currentPeriodKey = useMemo(() => getDateRangeKey(activeTab, selectedDate), [activeTab, selectedDate, getDateRangeKey]);
    const currentPeriodData = useMemo((): PeriodData => periodDataMap[currentPeriodKey] ?? {
        logs: null, report: null, error: null, isLoadingLogs: false, isLoadingReport: false
    }, [periodDataMap, currentPeriodKey]);

    const fetchReportData = useCallback(async (type: ReportType, date: Date, profile: StoredUserProfile | null) => {
        if (!userId || !profile) {
            console.warn(`[Report Page] User or Profile not loaded, cannot fetch data for ${type} ${format(date, 'yyyy-MM-dd')}`);
            return;
        }

        const periodKey = getDateRangeKey(type, date);

        const currentData = periodDataMap[periodKey];
        if (currentData && (currentData.isLoadingLogs || currentData.isLoadingReport)) {
            console.log(`[Report Page] Already loading data for ${periodKey}, skipping duplicate fetch.`);
            return;
        }
        if (currentData && currentData.logs && currentData.report && !currentData.error) {
            console.log(`[Report Page] Data for ${periodKey} already exists and no error, skipping fetch.`);
            return;
        }

        setPeriodDataMap(prev => ({
            ...prev,
            [periodKey]: { ...(prev[periodKey] || { logs: null, report: null, error: null }), isLoadingLogs: true, isLoadingReport: true, error: null }
        }));

        let fetchedLogsData: FetchedLogsData | null = null;
        let fetchError: string | null = null;

        try {
            console.log(`[Report Page] Fetching logs for ${periodKey}`);
            const { start, end } = getDateRange(type, date);
            const [foodLogs, exerciseLogs] = await Promise.all([
                getFoodLogs(userId, start, end),
                getExerciseLogs(userId, start, end)
            ]);
            fetchedLogsData = { food: foodLogs, exercise: exerciseLogs };
            console.log(`[Report Page] Logs fetched successfully for ${periodKey}. Food: ${foodLogs.length}, Exercise: ${exerciseLogs.length}`);
            setPeriodDataMap(prev => ({
                ...prev,
                [periodKey]: { ...prev[periodKey]!, logs: fetchedLogsData, isLoadingLogs: false }
            }));
        } catch (err: any) {
            console.error(`[Report Page] Error fetching logs for ${periodKey}:`, err);
            fetchError = err.message || "Could not load log data.";
            toast({ variant: "destructive", title: "Log Fetch Error", description: fetchError });
            setPeriodDataMap(prev => ({
                ...prev,
                [periodKey]: { ...prev[periodKey]!, logs: null, isLoadingLogs: false, isLoadingReport: false, error: fetchError }
            }));
            return;
        }

        if (fetchedLogsData) {
            console.log(`[Report Page] Generating AI report for ${periodKey}`);
            let reportResult: ProgressReportOutput | null = null;
            let reportError: string | null = null;
            try {
                const { start, end } = getDateRange(type, date);
                const startDateStr = format(start, 'yyyy-MM-dd');
                const endDateStr = format(end, 'yyyy-MM-dd');

                const targetCalories = (profile.useAiTargets ? profile.targetCalories : profile.manualTargetCalories) ?? 0;
                const targetProtein = (profile.useAiTargets ? profile.targetProtein : profile.manualTargetProtein) ?? 0;
                const targetCarbs = (profile.useAiTargets ? profile.targetCarbs : profile.manualTargetCarbs) ?? 0;
                const targetFat = (profile.useAiTargets ? profile.targetFat : profile.manualTargetFat) ?? 0;
                
                // Ensure translatePreference is correctly retrieved and defaulted
                const translatePref: TranslatePreference = profile.translatePreference || 'en';
                console.log(`[Report Page] Using translatePreference: ${translatePref} for report generation.`);


                if (targetCalories <= 0 || targetProtein <= 0 || targetCarbs <= 0 || targetFat <= 0) {
                    throw new Error("Nutritional targets missing or invalid in profile. Please update.");
                }

                const reportInput: ProgressReportInput = {
                    userId: userId, reportType: type, startDate: startDateStr, endDate: endDateStr,
                    foodLog: fetchedLogsData.food.map(log => ({
                        foodItem: log.foodItem, calories: log.calories, protein: log.protein,
                        carbohydrates: log.carbohydrates, fat: log.fat, timestamp: log.timestamp,
                    })),
                    exerciseLog: fetchedLogsData.exercise.map(log => ({
                        exerciseType: log.exerciseType, duration: log.duration || 0,
                        exerciseName: log.exerciseName, estimatedCaloriesBurned: log.estimatedCaloriesBurned,
                    })),
                    targetCalories, targetProtein, targetCarbs, targetFat,
                    fitnessGoal: profile.fitnessGoal ?? undefined,
                    translatePreference: translatePref,
                };

                reportResult = await generateProgressReport(reportInput);
                console.log(`[Report Page] AI Report generated successfully for ${periodKey}`);
            } catch (err: any) {
                console.error(`[Report Page] AI generation failed for ${periodKey}:`, err);
                reportError = err.message || 'Unknown error generating report.';
                toast({ variant: "destructive", title: `${type.charAt(0).toUpperCase() + type.slice(1)} Report Error`, description: `Report generation failed: ${reportError}` });
            } finally {
                setPeriodDataMap(prev => ({
                    ...prev,
                    [periodKey]: { ...prev[periodKey]!, report: reportResult, error: reportError || fetchError, isLoadingReport: false }
                }));
            }
        }
    }, [userId, getDateRangeKey, getDateRange, toast, periodDataMap]);

    const loadInitialProfile = useCallback(async () => {
        if (!userId || hasLoadedInitialProfile) {
            setIsFetchingProfile(false);
            return userProfile;
        }
        console.log("[Report Page] Loading initial profile...");
        setIsFetchingProfile(true);
        setPeriodDataMap({});
        try {
            const profile = await getUserProfile(userId);
            setUserProfile(profile);
            setHasLoadedInitialProfile(true);
            console.log("[Report Page] Initial profile loaded successfully:", !!profile);
            setIsFetchingProfile(false);
            return profile;
        } catch (err: any) {
            console.error("[Report Page] Error fetching initial profile:", err);
            const errorMsg = err.message || "Could not load initial profile data.";
            const initialKey = getDateRangeKey(activeTab, selectedDate);
            setPeriodDataMap({ [initialKey]: { logs: null, report: null, error: errorMsg, isLoadingLogs: false, isLoadingReport: false } });
            toast({ variant: "destructive", title: "Profile Load Error", description: errorMsg });
            setIsFetchingProfile(false);
            setHasLoadedInitialProfile(true); // Set to true even on error to prevent re-fetch loop
            return null;
        }
    }, [userId, toast, getDateRangeKey, activeTab, selectedDate, hasLoadedInitialProfile, userProfile]);

    useEffect(() => {
        if (!authLoading && userId && !hasLoadedInitialProfile) {
            loadInitialProfile();
        } else if (!authLoading && !userId) {
            setIsFetchingProfile(false); // Ensure loading stops if user is not authenticated
        }
    }, [authLoading, userId, loadInitialProfile, hasLoadedInitialProfile]);

    useEffect(() => {
        console.log(`[Report Page] Effect 2: Tab or Date changed to ${activeTab}/${format(selectedDate, 'yyyy-MM-dd')}. Profile exists: ${!!userProfile}. IsFetchingProfile: ${isFetchingProfile}`);
        if (userProfile && userId && !isFetchingProfile) { // Ensure profile is loaded and not currently fetching it
            fetchReportData(activeTab, selectedDate, userProfile);
        }
    }, [activeTab, selectedDate, userProfile, userId, isFetchingProfile, fetchReportData]);


    if (isFetchingProfile && !hasLoadedInitialProfile) { // Show skeleton only during initial profile fetch
        console.log("[Report Page] Rendering initial profile loading skeleton.");
        return <ReportLoadingSkeleton />;
    }

    if (!userProfile && !isFetchingProfile && hasLoadedInitialProfile) { // Profile fetch attempted and failed
        console.log("[Report Page] Rendering profile error state (profile load failed).");
        const initialError = periodDataMap[getDateRangeKey(activeTab, selectedDate)]?.error || "Could not load your profile. Please try again or contact support.";
        return <ReportErrorState message={initialError} onRetry={loadInitialProfile} />;
    }
    
    const profileIncomplete = !userProfile || !(userProfile.targetCalories || userProfile.manualTargetCalories) || !(userProfile.targetProtein || userProfile.manualTargetProtein) || !(userProfile.targetCarbs || userProfile.manualTargetCarbs) || !(userProfile.targetFat || userProfile.manualTargetFat);

    if (profileIncomplete && !isFetchingProfile && userProfile) { // Profile loaded but incomplete
        console.log("[Report Page] Rendering profile incomplete state.");
        return <ReportErrorState message="Your profile is missing required nutritional targets. Please update your profile to generate reports." onRetry={() => window.location.href = '/profile'} isProfileError={true} />;
    }

    // If profile is still loading but initial fetch is done, show general skeleton.
    // This might happen if loadInitialProfile is called again due to some state change.
    if (isFetchingProfile && hasLoadedInitialProfile) {
        return <ReportLoadingSkeleton />;
    }


    console.log(`[Report Page] Rendering main report view for key: ${currentPeriodKey}. isLoadingLogs: ${currentPeriodData.isLoadingLogs}, isLoadingReport: ${currentPeriodData.isLoadingReport}`);
    return (
        <motion.div 
            className="max-w-4xl mx-auto my-4 md:my-8 px-4"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
        >
            <motion.div
                className="relative overflow-hidden rounded-lg"
                whileHover={{ scale: 1.002 }}
                transition={{ duration: 0.2 }}
            >
                <Card className="shadow-xl border border-border/20 overflow-hidden bg-card/95 backdrop-blur-sm">
                    <motion.div
                        className="absolute inset-0 opacity-20 pointer-events-none"
                        animate={{ 
                            background: [
                                "radial-gradient(circle at 20% 30%, rgba(59, 130, 246, 0.1) 0%, transparent 60%)",
                                "radial-gradient(circle at 80% 70%, rgba(168, 85, 247, 0.1) 0%, transparent 60%)",
                                "radial-gradient(circle at 50% 10%, rgba(34, 197, 94, 0.1) 0%, transparent 60%)"
                            ]
                        }}
                        transition={{ 
                            duration: 12,
                            repeat: Infinity,
                            ease: "linear"
                        }}
                    />
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                        className="relative z-10"
                    >
                        <ReportHeader
                            selectedDate={selectedDate}
                    activeTab={activeTab}
                    setSelectedDate={setSelectedDate}
                    isDownloading={isDownloading}
                    setIsDownloading={setIsDownloading}
                    isLoading={currentPeriodData.isLoadingLogs || currentPeriodData.isLoadingReport}
                    report={currentPeriodData.report}
                    reportContentRef={reportContentRef}
                    getDateRange={getDateRange}
                        />
                        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ReportType)} className="w-full">
                            <ReportTabs activeTab={activeTab} setActiveTab={setActiveTab} />
                            <ReportContentArea
                                activeTab={activeTab}
                                isLoading={currentPeriodData.isLoadingLogs || currentPeriodData.isLoadingReport}
                                error={currentPeriodData.error}
                                report={currentPeriodData.report}
                                reportContentRef={reportContentRef}
                                fetchAndGenerateForTab={fetchReportData}
                                selectedDate={selectedDate}
                                userProfile={userProfile} // Pass userProfile here
                            />
                        </Tabs>
                    </motion.div>
                </Card>
            </motion.div>
        </motion.div>
    );
}

