// src/components/report/ReportLoadingSkeleton.tsx
"use client";

import React from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const ReportLoadingSkeleton: React.FC = () => {
    return (
        <div className="max-w-4xl mx-auto my-4 md:my-8 px-4 animate-pulse">
            <Card className="shadow-xl border border-border/20 overflow-hidden">
                {/* Header Skeleton */}
                <CardHeader className="p-4 sm:p-5 md:p-6 border-b">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div>
                            <Skeleton className="h-7 w-48 mb-1" />
                            <Skeleton className="h-4 w-64" />
                        </div>
                        <Skeleton className="h-9 w-32 rounded-md" />
                    </div>
                    <div className="mt-4 flex flex-col sm:flex-row justify-between items-center gap-3 bg-muted/50 p-2 rounded-md">
                        <Skeleton className="h-9 w-9 rounded-full" />
                        <Skeleton className="h-9 w-full sm:w-[280px] rounded-md" />
                        <Skeleton className="h-9 w-9 rounded-full" />
                    </div>
                </CardHeader>

                {/* Tabs Skeleton */}
                <div className="grid grid-cols-3 h-11 sm:h-12 bg-muted/80 border-b shadow-inner">
                    <Skeleton className="h-full m-1 rounded-sm" />
                    <Skeleton className="h-full m-1 rounded-sm bg-primary/10" />
                    <Skeleton className="h-full m-1 rounded-sm" />
                </div>

                {/* Content Skeleton */}
                <CardContent className="p-4 md:p-6 space-y-6">
                    {/* Summary Card Skeleton */}
                    <Card className="shadow-lg border-primary/20">
                        <CardHeader>
                            <Skeleton className="h-6 w-3/4" />
                            <Skeleton className="h-4 w-full mt-1" />
                        </CardHeader>
                    </Card>

                    {/* Section Card Skeletons */}
                    {[...Array(4)].map((_, i) => (
                        <Card key={i} className="shadow-md border border-border/30">
                            <CardHeader className="pb-3 pt-4 px-4 sm:px-5 bg-muted/30 border-b">
                                <Skeleton className="h-5 w-1/3" />
                            </CardHeader>
                            <CardContent className="p-4 sm:p-5 space-y-3">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-5/6" />
                                <Skeleton className="h-4 w-4/6" />
                            </CardContent>
                        </Card>
                    ))}
                </CardContent>
            </Card>
        </div>
    );
};

export default ReportLoadingSkeleton;
