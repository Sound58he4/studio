// Lazy-loaded Dashboard page with performance optimizations
"use client";

import React, { Suspense, lazy } from 'react';
import { DashboardSkeleton } from '@/components/common/RouteLoader';

// Lazy load the main Dashboard component
const DashboardPage = lazy(() => 
  import('./dashboard-main').then(module => ({ 
    default: module.DashboardMainPage 
  }))
);

export default function Dashboard() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardPage />
    </Suspense>
  );
}
