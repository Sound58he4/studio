// src/components/report/ReportHeader.tsx
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
import type { ReportType, ProgressReportOutput } from '@/app/report/page'; // Assuming types are in page.tsx

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
    isDark?: boolean;
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
    isDark = false,
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
        const originalColors = new Map<HTMLElement, string>();
        currentReportElement.querySelectorAll('*').forEach((el) => {
             const htmlEl = el as HTMLElement;
             originalColors.set(htmlEl, htmlEl.style.color);
             htmlEl.style.color = '#000';
         });

        try {
            const canvas = await html2canvas(currentReportElement, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
            currentReportElement.style.backgroundColor = originalBg;
            originalColors.forEach((color, el) => { el.style.color = color; });

            const imgData = canvas.toDataURL('image/png'); const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
            const pdfWidth = pdf.internal.pageSize.getWidth(); const pdfHeight = pdf.internal.pageSize.getHeight();
            const imgProps = pdf.getImageProperties(imgData); const imgWidth = imgProps.width; const imgHeight = imgProps.height;
            const margin = 40;
            const availableWidth = pdfWidth - 2 * margin;
            const scale = availableWidth / imgWidth;
            const scaledHeight = imgHeight * scale;
            let positionY = margin;
            let remainingImageHeight = imgHeight;

            while (remainingImageHeight > 0) {
                const availablePageHeight = pdfHeight - 2 * margin;
                const sliceHeightInPixels = Math.min(remainingImageHeight, availablePageHeight / scale);
                const sliceHeightInPoints = sliceHeightInPixels * scale;
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = imgWidth;
                tempCanvas.height = sliceHeightInPixels;
                const ctx = tempCanvas.getContext('2d');
                if (!ctx) { throw new Error("Could not get canvas context"); }
                 ctx.drawImage(canvas, 0, imgHeight - remainingImageHeight, imgWidth, sliceHeightInPixels, 0, 0, imgWidth, sliceHeightInPixels);
                const pageImgData = tempCanvas.toDataURL('image/png');
                pdf.addImage(pageImgData, 'PNG', margin, positionY, availableWidth, sliceHeightInPoints);
                remainingImageHeight -= sliceHeightInPixels;
                if (remainingImageHeight > 0) {
                     pdf.addPage();
                     positionY = margin;
                 }
            }

            const filename = `Bago_Report_${activeTab}_${format(selectedDate, 'yyyyMMdd')}.pdf`; pdf.save(filename);
            toast({ title: "Download Complete", description: `${filename} saved.` });
        } catch (error) {
            console.error("Error generating PDF:", error);
            toast({ title: "Download Failed", description: "Could not generate PDF.", variant: "destructive" });
            currentReportElement.style.backgroundColor = originalBg;
            originalColors.forEach((color, el) => { el.style.color = color; });
        } finally { setIsDownloading(false); }
    }, [activeTab, report, selectedDate, reportContentRef, toast, setIsDownloading]);

    return (
        <CardHeader className={`border-b p-4 sm:p-5 md:p-6 transition-all duration-300 ${
            isDark 
                ? 'bg-gradient-to-r from-gray-800/50 via-gray-700/50 to-gray-800/50' 
                : 'bg-gradient-to-r from-primary/10 via-card to-card'
        }`}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                    <CardTitle className={`text-xl md:text-2xl font-bold flex items-center gap-2 ${
                        isDark ? 'text-white' : 'text-primary'
                    }`}>
                        <FileText className="h-6 w-6" /> Your Progress Report
                    </CardTitle>
                    <CardDescription className={`text-sm md:text-base mt-1 ${
                        isDark ? 'text-gray-400' : ''
                    }`}>
                        Review your performance and get AI-powered insights.
                    </CardDescription>
                </div>
                <Button onClick={handleDownloadPDF} size="sm" disabled={isDownloading || isLoading || !report} className="w-full sm:w-auto shadow-sm">
                    {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Download className="mr-2 h-4 w-4"/>} {isDownloading ? "Downloading..." : "Download PDF"}
                </Button>
            </div>
            <div className={`mt-4 flex flex-col sm:flex-row justify-between items-center gap-3 p-2 rounded-md border shadow-inner transition-all duration-300 ${
                isDark 
                    ? 'bg-gray-700/50 border-gray-600' 
                    : 'bg-muted/50'
            }`}>
                <Button variant="outline" size="icon" className="h-8 w-8 sm:h-9 sm:w-9" onClick={() => navigateDate('prev')} aria-label="Previous Period"> <ChevronLeft className="h-4 w-4" /> </Button>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant={"outline"} className={cn("w-[200px] sm:w-[280px] justify-start text-left font-normal h-8 sm:h-9 text-xs sm:text-sm", !selectedDate && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {getFormattedDateRange(activeTab, selectedDate)}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={selectedDate} onSelect={handleDateChange} initialFocus />
                    </PopoverContent>
                </Popover>
                <Button variant="outline" size="icon" className="h-8 w-8 sm:h-9 sm:w-9" onClick={() => navigateDate('next')} aria-label="Next Period"> <ChevronRight className="h-4 w-4" /> </Button>
            </div>
        </CardHeader>
    );
};

export default ReportHeader;
