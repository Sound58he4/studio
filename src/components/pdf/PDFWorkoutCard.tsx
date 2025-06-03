// src/components/pdf/PDFWorkoutCard.tsx
"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
    FileText, 
    Eye,
    Download,
    Trash2,
    ExternalLink,
    Loader2,
    Calendar,
    Clock,
    Target,
    Zap,
    Dumbbell,
    ChevronDown,
    ChevronUp,
    CheckCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PDFWorkout, WorkoutCategory } from './PDFWorkoutViewer';
import { getPowerWorkoutByDay } from '@/data/workouts/power-workout-plan';
import { getXtremeWorkoutByDay } from '@/data/workouts/xtreme-workout-plan';
import { getLightWorkoutByDay } from '@/data/workouts/light-workout-plan';
import { getMaxWorkoutByDay } from '@/data/workouts/max-workout-plan';
import WorkoutQuoteDisplay from '@/components/workout/WorkoutQuoteDisplay';
import YouTubeWorkoutExplanation from '@/components/workout/YouTubeWorkoutExplanation';

interface PDFWorkoutCardProps {
    pdfWorkout: PDFWorkout;
    onRemove?: () => void;
    showRemoveButton?: boolean;
    className?: string;
}

const CATEGORY_CONFIGS = {
    'POWER': {
        color: 'bg-red-500',
        textColor: 'text-red-700 dark:text-red-300',
        bgColor: 'bg-red-50 dark:bg-red-900/20',
        borderColor: 'border-red-200 dark:border-red-800',
        icon: <Zap className="h-4 w-4" />,
    },
    'XTREME WORKOUT': {
        color: 'bg-purple-500',
        textColor: 'text-purple-700 dark:text-purple-300',
        bgColor: 'bg-purple-50 dark:bg-purple-900/20',
        borderColor: 'border-purple-200 dark:border-purple-800',
        icon: <Target className="h-4 w-4" />,
    },
    'LIGHT WORKOUT': {
        color: 'bg-green-500',
        textColor: 'text-green-700 dark:text-green-300',
        bgColor: 'bg-green-50 dark:bg-green-900/20',
        borderColor: 'border-green-200 dark:border-green-800',
        icon: <Clock className="h-4 w-4" />,
    },
    'MAX WORKOUT': {
        color: 'bg-orange-500',
        textColor: 'text-orange-700 dark:text-orange-300',
        bgColor: 'bg-orange-50 dark:bg-orange-900/20',
        borderColor: 'border-orange-200 dark:border-orange-800',
        icon: <Dumbbell className="h-4 w-4" />,
    }
};

