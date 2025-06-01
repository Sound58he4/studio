// src/components/pdf/PDFWorkoutViewer.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
    FileText, 
    Download, 
    Eye, 
    Calendar,
    Dumbbell,
    Zap,
    Target,
    Clock,
    CheckCircle,
    ExternalLink,
    RefreshCw,
    Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Types for PDF workout categories and files
export interface PDFWorkout {
    name: string;
    category: WorkoutCategory;
    day: number;
    filePath: string;
    description?: string;
}

export type WorkoutCategory = 'POWER' | 'XTREME WORKOUT' | 'LIGHT WORKOUT' | 'MAX WORKOUT';

interface PDFWorkoutViewerProps {
    onSelectPDF?: (pdf: PDFWorkout) => void;
    selectedCategory?: WorkoutCategory;
    selectedDay?: number;
    className?: string;
}

// Define the PDF files structure based on your public directory
const PDF_WORKOUTS: PDFWorkout[] = [
    // POWER category (Days 1-6)
    ...Array.from({ length: 6 }, (_, i) => ({
        name: `BAGO -POWER -DAY-${i + 1}`,
        category: 'POWER' as WorkoutCategory,
        day: i + 1,
        filePath: `/POWER/BAGO -POWER -DAY-${i + 1}.pdf.pdf`,
        description: `High-intensity power training for Day ${i + 1}`
    })),
    
    // XTREME WORKOUT category (Days 1-6)
    ...Array.from({ length: 6 }, (_, i) => ({
        name: `Xtream-workout DAY-${i + 1}`,
        category: 'XTREME WORKOUT' as WorkoutCategory,
        day: i + 1,
        filePath: `/XTREME WORKOUT/Xtream-workout DAY-${i + 1}.pdf.pdf`,
        description: `Extreme intensity workout for Day ${i + 1}`
    })),
    
    // LIGHT WORKOUT category (Days 1-3)
    ...Array.from({ length: 3 }, (_, i) => ({
        name: `Light-DAY -${i + 1}`,
        category: 'LIGHT WORKOUT' as WorkoutCategory,
        day: i + 1,
        filePath: `/LIGHT WORKOUT/Light-DAY -${i + 1}.pdf.pdf`,
        description: `Light intensity workout for Day ${i + 1}`
    })),
    
    // MAX WORKOUT category (Days 1-5)
    ...Array.from({ length: 5 }, (_, i) => ({
        name: `MAX WORKOUT -DAY - ${i + 1}`,
        category: 'MAX WORKOUT' as WorkoutCategory,
        day: i + 1,
        filePath: `/MAX WORKOUT/MAX WORKOUT -DAY - ${i + 1}.pdf`,
        description: `Maximum intensity workout for Day ${i + 1}`
    }))
];

const CATEGORY_CONFIGS = {
    'POWER': {
        color: 'bg-red-500',
        textColor: 'text-red-700 dark:text-red-300',
        bgColor: 'bg-red-50 dark:bg-red-900/20',
        borderColor: 'border-red-200 dark:border-red-800',
        icon: <Zap className="h-4 w-4" />,
        description: 'High-intensity power training sessions'
    },
    'XTREME WORKOUT': {
        color: 'bg-purple-500',
        textColor: 'text-purple-700 dark:text-purple-300',
        bgColor: 'bg-purple-50 dark:bg-purple-900/20',
        borderColor: 'border-purple-200 dark:border-purple-800',
        icon: <Target className="h-4 w-4" />,
        description: 'Extreme intensity challenges'
    },
    'LIGHT WORKOUT': {
        color: 'bg-green-500',
        textColor: 'text-green-700 dark:text-green-300',
        bgColor: 'bg-green-50 dark:bg-green-900/20',
        borderColor: 'border-green-200 dark:border-green-800',
        icon: <Clock className="h-4 w-4" />,
        description: 'Light and recovery-focused routines'
    },
    'MAX WORKOUT': {
        color: 'bg-orange-500',
        textColor: 'text-orange-700 dark:text-orange-300',
        bgColor: 'bg-orange-50 dark:bg-orange-900/20',
        borderColor: 'border-orange-200 dark:border-orange-800',
        icon: <Dumbbell className="h-4 w-4" />,
        description: 'Maximum intensity training programs'
    }
};

