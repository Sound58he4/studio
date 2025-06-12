// src/components/pdf/PDFWorkoutIntegration.tsx
"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
    CheckCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import PDFWorkoutViewer, { PDFWorkout, WorkoutCategory } from './PDFWorkoutViewer';
import { DayOfWeek } from '@/app/workout-plans/page';

interface PDFWorkoutIntegrationProps {
    day: DayOfWeek;
    onAddPDFWorkout: (day: DayOfWeek, pdfWorkout: PDFWorkout, replaceExisting: boolean) => void;
    className?: string;
}

const PDFWorkoutIntegration: React.FC<PDFWorkoutIntegrationProps> = ({
    day,
    onAddPDFWorkout,
    className
}) => {
    const { toast } = useToast();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedPDF, setSelectedPDF] = useState<PDFWorkout | null>(null);
    const [replaceExisting, setReplaceExisting] = useState(true);

    const handleSelectPDF = (pdf: PDFWorkout) => {
        setSelectedPDF(pdf);
    };

    const handleAddPDFToDay = () => {
        if (selectedPDF) {
            onAddPDFWorkout(day, selectedPDF, replaceExisting);
            setIsDialogOpen(false);
            setSelectedPDF(null);
            toast({
                title: replaceExisting ? "PDF Workout Exercises Added" : "PDF Workout Added",
                description: `${selectedPDF.name} has been added to ${day}${replaceExisting ? ", replacing existing exercises" : ""}`,
            });
        }
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
    };    return (
        <div className={cn("w-full", className)}>
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
                setIsDialogOpen(open);
                if (!open) {
                    setSelectedPDF(null);
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
                        <span className="relative z-10 truncate min-w-0">Add PDF Workout</span>
                        <div className="ml-1 text-[10px] sm:text-xs bg-white/20 px-1.5 py-0.5 rounded-full font-normal hidden xs:block">
                            Premium
                        </div>
                    </Button>
                </DialogTrigger>

                <DialogContent className="w-[95vw] max-w-6xl h-[90vh] max-h-[90vh] overflow-hidden flex flex-col p-3 sm:p-6">
                    <DialogHeader className="pb-2 sm:pb-4">
                        <DialogTitle className="flex items-center gap-2 text-sm sm:text-base">
                            <BookOpen className="h-4 w-4 sm:h-5 sm:w-5" />
                            Choose Premium PDF Workout for {day}
                        </DialogTitle>
                        <DialogDescription className="text-xs sm:text-sm">
                            Select from our premium workout plans: <strong>Max</strong> (Maximum intensity), <strong>Xtreme</strong> (Extreme challenges), <strong>Power</strong> (Strength focused), or <strong>Light</strong> (Beginner friendly).
                            All plans can replace your current exercises with professional PDF content.
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="flex-1 overflow-auto">
                        <PDFWorkoutViewer
                            onSelectPDF={handleSelectPDF}
                            className="border-0 shadow-none"
                        />
                    </div>
                    
                    <AnimatePresence>
                        {selectedPDF && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="border-t pt-3 sm:pt-4 mt-3 sm:mt-4"
                            >
                                <Card className="bg-gradient-to-br from-primary/5 to-purple/5 border-primary/20 shadow-md">
                                    <CardContent className="p-3 sm:p-4">
                                        <div className="flex flex-col space-y-3 sm:space-y-4">
                                            <div className="flex flex-col gap-3">
                                                <div className="flex items-start gap-2 sm:gap-3">
                                                    <div className="w-8 h-8 sm:w-12 sm:h-12 bg-gradient-to-br from-primary/20 to-purple/20 rounded-lg flex items-center justify-center shadow-inner flex-shrink-0">
                                                        <FileTextIcon className="h-4 w-4 sm:h-6 sm:w-6 text-primary" />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <h4 className="font-semibold text-sm sm:text-base truncate">{selectedPDF.name}</h4>
                                                            <Badge className="bg-gradient-to-r from-amber-500 to-orange-600 text-white text-[10px] sm:text-xs font-semibold px-1.5 py-0.5 flex-shrink-0">
                                                                PREMIUM
                                                            </Badge>
                                                        </div>
                                                        <p className="text-xs sm:text-sm text-muted-foreground">
                                                            {selectedPDF.category} • Day {selectedPDF.day}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                                            {selectedPDF.description}
                                                        </p>
                                                    </div>
                                                </div>
                                                
                                                <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-2 sm:justify-end">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleViewPDF(selectedPDF)}
                                                        className="text-xs hover:bg-blue-50 hover:border-blue-300 h-8 sm:h-9"
                                                    >
                                                        <Eye className="h-3 w-3 mr-1.5 flex-shrink-0" />
                                                        <span>Preview</span>
                                                    </Button>
                                                    
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleDownloadPDF(selectedPDF)}
                                                        className="text-xs hover:bg-green-50 hover:border-green-300 h-8 sm:h-9"
                                                    >
                                                        <Download className="h-3 w-3 mr-1.5 flex-shrink-0" />
                                                        <span>Download</span>
                                                    </Button>
                                                </div>
                                            </div>
                                            
                                            <div className="flex flex-col gap-3 border-t border-primary/10 pt-3 sm:pt-4">
                                                <div className="flex flex-col gap-2">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center space-x-2">
                                                            <Switch 
                                                                id="replace-existing" 
                                                                checked={replaceExisting} 
                                                                onCheckedChange={setReplaceExisting}
                                                            />
                                                            <Label htmlFor="replace-existing" className="text-xs sm:text-sm">
                                                                Replace existing exercises
                                                            </Label>
                                                        </div>
                                                        <Badge className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border-green-200 text-[10px] sm:text-xs shadow-sm flex-shrink-0">
                                                            <CheckCircle className="h-3 w-3 mr-1" />
                                                            Available
                                                        </Badge>
                                                    </div>
                                                </div>
                                                
                                                <Button
                                                    onClick={handleAddPDFToDay}
                                                    size="sm"
                                                    className="w-full text-xs sm:text-sm bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 h-9 sm:h-10"
                                                >
                                                    <Dumbbell className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 flex-shrink-0" />
                                                    <span className="truncate min-w-0">
                                                        {replaceExisting ? "Replace with Premium" : "Add Premium Plan"}
                                                    </span>
                                                    <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1.5 flex-shrink-0" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default PDFWorkoutIntegration;
