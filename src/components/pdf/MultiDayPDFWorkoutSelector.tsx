// src/components/pdf/MultiDayPDFWorkoutSelector.tsx
"use client";

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
    FileText as FileTextIcon, 
    Plus, 
    Eye,
    Download,
    Calendar,
    X,
    ArrowRight,
    BookOpen,
    Dumbbell,
    FilePlus2,
    CheckCircle,
    Save,
    Check,
    Zap,
    Target,
    Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PDFWorkout, WorkoutCategory } from './PDFWorkoutViewer';
import { DayOfWeek } from '@/app/workout-plans/page';

interface MultiDayPDFWorkoutSelectorProps {
    onAddPDFWorkouts: (assignments: PDFWorkoutAssignment[]) => void;
    className?: string;
}

export interface PDFWorkoutAssignment {
    day: DayOfWeek;
    pdfWorkout: PDFWorkout;
    replaceExisting: boolean;
}

const DAYS_OF_WEEK: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

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

const MultiDayPDFWorkoutSelector: React.FC<MultiDayPDFWorkoutSelectorProps> = ({
    onAddPDFWorkouts,
    className
}) => {
    const { toast } = useToast();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<WorkoutCategory | null>(null);
    const [dayAssignments, setDayAssignments] = useState<Record<number, DayOfWeek | null>>({});
    const [replaceExisting, setReplaceExisting] = useState(true);

    // Get available PDF workouts for selected category
    const availableWorkouts = useMemo(() => {
        if (!selectedCategory) return [];
        return PDF_WORKOUTS.filter(workout => workout.category === selectedCategory);
    }, [selectedCategory]);

    const handleCategorySelect = (category: WorkoutCategory) => {
        setSelectedCategory(category);
        // Reset day assignments when category changes
        setDayAssignments({});
    };

    const handleDayAssignment = (workoutDay: number, weekDay: DayOfWeek | null) => {
        setDayAssignments(prev => ({
            ...prev,
            [workoutDay]: weekDay
        }));
    };

    const handleSaveAssignments = () => {
        if (!selectedCategory) {
            toast({
                title: "Selection Required",
                description: "Please select a workout category.",
                variant: "destructive"
            });
            return;
        }

        const assignments: PDFWorkoutAssignment[] = [];
        
        // Create assignments for each mapped day
        Object.entries(dayAssignments).forEach(([workoutDay, weekDay]) => {
            if (weekDay) {
                const pdfWorkout = availableWorkouts.find(w => w.day === parseInt(workoutDay));
                if (pdfWorkout) {
                    assignments.push({
                        day: weekDay,
                        pdfWorkout,
                        replaceExisting
                    });
                }
            }
        });

        if (assignments.length === 0) {
            toast({
                title: "No Assignments",
                description: "Please assign at least one workout day to a week day.",
                variant: "destructive"
            });
            return;
        }

        onAddPDFWorkouts(assignments);
        setIsDialogOpen(false);
        setSelectedCategory(null);
        setDayAssignments({});
        
        toast({
            title: "PDF Workouts Assigned",
            description: `${assignments.length} workout${assignments.length > 1 ? 's' : ''} from ${selectedCategory} have been assigned successfully.`,
        });
    };

    const handleViewPDF = (pdf: PDFWorkout) => {
        window.open(pdf.filePath, '_blank');
    };

    const handleDownloadPDF = (pdf: PDFWorkout) => {
        const link = document.createElement('a');
        link.href = pdf.filePath;
        link.download = `${pdf.name}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const getAssignedDays = () => {
        return Object.values(dayAssignments).filter(day => day !== null);
    };

    const categoryConfig = selectedCategory ? CATEGORY_CONFIGS[selectedCategory] : null;

    return (
        <div className={cn("w-full", className)}>
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
                setIsDialogOpen(open);
                if (!open) {
                    setSelectedCategory(null);
                    setDayAssignments({});
                    setReplaceExisting(true);
                }
            }}>
                <DialogTrigger asChild>
                    <Button
                        variant="default"
                        size="sm"
                        className="w-full text-xs sm:text-sm font-medium shadow-lg bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white border-0 transform hover:scale-105 transition-all duration-200 hover:shadow-xl relative overflow-hidden group h-9 sm:h-10"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-out" />
                        <FilePlus2 size={14} className="mr-1.5 text-white drop-shadow-sm flex-shrink-0" />
                        <span className="relative z-10 truncate min-w-0">Assign PDF Workout Plan</span>
                        <div className="ml-1 text-[10px] sm:text-xs bg-white/20 px-1.5 py-0.5 rounded-full font-normal hidden xs:block">
                            Premium
                        </div>
                    </Button>
                </DialogTrigger>

                <DialogContent className="w-[95vw] max-w-7xl h-[90vh] max-h-[90vh] overflow-hidden flex flex-col p-2 sm:p-4 md:p-6">
                    <DialogHeader className="pb-2 sm:pb-3 md:pb-4">
                        <DialogTitle className="flex items-center gap-2 text-sm sm:text-base">
                            <BookOpen className="h-4 w-4 sm:h-5 sm:w-5" />
                            <span className="truncate">Assign PDF Workout Plan</span>
                        </DialogTitle>
                        <DialogDescription className="text-xs sm:text-sm text-left">
                            Choose a workout category and assign each workout day to specific days of the week.
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="flex-1 overflow-auto space-y-3 sm:space-y-4">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                            {/* Category Selection Section */}
                            <div className="space-y-3 sm:space-y-4">
                                <Card className="border-primary/20">
                                    <CardHeader className="pb-2 sm:pb-3">
                                        <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                                            <FileTextIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                                            <span className="text-xs sm:text-sm">Step 1: Select Category</span>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-2 sm:space-y-3">
                                        {Object.entries(CATEGORY_CONFIGS).map(([category, config]) => {
                                            const workoutCount = PDF_WORKOUTS.filter(w => w.category === category).length;
                                            const isSelected = selectedCategory === category;
                                            
                                            return (
                                                <Card 
                                                    key={category}
                                                    className={cn(
                                                        "cursor-pointer transition-all duration-200 hover:scale-[1.01] sm:hover:scale-[1.02]",
                                                        isSelected 
                                                            ? "ring-2 ring-primary bg-primary/5" 
                                                            : "hover:shadow-md"
                                                    )}
                                                    onClick={() => handleCategorySelect(category as WorkoutCategory)}
                                                >
                                                    <CardContent className="p-3 sm:p-4">
                                                        <div className="flex items-center gap-2 sm:gap-3">
                                                            <div className={cn(
                                                                "w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                                                                config.bgColor
                                                            )}>
                                                                <div className="scale-75 sm:scale-100">
                                                                    {config.icon}
                                                                </div>
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-1 sm:gap-2 mb-1">
                                                                    <h3 className="font-semibold text-xs sm:text-sm truncate">{category}</h3>
                                                                    {isSelected && (
                                                                        <Badge variant="default" className="text-[10px] sm:text-xs px-1 sm:px-2 py-0.5 flex-shrink-0">
                                                                            <Check className="h-2 w-2 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                                                                            <span className="hidden sm:inline">Selected</span>
                                                                            <span className="sm:hidden">✓</span>
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                                <p className="text-[10px] sm:text-xs text-muted-foreground">
                                                                    {workoutCount} workout days
                                                                </p>
                                                                <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1 line-clamp-2">
                                                                    {config.description}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            );
                                        })}
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Day Assignment Section */}
                            <div className="space-y-3 sm:space-y-4">
                                {selectedCategory ? (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="space-y-3 sm:space-y-4"
                                    >
                                        {/* Selected Category Summary */}
                                        <Card className={cn("border-2", categoryConfig?.borderColor, categoryConfig?.bgColor)}>
                                            <CardContent className="p-3 sm:p-4">
                                                <div className="flex items-center gap-2 sm:gap-3">
                                                    <div className={cn(
                                                        "w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                                                        categoryConfig?.bgColor
                                                    )}>
                                                        <div className="scale-75 sm:scale-100">
                                                            {categoryConfig?.icon}
                                                        </div>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-semibold text-xs sm:text-sm truncate">{selectedCategory}</h4>
                                                        <p className="text-[10px] sm:text-xs text-muted-foreground">
                                                            {availableWorkouts.length} workout days
                                                        </p>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        {/* Day Assignment */}
                                        <Card className="border-secondary/20">
                                            <CardHeader className="pb-2 sm:pb-3">
                                                <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                                                    <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                                                    <span className="text-xs sm:text-sm">Step 2: Assign Days</span>
                                                </CardTitle>
                                                <CardDescription className="text-[10px] sm:text-xs">
                                                    Assign each {selectedCategory} workout day to days of the week
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent className="space-y-3 sm:space-y-4">
                                                <div className="space-y-2 sm:space-y-3">
                                                    {availableWorkouts.map((workout) => (
                                                        <div key={workout.day} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-2 sm:p-3 border rounded-lg">
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center justify-between sm:justify-start gap-2 mb-1">
                                                                    <Badge variant="outline" className="text-[10px] sm:text-xs px-1 sm:px-2 py-0.5 flex-shrink-0">
                                                                        Day {workout.day}
                                                                    </Badge>
                                                                    <div className="flex gap-1">
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            onClick={() => handleViewPDF(workout)}
                                                                            className="h-5 w-5 sm:h-6 sm:w-6 p-0"
                                                                            title="View PDF"
                                                                        >
                                                                            <Eye className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                                                        </Button>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            onClick={() => handleDownloadPDF(workout)}
                                                                            className="h-5 w-5 sm:h-6 sm:w-6 p-0"
                                                                            title="Download PDF"
                                                                        >
                                                                            <Download className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                                <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                                                                    {workout.description}
                                                                </p>
                                                            </div>
                                                            <div className="flex items-center gap-2 pt-1 sm:pt-0">
                                                                <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                                                                <Select
                                                                    value={dayAssignments[workout.day] || "none"}
                                                                    onValueChange={(value) => 
                                                                        handleDayAssignment(
                                                                            workout.day, 
                                                                            value === "none" ? null : value as DayOfWeek
                                                                        )
                                                                    }
                                                                >
                                                                    <SelectTrigger className="w-full sm:w-32 h-8 text-xs">
                                                                        <SelectValue placeholder="Select day" />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="none">None</SelectItem>
                                                                        {DAYS_OF_WEEK.map((day) => (
                                                                            <SelectItem 
                                                                                key={day} 
                                                                                value={day}
                                                                                disabled={getAssignedDays().includes(day)}
                                                                            >
                                                                                {day}
                                                                            </SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>

                                                <Separator className="my-2 sm:my-3" />

                                                {/* Options */}
                                                <div className="space-y-2 sm:space-y-3">
                                                    <div className="flex items-start sm:items-center space-x-2">
                                                        <Switch 
                                                            id="replace-existing" 
                                                            checked={replaceExisting} 
                                                            onCheckedChange={setReplaceExisting}
                                                            className="mt-0.5 sm:mt-0"
                                                        />
                                                        <Label htmlFor="replace-existing" className="text-xs sm:text-sm leading-tight">
                                                            Replace existing exercises on assigned days
                                                        </Label>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        {/* Summary and Save */}
                                        {Object.values(dayAssignments).some(day => day !== null) && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                            >
                                                <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                                                    <CardContent className="p-3 sm:p-4">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 flex-shrink-0" />
                                                            <span className="text-xs sm:text-sm font-medium text-green-800 dark:text-green-200">
                                                                Ready to Apply
                                                            </span>
                                                        </div>
                                                        <div className="text-[10px] sm:text-xs text-green-700 dark:text-green-300 mb-3 space-y-0.5 sm:space-y-1">
                                                            {Object.entries(dayAssignments).map(([workoutDay, weekDay]) => 
                                                                weekDay && (
                                                                    <div key={workoutDay} className="flex flex-col sm:flex-row sm:items-center gap-1">
                                                                        <span className="font-medium">{selectedCategory} Day {workoutDay}</span>
                                                                        <span className="hidden sm:inline">→</span>
                                                                        <span className="text-green-600 dark:text-green-400">{weekDay}</span>
                                                                    </div>
                                                                )
                                                            )}
                                                        </div>
                                                        <Button
                                                            onClick={handleSaveAssignments}
                                                            size="sm"
                                                            className="w-full bg-green-600 hover:bg-green-700 text-white h-8 sm:h-9 text-xs sm:text-sm"
                                                        >
                                                            <Save className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                                                            Save Assignments
                                                        </Button>
                                                    </CardContent>
                                                </Card>
                                            </motion.div>
                                        )}
                                    </motion.div>
                                ) : (
                                    <Card className="border-dashed border-muted-foreground/30">
                                        <CardContent className="p-4 sm:p-8 text-center">
                                            <FileTextIcon className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground/50 mx-auto mb-2 sm:mb-3" />
                                            <p className="text-xs sm:text-sm text-muted-foreground">
                                                Select a workout category to continue
                                            </p>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default MultiDayPDFWorkoutSelector;
