"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils'; // Keep cn import in case needed elsewhere or later

interface Tip {
    id: number;
    type: 'do' | 'dont'; // Ensure type is specific
    text: string;
}

interface FitnessTipProps {
    tip: Tip | null;
}

const FitnessTip: React.FC<FitnessTipProps> = ({ tip }) => {
    if (!tip) {
        return null; // Return null if no tip is provided
    }

    // Removed cn() wrapper from Card className as it wasn't necessary for a static string
    return (
        <Card className="shadow-md border-accent/50 bg-gradient-to-tr from-accent/10 via-card to-accent/5 hover:shadow-accent/10 hover:shadow-lg transition-shadow duration-300"> {/* Adjusted gradient/shadow */}
            <CardHeader className="pb-3 pt-4 px-5">
                <CardTitle className="text-base md:text-lg flex items-center gap-2 text-accent font-semibold"> {/* Made font bolder */}
                 <Lightbulb className="h-5 w-5"/> Today's Fitness Tip
                </CardTitle>
            </CardHeader>
            <CardContent className="p-5 text-sm text-foreground/90 flex items-start gap-3">
                {tip.type === 'do' ? (
                    <CheckCircle className="h-6 w-6 text-green-500 dark:text-green-400 mt-0.5 flex-shrink-0"/> /* Adjusted color slightly */
                ) : (
                    <XCircle className="h-6 w-6 text-red-500 dark:text-red-400 mt-0.5 flex-shrink-0"/> /* Adjusted color slightly */
                )}
                <p className="leading-relaxed font-medium">{tip.text}</p>
            </CardContent>
        </Card>
    );
};

export default FitnessTip;
