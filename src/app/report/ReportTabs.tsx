// src/app/report/ReportTabs.tsx
"use client";

import React from 'react';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ReportType } from './page'; // Assuming ReportType is in page.tsx

interface ReportTabsProps {
    activeTab: ReportType;
    setActiveTab: (tab: ReportType) => void;
}

const ReportTabs: React.FC<ReportTabsProps> = ({ activeTab, setActiveTab }) => {
    return (
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ReportType)} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6 bg-white/40 backdrop-blur-sm rounded-2xl shadow-clayInset">
                <TabsTrigger value="daily" className="rounded-xl text-xs sm:text-sm data-[state=active]:bg-white/60 data-[state=active]:text-blue-600 data-[state=active]:font-semibold data-[state=active]:shadow-clay transition-all duration-300">Daily</TabsTrigger>
                <TabsTrigger value="weekly" className="rounded-xl text-xs sm:text-sm data-[state=active]:bg-white/60 data-[state=active]:text-blue-600 data-[state=active]:font-semibold data-[state=active]:shadow-clay transition-all duration-300">Weekly</TabsTrigger>
                <TabsTrigger value="monthly" className="rounded-xl text-xs sm:text-sm data-[state=active]:bg-white/60 data-[state=active]:text-blue-600 data-[state=active]:font-semibold data-[state=active]:shadow-clay transition-all duration-300">Monthly</TabsTrigger>
            </TabsList>
             {/* Content will be rendered by ReportContentArea */}
        </Tabs>
    );
};

export default ReportTabs;

