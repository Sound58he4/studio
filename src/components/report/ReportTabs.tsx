// src/components/report/ReportTabs.tsx
"use client";

import React from 'react';
import { TabsList, TabsTrigger } from "@/components/ui/tabs"; // Only import List and Trigger
import type { ReportType } from '@/app/report/page'; // Assuming ReportType is in page.tsx

interface ReportTabsProps {
    activeTab: ReportType;
    setActiveTab: (tab: ReportType) => void;
}

const ReportTabs: React.FC<ReportTabsProps> = ({ activeTab, setActiveTab }) => {
    // NOTE: This component should be rendered *inside* a <Tabs> component in the parent.
    return (
        <TabsList className="grid w-full grid-cols-3 rounded-none bg-muted/80 border-b shadow-inner h-11 sm:h-12">
            <TabsTrigger value="daily" className="text-xs sm:text-sm data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:font-semibold">Daily</TabsTrigger>
            <TabsTrigger value="weekly" className="text-xs sm:text-sm data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:font-semibold">Weekly</TabsTrigger>
            <TabsTrigger value="monthly" className="text-xs sm:text-sm data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:font-semibold">Monthly</TabsTrigger>
        </TabsList>
    );
};

export default ReportTabs;
