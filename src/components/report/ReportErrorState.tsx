// src/components/report/ReportErrorState.tsx
"use client";

import React from 'react';
import Link from 'next/link'; // Import Link
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, User } from "lucide-react";

interface ReportErrorStateProps {
    message: string;
    onRetry: () => void;
    isProfileError?: boolean; // Optional flag for profile-specific errors
    isDark?: boolean;
}

const ReportErrorState: React.FC<ReportErrorStateProps> = ({ message, onRetry, isProfileError = false, isDark = false }) => {
    return (
        <div className="flex justify-center items-center min-h-[calc(100vh-250px)] p-4">
            <Card className={`w-full max-w-md text-center shadow-lg transition-all duration-300 ${
                isDark 
                    ? 'border-red-500/30 bg-[#2a2a2a]' 
                    : 'border-destructive'
            }`}>
                <CardHeader>
                    <AlertCircle className={`mx-auto h-10 w-10 ${
                        isDark ? 'text-red-400' : 'text-destructive'
                    }`} />
                    <CardTitle className={`${
                        isDark ? 'text-red-400' : 'text-destructive'
                    }`}>
                       {isProfileError ? "Profile Issue" : "Report Error"}
                    </CardTitle>
                    <CardDescription className={`${
                        isDark ? 'text-gray-400' : ''
                    }`}>{message}</CardDescription>
                </CardHeader>
                <CardFooter className="justify-center">
                    {isProfileError ? (
                        <Link href="/profile">
                             <Button variant="secondary" className={`transition-all duration-300 ${
                                 isDark ? 'bg-[#2a2a2a] hover:bg-[#3a3a3a] text-gray-300 hover:text-white' : ''
                             }`}>
                                 <User className="mr-2 h-4 w-4"/> Go to Profile
                             </Button>
                        </Link>
                    ) : (
                        <Button onClick={onRetry} variant="secondary" className={`transition-all duration-300 ${
                            isDark ? 'bg-[#2a2a2a] hover:bg-[#3a3a3a] text-gray-300 hover:text-white' : ''
                        }`}>
                            <RefreshCw className="mr-2 h-4 w-4"/>Retry
                        </Button>
                    )}
                </CardFooter>
            </Card>
        </div>
    );
};

export default ReportErrorState;
