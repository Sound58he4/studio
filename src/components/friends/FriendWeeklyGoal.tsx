// src/components/friends/FriendWeeklyGoal.tsx
import React, { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Flame, Beef, Zap, Wheat, Target, TrendingUp } from 'lucide-react';
import type { FriendWeeklyGoal } from '@/services/firestore/friendNutritionService';
import { cn } from '@/lib/utils';

interface FriendWeeklyGoalProps {
  weeklyGoal: FriendWeeklyGoal;
  isDark?: boolean;
  compact?: boolean;
}

const FriendWeeklyGoal: React.FC<FriendWeeklyGoalProps> = ({ 
  weeklyGoal, 
  isDark = false, 
  compact = false 
}) => {
  const progressBarsRef = useRef<{ [key: string]: HTMLDivElement | null }>({});

  useEffect(() => {
    // Set progress bar widths using refs to avoid inline styles
    Object.entries(progressBarsRef.current).forEach(([key, element]) => {
      if (element) {
        const progress = parseFloat(element.getAttribute('data-progress') || '0');
        element.style.width = `${progress}%`;
      }
    });
  }, [weeklyGoal]);
  const nutritionData = [
    {
      name: 'Calories',
      current: weeklyGoal.weeklyActuals.calories,
      target: weeklyGoal.weeklyTargets.calories,
      progress: weeklyGoal.progress.calories,
      unit: '',
      icon: Flame,
      color: 'blue',
      shortName: 'Cal'
    },
    {
      name: 'Protein',
      current: weeklyGoal.weeklyActuals.protein,
      target: weeklyGoal.weeklyTargets.protein,
      progress: weeklyGoal.progress.protein,
      unit: 'g',
      icon: Beef,
      color: 'orange',
      shortName: 'Pro'
    },
    {
      name: 'Carbs',
      current: weeklyGoal.weeklyActuals.carbohydrates,
      target: weeklyGoal.weeklyTargets.carbohydrates,
      progress: weeklyGoal.progress.carbohydrates,
      unit: 'g',
      icon: Zap,
      color: 'green',
      shortName: 'Carbs'
    },
    {
      name: 'Fat',
      current: weeklyGoal.weeklyActuals.fat,
      target: weeklyGoal.weeklyTargets.fat,
      progress: weeklyGoal.progress.fat,
      unit: 'g',
      icon: Wheat,
      color: 'purple',
      shortName: 'Fat'
    }
  ];

  const getColorClasses = (color: string) => {
    const colorMap = {
      blue: isDark ? 'text-blue-400' : 'text-blue-500',
      orange: isDark ? 'text-orange-400' : 'text-orange-500',
      green: isDark ? 'text-emerald-400' : 'text-emerald-500',
      purple: isDark ? 'text-purple-400' : 'text-purple-500',
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  const getProgressBarColor = (color: string) => {
    const colorMap = {
      blue: 'bg-gradient-to-r from-blue-400 to-blue-500',
      orange: 'bg-gradient-to-r from-orange-400 to-orange-500',
      green: 'bg-gradient-to-r from-emerald-400 to-emerald-500',
      purple: 'bg-gradient-to-r from-purple-400 to-purple-500',
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  const getBadgeColor = (progress: number) => {
    if (progress >= 90) return isDark ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (progress >= 70) return isDark ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'bg-blue-100 text-blue-700 border-blue-200';
    if (progress >= 50) return isDark ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' : 'bg-yellow-100 text-yellow-700 border-yellow-200';
    return isDark ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-red-100 text-red-700 border-red-200';
  };

  const averageProgress = Math.round(
    (weeklyGoal.progress.calories + weeklyGoal.progress.protein + weeklyGoal.progress.carbohydrates + weeklyGoal.progress.fat) / 4
  );

  if (compact) {
    return (
      <Card className={cn(
        "transition-all duration-300 hover:shadow-md border-0 rounded-2xl backdrop-blur-sm",
        isDark ? 'bg-[#2a2a2a] border-[#3a3a3a]' : 'bg-white/90 border-gray-200/50'
      )}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Target className={cn("w-4 h-4", isDark ? 'text-purple-400' : 'text-purple-600')} />
              <span className={cn("text-sm font-medium", isDark ? 'text-white' : 'text-gray-900')}>
                Weekly Goal
              </span>
            </div>
            <Badge className={cn("text-xs px-2 py-1 rounded-full", getBadgeColor(averageProgress))}>
              {averageProgress}%
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            {nutritionData.map((item, index) => {
              const IconComponent = item.icon;
              const safeProgress = Math.max(0, Math.min(item.progress, 100));
              
              return (
                <div key={index} className={cn(
                  "p-2 rounded-xl transition-all duration-300",
                  isDark ? 'bg-[#2a2a2a]' : 'bg-gray-50/70'
                )}>
                  <div className="flex items-center space-x-1 mb-1">
                    <IconComponent className={cn("w-3 h-3", getColorClasses(item.color))} />
                    <span className={cn("text-xs font-medium", isDark ? 'text-gray-300' : 'text-gray-700')}>
                      {item.shortName}
                    </span>
                  </div>
                  
                  <div className="space-y-1">
                    <div className={cn("text-xs", isDark ? 'text-gray-400' : 'text-gray-600')}>
                      {item.current.toFixed(item.unit === 'g' ? 0 : 0)}/{item.target.toFixed(item.unit === 'g' ? 0 : 0)}{item.unit}
                    </div>
                    
                    <div className={cn("w-full rounded-full h-1.5", isDark ? 'bg-gray-600/50' : 'bg-gray-200/70')}>
                      <div 
                        ref={(el) => { progressBarsRef.current[`compact-${index}`] = el; }}
                        className={cn("h-1.5 rounded-full transition-all duration-500", getProgressBarColor(item.color))}
                        data-progress={safeProgress}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      "transition-all duration-300 hover:shadow-lg border-0 rounded-3xl backdrop-blur-sm",
      isDark ? 'bg-[#2a2a2a] border-[#3a3a3a]' : 'bg-white/90 border-gray-200/50'
    )}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={cn(
              "w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg",
              isDark ? 'bg-purple-600' : 'bg-gradient-to-br from-purple-500 to-purple-600'
            )}>
              <Target className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className={cn("text-lg font-semibold", isDark ? 'text-white' : 'text-gray-900')}>
                Weekly Nutrition Goal
              </CardTitle>
              <p className={cn("text-sm", isDark ? 'text-gray-400' : 'text-gray-600')}>
                Progress towards weekly targets
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <TrendingUp className={cn("w-4 h-4", getColorClasses('green'))} />
            <Badge className={cn("text-sm px-3 py-1 rounded-full", getBadgeColor(averageProgress))}>
              {averageProgress}% Overall
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {nutritionData.map((item, index) => {
            const IconComponent = item.icon;
            const safeProgress = Math.max(0, Math.min(item.progress, 100));
            
            return (
              <div key={index} className={cn(
                "p-4 rounded-2xl transition-all duration-300 shadow-sm border",
                isDark ? 'bg-[#2a2a2a] border-[#3a3a3a]' : 'bg-white/70 border-gray-200/50'
              )}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <IconComponent className={cn("w-4 h-4", getColorClasses(item.color))} />
                    <span className={cn("text-sm font-medium", isDark ? 'text-white' : 'text-gray-900')}>
                      {item.name}
                    </span>
                  </div>
                  <div className={cn("text-lg font-bold", getColorClasses(item.color))}>
                    {safeProgress}%
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className={cn("text-sm", isDark ? 'text-gray-400' : 'text-gray-600')}>
                    {item.current.toFixed(item.unit === 'g' ? 1 : 0)} / {item.target.toFixed(item.unit === 'g' ? 1 : 0)}{item.unit}
                  </div>
                  
                  <div className={cn("w-full rounded-full h-2.5", isDark ? 'bg-gray-600/50' : 'bg-gray-200/50')}>
                    <div 
                      ref={(el) => { progressBarsRef.current[`full-${index}`] = el; }}
                      className={cn("h-2.5 rounded-full transition-all duration-500 shadow-sm", getProgressBarColor(item.color))}
                      data-progress={safeProgress}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default FriendWeeklyGoal;
