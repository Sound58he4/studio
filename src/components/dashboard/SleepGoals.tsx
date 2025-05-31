"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Moon, Info, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const SleepGoals: React.FC = () => {
    return (
        <Card className={cn(
            "shadow-sm border border-indigo-200 dark:border-indigo-800",
            "bg-gradient-to-tr from-indigo-100/50 via-indigo-50/50 to-indigo-100/50 dark:from-indigo-900/30 dark:via-card dark:to-indigo-900/40",
            "hover:shadow-lg transition-all duration-300",
            "relative overflow-hidden group"
        )}>
            {/* Night sky background with subtle stars */}
            <div className="absolute inset-0 opacity-20 dark:opacity-30">
                <div 
                    className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 via-purple-900/10 to-indigo-800/20"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='m0 40l40-40h-40v40zm40 0v-40h-40l40 40z'/%3E%3C/g%3E%3C/svg%3E")`
                    }}
                />
                {/* Animated floating stars */}
                <motion.div
                    className="absolute top-2 right-3"
                    animate={{ 
                        opacity: [0.3, 0.8, 0.3],
                        scale: [0.8, 1.2, 0.8]
                    }}
                    transition={{ 
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                >
                    <Star className="h-2 w-2 text-yellow-300/60" />
                </motion.div>
                <motion.div
                    className="absolute bottom-8 left-4"
                    animate={{ 
                        opacity: [0.2, 0.6, 0.2],
                        scale: [1, 1.3, 1]
                    }}
                    transition={{ 
                        duration: 6,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 1
                    }}
                >
                    <Star className="h-1.5 w-1.5 text-yellow-300/40" />
                </motion.div>
                <motion.div
                    className="absolute top-8 left-6"
                    animate={{ 
                        opacity: [0.4, 0.9, 0.4],
                        scale: [0.9, 1.4, 0.9]
                    }}
                    transition={{ 
                        duration: 5,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 2
                    }}
                >
                    <Star className="h-1 w-1 text-yellow-300/50" />
                </motion.div>
            </div>
            
            <div className="relative z-10">
                <CardHeader className="pb-2 pt-3 px-3 sm:px-4">
                    <CardTitle className="text-xs sm:text-sm font-semibold flex items-center gap-2 text-indigo-700 dark:text-indigo-300">
                        <motion.div
                            animate={{ 
                                rotate: [0, -10, 10, 0],
                                scale: [1, 1.1, 1]
                            }}
                            transition={{ 
                                duration: 6,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                        >
                            <Moon className="h-3 w-3 sm:h-4 sm:w-4"/>
                        </motion.div>
                        Sleep Goals
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
                                duration: 3,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                        >
                            <Info className="h-3 w-3 text-indigo-600 dark:text-indigo-400 mt-0.5 flex-shrink-0"/>
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
                            <div className="font-medium mb-1">Target: 7-9 hours</div>
                            <div className="text-xs text-muted-foreground">Quality sleep supports recovery and metabolism</div>
                        </motion.div>
                    </div>
                </CardContent>
            </div>
        </Card>
    );
};

export default SleepGoals;