const PDFWorkoutViewer: React.FC<PDFWorkoutViewerProps> = ({
    onSelectPDF,
    selectedCategory,
    selectedDay,
    className
}) => {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState<WorkoutCategory>('POWER');
    const [selectedPDF, setSelectedPDF] = useState<PDFWorkout | null>(null);
    const [isLoading, setIsLoading] = useState<string | null>(null);

    // Set initial tab from props
    useEffect(() => {
        if (selectedCategory) {
            setActiveTab(selectedCategory);
        }
    }, [selectedCategory]);

    // Filter PDFs by category
    const getPDFsByCategory = (category: WorkoutCategory) => {
        return PDF_WORKOUTS.filter(pdf => pdf.category === category);
    };

    // Handle PDF selection
    const handleSelectPDF = (pdf: PDFWorkout) => {
        setSelectedPDF(pdf);
        onSelectPDF?.(pdf);
        toast({
            title: "Workout PDF Selected",
            description: `Selected ${pdf.name} for viewing`,
        });
    };

    // Handle PDF viewing
    const handleViewPDF = async (pdf: PDFWorkout) => {
        setIsLoading(pdf.filePath);
        try {
            // Open PDF in new tab/window
            window.open(pdf.filePath, '_blank');
            toast({
                title: "PDF Opened",
                description: `${pdf.name} opened in new tab`,
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to open PDF file",
                variant: "destructive"
            });
        } finally {
            setIsLoading(null);
        }
    };

    // Handle PDF download
    const handleDownloadPDF = async (pdf: PDFWorkout) => {
        setIsLoading(pdf.filePath);
        try {
            const link = document.createElement('a');
            link.href = pdf.filePath;
            link.download = `${pdf.name}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            toast({
                title: "Download Started",
                description: `${pdf.name} download initiated`,
            });
        } catch (error) {
            toast({
                title: "Download Error",
                description: "Failed to download PDF file",
                variant: "destructive"
            });
        } finally {
            setIsLoading(null);
        }    };

    // Render PDF card
    const renderPDFCard = (pdf: PDFWorkout) => {
        const config = CATEGORY_CONFIGS[pdf.category];
        const isSelected = selectedPDF?.filePath === pdf.filePath;
        const isCurrentlyLoading = isLoading === pdf.filePath;
        
        return (
            <motion.div
                key={pdf.filePath}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                whileHover={{ y: -2 }}
                className="w-full"
            >
                <Card className={cn(
                    "relative overflow-hidden transition-all duration-300 hover:shadow-lg cursor-pointer",
                    config.borderColor,
                    config.bgColor,
                    isSelected && "ring-2 ring-primary"
                )}>
                    <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-6">
                        <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                                <CardTitle className={cn("text-sm sm:text-base font-semibold flex items-center gap-1 sm:gap-2", config.textColor)}>
                                    {config.icon}
                                    Day {pdf.day}
                                </CardTitle>
                                <CardDescription className="text-xs sm:text-sm mt-1 line-clamp-2">
                                    {pdf.description}
                                </CardDescription>
                            </div>
                            <Badge variant="secondary" className={cn("text-[10px] sm:text-xs shrink-0", config.color, "text-white")}>
                                PDF
                            </Badge>
                        </div>
                    </CardHeader>
                    
                    <CardContent className="pt-0 p-3 sm:p-6">
                        <div className="flex flex-col gap-1.5 sm:gap-2">
                            <div className="flex gap-1 sm:gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleViewPDF(pdf)}
                                    disabled={isCurrentlyLoading}
                                    className="flex-1 text-[10px] sm:text-xs h-7 sm:h-8"
                                >
                                    {isCurrentlyLoading ? (
                                        <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin mr-1" />
                                    ) : (
                                        <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                    )}
                                    View
                                </Button>
                                
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDownloadPDF(pdf)}
                                    disabled={isCurrentlyLoading}
                                    className="flex-1 text-[10px] sm:text-xs h-7 sm:h-8"
                                >
                                    <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                    <span className="hidden sm:inline">Download</span>
                                    <span className="sm:hidden">Get</span>
                                </Button>
                            </div>
                              {onSelectPDF && (
                                <Button
                                    variant={isSelected ? "default" : "secondary"}
                                    size="sm"
                                    onClick={() => handleSelectPDF(pdf)}
                                    className={cn(
                                        "w-full text-[10px] sm:text-xs h-7 sm:h-8", 
                                        pdf.category === 'POWER' && !isSelected && "bg-green-100 hover:bg-green-200 text-green-700 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-900/50"
                                    )}
                                >
                                    {isSelected ? (
                                        <>
                                            <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                            <span className="hidden sm:inline">Selected</span>
                                            <span className="sm:hidden">✓</span>
                                        </>
                                    ) : pdf.category === 'POWER' ? (
                                        <>
                                            <Dumbbell className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                            <span className="hidden sm:inline">Select (Exercises Available)</span>
                                            <span className="sm:hidden">Select (POWER)</span>
                                        </>
                                    ) : (
                                        <>
                                            <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                            <span className="hidden sm:inline">Select for Workout</span>
                                            <span className="sm:hidden">Select</span>
                                        </>
                                    )}
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        );
    };

    return (
        <div className={cn("w-full", className)}>
            <Card className="shadow-lg border border-border/20 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-primary/10 via-card to-card border-b">
                    <CardTitle className="text-xl font-bold text-primary flex items-center gap-2">
                        <FileText className="h-6 w-6" />
                        PDF Workout Library
                    </CardTitle>
                    <CardDescription>
                        Choose from pre-designed workout PDFs organized by intensity level
                    </CardDescription>
                </CardHeader>
                
                <CardContent className="p-0">
                    <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as WorkoutCategory)}>                        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 h-auto p-1 bg-muted/50">
                            {Object.entries(CATEGORY_CONFIGS).map(([category, config]) => (
                                <TabsTrigger
                                    key={category}
                                    value={category}
                                    className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 data-[state=active]:bg-background p-2 sm:p-3"
                                >
                                    {config.icon}
                                    <span className="text-[10px] sm:text-xs font-medium text-center leading-tight">
                                        {category.replace(' WORKOUT', '').replace('XTREME', 'XTREME')}
                                    </span>
                                </TabsTrigger>
                            ))}
                        </TabsList>
                          {Object.keys(CATEGORY_CONFIGS).map((category) => (
                            <TabsContent key={category} value={category} className="p-3 sm:p-4">
                                <div className="mb-3 sm:mb-4">
                                    <h3 className="text-base sm:text-lg font-semibold mb-1 sm:mb-2">{category}</h3>
                                    <p className="text-xs sm:text-sm text-muted-foreground">
                                        {CATEGORY_CONFIGS[category as WorkoutCategory].description}
                                    </p>
                                </div>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                                    {getPDFsByCategory(category as WorkoutCategory).map(renderPDFCard)}
                                </div>
                                
                                {getPDFsByCategory(category as WorkoutCategory).length === 0 && (
                                    <div className="text-center py-6 sm:py-8 text-muted-foreground">
                                        <FileText className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 opacity-50" />
                                        <p className="text-sm sm:text-base">No PDF workouts available in this category</p>
                                    </div>
                                )}
                            </TabsContent>
                        ))}
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
};

export default PDFWorkoutViewer;
