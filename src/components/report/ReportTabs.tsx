// src/components/report/ReportTabs.tsx
"use client";

import React from 'react';
import { TabsList, TabsTrigger } from "@/components/ui/tabs"; // Only import List and Trigger
import type { ReportType } from '@/app/report/page'; // Assuming ReportType is in page.tsx

interface ReportTabsProps {
    activeTab: ReportType;
    setActiveTab: (tab: ReportType) => void;
    isDark?: boolean;
}

const ReportTabs: React.FC<ReportTabsProps> = ({ activeTab, setActiveTab, isDark = false }) => {
    // NOTE: This component should be rendered *inside* a <Tabs> component in the parent.
    return (
        <TabsList className={`grid w-full grid-cols-3 rounded-none border-b shadow-inner h-11 sm:h-12 transition-all duration-300 ${
            isDark 
                ? 'bg-[#2a2a2a] border-[#3a3a3a]' 
                : 'bg-muted/80'
        }`}>
            <TabsTrigger value="daily" className={`text-xs sm:text-sm transition-all duration-300 ${
                isDark 
                    ? 'data-[state=active]:bg-purple-600/20 data-[state=active]:text-purple-300 data-[state=active]:font-semibold text-gray-300 hover:text-white' 
                    : 'data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:font-semibold'
            }`}>Daily</TabsTrigger>
            <TabsTrigger value="weekly" className={`text-xs sm:text-sm transition-all duration-300 ${
                isDark 
                    ? 'data-[state=active]:bg-purple-600/20 data-[state=active]:text-purple-300 data-[state=active]:font-semibold text-gray-300 hover:text-white' 
                    : 'data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:font-semibold'
            }`}>Weekly</TabsTrigger>
            <TabsTrigger value="monthly" className={`text-xs sm:text-sm transition-all duration-300 ${
                isDark 
                    ? 'data-[state=active]:bg-purple-600/20 data-[state=active]:text-purple-300 data-[state=active]:font-semibold text-gray-300 hover:text-white' 
                    : 'data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:font-semibold'
            }`}>Monthly</TabsTrigger>
        </TabsList>
    );
};

export default ReportTabs;
