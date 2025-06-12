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
}) => {    const { toast } = useToast();
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
                    setReplaceExisting(true); // Reset to default value when dialog closes
                }
            }}>
                <DialogTrigger asChild>
                    <motion.div
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full"
                    >
                        <Button
                            size="lg"
                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg text-sm sm:text-base h-12 sm:h-14"
                        >
                            <motion.div
                                animate={{ rotate: [0, 5, 0] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            >
                                <FilePlus2 size={20} className="mr-2 sm:mr-3" />
                            </motion.div>
                            <div className="flex flex-col items-start text-left">
                                <span className="font-semibold">Browse PDF Workouts</span>
                                <span className="text-xs opacity-90">Power • Light • Max • Xtreme</span>
                            </div>
                        </Button>
                    </motion.div>
                </DialogTrigger>                <DialogContent className="w-[95vw] max-w-6xl h-[90vh] max-h-[90vh] overflow-hidden flex flex-col p-3 sm:p-6">
                    <DialogHeader className="pb-2 sm:pb-4">
                        <DialogTitle className="flex items-center gap-2 text-sm sm:text-base">
                            <BookOpen className="h-4 w-4 sm:h-5 sm:w-5" />
                            Choose PDF Workout for {day}
                        </DialogTitle>                        <DialogDescription className="text-xs sm:text-sm">
                            Select a pre-designed workout PDF to add to your {day} routine. 
                            All workout types can replace your current exercises with the PDF content.
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="flex-1 overflow-auto">
                        <PDFWorkoutViewer
                            onSelectPDF={handleSelectPDF}
                            className="border-0 shadow-none"
                        />
                    </div>
                    
                    {/* Selection Summary */}                    <AnimatePresence>
                        {selectedPDF && (                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="border-t pt-3 sm:pt-4 mt-3 sm:mt-4"
                            >
                                <Card className="bg-primary/5 border-primary/20">
                                    <CardContent className="p-3 sm:p-4">
                                        <div className="flex flex-col space-y-3 sm:space-y-4">
                                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                                <div className="flex items-center gap-2 sm:gap-3">
                                                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                                                        <FileTextIcon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <h4 className="font-semibold text-sm sm:text-base truncate">{selectedPDF.name}</h4>
                                                        <p className="text-xs sm:text-sm text-muted-foreground">
                                                            {selectedPDF.category} • Day {selectedPDF.day}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                                            {selectedPDF.description}
                                                        </p>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleViewPDF(selectedPDF)}
                                                        className="flex-1 sm:flex-initial text-xs"
                                                    >
                                                        <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                                        <span className="hidden sm:inline">Preview</span>
                                                        <span className="sm:hidden">View</span>
                                                    </Button>
                                                    
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleDownloadPDF(selectedPDF)}
                                                        className="flex-1 sm:flex-initial text-xs"
                                                    >
                                                        <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                                        <span className="hidden sm:inline">Download</span>
                                                        <span className="sm:hidden">Get</span>
                                                    </Button>
                                                </div>
                                            </div>
                                            
                                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-primary/10 pt-3 sm:pt-4">
                                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                                                    <div className="flex items-center space-x-2">
                                                        <Switch 
                                                            id="replace-existing" 
                                                            checked={replaceExisting} 
                                                            onCheckedChange={setReplaceExisting}
                                                        />
                                                        <Label htmlFor="replace-existing" className="text-xs sm:text-sm">
                                                            Replace existing exercises
                                                        </Label>
                                                    </div>                                                    <Badge className="bg-green-100 text-green-700 border-green-200 text-xs self-start">
                                                            <CheckCircle className="h-3 w-3 mr-1" />
                                                            Available
                                                        </Badge>
                                                </div>
                                                
                                                <Button
                                                    onClick={handleAddPDFToDay}
                                                    size="sm"
                                                    className="w-full sm:w-auto text-xs sm:text-sm"
                                                >
                                                    <Dumbbell className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                                    <span className="truncate">
                                                        {replaceExisting ? "Replace with PDF Exercises" : "Add to Day"}
                                                    </span>
                                                    <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
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
