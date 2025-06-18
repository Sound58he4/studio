// src/app/report/ReportHeader.tsx
"use client";

import React, { useCallback } from 'react';
import { CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Loader2, Download, Calendar as CalendarIcon, ChevronLeft, ChevronRight, FileText } from "lucide-react";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { format, addDays, subDays, addWeeks, subWeeks, addMonths, subMonths } from 'date-fns';
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { ReportType, ProgressReportOutput } from './page'; // Assuming types are in page.tsx

interface ReportHeaderProps {
    selectedDate: Date;
    activeTab: ReportType;
    setSelectedDate: (date: Date) => void;
    isDownloading: boolean;
    setIsDownloading: (isDownloading: boolean) => void;
    isLoading: boolean;
    report: ProgressReportOutput | null;
    reportContentRef: React.RefObject<HTMLDivElement | null>;
    getDateRange: (type: ReportType, date: Date) => { start: Date; end: Date };
}

const ReportHeader: React.FC<ReportHeaderProps> = ({
    selectedDate,
    activeTab,
    setSelectedDate,
    isDownloading,
    setIsDownloading,
    isLoading,
    report,
    reportContentRef,
    getDateRange,
}) => {
    const { toast } = useToast();

    const navigateDate = (direction: 'prev' | 'next') => {
        let newDate: Date;
        switch (activeTab) {
            case 'daily': newDate = direction === 'prev' ? subDays(selectedDate, 1) : addDays(selectedDate, 1); break;
            case 'weekly': newDate = direction === 'prev' ? subWeeks(selectedDate, 1) : addWeeks(selectedDate, 1); break;
            case 'monthly': newDate = direction === 'prev' ? subMonths(selectedDate, 1) : addMonths(selectedDate, 1); break;
        }
        setSelectedDate(newDate);
    };

    const handleDateChange = (date: Date | undefined) => { if (date) setSelectedDate(date); };

    const getFormattedDateRange = (type: ReportType, date: Date): string => {
        const { start, end } = getDateRange(type, date);
        switch (type) {
            case 'daily': return format(date, 'eeee, MMM d, yyyy');
            case 'weekly': return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
            case 'monthly': return format(date, 'MMMM yyyy');
        }
    };

     // PDF Download Handler
     const handleDownloadPDF = useCallback(async () => {
        const currentReportElement = reportContentRef.current;
        if (!currentReportElement || !report) {
            toast({ title: "Cannot Download", description: "Report content is not available.", variant: "destructive" }); return;
        }
        setIsDownloading(true); toast({ title: "Preparing Download", description: "Generating PDF..." });
        const originalBg = currentReportElement.style.backgroundColor;
        currentReportElement.style.backgroundColor = 'white'; // Ensure white background for PDF
        // Temporarily set text color to black for all elements for better PDF readability
        const originalColors = new Map<HTMLElement, string>();
        currentReportElement.querySelectorAll('*').forEach((el) => {
             const htmlEl = el as HTMLElement;
             originalColors.set(htmlEl, htmlEl.style.color);
             htmlEl.style.color = '#000';
         });


        try {
            // Render canvas with higher scale for better quality
            const canvas = await html2canvas(currentReportElement, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });

            // Restore original styles *after* canvas generation
            currentReportElement.style.backgroundColor = originalBg;
            originalColors.forEach((color, el) => { el.style.color = color; });


            const imgData = canvas.toDataURL('image/png'); const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
            const pdfWidth = pdf.internal.pageSize.getWidth(); const pdfHeight = pdf.internal.pageSize.getHeight();
            const imgProps = pdf.getImageProperties(imgData); const imgWidth = imgProps.width; const imgHeight = imgProps.height;
            const margin = 40; // Points
            const availableWidth = pdfWidth - 2 * margin;
            const scale = availableWidth / imgWidth; // Calculate scale based on available width
            const scaledHeight = imgHeight * scale;
            let positionY = margin; // Start position below top margin
            let remainingImageHeight = imgHeight;

            while (remainingImageHeight > 0) {
                const availablePageHeight = pdfHeight - 2 * margin; // Height available for image on one page
                const sliceHeightInPixels = Math.min(remainingImageHeight, availablePageHeight / scale); // Height of the image slice in pixels
                const sliceHeightInPoints = sliceHeightInPixels * scale; // Height of the image slice in PDF points

                // Create a temporary canvas for the current slice
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = imgWidth;
                tempCanvas.height = sliceHeightInPixels;
                const ctx = tempCanvas.getContext('2d');
                if (!ctx) { throw new Error("Could not get canvas context"); }

                // Draw the slice onto the temporary canvas
                // Source: x=0, y=currentPositionInImage, width=imgWidth, height=sliceHeightInPixels
                // Dest:   x=0, y=0, width=imgWidth, height=sliceHeightInPixels
                 ctx.drawImage(canvas, 0, imgHeight - remainingImageHeight, imgWidth, sliceHeightInPixels, 0, 0, imgWidth, sliceHeightInPixels);

                const pageImgData = tempCanvas.toDataURL('image/png');

                // Add image to PDF page
                pdf.addImage(pageImgData, 'PNG', margin, positionY, availableWidth, sliceHeightInPoints);

                remainingImageHeight -= sliceHeightInPixels;

                // Add new page if there's more image left
                if (remainingImageHeight > 0) {
                     pdf.addPage();
                     positionY = margin; // Reset Y position for the new page
                 }
            }


            const filename = `Bago_Report_${activeTab}_${format(selectedDate, 'yyyyMMdd')}.pdf`; pdf.save(filename);
            toast({ title: "Download Complete", description: `${filename} saved.` });
        } catch (error) {
            console.error("Error generating PDF:", error);
            toast({ title: "Download Failed", description: "Could not generate PDF.", variant: "destructive" });
            // Ensure styles are restored even on error
            currentReportElement.style.backgroundColor = originalBg;
            originalColors.forEach((color, el) => { el.style.color = color; });
        } finally { setIsDownloading(false); }
    }, [activeTab, report, selectedDate, reportContentRef, toast, setIsDownloading]);


    return (
        <>
            {/* Date Navigation */}
            <div className="mb-6 bg-white/40 backdrop-blur-sm border-0 shadow-clayInset rounded-2xl p-4">
                <div className="flex items-center justify-between">
                    <button 
                        onClick={() => navigateDate('prev')}
                        className="bg-white/40 backdrop-blur-sm shadow-clayInset hover:bg-white/60 rounded-2xl p-2 transition-all duration-300 hover:scale-105"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className={cn(
                                    "w-[240px] justify-center text-left font-normal bg-white/60 backdrop-blur-sm border-0 shadow-clayInset hover:bg-white/80 rounded-2xl transition-all duration-300",
                                    !selectedDate && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {selectedDate ? getFormattedDateRange(activeTab, selectedDate) : "Pick a date"}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-clayGlass backdrop-blur-sm border-0 shadow-clay rounded-3xl" align="center">
                            <Calendar
                                mode="single"
                                selected={selectedDate}
                                onSelect={handleDateChange}
                                initialFocus
                                className="pointer-events-auto"
                            />
                        </PopoverContent>
                    </Popover>

                    <button 
                        onClick={() => navigateDate('next')}
                        className="bg-white/40 backdrop-blur-sm shadow-clayInset hover:bg-white/60 rounded-2xl p-2 transition-all duration-300 hover:scale-105"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Download Button */}
            <div className="mb-6 flex justify-end">
                <Button 
                    onClick={handleDownloadPDF}
                    disabled={isDownloading || isLoading || !report}
                    className="bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-2xl shadow-clay transition-all duration-300 hover:shadow-clayStrong hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                >
                    {isDownloading ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Generating...
                        </>
                    ) : (
                        <>
                            <Download className="w-4 h-4 mr-2" />
                            Download PDF
                        </>
                    )}
                </Button>
            </div>
        </>
    );
};

export default ReportHeader;

