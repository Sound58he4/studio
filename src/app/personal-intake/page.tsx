// src/app/personal-intake/page.tsx
"use client";

// This page is no longer used.
// The "Personal Intake" feature has been removed.
// Quick Log functionality is available on the /quick-log page.

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Info } from 'lucide-react';

export default function PersonalIntakePageRemoved() {
  return (
    <motion.div 
      className="max-w-3xl mx-auto my-8 px-4 text-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/5 pointer-events-none -z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2 }}
      />
      <Card className="shadow-lg border-border/20 bg-card/95 backdrop-blur-sm relative">
        <CardHeader className="bg-gradient-to-r from-muted/30 via-card to-card border-b p-5 md:p-6">
          <CardTitle className="text-2xl font-bold text-primary flex items-center justify-center gap-2">
            <Info className="h-7 w-7" /> Feature Update
          </CardTitle>
          <CardDescription className="text-base mt-1 text-muted-foreground">
            The "Personal Intake" feature has been streamlined.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 md:p-8">
          <p className="mb-6 text-muted-foreground">
            Functionality for managing your frequently eaten foods has been integrated into the "Quick Log" page.
            You can add, edit, delete, and log your common items directly from there.
          </p>
          <Link href="/quick-log" passHref>
            <Button variant="outline" className="shadow-sm hover:border-primary hover:text-primary">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go to Quick Log Page
            </Button>
          </Link>
        </CardContent>
      </Card>
    </motion.div>
  );
}
