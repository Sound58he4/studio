// src/components/ui/ProgressRing.tsx
"use client";

import React from 'react';
import { cn } from '@/lib/utils';

interface ProgressRingProps {
    value: number;
    max: number;
    size?: number;
    strokeWidth?: number;
    color?: string; // Tailwind color class or HSL string
    backgroundColor?: string; // Tailwind color class or HSL string
    label?: string;
    unit?: string;
    className?: string;
}

const ProgressRing: React.FC<ProgressRingProps> = ({
    value,
    max,
    size = 120,
    strokeWidth = 10,
    color = 'hsl(var(--primary))', // Default to primary color
    backgroundColor = 'hsl(var(--muted))', // Default to muted
    label,
    unit,
    className,
}) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const progress = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
    const offset = circumference - (progress / 100) * circumference;

    const isTailwindColor = (c: string) => !c.startsWith('hsl') && !c.startsWith('#') && !c.startsWith('rgb');

    return (
        <div className={cn("relative flex flex-col items-center justify-center", className)} style={{ width: size, height: size }}>
            <svg
                width={size}
                height={size}
                viewBox={`0 0 ${size} ${size}`}
                className="-rotate-90"
            >
                {/* Background Circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    className={isTailwindColor(backgroundColor) ? backgroundColor : undefined} // Apply Tailwind class if applicable
                    style={!isTailwindColor(backgroundColor) ? { stroke: backgroundColor } : undefined} // Apply style if HSL/RGB
                    strokeDasharray={circumference}
                    strokeDashoffset={0}
                    opacity={0.3} // Make background slightly transparent
                />
                {/* Progress Circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    className={isTailwindColor(color) ? color : undefined} // Apply Tailwind class if applicable
                    style={!isTailwindColor(color) ? { stroke: color } : undefined} // Apply style if HSL/RGB
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    transform={`rotate(0 ${size / 2} ${size / 2})`} // Ensures start at the top
                    // Add transition for smoother updates
                    className="transition-all duration-500 ease-out"
                />
            </svg>
            {/* Center Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-xl sm:text-2xl font-bold text-foreground">
                    {value.toFixed(0)}
                </span>
                 {label && <span className="text-xs text-muted-foreground mt-0.5">{label}</span>}
                 {/* Optional: Show Percentage */}
                 {/* <span className="text-xs text-primary mt-0.5">{progress.toFixed(0)}%</span> */}
            </div>
        </div>
    );
};

export default ProgressRing;