// src/components/dashboard/GoalsCard.tsx
"use client";

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardFooter, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import ProgressTracker from '@/components/dashboard/ProgressTracker';
import { RefreshCw, Flame, Leaf, Zap, Dumbbell, Info, Target, Activity, CheckCircle, Loader2, Droplets, Beef, Wheat, RotateCcw, Sparkles } from 'lucide-react';
import type { CalculateTargetsOutput } from '@/ai/flows/dashboard-update';
import { cn } from "@/lib/utils";
import { Progress } from '@/components/ui/progress'; 

import type { StoredUserProfile, PeriodTotals, SuggestCalorieAdjustmentOutput } from '@/app/dashboard/types';

export interface GoalsCardProps {
  userProfile: StoredUserProfile | null;
  periodTotals: PeriodTotals;
  dailyTargets: CalculateTargetsOutput | null;
  activePeriodTab: 'daily' | 'weekly' | 'ai-targets';
  setActivePeriodTab: (tab: 'daily' | 'weekly' | 'ai-targets') => void;
  onRecalculateAiTargets: () => void;
  isLoadingTargets: boolean;
  className?: string;
  targetActivityCaloriesToday: number | null;
  actualBurnForDisplay: number;
  isLoadingSuggestion: boolean;
  calorieAdjustmentSuggestion: SuggestCalorieAdjustmentOutput | null;
}

