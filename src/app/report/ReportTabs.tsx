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
            <TabsList className="grid w-full grid-cols-3 rounded-none bg-muted/80 border-b shadow-inner h-11 sm:h-12">
                <TabsTrigger value="daily" className="text-xs sm:text-sm data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:font-semibold">Daily</TabsTrigger>
                <TabsTrigger value="weekly" className="text-xs sm:text-sm data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:font-semibold">Weekly</TabsTrigger>
                <TabsTrigger value="monthly" className="text-xs sm:text-sm data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:font-semibold">Monthly</TabsTrigger>
            </TabsList>
             {/* Content will be rendered by ReportContentArea */}
        </Tabs>
    );
};

export default ReportTabs;

    