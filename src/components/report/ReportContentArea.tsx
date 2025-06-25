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
    isDark?: boolean;
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
    isDark = false,
}) => {
    return (
        <div ref={reportContentRef} className="min-h-[400px]">
             <TabsContent value={activeTab} className="mt-0">
                {isLoading ? (
                    <div className="flex justify-center items-center py-10 h-full">
                        <div className={`backdrop-blur-sm rounded-2xl p-6 shadow-clayInset transition-all duration-300 ${
                            isDark 
                                ? 'bg-gray-700/40 border border-gray-600' 
                                : 'bg-white/40'
                        }`}>
                            <div className="flex items-center">
                                <Loader2 className={`h-8 w-8 animate-spin mr-3 ${
                                    isDark ? 'text-purple-400' : 'text-blue-600'
                                }`}/>
                                <p className={`font-medium ${
                                    isDark ? 'text-gray-300' : 'text-gray-700'
                                }`}>Generating {activeTab} report...</p>
                            </div>
                        </div>
                    </div>
                ) : error ? (
                    <div className="text-center py-10 flex flex-col items-center gap-4 h-full justify-center">
                        <div className={`backdrop-blur-sm rounded-2xl p-6 shadow-clayInset max-w-md transition-all duration-300 ${
                            isDark 
                                ? 'bg-red-900/20 border border-red-700/30' 
                                : 'bg-red-50/80'
                        }`}>
                            <AlertCircle className={`h-6 w-6 mx-auto mb-3 ${
                                isDark ? 'text-red-400' : 'text-red-600'
                            }`}/>
                            <p className={`mb-4 ${
                                isDark ? 'text-red-300' : 'text-red-700'
                            }`}>{error}</p>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => fetchAndGenerateForTab(activeTab, selectedDate, userProfile)}
                                className={`backdrop-blur-sm border-0 shadow-clayInset rounded-2xl transition-all duration-300 ${
                                    isDark 
                                        ? 'bg-gray-700/60 hover:bg-gray-600/80 text-gray-300 hover:text-white' 
                                        : 'bg-white/60 hover:bg-white/80'
                                }`}
                            >
                                <RefreshCw className="mr-2 h-4 w-4"/>Retry
                            </Button>
                        </div>
                    </div>
                ) : report ? (
                    <ReportDisplay report={report} isDark={isDark} />
                ) : (
                    <div className="text-center py-10 h-full flex items-center justify-center">
                        <div className={`backdrop-blur-sm rounded-2xl p-6 shadow-clayInset max-w-md transition-all duration-300 ${
                            isDark 
                                ? 'bg-gray-700/40 border border-gray-600' 
                                : 'bg-blue-50/80'
                        }`}>
                            <p className={`font-medium mb-2 ${
                                isDark ? 'text-gray-300' : 'text-gray-700'
                            }`}>No data available to generate a report for this period.</p>
                            <p className={`text-sm ${
                                isDark ? 'text-gray-400' : 'text-gray-600'
                            }`}>Log meals and workouts to see your progress.</p>
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

