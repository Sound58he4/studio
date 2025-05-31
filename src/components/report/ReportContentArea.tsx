// src/components/report/ReportContentArea.tsx
"use client";

import React from 'react';
import { TabsContent } from "@/components/ui/tabs"; // Only import TabsContent
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";
import ReportDisplay from '@/components/report/ReportDisplay';
import type { ReportType, ProgressReportOutput } from '@/app/report/page'; // Adjust path if types are moved
import type { StoredUserProfile } from '@/app/dashboard/types';

interface ReportContentAreaProps {
    activeTab: ReportType;
    isLoading: boolean; // Combined loading state for the active tab
    error: string | null; // Error state for the active tab
    report: ProgressReportOutput | null; // Report data for the active tab
    reportContentRef: React.RefObject<HTMLDivElement | null>;
    fetchAndGenerateForTab: (tab: ReportType, date: Date, profile: StoredUserProfile | null) => void; // Pass profile to fetch function
    selectedDate: Date;
    userProfile: StoredUserProfile | null; // Add userProfile to props
}

const ReportContentArea: React.FC<ReportContentAreaProps> = ({
    activeTab,
    isLoading,
    error,
    report,
    reportContentRef,
    fetchAndGenerateForTab,
    selectedDate,
    userProfile, // Destructure userProfile
}) => {
    // NOTE: This component expects to be rendered inside a <Tabs> component in the parent.
    return (
        <div ref={reportContentRef} className="p-4 md:p-6 bg-background min-h-[400px]"> {/* Add min-height */}
             {/* Render content for the active tab using TabsContent */}
             <TabsContent value={activeTab} className="mt-0">
                {isLoading ? (
                    <div className="flex justify-center items-center py-10 h-full">
                        <Loader2 className="h-8 w-8 animate-spin text-primary"/>
                        <p className="ml-3 text-muted-foreground">Generating {activeTab} report...</p>
                    </div>
                ) : error ? (
                    <div className="text-center py-10 text-destructive flex flex-col items-center gap-2 h-full justify-center">
                        <AlertCircle className="h-6 w-6"/>
                        <p className="max-w-md">{error}</p>
                         {/* Pass activeTab and profile to the retry function */}
                        <Button variant="outline" size="sm" onClick={() => fetchAndGenerateForTab(activeTab, selectedDate, userProfile)}>
                            <RefreshCw className="mr-2 h-4 w-4"/>Retry
                        </Button>
                    </div>
                ) : report ? (
                    <ReportDisplay report={report} />
                ) : (
                    <div className="text-center py-10 text-muted-foreground italic h-full flex items-center justify-center">
                        <div> {/* Wrapper div for better centering */}
                           <p>No data available to generate a report for this period.</p>
                           <p className="text-xs mt-1">Log meals and workouts to see your progress.</p>
                        </div>
                    </div>
                )}
             </TabsContent>
             {/* Render empty TabsContent for other tabs to ensure Tabs component works correctly */}
             {activeTab !== 'daily' && <TabsContent value="daily" className="mt-0"></TabsContent>}
             {activeTab !== 'weekly' && <TabsContent value="weekly" className="mt-0"></TabsContent>}
             {activeTab !== 'monthly' && <TabsContent value="monthly" className="mt-0"></TabsContent>}
        </div>
    );
};

export default ReportContentArea;

