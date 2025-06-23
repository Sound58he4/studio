// src/app/dashboard/DashboardMainContent.tsx
"use client";

import React, { useMemo } from 'react'; 
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertCircle, Target, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

// Import dashboard components used here
import GoalsCard from '@/components/dashboard/GoalsCard';

// Import types
import type {
    StoredUserProfile,
    PeriodTotals,
    SuggestCalorieAdjustmentOutput 
} from './types';
import type { CalculateTargetsOutput } from '@/ai/flows/dashboard-update';

interface DashboardMainContentProps {
    error: string | null; 
    userProfile: StoredUserProfile | null;
    dailyTargets: CalculateTargetsOutput | null;
    periodTotals: PeriodTotals;    activePeriodTab: 'daily' | 'weekly' | 'ai-targets';
    setActivePeriodTab: (tab: 'daily' | 'weekly' | 'ai-targets') => void;
    handleRecalculateAiTargets: () => void;
    isCalculatingTargets: boolean; 
    isLoadingTotals: boolean; 
    calorieAdjustmentSuggestion: SuggestCalorieAdjustmentOutput | null; 
    isLoadingSuggestion: boolean; 
    targetActivityCaloriesToday: number | null;
    isDark: boolean; // Add dark theme prop
}

const DashboardMainContent: React.FC<DashboardMainContentProps> = ({
    error,
    userProfile,
    dailyTargets,
    periodTotals,
    activePeriodTab,
    setActivePeriodTab,
    handleRecalculateAiTargets,
    isCalculatingTargets,
    isLoadingTotals, 
    calorieAdjustmentSuggestion, 
    isLoadingSuggestion, 
    targetActivityCaloriesToday,
    isDark,
}) => {

    const actualBurnForDisplay = useMemo(() => {
        return activePeriodTab === 'daily' || activePeriodTab === 'ai-targets' ? periodTotals.caloriesBurned : 0;
    }, [activePeriodTab, periodTotals.caloriesBurned]);

    return (
        <div className="space-y-4 sm:space-y-6">
            {error && !error.includes("Profile incomplete") && !error.includes("User profile not found") && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                >                    <Card className={`border backdrop-blur-sm shadow-clayStrong ${isDark ? 'bg-[#1a1a1a] border-[#3a3a3a]' : 'border-red-200 bg-red-50/80 text-red-700'}`}>
                        <CardHeader className="flex flex-row items-center space-x-3 space-y-0 p-4">
                            <AlertCircle className={`h-5 w-5 flex-shrink-0 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
                            <div>                                <CardTitle className={`text-sm font-medium ${isDark ? 'text-red-400' : 'text-red-700'}`}>Dashboard Issue</CardTitle>
                                <CardDescription className={`text-xs ${isDark ? 'text-red-300' : 'text-red-600/90'}`}>{error}</CardDescription>
                            </div>
                        </CardHeader>
                    </Card>
                </motion.div>
            )}

            {/* Nutritional Targets Card with New Design */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className={`backdrop-blur-sm rounded-3xl border-0 p-4 sm:p-6 md:p-8 transition-all duration-500 ${isDark ? 'bg-[#2a2a2a] border-[#3a3a3a]' : 'bg-clay-100/70 border border-white/50 shadow-clayStrong'}`}
            >                <GoalsCard
                    userProfile={userProfile}
                    periodTotals={periodTotals}
                    dailyTargets={dailyTargets}
                    activePeriodTab={activePeriodTab}
                    setActivePeriodTab={setActivePeriodTab}
                    onRecalculateAiTargets={handleRecalculateAiTargets}
                    isLoadingTargets={isCalculatingTargets || isLoadingTotals}
                    targetActivityCaloriesToday={targetActivityCaloriesToday}
                    actualBurnForDisplay={actualBurnForDisplay}
                    isLoadingSuggestion={isLoadingSuggestion}
                    calorieAdjustmentSuggestion={calorieAdjustmentSuggestion}
                    isDark={isDark}
                />
            </motion.div>
        </div>
    );
};

export default DashboardMainContent;
