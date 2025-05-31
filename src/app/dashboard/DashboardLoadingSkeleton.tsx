"use client";

import React from 'react';
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const DashboardLoadingSkeleton: React.FC = () => {
    return (
        <div className="flex flex-col min-h-screen bg-gradient-to-br from-primary/5 via-background to-muted/50 p-4 md:p-6 lg:p-8 animate-pulse">
            <main className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                {/* Main content area skeleton */}
                <div className="lg:col-span-2 space-y-6 md:space-y-8">
                    {/* Goals Card Skeleton */}
                    <Card className="shadow-lg border border-primary/10 overflow-hidden">
                        <CardHeader className="p-5 md:p-6">
                            <Skeleton className="h-6 w-1/2 mb-2 rounded" />
                            <Skeleton className="h-4 w-3/4 rounded" />
                        </CardHeader>
                        <CardContent className="p-5 md:p-6 space-y-5">
                            <Skeleton className="h-12 w-full rounded" />
                            <Skeleton className="h-12 w-full rounded" />
                            <Skeleton className="h-12 w-full rounded" />
                            <Skeleton className="h-12 w-full rounded" />
                        </CardContent>
                    </Card>

                    {/* Calorie Balance Card Skeleton */}
                     <Card className="shadow-lg border border-primary/15 overflow-hidden">
                        <CardHeader className="p-3 sm:p-4 md:p-5 border-b border-primary/15">
                             <Skeleton className="h-5 w-3/5 mb-1 rounded" />
                             <Skeleton className="h-3 w-4/5 rounded" />
                        </CardHeader>
                        <CardContent className="p-3 sm:p-4 md:p-5 grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4 items-stretch">
                             {[...Array(3)].map((_, i) => (
                                  <div key={i} className="flex flex-col items-center justify-center text-center p-3 sm:p-4 rounded-lg border border-border/30 shadow-sm bg-muted/30">
                                      <Skeleton className="h-8 w-8 sm:h-10 sm:w-10 rounded-full mb-2" />
                                      <Skeleton className="h-3 w-16 mb-1.5" />
                                      <Skeleton className="h-6 w-20 mb-1" />
                                      <Skeleton className="h-3 w-12" />
                                  </div>
                              ))}
                         </CardContent>
                          <CardHeader className="p-2 sm:p-3 border-t justify-center text-center">
                             <Skeleton className="h-3 w-3/4 mx-auto" />
                         </CardHeader>
                     </Card>


                    {/* Workout Plan Skeleton */}
                    <Card className="shadow-xl border border-accent/20 overflow-hidden">
                        <CardHeader className="p-4 sm:p-5 border-b">
                            <Skeleton className="h-6 w-3/5 mb-1 rounded" />
                            <Skeleton className="h-4 w-4/5 rounded" />
                        </CardHeader>
                         <CardContent className="p-4 sm:p-5 space-y-4">
                             <Skeleton className="h-16 w-full rounded-lg" />
                             <Skeleton className="h-16 w-full rounded-lg" />
                             <Skeleton className="h-16 w-full rounded-lg" />
                         </CardContent>
                    </Card>

                    {/* Quick Actions Skeleton */}
                     <Card className="shadow-sm border border-border/20 overflow-hidden">
                         <CardHeader className="pb-2 pt-4 px-4 sm:pb-3 sm:pt-5 sm:px-5">
                             <Skeleton className="h-5 w-1/3 rounded" />
                         </CardHeader>
                         <CardContent className="p-3 sm:p-4 md:p-5 grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
                             {[...Array(4)].map((_, i) => (
                                 <div key={i} className="flex flex-col items-center justify-center text-center p-3 sm:p-4 gap-1.5 sm:gap-2 rounded-lg border bg-muted/30">
                                     <Skeleton className="h-6 w-6 rounded-full mb-1" />
                                     <Skeleton className="h-3 w-16 rounded" />
                                 </div>
                             ))}
                         </CardContent>
                     </Card>
                </div>

                {/* Sidebar area skeleton */}
                <div className="lg:col-span-1 space-y-6 md:space-y-8">
                    {/* Fitness Tip Skeleton */}
                     <Card className="shadow-md border-accent/20">
                         <CardHeader className="pb-3 pt-4 px-5">
                             <Skeleton className="h-5 w-3/4 rounded" />
                         </CardHeader>
                         <CardContent className="p-5">
                              <Skeleton className="h-4 w-full rounded" />
                              <Skeleton className="h-4 w-5/6 mt-2 rounded" />
                         </CardContent>
                     </Card>


                    {/* Weekly Summary Skeleton */}
                    <Card className="shadow-sm border border-border/20">
                        <CardHeader className="p-3 sm:p-4">
                            <Skeleton className="h-5 w-1/2 rounded" />
                        </CardHeader>
                        <CardContent className="text-sm space-y-3 p-4 sm:p-5">
                            <Skeleton className="h-4 w-3/4 rounded" />
                            <Skeleton className="h-4 w-1/2 rounded" />
                            <Skeleton className="h-4 w-2/3 rounded" />
                        </CardContent>
                    </Card>

                    {/* Recent Logs Skeleton */}
                    <Card className="shadow-sm border border-border/20">
                         <CardHeader className="p-3 sm:p-4">
                             <Skeleton className="h-5 w-1/2 rounded" />
                         </CardHeader>
                         <CardContent className="space-y-3 p-4 sm:p-5">
                             <Skeleton className="h-4 w-full rounded" />
                             <Skeleton className="h-4 w-5/6 rounded" />
                             <Skeleton className="h-4 w-3/4 rounded" />
                         </CardContent>
                         <CardHeader className="pt-2 sm:pt-3 pb-3 sm:pb-4 px-3 sm:px-4 flex justify-end">
                              <Skeleton className="h-4 w-1/4 rounded" />
                         </CardHeader>
                    </Card>
                </div>
            </main>
             <footer className="mt-12 pt-8 text-center text-xs text-muted-foreground border-t border-border/30">
                 <Skeleton className="h-3 w-1/2 mx-auto" />
             </footer>
        </div>
    );
};

export default DashboardLoadingSkeleton;
