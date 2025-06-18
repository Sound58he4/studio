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
        <div className="min-h-screen pb-20 md:pb-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 transition-all duration-500">
            <div className="max-w-7xl mx-auto my-4 md:my-8 px-2 sm:px-4">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="mb-6"
                >
                    <div className="flex items-center gap-4 mb-4">
                        <Link href="/workout-plans">
                            <Button variant="ghost" size="sm" className="gap-2 rounded-xl">
                                <ArrowLeft className="h-4 w-4" />
                                Back to Workout Plans
                            </Button>
                        </Link>
                    </div>
                    
                    <div className="backdrop-blur-sm p-6 border shadow-lg rounded-3xl transition-all duration-300 bg-white/90 border-gray-200/50">
                        <div className="text-center mb-6">
                            <div className="flex items-center justify-center gap-3 mb-4">
                                <motion.div
                                    initial={{ rotate: -10, scale: 0.8 }}
                                    animate={{ rotate: 0, scale: 1 }}
                                    transition={{ delay: 0.3, duration: 0.5, type: "spring" }}
                                    className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg bg-gradient-to-br from-orange-500 to-red-600"
                                >
                                    <BookOpen className="h-7 w-7 text-white" />
                                </motion.div>
                            </div>
                            <h1 className="text-3xl font-bold mb-2 text-gray-900">
                                PDF Workout Library
                            </h1>
                            <p className="text-lg text-gray-600">
                                Browse and access our complete collection of pre-designed workout PDFs organized by intensity level
                            </p>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div className="text-center p-3 rounded-2xl border transition-all duration-300 bg-red-50/80 border-red-200/50 hover:bg-red-100/80">
                                <div className="text-red-600 font-semibold text-sm">POWER</div>
                                <div className="text-xs text-red-500">6 Workouts</div>
                            </div>
                            <div className="text-center p-3 rounded-2xl border transition-all duration-300 bg-purple-50/80 border-purple-200/50 hover:bg-purple-100/80">
                                <div className="text-purple-600 font-semibold text-sm">XTREME</div>
                                <div className="text-xs text-purple-500">6 Workouts</div>
                            </div>
                            <div className="text-center p-3 rounded-2xl border transition-all duration-300 bg-green-50/80 border-green-200/50 hover:bg-green-100/80">
                                <div className="text-green-600 font-semibold text-sm">LIGHT</div>
                                <div className="text-xs text-green-500">3 Workouts</div>
                            </div>
                            <div className="text-center p-3 rounded-2xl border transition-all duration-300 bg-orange-50/80 border-orange-200/50 hover:bg-orange-100/80">
                                <div className="text-orange-600 font-semibold text-sm">MAX</div>
                                <div className="text-xs text-orange-500">5 Workouts</div>
                            </div>
                        </div>
                    </div>
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
                    <div className="backdrop-blur-sm rounded-3xl border border-dashed border-gray-300/50 bg-white/60 transition-all duration-300">
                        <div className="p-4 text-center">
                            <h3 className="font-semibold mb-2 flex items-center justify-center gap-2 text-gray-900">
                                <Calendar className="h-4 w-4" />
                                Ready to add PDFs to your workout plan?
                            </h3>
                            <p className="text-sm text-gray-600 mb-3">
                                Browse the PDFs above and then visit your workout plans to add them to specific days
                            </p>
                            <Link href="/workout-plans">
                                <Button size="sm" className="gap-2 rounded-xl bg-gradient-to-br from-blue-400 to-purple-500 hover:from-blue-500 hover:to-purple-600 text-white shadow-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]">
                                    <FileText className="h-4 w-4" />
                                    Go to Workout Plans
                                </Button>
                            </Link>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
