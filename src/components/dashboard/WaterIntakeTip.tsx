// src/components/dashboard/WaterIntakeTip.tsx
"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Droplet, Info } from 'lucide-react'; 
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const WaterIntakeTip: React.FC = () => {
    return (
        <Card className={cn(
            "shadow-sm border border-blue-200 dark:border-blue-800",
            "bg-gradient-to-tr from-blue-100/50 via-blue-50/50 to-blue-100/50 dark:from-blue-900/30 dark:via-card dark:to-blue-900/40",
            "hover:shadow-lg transition-all duration-300",
            "relative overflow-hidden group"
        )}>
            {/* Water wave background effect */}
            <div className="absolute inset-0 opacity-20 dark:opacity-30">
                <div 
                    className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-blue-400/5 to-blue-600/15"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2306b6d4' fill-opacity='0.05'%3E%3Cpath d='M30 30c0-11.046-8.954-20-20-20s-20 8.954-20 20 8.954 20 20 20 20-8.954 20-20z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                    }}
                />
                {/* Animated water droplets */}
                <motion.div
                    className="absolute top-3 right-4"
                    animate={{ 
                        y: [0, -5, 0, -3, 0],
                        opacity: [0.4, 0.8, 0.4, 0.6, 0.4],
                        scale: [0.8, 1.2, 0.8, 1, 0.8]
                    }}
                    transition={{ 
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                >
                    <Droplet className="h-2 w-2 text-cyan-400/70" />
                </motion.div>
                <motion.div
                    className="absolute bottom-6 left-3"
                    animate={{ 
                        y: [0, -8, 0, -4, 0],
                        opacity: [0.3, 0.7, 0.3, 0.5, 0.3],
                        scale: [1, 1.3, 1, 1.1, 1]
                    }}
                    transition={{ 
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 1
                    }}
                >
                    <Droplet className="h-1.5 w-1.5 text-blue-400/60" />
                </motion.div>
                <motion.div
                    className="absolute top-8 left-5"
                    animate={{ 
                        y: [0, -6, 0, -2, 0],
                        opacity: [0.5, 0.9, 0.5, 0.7, 0.5],
                        scale: [0.9, 1.4, 0.9, 1.2, 0.9]
                    }}
                    transition={{ 
                        duration: 3.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 0.5
                    }}
                >
                    <Droplet className="h-1 w-1 text-cyan-500/50" />
                </motion.div>
                {/* Flowing wave effect */}
                <motion.div
                    className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-blue-300/10 to-transparent"
                    animate={{ 
                        x: [-20, 20, -20],
                        opacity: [0.1, 0.3, 0.1]
                    }}
                    transition={{ 
                        duration: 8,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />
            </div>
            
            <div className="relative z-10">
                <CardHeader className="pb-2 pt-3 px-3 sm:px-4">
                    <CardTitle className="text-xs sm:text-sm font-semibold flex items-center gap-2 text-blue-700 dark:text-blue-300">
                        <motion.div
                            animate={{ 
                                y: [0, -2, 0, -1, 0],
                                rotate: [0, 5, -5, 0],
                                scale: [1, 1.1, 1]
                            }}
                            transition={{ 
                                duration: 4,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                        >
                            <Droplet className="h-3 w-3 sm:h-4 sm:w-4"/>
                        </motion.div>
                        Hydration
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 pt-0">
                    <div className="flex items-start gap-2">
                        <motion.div
                            animate={{ 
                                opacity: [0.6, 1, 0.6],
                                scale: [0.9, 1.1, 0.9]
                            }}
                            transition={{ 
                                duration: 2.5,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                        >
                            <Info className="h-3 w-3 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0"/>
                        </motion.div>
                        <motion.div 
                            className="text-xs text-foreground/90 leading-relaxed"
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ 
                                duration: 0.8,
                                ease: "easeOut"
                            }}
                        >
                            <div className="font-medium mb-1">Target: 3L daily</div>
                            <div className="text-xs text-muted-foreground">Stay hydrated for optimal performance</div>
                        </motion.div>
                    </div>
                </CardContent>
            </div>
        </Card>
    );
};

export default WaterIntakeTip;