const GoalsCard: React.FC<GoalsCardProps> = ({
  userProfile,
  periodTotals,
  dailyTargets,
  activePeriodTab,
  setActivePeriodTab,
  onRecalculateAiTargets,
  isLoadingTargets,
  className,
  targetActivityCaloriesToday,
  actualBurnForDisplay,
  isLoadingSuggestion,
  calorieAdjustmentSuggestion,
}) => {  const calculatePercentage = (current: number, target: number) => {
    if (!target || target <= 0) {
      console.log(`[GoalsCard] Zero or invalid target detected: current=${current}, target=${target}`);
      return 0;
    }
    const percentage = Math.round((current / target) * 100);
    if (isNaN(percentage) || !isFinite(percentage)) {
      console.warn(`[GoalsCard] Invalid percentage calculated: current=${current}, target=${target}, percentage=${percentage}`);
      return 0;
    }
    return percentage;
  };
  const renderNutritionCards = (isWeekly: boolean) => {
    if (!dailyTargets) return null;

    const valueCalories = Number(periodTotals.calories) || 0;
    const valueProtein = Number(periodTotals.protein) || 0;
    const valueCarbs = Number(periodTotals.carbohydrates) || 0;
    const valueFat = Number(periodTotals.fat) || 0;

    const numDays = isWeekly ? 7 : 1;
    const targetCalories = (Number(dailyTargets.targetCalories) || 0) * numDays;
    const targetProtein = (Number(dailyTargets.targetProtein) || 0) * numDays;
    const targetCarbs = (Number(dailyTargets.targetCarbs) || 0) * numDays;
    const targetFat = (Number(dailyTargets.targetFat) || 0) * numDays;

    const nutritionData = [
      {
        name: 'Calories',
        current: valueCalories,
        target: targetCalories,
        unit: '',
        icon: Droplets,
        color: 'blue'
      },
      {
        name: 'Protein',
        current: valueProtein,
        target: targetProtein,
        unit: 'g',
        icon: Beef,
        color: 'orange'
      },
      {
        name: 'Carbs',
        current: valueCarbs,
        target: targetCarbs,
        unit: 'g',
        icon: Zap,
        color: 'green'
      },
      {
        name: 'Fat',
        current: valueFat,
        target: targetFat,
        unit: 'g',
        icon: Wheat,
        color: 'purple'
      }
    ];

    return (      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        {nutritionData.map((item, index) => {
          const percentage = calculatePercentage(item.current, item.target);
          const safePercentage = Math.max(0, Math.min(percentage, 100));
          const IconComponent = item.icon;
          return (
            <div key={index} className="backdrop-blur-sm rounded-2xl p-4 sm:p-6 shadow-lg border transition-all duration-300 bg-white/50 border-white/30">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <IconComponent className={`w-4 h-4 sm:w-5 sm:h-5 ${
                    item.color === 'blue' ? 'text-blue-500' : 
                    item.color === 'orange' ? 'text-orange-500' : 
                    item.color === 'green' ? 'text-emerald-500' : 
                    'text-purple-500'
                  }`} />
                  <span className="text-sm sm:text-base font-medium text-gray-700">{item.name}</span>
                </div>
                <div className={`text-lg sm:text-xl font-bold ${
                  item.color === 'blue' ? 'text-blue-600' : 
                  item.color === 'orange' ? 'text-orange-600' : 
                  item.color === 'green' ? 'text-emerald-600' : 
                  'text-purple-600'
                }`}>
                  {safePercentage}%
                </div>
              </div>
              <div className="mb-3">
                <div className="text-sm sm:text-base mb-2 text-gray-600">
                  {(item.current || 0).toFixed(item.unit === 'g' ? 1 : 0)} / {(item.target || 0).toFixed(item.unit === 'g' ? 1 : 0)}{item.unit}
                </div>                <div className="w-full rounded-full h-2.5 sm:h-3 shadow-lg bg-gray-200/50">
                  <div 
                    className={`h-2.5 sm:h-3 rounded-full transition-all duration-500 shadow-lg ${
                      item.color === 'blue' ? 'bg-gradient-to-r from-blue-400 to-blue-500' : 
                      item.color === 'orange' ? 'bg-gradient-to-r from-orange-400 to-orange-500' : 
                      item.color === 'green' ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : 
                      'bg-gradient-to-r from-purple-400 to-purple-500'
                    }`}
                    style={{ width: `${safePercentage}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const burnGoalProgress = targetActivityCaloriesToday && targetActivityCaloriesToday > 0 
    ? Math.min(100, (actualBurnForDisplay / targetActivityCaloriesToday) * 100) 
    : 0;
  const burnGoalReached = targetActivityCaloriesToday !== null && actualBurnForDisplay >= targetActivityCaloriesToday;

  return (
    <div className={cn("space-y-4 sm:space-y-6", className)}>      {/* Nutritional Targets Card */}
      <div className="backdrop-blur-sm rounded-3xl shadow-lg border-0 p-4 sm:p-6 md:p-8 animate-scale-in transition-all duration-500 bg-white/70 shadow-lg border border-blue-100/50">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center shadow-lg bg-gradient-to-br from-blue-400 to-blue-500">
              <Target className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800">Nutritional Targets</h3>
              <p className="text-sm sm:text-base text-gray-600">Track daily nutrition</p>
            </div>
          </div>
        </div>
        
        {/* Goals Tabs - Mobile Optimized */}
        <div className="flex mb-6 sm:mb-8 backdrop-blur-sm rounded-xl p-1 shadow-lg max-w-lg bg-gray-100/50">
          <button 
            onClick={() => setActivePeriodTab('daily')} 
            className={`flex-1 py-2 sm:py-3 px-3 sm:px-4 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 ${
              activePeriodTab === 'daily' 
                ? 'bg-white shadow-lg text-gray-800'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Today
          </button>
          <button 
            onClick={() => setActivePeriodTab('weekly')} 
            className={`flex-1 py-2 sm:py-3 px-3 sm:px-4 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 ${
              activePeriodTab === 'weekly' 
                ? 'bg-white shadow-lg text-gray-800'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Week
          </button>
          <button 
            onClick={() => {
              setActivePeriodTab('ai-targets');
              onRecalculateAiTargets();
            }} 
            className={`flex-1 py-2 sm:py-3 px-3 sm:px-4 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 ${
              activePeriodTab === 'ai-targets' 
                ? 'bg-white shadow-lg text-gray-800'
                : 'text-gray-600 hover:text-gray-800'
            }`}
            disabled={isLoadingTargets}
          >
            <div className="flex items-center justify-center gap-1">
              <RotateCcw size={12} className={`${isLoadingTargets ? 'animate-spin' : ''}`} />
              AI Targets
            </div>
          </button>
        </div>        {/* Content */}
        {isLoadingTargets ? (
          <SkeletonLoader />
        ) : dailyTargets && (dailyTargets.targetCalories ?? 0) > 0 ? (
          <>
            {activePeriodTab === 'daily' && renderNutritionCards(false)}
            {activePeriodTab === 'weekly' && renderNutritionCards(true)}
            {activePeriodTab === 'ai-targets' && (
              <div className="text-center py-8 sm:py-10">
                <div className="flex items-center justify-center space-x-2 mb-4">
                  <Sparkles className="w-6 h-6 text-blue-500" />
                  <span className="text-lg font-semibold text-gray-800">AI-Powered Targets</span>
                </div>
                <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">
                  Your nutritional targets have been calculated using AI based on your profile, fitness goals, and activity level.
                </p>
                {renderNutritionCards(false)}
                <div className="mt-6 pt-4 border-t border-gray-200/50">
                  <p className="text-xs text-blue-600 flex items-center justify-center gap-1">
                    <Target size={14} /> Targets updated with AI analysis
                  </p>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8 sm:py-10 text-gray-500 italic">
            <p className="text-sm">Set your profile and targets to see progress.</p>
            <Link href="/profile">
              <Button variant="link" size="sm" className="mt-2 text-blue-600">Go to Profile</Button>
            </Link>
          </div>
        )}

        {/* Status Messages and Activity Goal */}
        {activePeriodTab === 'daily' && (
          <div className="mt-6 pt-4 border-t border-gray-200/50">
            {/* Calorie Adjustment Suggestion */}
            {isLoadingSuggestion && !calorieAdjustmentSuggestion && (
              <div className="flex items-center justify-center text-xs text-gray-500 animate-pulse mb-4">
                <Loader2 size={14} className="animate-spin mr-1.5"/> Loading activity guidance...
              </div>
            )}
            
            {calorieAdjustmentSuggestion && (
              <div className="mb-4 text-center">
                <p className="text-sm font-semibold text-blue-600 flex items-center justify-center gap-1 mb-1">
                  <Flame size={14} /> {calorieAdjustmentSuggestion.actionTitle}
                </p>                {calorieAdjustmentSuggestion.actionUnit && calorieAdjustmentSuggestion.actionUnit.includes('kcal to eat') && calorieAdjustmentSuggestion.actionValue !== null && (
                  <p className="text-xs text-gray-600">
                    Target: {calorieAdjustmentSuggestion.actionValue.toFixed(0)} {calorieAdjustmentSuggestion.actionUnit}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {activePeriodTab === 'weekly' && (
          <div className="mt-6 pt-4 border-t border-gray-200/50 text-center">
            <p className="text-xs text-gray-500 italic">Daily activity suggestions available in 'Today's Goals' view.</p>
          </div>
        )}
      </div>

      {/* Today's Exercise Burn Goal - New Design Implementation */}
      {activePeriodTab === 'daily' && (
        <div className="backdrop-blur-sm rounded-3xl shadow-lg border p-4 sm:p-6 md:p-8 animate-fade-in transition-all duration-500 bg-gradient-to-br from-amber-50/80 to-orange-50/80 border-white/30">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-3 sm:mb-4">
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500" />
              <span className="font-semibold text-base sm:text-lg text-amber-700">
                {calorieAdjustmentSuggestion?.actionTitle || "Today's Exercise Goal"}
              </span>
            </div>
            <p className="text-sm sm:text-base italic mb-4 sm:mb-6 text-gray-600">
              {calorieAdjustmentSuggestion?.motivationalTip || "Your journey is unique"}
            </p>
            
            <div className="mb-4 sm:mb-6">
              <p className="text-sm sm:text-base font-medium mb-3 text-gray-700">
                Today's Exercise Burn Goal:
              </p>
              {targetActivityCaloriesToday !== null && targetActivityCaloriesToday > 0 ? (
                <>                  <div className="w-full rounded-full h-3 sm:h-4 mb-2 sm:mb-3 shadow-lg bg-amber-200/50">
                    <div 
                      className="bg-gradient-to-r from-amber-400 to-orange-500 h-3 sm:h-4 rounded-full transition-all duration-500 shadow-lg" 
                      style={{ width: `${Math.min(burnGoalProgress, 100)}%` }}
                    />
                  </div>
                  <p className="text-sm sm:text-base text-gray-600">
                    {actualBurnForDisplay.toFixed(0)} / {targetActivityCaloriesToday.toFixed(0)} kcal
                  </p>
                  {burnGoalReached && (
                    <p className="text-xs text-green-600 flex items-center justify-center gap-1 animate-pulse mt-2">
                      <CheckCircle size={14}/> Burn Goal Reached!
                    </p>
                  )}
                </>
              ) : (
                <p className="text-sm text-gray-500 italic">Set an activity burn goal in your profile.</p>
              )}
            </div>
            
            <Link href="/log">
              <Button className="rounded-full shadow-lg transition-all duration-200 px-6 sm:px-8 py-2 sm:py-3 text-sm sm:text-base hover:scale-105 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white">
                <Zap className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Log Food / Activity
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

function SkeletonLoader() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 animate-pulse">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="space-y-3 p-4 sm:p-6 rounded-2xl bg-gray-200/50 border border-gray-200/30">
          <Skeleton className="h-5 w-1/3 rounded bg-gray-300/60" />
          <Skeleton className="h-4 w-full rounded bg-gray-300/60" />
          <Skeleton className="h-3 w-1/2 rounded bg-gray-300/60" />
        </div>
      ))}
    </div>
  );
}

export default GoalsCard;