const PDFWorkoutCard: React.FC<PDFWorkoutCardProps> = ({
    pdfWorkout,
    onRemove,
    showRemoveButton = true,
    className
}) => {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState<'view' | 'download' | null>(null);
    const [isExpanded, setIsExpanded] = useState(false);    const config = CATEGORY_CONFIGS[pdfWorkout.category];
    
    // Get workout details based on category
    const getWorkoutDetails = () => {
        switch (pdfWorkout.category) {
            case 'POWER':
                return getPowerWorkoutByDay(pdfWorkout.day);
            case 'XTREME WORKOUT':
                return getXtremeWorkoutByDay(pdfWorkout.day);
            case 'LIGHT WORKOUT':
                return getLightWorkoutByDay(pdfWorkout.day);
            case 'MAX WORKOUT':
                return getMaxWorkoutByDay(pdfWorkout.day);
            default:
                return null;
        }
    };

    const workoutDetails = getWorkoutDetails();

    const handleView = async () => {
        setIsLoading('view');
        try {
            window.open(pdfWorkout.filePath, '_blank');
            toast({
                title: "PDF Opened",
                description: `${pdfWorkout.name} opened in new tab`,
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

    const handleDownload = async () => {
        setIsLoading('download');
        try {
            const link = document.createElement('a');
            link.href = pdfWorkout.filePath;
            link.download = `${pdfWorkout.name}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            toast({
                title: "Download Started",
                description: `${pdfWorkout.name} download initiated`,
            });
        } catch (error) {
            toast({
                title: "Download Error",
                description: "Failed to download PDF file",
                variant: "destructive"
            });
        } finally {
            setIsLoading(null);
        }
    };

    const handleRemove = () => {
        onRemove?.();
        toast({
            title: "PDF Workout Removed",
            description: `${pdfWorkout.name} has been removed from your plan`,
        });
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={cn("w-full", className)}
        >            <Card className={cn(
                "relative overflow-hidden transition-all duration-300 hover:shadow-md group",
                config.borderColor,
                config.bgColor
            )}>
                <CardContent className="p-3 sm:p-4">
                    <div className="flex items-start justify-between gap-2 sm:gap-3">
                        {/* PDF Info */}
                        <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                            <div className={cn(
                                "w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                                "bg-gradient-to-br from-white/20 to-white/5 border border-white/20"
                            )}>
                                <FileText className={cn("h-4 w-4 sm:h-5 sm:w-5", config.textColor)} />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1 sm:gap-2 mb-1">
                                    <h4 className={cn("font-semibold text-xs sm:text-sm truncate", config.textColor)}>
                                        {pdfWorkout.name}
                                    </h4>
                                    <Badge 
                                        variant="secondary" 
                                        className={cn("text-[10px] sm:text-xs shrink-0", config.color, "text-white")}
                                    >
                                        Day {pdfWorkout.day}
                                    </Badge>
                                </div>
                                
                                <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                                    <Badge variant="outline" className="text-[10px] sm:text-xs">
                                        {config.icon}
                                        <span className="ml-1">{pdfWorkout.category}</span>
                                    </Badge>
                                </div>
                                
                                {pdfWorkout.description && (
                                    <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-2">
                                        {pdfWorkout.description}
                                    </p>
                                )}
                                  {/* Show additional details for all workout types with structured data */}
                                {workoutDetails && (
                                    <div className="mt-1 sm:mt-2">
                                        <p className="text-[10px] sm:text-xs font-medium text-muted-foreground">
                                            {workoutDetails.name}
                                        </p>
                                        <p className="text-[10px] sm:text-xs text-muted-foreground">
                                            {workoutDetails.exercises.length} exercises
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>                        {/* Action Buttons */}
                        <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
                            {/* Show expand button for workouts with structured data */}
                            {workoutDetails && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setIsExpanded(!isExpanded)}
                                    className="h-6 w-6 sm:h-8 sm:w-8 p-0 hover:bg-white/20"
                                    title={isExpanded ? "Collapse details" : "View workout details"}
                                >
                                    {isExpanded ? (
                                        <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4" />
                                    ) : (
                                        <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />
                                    )}
                                </Button>
                            )}
                            
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleView}
                                disabled={isLoading === 'view'}
                                className="h-6 w-6 sm:h-8 sm:w-8 p-0 hover:bg-white/20"
                                title="View PDF"
                            >
                                {isLoading === 'view' ? (
                                    <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                                ) : (
                                    <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                                )}
                            </Button>
                            
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleDownload}
                                disabled={isLoading === 'download'}
                                className="h-6 w-6 sm:h-8 sm:w-8 p-0 hover:bg-white/20"
                                title="Download PDF"
                            >
                                {isLoading === 'download' ? (
                                    <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                                ) : (
                                    <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                                )}
                            </Button>
                            
                            {showRemoveButton && onRemove && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleRemove}
                                    className="h-6 w-6 sm:h-8 sm:w-8 p-0 hover:bg-destructive/20 hover:text-destructive"
                                    title="Remove PDF workout"
                                >
                                    <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                                </Button>
                            )}
                        </div>
                    </div>                    {/* Expanded Section for All Workout Types */}
                    {isExpanded && workoutDetails && (<motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className="mt-3 sm:mt-4 space-y-3 sm:space-y-4 overflow-hidden"
                        >                            {/* Workout Quote */}
                            <WorkoutQuoteDisplay 
                                quote={workoutDetails.quote}
                                variant="minimal"
                                showIcon={false}
                                className="text-[10px] sm:text-xs"
                            />
                            
                            {/* YouTube Explanation */}
                            <YouTubeWorkoutExplanation
                                youtubeUrl={workoutDetails.youtubeExplanationUrl}
                                workoutName={workoutDetails.name}
                                description="Watch how to perform this workout properly"
                            />
                            
                            {/* Exercise Preview */}
                            <div className="bg-white/10 rounded-lg p-2 sm:p-3 border border-white/20">
                                <h5 className="text-[10px] sm:text-xs font-semibold mb-1 sm:mb-2 text-foreground/80">
                                    Exercises Preview ({workoutDetails.exercises.length} total)
                                </h5>
                                <div className="space-y-1 max-h-24 sm:max-h-32 overflow-y-auto">
                                    {workoutDetails.exercises.slice(0, 5).map((exercise, idx) => (
                                        <div key={idx} className="flex justify-between items-center text-[10px] sm:text-xs">
                                            <span className="text-foreground/70 truncate mr-2">{exercise.exercise}</span>
                                            <span className="text-muted-foreground whitespace-nowrap">
                                                {exercise.sets && exercise.reps ? `${exercise.sets} x ${exercise.reps}` : 'See PDF'}
                                            </span>
                                        </div>
                                    ))}
                                    {workoutDetails.exercises.length > 5 && (
                                        <p className="text-[10px] sm:text-xs text-muted-foreground italic">
                                            +{workoutDetails.exercises.length - 5} more exercises...
                                        </p>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}                    {/* Action Bar */}
                    <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-white/10">
                        <div className="flex flex-col sm:flex-row gap-1.5 sm:gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleView}
                                disabled={isLoading !== null}
                                className={cn(
                                    "flex-1 text-[10px] sm:text-xs h-6 sm:h-7 border-white/20 hover:bg-white/10",
                                    config.textColor
                                )}
                            >
                                {isLoading === 'view' ? (
                                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                ) : (
                                    <ExternalLink className="h-3 w-3 mr-1" />
                                )}
                                Open PDF
                            </Button>
                            
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleDownload}
                                disabled={isLoading !== null}
                                className={cn(
                                    "flex-1 text-[10px] sm:text-xs h-6 sm:h-7 border-white/20 hover:bg-white/10",
                                    config.textColor
                                )}
                            >
                                {isLoading === 'download' ? (
                                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                ) : (
                                    <Download className="h-3 w-3 mr-1" />
                                )}
                                Download
                            </Button>                            {workoutDetails && (
                                <Badge 
                                    variant="secondary" 
                                    className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800 text-[10px] sm:text-xs w-full sm:w-auto justify-center sm:justify-start"
                                >
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Exercises Added
                                </Badge>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
};

export default PDFWorkoutCard;
