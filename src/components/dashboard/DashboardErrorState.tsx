// src/components/dashboard/DashboardErrorState.tsx
"use client";

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, AlertTriangle, RefreshCw, LogIn, User } from "lucide-react";

interface DashboardErrorStateProps {
    message: string;
    onRetry?: () => void;
    isProfileError?: boolean; // Optional flag for profile-specific errors
    isAccessDenied?: boolean;
}

const DashboardErrorState: React.FC<DashboardErrorStateProps> = ({ 
  message, 
  onRetry, 
  isProfileError = false,
  isAccessDenied = false 
}) => {
  const isAccessError = isAccessDenied || message.toLowerCase().includes('access denied') || message.toLowerCase().includes('log in');

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-background to-muted/50">
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="w-full max-w-md"
            >
                <Card className="border-destructive/20 shadow-xl">
                    <CardContent className="p-8 text-center space-y-6">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                            className="flex justify-center"
                        >
                            {isAccessError ? (
                                <LogIn className="h-16 w-16 text-destructive" />
                            ) : isProfileError ? (
                                <User className="h-16 w-16 text-warning" />
                            ) : (
                                <AlertTriangle className="h-16 w-16 text-destructive" />
                            )}
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="space-y-2"
                        >
                            <h2 className="text-2xl font-bold text-foreground">
                                {isAccessError ? 'Access Required' : isProfileError ? 'Profile Setup Needed' : 'Something Went Wrong'}
                            </h2>
                            <p className="text-muted-foreground leading-relaxed">
                                {message}
                            </p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="flex flex-col sm:flex-row gap-3 justify-center"
                        >
                            <Button 
                                onClick={onRetry}
                                variant={isAccessError ? "default" : "outline"}
                                className="flex items-center gap-2"
                            >
                                {isAccessError ? (
                                    <>
                                        <LogIn className="h-4 w-4" />
                                        Sign In
                                    </>
                                ) : isProfileError ? (
                                    <>
                                        <User className="h-4 w-4" />
                                        Complete Profile
                                    </>
                                ) : (
                                    <>
                                        <RefreshCw className="h-4 w-4" />
                                        Try Again
                                    </>
                                )}
                            </Button>

                            {!isAccessError && (
                                <Button 
                                    variant="ghost" 
                                    onClick={() => window.location.reload()}
                                    className="flex items-center gap-2"
                                >
                                    <RefreshCw className="h-4 w-4" />
                                    Refresh Page
                                </Button>
                            )}
                        </motion.div>

                        {isAccessError && (
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.6 }}
                                className="text-xs text-muted-foreground"
                            >
                                You'll be redirected to the login page to continue.
                            </motion.p>
                        )}
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
};

export default DashboardErrorState;
