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
    userProfile,
}) => {
    return (
        <div ref={reportContentRef} className="min-h-[400px]">
             <TabsContent value={activeTab} className="mt-0">
                {isLoading ? (
                    <div className="flex justify-center items-center py-10 h-full">
                        <div className="bg-white/40 backdrop-blur-sm rounded-2xl p-6 shadow-clayInset">
                            <div className="flex items-center">
                                <Loader2 className="h-8 w-8 animate-spin text-blue-600 mr-3"/>
                                <p className="text-gray-700 font-medium">Generating {activeTab} report...</p>
                            </div>
                        </div>
                    </div>
                ) : error ? (
                    <div className="text-center py-10 flex flex-col items-center gap-4 h-full justify-center">
                        <div className="bg-red-50/80 backdrop-blur-sm rounded-2xl p-6 shadow-clayInset max-w-md">
                            <AlertCircle className="h-6 w-6 text-red-600 mx-auto mb-3"/>
                            <p className="text-red-700 mb-4">{error}</p>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => fetchAndGenerateForTab(activeTab, selectedDate, userProfile)}
                                className="bg-white/60 backdrop-blur-sm border-0 shadow-clayInset hover:bg-white/80 rounded-2xl"
                            >
                                <RefreshCw className="mr-2 h-4 w-4"/>Retry
                            </Button>
                        </div>
                    </div>
                ) : report ? (
                    <ReportDisplay report={report} />
                ) : (
                    <div className="text-center py-10 h-full flex items-center justify-center">
                        <div className="bg-blue-50/80 backdrop-blur-sm rounded-2xl p-6 shadow-clayInset max-w-md">
                            <p className="text-gray-700 font-medium mb-2">No data available to generate a report for this period.</p>
                            <p className="text-gray-600 text-sm">Log meals and workouts to see your progress.</p>
                        </div>
                    </div>
                )}
             </TabsContent>
             {/* Empty TabsContent for other tabs */}
             {activeTab !== 'daily' && <TabsContent value="daily" className="mt-0"></TabsContent>}
             {activeTab !== 'weekly' && <TabsContent value="weekly" className="mt-0"></TabsContent>}
             {activeTab !== 'monthly' && <TabsContent value="monthly" className="mt-0"></TabsContent>}
        </div>
    );
};

export default ReportContentArea;

