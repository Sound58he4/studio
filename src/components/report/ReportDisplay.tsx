// src/components/report/ReportDisplay.tsx
"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ThumbsDown, ThumbsUp, Utensils, CheckCircle, AlertTriangle, BrainCircuit, TrendingUp, TrendingDown, Target, Clock, MessageSquare, ListChecks } from "lucide-react";
import { cn } from "@/lib/utils";
import MacronutrientChart from './MacronutrientChart'; // Corrected import path
import type { ProgressReportOutput } from '@/app/report/page'; // Import type

interface ReportDisplayProps {
    report: ProgressReportOutput;
}

const SectionCard: React.FC<{ title: string; icon: React.ElementType; children: React.ReactNode; className?: string }> = ({ title, icon: Icon, children, className }) => (
    <Card className={cn("shadow-md border border-border/30 bg-card/70 overflow-hidden transition-shadow hover:shadow-lg", className)}>
        <CardHeader className="pb-3 pt-4 px-4 sm:px-5 bg-muted/30 border-b">
            <CardTitle className="text-base sm:text-lg font-semibold flex items-center gap-2 text-foreground/90">
                <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" /> {title}
            </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-5 text-sm">
            {children}
        </CardContent>
    </Card>
);

const ReportDisplay: React.FC<ReportDisplayProps> = ({ report }) => {

    const macroData = [
        { name: 'Protein', consumed: report.macronutrientConsumption.proteinAvg ?? 0, target: report.macronutrientConsumption.proteinTarget, fill: "hsl(var(--chart-1))" },
        { name: 'Carbs', consumed: report.macronutrientConsumption.carbsAvg ?? 0, target: report.macronutrientConsumption.carbsTarget, fill: "hsl(var(--chart-2))" },
        { name: 'Fat', consumed: report.macronutrientConsumption.fatAvg ?? 0, target: report.macronutrientConsumption.fatTarget, fill: "hsl(var(--chart-3))" },
    ];

    const calorieData = [
        { name: 'Calories', consumed: report.macronutrientConsumption.calorieAvg ?? 0, target: report.macronutrientConsumption.calorieTarget, fill: "hsl(var(--chart-5))" }
    ]

    const renderTrendIcon = () => {
        switch (report.progressHighlights.trend) {
            case 'positive': return <TrendingUp className="h-6 w-6 text-green-500" />;
            case 'negative': return <TrendingDown className="h-6 w-6 text-red-500" />;
            case 'neutral': default: return <Target className="h-6 w-6 text-muted-foreground" />;
        }
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* 1. Overall Summary */}
            <Card className="shadow-lg border-primary/20 bg-gradient-to-br from-primary/5 to-card">
                <CardHeader>
                    <CardTitle className="text-xl sm:text-2xl text-primary">{report.reportTitle}</CardTitle>
                    <CardDescription className="text-sm sm:text-base">{report.overallSummary}</CardDescription>
                </CardHeader>
            </Card>

            {/* 2. Macronutrient Consumption */}
            <SectionCard title="Macronutrient Analysis" icon={Utensils}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                    <MacronutrientChart data={calorieData} title="Avg. Daily Calories" targetKey="target" valueKey="consumed" unit="kcal" />
                    <MacronutrientChart data={macroData} title="Avg. Daily Macros" targetKey="target" valueKey="consumed" unit="g" showLabels/>
                </div>
                 <Separator className="my-4" />
                 <p className="text-xs italic text-muted-foreground mt-3">{report.macronutrientConsumption.feedback}</p>
            </SectionCard>

            {/* 3. Food Variety & Healthiness */}
            <SectionCard title="Food Choices" icon={Utensils}>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <div>
                         <h4 className="font-medium text-green-600 dark:text-green-400 mb-2 flex items-center gap-1"><ThumbsUp size={16}/> Healthy Choices</h4>
                         {report.foodVarietyAndHealthiness.healthiestFoods.length > 0 ? (
                             <ul className="list-disc list-inside space-y-1 text-foreground/90">
                                 {report.foodVarietyAndHealthiness.healthiestFoods.map((food, i) => <li key={`h-${i}`}>{food}</li>)}
                             </ul>
                         ) : <p className="text-muted-foreground text-xs italic">No specific healthy items identified.</p>}
                     </div>
                     <div>
                         <h4 className="font-medium text-red-600 dark:text-red-400 mb-2 flex items-center gap-1"><ThumbsDown size={16}/> Areas to Watch</h4>
                          {report.foodVarietyAndHealthiness.lessHealthyFoods.length > 0 ? (
                             <ul className="list-disc list-inside space-y-1 text-foreground/90">
                                 {report.foodVarietyAndHealthiness.lessHealthyFoods.map((food, i) => <li key={`lh-${i}`}>{food}</li>)}
                             </ul>
                         ) : <p className="text-muted-foreground text-xs italic">No specific less healthy items identified.</p>}
                     </div>
                 </div>
                 <Separator className="my-4" />
                 <p className="text-xs italic text-muted-foreground mt-3">{report.foodVarietyAndHealthiness.feedback}</p>
            </SectionCard>

            {/* 4. Progress Highlights */}
            <SectionCard title="Progress Highlights" icon={CheckCircle}>
                 <div className="flex items-center gap-3 mb-3">
                     {renderTrendIcon()}
                     <p className="font-medium capitalize">{report.progressHighlights.trend} Trend</p>
                 </div>
                 <ul className="list-disc list-inside space-y-1 pl-1 text-foreground/90">
                    {report.progressHighlights.points.map((point, i) => <li key={`p-${i}`}>{point}</li>)}
                </ul>
            </SectionCard>

            {/* 5. Personalized Feedback & Improvements */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <SectionCard title="Bago's Feedback" icon={BrainCircuit}>
                     <ul className="list-disc list-inside space-y-1 text-foreground/90">
                         {report.personalizedFeedback.map((feedback, i) => <li key={`f-${i}`}>{feedback}</li>)}
                     </ul>
                 </SectionCard>
                 <SectionCard title="Key Improvement Areas" icon={ListChecks}>
                     <ul className="list-disc list-inside space-y-1 text-foreground/90">
                         {report.keyImprovementAreas.map((area, i) => <li key={`imp-${i}`}>{area}</li>)}
                     </ul>
                 </SectionCard>
            </div>

             {/* 6. Goal Timeline Estimate */}
             <SectionCard title="Goal Outlook" icon={Clock} className="bg-gradient-to-r from-accent/5 to-card">
                 <p className="italic text-muted-foreground">{report.goalTimelineEstimate}</p>
             </SectionCard>

        </div>
    );
};

export default ReportDisplay;
