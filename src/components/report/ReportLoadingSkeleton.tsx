// src/components/report/ReportLoadingSkeleton.tsx
"use client";

import React from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface ReportLoadingSkeletonProps {
    isDark?: boolean;
}

const ReportLoadingSkeleton: React.FC<ReportLoadingSkeletonProps> = ({ isDark = false }) => {
    return (
        <div className="max-w-4xl mx-auto my-4 md:my-8 px-4 animate-pulse">
            <Card className={`shadow-xl overflow-hidden transition-all duration-300 ${
                isDark 
                    ? 'border border-[#3a3a3a] bg-[#2a2a2a]' 
                    : 'border border-border/20'
            }`}>
                {/* Header Skeleton */}
                <CardHeader className={`p-4 sm:p-5 md:p-6 border-b transition-all duration-300 ${
                    isDark ? 'border-[#3a3a3a]' : ''
                }`}>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div>
                            <Skeleton className={`h-7 w-48 mb-1 ${isDark ? 'bg-[#3a3a3a]' : ''}`} />
                            <Skeleton className={`h-4 w-64 ${isDark ? 'bg-[#3a3a3a]' : ''}`} />
                        </div>
                        <Skeleton className={`h-9 w-32 rounded-md ${isDark ? 'bg-[#3a3a3a]' : ''}`} />
                    </div>
                    <div className={`mt-4 flex flex-col sm:flex-row justify-between items-center gap-3 p-2 rounded-md transition-all duration-300 ${
                        isDark ? 'bg-[#2a2a2a]' : 'bg-muted/50'
                    }`}>
                        <Skeleton className={`h-9 w-9 rounded-full ${isDark ? 'bg-[#3a3a3a]' : ''}`} />
                        <Skeleton className={`h-9 w-full sm:w-[280px] rounded-md ${isDark ? 'bg-[#3a3a3a]' : ''}`} />
                        <Skeleton className={`h-9 w-9 rounded-full ${isDark ? 'bg-[#3a3a3a]' : ''}`} />
                    </div>
                </CardHeader>

                {/* Tabs Skeleton */}
                <div className={`grid grid-cols-3 h-11 sm:h-12 border-b shadow-inner transition-all duration-300 ${
                    isDark ? 'bg-[#2a2a2a] border-[#3a3a3a]' : 'bg-muted/80'
                }`}>
                    <Skeleton className={`h-full m-1 rounded-sm ${isDark ? 'bg-[#3a3a3a]' : ''}`} />
                    <Skeleton className={`h-full m-1 rounded-sm ${
                        isDark ? 'bg-purple-600/20' : 'bg-primary/10'
                    }`} />
                    <Skeleton className={`h-full m-1 rounded-sm ${isDark ? 'bg-[#3a3a3a]' : ''}`} />
                </div>

                {/* Content Skeleton */}
                <CardContent className="p-4 md:p-6 space-y-6">
                    {/* Summary Card Skeleton */}
                    <Card className={`shadow-lg transition-all duration-300 ${
                        isDark 
                            ? 'border-purple-500/20 bg-[#2a2a2a]' 
                            : 'border-primary/20'
                    }`}>
                        <CardHeader>
                            <Skeleton className={`h-6 w-3/4 ${isDark ? 'bg-[#3a3a3a]' : ''}`} />
                            <Skeleton className={`h-4 w-full mt-1 ${isDark ? 'bg-[#3a3a3a]' : ''}`} />
                        </CardHeader>
                    </Card>

                    {/* Section Card Skeletons */}
                    {[...Array(4)].map((_, i) => (
                        <Card key={i} className={`shadow-md transition-all duration-300 ${
                            isDark 
                                ? 'border border-[#3a3a3a] bg-[#2a2a2a]' 
                                : 'border border-border/30'
                        }`}>
                            <CardHeader className={`pb-3 pt-4 px-4 sm:px-5 border-b transition-all duration-300 ${
                                isDark 
                                    ? 'bg-[#3a3a3a] border-[#3a3a3a]' 
                                    : 'bg-muted/30'
                            }`}>
                                <Skeleton className={`h-5 w-1/3 ${isDark ? 'bg-[#3a3a3a]' : ''}`} />
                            </CardHeader>
                            <CardContent className="p-4 sm:p-5 space-y-3">
                                <Skeleton className={`h-4 w-full ${isDark ? 'bg-[#3a3a3a]' : ''}`} />
                                <Skeleton className={`h-4 w-5/6 ${isDark ? 'bg-[#3a3a3a]' : ''}`} />
                                <Skeleton className={`h-4 w-4/6 ${isDark ? 'bg-[#3a3a3a]' : ''}`} />
                            </CardContent>
                        </Card>
                    ))}
                </CardContent>
            </Card>
        </div>
    );
};

export default ReportLoadingSkeleton;
