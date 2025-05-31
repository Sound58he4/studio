// Route-level lazy loading wrapper with performance optimizations
"use client";

import React, { Suspense, memo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

// Generic loading skeleton for routes
export const RouteLoadingSkeleton = memo(() => (
  <div className="min-h-screen p-4 space-y-6">
    <Card>
      <CardHeader>
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
        <Skeleton className="h-48 w-full" />
      </CardContent>
    </Card>
  </div>
));

// Route-specific loading skeletons
export const DashboardSkeleton = memo(() => (
  <div className="min-h-screen grid grid-cols-1 lg:grid-cols-4 gap-6 p-4">
    <div className="lg:col-span-3 space-y-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    </div>
    <div className="space-y-4">
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  </div>
));

export const ChatSkeleton = memo(() => (
  <div className="h-screen flex flex-col">
    <div className="border-b p-4">
      <div className="flex items-center space-x-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
    </div>
    <div className="flex-1 p-4 space-y-4">
      <Skeleton className="h-16 w-3/4" />
      <Skeleton className="h-12 w-1/2 ml-auto" />
      <Skeleton className="h-20 w-2/3" />
    </div>
    <div className="border-t p-4">
      <Skeleton className="h-12 w-full" />
    </div>
  </div>
));

export const ProfileSkeleton = memo(() => (
  <div className="max-w-4xl mx-auto p-6 space-y-6">
    <Card>
      <CardHeader>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-24 w-full" />
        </div>
      </CardContent>
    </Card>
  </div>
));

// Generic wrapper for lazy-loaded routes
interface LazyRouteWrapperProps {
  children: React.ReactNode;
  fallback?: React.ComponentType;
}

export const LazyRouteWrapper = memo<LazyRouteWrapperProps>(({ 
  children, 
  fallback: FallbackComponent = RouteLoadingSkeleton 
}) => (
  <Suspense fallback={<FallbackComponent />}>
    {children}
  </Suspense>
));

// Loading overlay for route transitions
export const RouteTransitionLoader = memo(() => (
  <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
    <div className="flex items-center space-x-2">
      <Loader2 className="h-6 w-6 animate-spin" />
      <span className="text-sm text-muted-foreground">Loading...</span>
    </div>
  </div>
));
