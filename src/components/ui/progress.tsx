"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

// Define the props type including the new optional className for the indicator
interface ProgressProps extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  indicatorClassName?: string;
  value?: number; // This value should ideally represent the percentage (0-100)
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps // Use the extended props type
>(({ className, value, indicatorClassName, ...props }, ref) => {
    // Ensure value is within 0-100 range for percentage
    const progressPercentage = value !== undefined ? Math.max(0, Math.min(100, value)) : 0;

    return (
        <ProgressPrimitive.Root
            ref={ref}
            className={cn(
            "relative h-2.5 w-full overflow-hidden rounded-full bg-muted/80", // Slightly thicker, adjust bg opacity
             // Add subtle background pattern
             "bg-[linear-gradient(45deg,rgba(255,255,255,0.05)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.05)_50%,rgba(255,255,255,0.05)_75%,transparent_75%,transparent)] dark:bg-[linear-gradient(45deg,rgba(0,0,0,0.1)_25%,transparent_25%,transparent_50%,rgba(0,0,0,0.1)_50%,rgba(0,0,0,0.1)_75%,transparent_75%,transparent)] bg-[length:10px_10px]",
            className // Allow overriding root styles
            )}
            {...props}
        >
            <ProgressPrimitive.Indicator
            className={cn(
                "h-full w-full flex-1 transition-all duration-700 ease-out-quad", // Use new timing function, removed animate-pulse-opacity
                "group-hover:animate-pulse-opacity", // Apply animation on group hover
                indicatorClassName ? indicatorClassName : "bg-primary" // Apply custom indicator styles or default to primary
            )}
            style={{ width: `${progressPercentage}%` }} // Set width based on calculated percentage
            />
        </ProgressPrimitive.Root>
    );
})
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
