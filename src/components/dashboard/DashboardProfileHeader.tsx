// src/components/dashboard/DashboardProfileHeader.tsx
"use client";

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils"; // Ensure cn is imported

interface DashboardProfileHeaderProps {
    displayName: string | null | undefined;
    photoURL: string | null | undefined;
    level?: number; // Optional
    xp?: number; // Optional
    isLoading?: boolean;
}

const DashboardProfileHeader: React.FC<DashboardProfileHeaderProps> = ({
    displayName,
    photoURL,
    level,
    xp,
    isLoading = false,
}) => {
    if (isLoading) {
        return (
            <div className="flex w-full flex-col gap-4 @[520px]:flex-row @[520px]:items-center @[520px]:justify-between p-4">
                <div className="flex items-center gap-4">
                    <Skeleton className="aspect-square h-24 w-24 rounded-full border-4 border-white shadow-md" />
                    <div className="flex flex-col gap-1">
                        <Skeleton className="h-7 w-40 rounded-md" />
                        <Skeleton className="h-5 w-20 rounded-md" />
                        <Skeleton className="h-4 w-24 rounded-md" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex w-full flex-col gap-4 @[520px]:flex-row @[520px]:items-center @[520px]:justify-between p-4">
            <div className="flex items-center gap-4">
                <Avatar className="aspect-square h-24 w-24 rounded-full border-4 border-white shadow-md">
                    <AvatarImage src={photoURL ?? undefined} alt={displayName || "User"} />
                    <AvatarFallback className="text-3xl">
                        {displayName ? displayName.charAt(0).toUpperCase() : "U"}
                    </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                    <p className="text-2xl leading-tight font-bold tracking-tight text-[#0e1b16]">{displayName || "User"}</p>
                    {level !== undefined && (
                        <p className={cn(
                            "bg-gradient-to-r from-[#19e597] to-[#4e977b] bg-clip-text text-base leading-normal font-medium text-transparent"
                        )}>
                            Level {level}
                        </p>
                    )}
                    {xp !== undefined && (
                         <p className="text-sm leading-normal font-normal text-gray-600">{xp} XP</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DashboardProfileHeader;
