// src/components/dashboard/ProgressTracker.tsx
"use client";

import React from 'react';
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Percent } from 'lucide-react';
import { cn } from "@/lib/utils";

interface ProgressTrackerProps {
    label: string;
    value: number;
    target: number | undefined;
    unit: string;
    icon?: React.ReactNode;
    color?: 'orange' | 'red' | 'yellow' | 'green' | 'blue' | 'purple';
    isAverage?: boolean;
}

const ProgressTracker: React.FC<ProgressTrackerProps> = ({
    label,
    value,
    target,
    unit,
    icon,
    color = 'blue', // Default color if not specified
    isAverage = false
}) => {
    const targetValue = target ?? 0;
    // If isAverage is true, the 'value' is daily average, so for weekly target comparison, multiply by 7.
    // Otherwise, use value as is (assumed to be total for the period matching the target).
    const valueForPercent = isAverage && targetValue > 0 && (label.toLowerCase().includes("weekly")) 
        ? value * 7 
        : value; 
    
    const progressPercent = (targetValue > 0) ? Math.max(0, Math.min(100, Math.round((valueForPercent / targetValue) * 100))) : 0;
    const displayTarget = targetValue > 0 ? ` / ${targetValue.toFixed(0)}${unit}` : ` ${unit}`;
    const isOverTarget = targetValue > 0 && valueForPercent > targetValue;

    const colorVariants = {
        orange: { text: 'text-orange-600 dark:text-orange-400', gradient: 'from-orange-400 to-orange-600', iconBg: 'bg-orange-100 dark:bg-orange-800/30', cardBg: 'bg-gradient-to-br from-orange-100/80 via-orange-50/60 to-orange-200/70 dark:from-orange-900/50 dark:via-orange-800/40 dark:to-orange-700/50 border-orange-300/70 dark:border-orange-700/50', shadow: 'hover:shadow-orange-500/20' },
        red: { text: 'text-red-600 dark:text-red-400', gradient: 'from-red-400 to-red-600', iconBg: 'bg-red-100 dark:bg-red-800/30', cardBg: 'bg-gradient-to-br from-red-100/80 via-red-50/60 to-red-200/70 dark:from-red-900/50 dark:via-red-800/40 dark:to-red-700/50 border-red-300/70 dark:border-red-700/50', shadow: 'hover:shadow-red-500/20' },
        yellow: { text: 'text-yellow-600 dark:text-yellow-400', gradient: 'from-yellow-400 to-yellow-600', iconBg: 'bg-yellow-100 dark:bg-yellow-800/30', cardBg: 'bg-gradient-to-br from-yellow-100/80 via-yellow-50/60 to-yellow-200/70 dark:from-yellow-900/50 dark:via-yellow-800/40 dark:to-yellow-700/50 border-yellow-300/70 dark:border-yellow-700/50', shadow: 'hover:shadow-yellow-500/20' },
        green: { text: 'text-green-600 dark:text-green-400', gradient: 'from-green-400 to-green-600', iconBg: 'bg-green-100 dark:bg-green-800/30', cardBg: 'bg-gradient-to-br from-green-100/80 via-green-50/60 to-green-200/70 dark:from-green-900/50 dark:via-green-800/40 dark:to-green-700/50 border-green-300/70 dark:border-green-700/50', shadow: 'hover:shadow-green-500/20' },
        blue: { text: 'text-blue-600 dark:text-blue-400', gradient: 'from-blue-400 to-blue-600', iconBg: 'bg-blue-100 dark:bg-blue-800/30', cardBg: 'bg-gradient-to-br from-blue-100/80 via-blue-50/60 to-blue-200/70 dark:from-blue-900/50 dark:via-blue-800/40 dark:to-blue-700/50 border-blue-300/70 dark:border-blue-700/50', shadow: 'hover:shadow-blue-500/20' },
        purple: { text: 'text-purple-600 dark:text-purple-400', gradient: 'from-purple-400 to-purple-600', iconBg: 'bg-purple-100 dark:bg-purple-800/30', cardBg: 'bg-gradient-to-br from-purple-100/80 via-purple-50/60 to-purple-200/70 dark:from-purple-900/50 dark:via-purple-800/40 dark:to-purple-700/50 border-purple-300/70 dark:border-purple-700/50', shadow: 'hover:shadow-purple-500/20' },
    };

    const currentColors = colorVariants[color] || colorVariants.blue; // Fallback to blue if color prop is undefined

    const progressIndicatorClasses = () => {
        if (targetValue <= 0) return 'bg-muted'; 
        const gradientClass = `bg-gradient-to-r ${currentColors.gradient}`;
        // If value exceeds target, change color to indicate over-target (e.g., yellow/orange for caution)
        if (isOverTarget) return `bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500`; 
        return gradientClass;
    };

    const displayValueText = value.toFixed(unit === 'g' || isAverage ? 1 : 0);

    return (
        <div className={cn(
            "group space-y-1.5 relative p-2.5 sm:p-3.5 rounded-xl border shadow-lg transition-all duration-300 ease-out hover:shadow-2xl hover:border-primary/60 hover:scale-[1.02] sm:hover:scale-[1.04] transform-gpu",
            "animate-in fade-in slide-in-from-bottom-4 duration-700", 
            currentColors.cardBg,
            currentColors.shadow 
        )}>
             <div className="flex justify-between items-start sm:items-center text-sm mb-1.5">
                <span className="font-bold text-xs sm:text-sm text-foreground/90 group-hover:text-foreground transition-colors duration-200 flex items-center gap-1.5 sm:gap-2 tracking-tight leading-tight">
                    {icon && (
                       <span className={cn(
                           "p-1 sm:p-1.5 rounded-full transition-all duration-300 group-hover:scale-125 group-hover:rotate-[-8deg] shadow-sm flex-shrink-0", 
                           currentColors.iconBg, 
                           "animate-subtle-pulse" // Animation for icon background
                        )}>
                          {React.cloneElement(icon as React.ReactElement, { className: cn("h-3 w-3 sm:h-4 sm:w-4", currentColors.text) })}
                       </span>
                    )}
                    <span className="break-words">{label}</span>
                </span>
                 <div className="flex items-center gap-1 sm:gap-2 text-xs font-mono flex-shrink-0">
                     <span className={cn(
                       "font-medium transition-colors duration-300 group-hover:text-primary text-right",
                       isOverTarget ? 'text-yellow-600 dark:text-yellow-400 font-bold' : 'text-muted-foreground'
                    )}>
                       {displayValueText}{displayTarget}
                    </span>
                     <span className={cn(
                       "opacity-0 transition-opacity duration-300 group-hover:opacity-100 flex items-center gap-1",
                        isOverTarget ? 'text-yellow-500 dark:text-yellow-300' : 'text-primary',
                        'font-semibold'
                     )}>
                         <Percent className="h-3 w-3" /> {progressPercent.toFixed(0)}%
                     </span>
                </div>
             </div>
             <Progress
                value={progressPercent}
                indicatorClassName={cn(
                    progressIndicatorClasses(), 
                    "transition-all duration-1000 ease-out-quad shadow-md" // Ensure animation class matches definition
                )}
                className="h-2 sm:h-3 rounded-full" // Make progress bar responsive
             />
        </div>
    );
};

export default ProgressTracker;
