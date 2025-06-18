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
    <Card className={cn("bg-white/40 backdrop-blur-sm border-0 shadow-clayInset rounded-2xl transition-all duration-300 hover:shadow-clay", className)}>
        <CardHeader className="pb-3 pt-4 px-4 sm:px-5">
            <CardTitle className="text-base sm:text-lg font-semibold flex items-center gap-3 text-gray-800">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center shadow-clayInset">
                    <Icon className="h-5 w-5 text-white" />
                </div>
                {title}
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
        <div className="space-y-6 animate-fade-in">
            {/* Daily Report Header */}
            <Card className="mb-6 bg-white/40 backdrop-blur-sm border-0 shadow-clayInset rounded-2xl">
                <CardHeader>
                    <CardTitle className="text-blue-600 text-xl sm:text-2xl">{report.reportTitle}</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-gray-700 leading-relaxed">{report.overallSummary}</p>
                </CardContent>
            </Card>

            {/* Macronutrient Analysis */}
            <SectionCard title="Macronutrient Analysis" icon={TrendingUp} className="bg-white/40">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                    <MacronutrientChart data={calorieData} title="Avg. Daily Calories" targetKey="target" valueKey="consumed" unit="kcal" />
                    <MacronutrientChart data={macroData} title="Avg. Daily Macros" targetKey="target" valueKey="consumed" unit="g" showLabels/>
                </div>
                <p className="text-sm text-gray-600 mt-4">{report.macronutrientConsumption.feedback}</p>
            </SectionCard>

            {/* Food Choices */}
            <SectionCard title="Food Choices" icon={Target} className="bg-white/40">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-green-50/80 backdrop-blur-sm rounded-2xl p-4 shadow-clayInset">
                        <div className="flex items-center mb-3">
                            <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                            <h3 className="font-semibold text-green-600">Healthy Choices</h3>
                        </div>
                        {report.foodVarietyAndHealthiness.healthiestFoods.length > 0 ? (
                            <ul className="space-y-1">
                                {report.foodVarietyAndHealthiness.healthiestFoods.map((food, i) => (
                                    <li key={`h-${i}`} className="text-gray-700 flex items-center">
                                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                                        {food}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-gray-600 text-sm italic">No specific healthy items identified.</p>
                        )}
                    </div>
                    <div className="bg-red-50/80 backdrop-blur-sm rounded-2xl p-4 shadow-clayInset">
                        <div className="flex items-center mb-3">
                            <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
                            <h3 className="font-semibold text-red-600">Areas to Watch</h3>
                        </div>
                        {report.foodVarietyAndHealthiness.lessHealthyFoods.length > 0 ? (
                            <ul className="space-y-1">
                                {report.foodVarietyAndHealthiness.lessHealthyFoods.map((food, i) => (
                                    <li key={`lh-${i}`} className="text-gray-700 flex items-center">
                                        <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                                        {food}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-gray-600 text-sm italic">No specific less healthy items identified.</p>
                        )}
                    </div>
                </div>
                <p className="text-sm text-gray-600 mt-4">{report.foodVarietyAndHealthiness.feedback}</p>
            </SectionCard>

            {/* Progress Highlights */}
            <SectionCard title="Progress Highlights" icon={CheckCircle} className="bg-white/40">
                <div className="bg-blue-50 p-4 rounded-lg mb-4">
                    <div className="flex items-center mb-2">
                        {renderTrendIcon()}
                        <span className="font-medium text-blue-800 ml-2 capitalize">{report.progressHighlights.trend} Trend</span>
                    </div>
                    <ul className="space-y-2">
                        {report.progressHighlights.points.map((point, i) => (
                            <li key={`p-${i}`} className="text-blue-700 flex items-start">
                                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mr-2 mt-2"></span>
                                {point}
                            </li>
                        ))}
                    </ul>
                </div>
            </SectionCard>

            {/* Feedback and Improvement Areas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <Card className="bg-white/40 backdrop-blur-sm border-0 shadow-clayInset rounded-2xl">
                    <CardHeader>
                        <CardTitle className="flex items-center text-gray-800 text-lg">
                            <span className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center mr-2">
                                <span className="text-purple-600 font-bold text-sm">B</span>
                            </span>
                            Bago's Feedback
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-3">
                            {report.personalizedFeedback.map((feedback, i) => (
                                <li key={`f-${i}`} className="text-gray-700 flex items-start">
                                    <span className="w-1.5 h-1.5 bg-purple-600 rounded-full mr-2 mt-2"></span>
                                    {feedback}
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>

                <Card className="bg-white/40 backdrop-blur-sm border-0 shadow-clayInset rounded-2xl">
                    <CardHeader>
                        <CardTitle className="flex items-center text-gray-800 text-lg">
                            <TrendingUp className="w-5 h-5 mr-2 text-orange-600" />
                            Key Improvement Areas
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-3">
                            {report.keyImprovementAreas.map((area, i) => (
                                <li key={`imp-${i}`} className="text-gray-700 flex items-start">
                                    <span className="w-1.5 h-1.5 bg-orange-600 rounded-full mr-2 mt-2"></span>
                                    {area}
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            </div>

            {/* Goal Outlook */}
            <Card className="bg-white/40 backdrop-blur-sm border-0 shadow-clayInset rounded-2xl">
                <CardHeader>
                    <CardTitle className="flex items-center text-gray-800">
                        <Target className="w-5 h-5 mr-2 text-green-600" />
                        Goal Outlook
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-gray-600 italic">{report.goalTimelineEstimate}</p>
                </CardContent>
            </Card>
        </div>
    );
};

export default ReportDisplay;
