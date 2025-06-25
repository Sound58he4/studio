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
    isDark?: boolean;
}

const SectionCard: React.FC<{ title: string; icon: React.ElementType; children: React.ReactNode; className?: string; isDark?: boolean }> = ({ title, icon: Icon, children, className, isDark = false }) => (
    <Card className={cn("backdrop-blur-sm border-0 rounded-2xl transition-all duration-300 hover:shadow-clay", 
        isDark ? "bg-gray-700/40 shadow-lg border border-gray-600" : "bg-white/40 shadow-clayInset", 
        className)}>
        <CardHeader className="pb-3 pt-4 px-4 sm:px-5">
            <CardTitle className={`text-base sm:text-lg font-semibold flex items-center gap-3 ${
                isDark ? 'text-gray-200' : 'text-gray-800'
            }`}>
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-clayInset ${
                    isDark 
                        ? 'bg-gradient-to-br from-purple-500 to-purple-700' 
                        : 'bg-gradient-to-br from-blue-400 to-blue-600'
                }`}>
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

const ReportDisplay: React.FC<ReportDisplayProps> = ({ report, isDark = false }) => {

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
            <Card className={`mb-6 backdrop-blur-sm border-0 rounded-2xl transition-all duration-300 ${
                isDark 
                    ? 'bg-gray-700/40 shadow-lg border border-gray-600' 
                    : 'bg-white/40 shadow-clayInset'
            }`}>
                <CardHeader>
                    <CardTitle className={`text-xl sm:text-2xl ${
                        isDark ? 'text-purple-300' : 'text-blue-600'
                    }`}>{report.reportTitle}</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className={`leading-relaxed ${
                        isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}>{report.overallSummary}</p>
                </CardContent>
            </Card>

            {/* Macronutrient Analysis */}
            <SectionCard title="Macronutrient Analysis" icon={TrendingUp} isDark={isDark}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                    <MacronutrientChart data={calorieData} title="Avg. Daily Calories" targetKey="target" valueKey="consumed" unit="kcal" isDark={isDark} />
                    <MacronutrientChart data={macroData} title="Avg. Daily Macros" targetKey="target" valueKey="consumed" unit="g" showLabels isDark={isDark}/>
                </div>
                <p className={`text-sm mt-4 ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>{report.macronutrientConsumption.feedback}</p>
            </SectionCard>

            {/* Food Choices */}
            <SectionCard title="Food Choices" icon={Target} isDark={isDark}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className={`backdrop-blur-sm rounded-2xl p-4 shadow-clayInset transition-all duration-300 ${
                        isDark 
                            ? 'bg-green-900/20 border border-green-700/30' 
                            : 'bg-green-50/80'
                    }`}>
                        <div className="flex items-center mb-3">
                            <CheckCircle className={`w-5 h-5 mr-2 ${
                                isDark ? 'text-green-400' : 'text-green-600'
                            }`} />
                            <h3 className={`font-semibold ${
                                isDark ? 'text-green-400' : 'text-green-600'
                            }`}>Healthy Choices</h3>
                        </div>
                        {report.foodVarietyAndHealthiness.healthiestFoods.length > 0 ? (
                            <ul className="space-y-1">
                                {report.foodVarietyAndHealthiness.healthiestFoods.map((food: any, i: any) => (
                                    <li key={`h-${i}`} className={`flex items-center ${
                                        isDark ? 'text-gray-300' : 'text-gray-700'
                                    }`}>
                                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                                        {food}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className={`text-sm italic ${
                                isDark ? 'text-gray-400' : 'text-gray-600'
                            }`}>No specific healthy items identified.</p>
                        )}
                    </div>
                    <div className={`backdrop-blur-sm rounded-2xl p-4 shadow-clayInset transition-all duration-300 ${
                        isDark 
                            ? 'bg-red-900/20 border border-red-700/30' 
                            : 'bg-red-50/80'
                    }`}>
                        <div className="flex items-center mb-3">
                            <AlertTriangle className={`w-5 h-5 mr-2 ${
                                isDark ? 'text-red-400' : 'text-red-600'
                            }`} />
                            <h3 className={`font-semibold ${
                                isDark ? 'text-red-400' : 'text-red-600'
                            }`}>Areas to Watch</h3>
                        </div>
                        {report.foodVarietyAndHealthiness.lessHealthyFoods.length > 0 ? (
                            <ul className="space-y-1">
                                {report.foodVarietyAndHealthiness.lessHealthyFoods.map((food: any, i: any) => (
                                    <li key={`lh-${i}`} className={`flex items-center ${
                                        isDark ? 'text-gray-300' : 'text-gray-700'
                                    }`}>
                                        <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                                        {food}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className={`text-sm italic ${
                                isDark ? 'text-gray-400' : 'text-gray-600'
                            }`}>No specific less healthy items identified.</p>
                        )}
                    </div>
                </div>
                <p className={`text-sm mt-4 ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>{report.foodVarietyAndHealthiness.feedback}</p>
            </SectionCard>

            {/* Progress Highlights */}
            <SectionCard title="Progress Highlights" icon={CheckCircle} isDark={isDark}>
                <div className={`p-4 rounded-lg mb-4 transition-all duration-300 ${
                    isDark ? 'bg-blue-900/30' : 'bg-blue-50'
                }`}>
                    <div className="flex items-center mb-2">
                        {renderTrendIcon()}
                        <span className={`font-medium ml-2 capitalize ${
                            isDark ? 'text-blue-300' : 'text-blue-800'
                        }`}>{report.progressHighlights.trend} Trend</span>
                    </div>
                    <ul className="space-y-2">
                        {report.progressHighlights.points.map((point: any, i: any) => (
                            <li key={`p-${i}`} className={`flex items-start ${
                                isDark ? 'text-blue-200' : 'text-blue-700'
                            }`}>
                                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mr-2 mt-2"></span>
                                {point}
                            </li>
                        ))}
                    </ul>
                </div>
            </SectionCard>

            {/* Feedback and Improvement Areas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <Card className={`backdrop-blur-sm border-0 rounded-2xl transition-all duration-300 ${
                    isDark 
                        ? 'bg-gray-700/40 shadow-lg border border-gray-600' 
                        : 'bg-white/40 shadow-clayInset'
                }`}>
                    <CardHeader>
                        <CardTitle className={`flex items-center text-lg ${
                            isDark ? 'text-gray-200' : 'text-gray-800'
                        }`}>
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 ${
                                isDark ? 'bg-purple-800/60' : 'bg-purple-100'
                            }`}>
                                <span className={`font-bold text-sm ${
                                    isDark ? 'text-purple-300' : 'text-purple-600'
                                }`}>B</span>
                            </span>
                            Bago's Feedback
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-3">
                            {report.personalizedFeedback.map((feedback: any, i: any) => (
                                <li key={`f-${i}`} className={`flex items-start ${
                                    isDark ? 'text-gray-300' : 'text-gray-700'
                                }`}>
                                    <span className="w-1.5 h-1.5 bg-purple-600 rounded-full mr-2 mt-2"></span>
                                    {feedback}
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>

                <Card className={`backdrop-blur-sm border-0 rounded-2xl transition-all duration-300 ${
                    isDark 
                        ? 'bg-gray-700/40 shadow-lg border border-gray-600' 
                        : 'bg-white/40 shadow-clayInset'
                }`}>
                    <CardHeader>
                        <CardTitle className={`flex items-center text-lg ${
                            isDark ? 'text-gray-200' : 'text-gray-800'
                        }`}>
                            <TrendingUp className={`w-5 h-5 mr-2 ${
                                isDark ? 'text-orange-400' : 'text-orange-600'
                            }`} />
                            Key Improvement Areas
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-3">
                            {report.keyImprovementAreas.map((area: any, i: any) => (
                                <li key={`imp-${i}`} className={`flex items-start ${
                                    isDark ? 'text-gray-300' : 'text-gray-700'
                                }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full mr-2 mt-2 ${
                                        isDark ? 'bg-orange-400' : 'bg-orange-600'
                                    }`}></span>
                                    {area}
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            </div>

            {/* Goal Outlook */}
            <Card className={`backdrop-blur-sm border-0 rounded-2xl transition-all duration-300 ${
                isDark 
                    ? 'bg-gray-700/40 shadow-lg border border-gray-600' 
                    : 'bg-white/40 shadow-clayInset'
            }`}>
                <CardHeader>
                    <CardTitle className={`flex items-center ${
                        isDark ? 'text-gray-200' : 'text-gray-800'
                    }`}>
                        <Target className={`w-5 h-5 mr-2 ${
                            isDark ? 'text-green-400' : 'text-green-600'
                        }`} />
                        Goal Outlook
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className={`italic ${
                        isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>{report.goalTimelineEstimate}</p>
                </CardContent>
            </Card>
        </div>
    );
};

export default ReportDisplay;
