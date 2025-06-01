// src/app/pdf-workouts/page.tsx
"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { ArrowLeft, BookOpen, FileText, Download, Eye, Calendar } from 'lucide-react';
import PDFWorkoutViewer from '@/components/pdf/PDFWorkoutViewer';
import Link from 'next/link';

export default function PDFWorkoutsPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    // Redirect if not authenticated
    React.useEffect(() => {
        if (!authLoading && !user) {
            router.replace('/authorize');
        }
    }, [authLoading, user, router]);

    if (authLoading) {
        return (
            <div className="flex justify-center items-center min-h-[calc(100vh-200px)] p-4">
                <div className="animate-pulse text-muted-foreground">Loading...</div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <motion.div 
            className="max-w-7xl mx-auto my-4 md:my-8 px-2 sm:px-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
        >
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="mb-6"
            >
                <div className="flex items-center gap-4 mb-4">
                    <Link href="/workout-plans">
                        <Button variant="ghost" size="sm" className="gap-2">
                            <ArrowLeft className="h-4 w-4" />
                            Back to Workout Plans
                        </Button>
                    </Link>
                </div>
                
                <Card className="border border-border/20 bg-gradient-to-r from-primary/5 via-card to-card">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-2xl md:text-3xl font-bold text-primary flex items-center gap-3">
                            <motion.div
                                initial={{ rotate: -10, scale: 0.8 }}
                                animate={{ rotate: 0, scale: 1 }}
                                transition={{ delay: 0.3, duration: 0.5, type: "spring" }}
                            >
                                <BookOpen className="h-7 w-7" />
                            </motion.div>
                            PDF Workout Library
                        </CardTitle>
                        <CardDescription className="text-base mt-2">
                            Browse and access our complete collection of pre-designed workout PDFs organized by intensity level
                        </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                                <div className="text-red-600 dark:text-red-400 font-semibold text-sm">POWER</div>
                                <div className="text-xs text-red-500 dark:text-red-300">6 Workouts</div>
                            </div>
                            <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                                <div className="text-purple-600 dark:text-purple-400 font-semibold text-sm">XTREME</div>
                                <div className="text-xs text-purple-500 dark:text-purple-300">6 Workouts</div>
                            </div>
                            <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                <div className="text-green-600 dark:text-green-400 font-semibold text-sm">LIGHT</div>
                                <div className="text-xs text-green-500 dark:text-green-300">3 Workouts</div>
                            </div>
                            <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                                <div className="text-orange-600 dark:text-orange-400 font-semibold text-sm">MAX</div>
                                <div className="text-xs text-orange-500 dark:text-orange-300">5 Workouts</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* PDF Viewer */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
            >
                <PDFWorkoutViewer />
            </motion.div>

            {/* Quick Actions Footer */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                className="mt-8"
            >
                <Card className="bg-muted/30 border-dashed">
                    <CardContent className="p-4 text-center">
                        <h3 className="font-semibold mb-2 flex items-center justify-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Ready to add PDFs to your workout plan?
                        </h3>
                        <p className="text-sm text-muted-foreground mb-3">
                            Browse the PDFs above and then visit your workout plans to add them to specific days
                        </p>
                        <Link href="/workout-plans">
                            <Button size="sm" className="gap-2">
                                <FileText className="h-4 w-4" />
                                Go to Workout Plans
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </motion.div>
        </motion.div>
    );
}
