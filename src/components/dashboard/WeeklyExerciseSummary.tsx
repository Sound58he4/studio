
"use client";

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Dumbbell, Zap, HeartPulse, Sun, History as HistoryIcon, Activity } from 'lucide-react'; // Added Activity
import { cn } from "@/lib/utils"; // Import cn


// Import type from parent's definition
import type { WeeklyExerciseSummaryData } from '@/app/dashboard/types';


interface SummaryItemProps {
    label: string;
    value: string | number;
    icon?: React.ReactNode; // Optional icon
}

function SummaryItem({ label, value, icon }: SummaryItemProps) {
    return (
         // Enhanced item styling
        <div className={cn(
           "flex justify-between items-center py-1 sm:py-1.5 px-1 -mx-1 border-b border-dashed last:border-b-0", // Adjusted padding
           "hover:bg-muted/50 rounded transition-colors"
         )}>
             <span className="text-muted-foreground flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm"> {/* Adjusted text size and gap */}
                 {icon && React.cloneElement(icon as React.ReactElement, { size: 12, className: "text-primary/80" })} {/* Adjusted icon size */}
                 {label}:
             </span>
            <span className="font-semibold text-foreground/90 text-xs sm:text-sm">{value}</span> {/* Adjusted text size */}
        </div>
    );
}


interface WeeklyExerciseSummaryProps {
    summary: WeeklyExerciseSummaryData;
    isLoading: boolean; // Use the prop name from the parent
}

const WeeklyExerciseSummary: React.FC<WeeklyExerciseSummaryProps> = ({ summary, isLoading }) => { // Use 'isLoading' prop name

    const renderSkeleton = () => (
        <CardContent className="animate-pulse space-y-3 p-4 sm:p-5"> {/* Added padding */}
             {[...Array(4)].map((_, i) => (
                 <div key={i} className="flex justify-between items-center border-b border-dashed pb-2 last:border-b-0">
                     <Skeleton className="h-4 w-2/3 rounded" />
                     <Skeleton className="h-3 w-12 rounded" />
                 </div>
             ))}
        </CardContent>
    )

    const renderContent = () => (
        <CardContent className="space-y-1 sm:space-y-1.5 p-4 sm:p-5"> {/* Added padding, reduced space */}
            {summary.totalWorkouts === 0 ? (
                <p className="text-sm text-center text-muted-foreground italic py-4">No workouts logged yet this week.</p>
            ) : (
                <>
                   <SummaryItem label="Total Workouts" value={summary.totalWorkouts} icon={<TrendingUp />} />
                   {summary.strengthWorkouts > 0 && <SummaryItem label="Strength" value={summary.strengthWorkouts} icon={<Dumbbell />} />}
                   {summary.cardioWorkouts > 0 && <SummaryItem label="Cardio" value={summary.cardioWorkouts} icon={<HeartPulse />} />}
                   {summary.flexibilityWorkouts > 0 && <SummaryItem label="Flexibility" value={summary.flexibilityWorkouts} icon={<Sun />} />}
                   {summary.otherWorkouts > 0 && <SummaryItem label="Other" value={summary.otherWorkouts} icon={<Zap />} />}
                   {summary.totalCaloriesBurned > 0 && <SummaryItem label="Calories Burned" value={`${summary.totalCaloriesBurned.toFixed(0)} kcal`} icon={<Zap />} />}
                   {summary.mostFrequentType && <SummaryItem label="Most Frequent" value={summary.mostFrequentType} icon={<HistoryIcon />} />}
                </>
            )}
        </CardContent>
    )


    return (
        <Card className="shadow-sm border border-border/30 bg-card/80 backdrop-blur-sm hover:shadow-md transition-shadow animate-in fade-in slide-in-from-bottom-4 duration-500 card-interactive">
            <CardHeader className="p-3 sm:p-4"> {/* Adjust padding */}
                <CardTitle className="text-sm sm:text-base font-semibold flex items-center gap-2">
                    <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-primary"/> This Week's Workouts {/* Changed icon */}
                </CardTitle>
                {/* <CardDescription className="text-xs">Summary since Sunday.</CardDescription> */}
            </CardHeader>

            {isLoading ? renderSkeleton() : renderContent()} {/* Check isLoading prop */}

            <CardFooter className="pt-2 sm:pt-3 pb-3 sm:pb-4 px-3 sm:px-4 flex justify-end">
               <Link href="/history?tab=exercise">
                    {/* Improved link style */}
                   <Button variant="link" size="sm" className="text-xs h-auto p-0 text-primary hover:underline underline-offset-4">View All Workout History</Button>
               </Link>
            </CardFooter>
        </Card>
    );
};

export default WeeklyExerciseSummary;

