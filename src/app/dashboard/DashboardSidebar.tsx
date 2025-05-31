
"use client";

import React from 'react';

// This sidebar is now empty since all components have been moved to Overview page
interface DashboardSidebarProps {}

const DashboardSidebar: React.FC<DashboardSidebarProps> = () => {
    return (
        <div className="space-y-6 md:space-y-8">
            <p className="text-muted-foreground text-center italic p-4">
                Check the Overview page for fitness tips, sleep goals, and hydration reminders!
            </p>
        </div>
    );
};

export default DashboardSidebar;
