// Route preloading utilities for improved navigation performance
"use client";

import { useRouter } from 'next/navigation';
import { useCallback, useEffect } from 'react';

// Routes that are commonly navigated to
const PRELOAD_ROUTES = [
  '/dashboard',
  '/log',
  '/history',
  '/profile',
  '/friends',
  '/quick-log',
  '/points'
] as const;

type PreloadRoute = typeof PRELOAD_ROUTES[number];

// Hook for route preloading
export const useRoutePreloader = () => {
  const router = useRouter();

  const preloadRoute = useCallback((route: string) => {
    router.prefetch(route);
  }, [router]);

  const preloadCommonRoutes = useCallback(() => {
    PRELOAD_ROUTES.forEach(route => {
      router.prefetch(route);
    });
  }, [router]);

  return {
    preloadRoute,
    preloadCommonRoutes
  };
};

// Component to preload critical routes on mount
export const RoutePreloader = () => {
  const { preloadCommonRoutes } = useRoutePreloader();

  useEffect(() => {
    // Preload common routes after a short delay to not block initial render
    const timer = setTimeout(() => {
      preloadCommonRoutes();
    }, 1000);

    return () => clearTimeout(timer);
  }, [preloadCommonRoutes]);

  return null;
};

// Enhanced navigation with preloading
export const useEnhancedNavigation = () => {
  const router = useRouter();
  const { preloadRoute } = useRoutePreloader();

  const navigateWithPreload = useCallback((route: string) => {
    // Preload the route before navigating
    preloadRoute(route);
    
    // Small delay to allow prefetch to start
    setTimeout(() => {
      router.push(route);
    }, 50);
  }, [router, preloadRoute]);

  const navigateBack = useCallback(() => {
    router.back();
  }, [router]);

  return {
    navigateWithPreload,
    navigateBack,
    router
  };
};

// Link component with built-in preloading on hover
import Link from 'next/link';
import { forwardRef } from 'react';

interface PreloadLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  preloadDelay?: number;
}

export const PreloadLink = forwardRef<HTMLAnchorElement, PreloadLinkProps>(({
  href,
  children,
  className,
  preloadDelay = 100,
  ...props
}, ref) => {
  const { preloadRoute } = useRoutePreloader();
  let preloadTimer: NodeJS.Timeout;

  const handleMouseEnter = () => {
    preloadTimer = setTimeout(() => {
      preloadRoute(href);
    }, preloadDelay);
  };

  const handleMouseLeave = () => {
    if (preloadTimer) {
      clearTimeout(preloadTimer);
    }
  };

  return (
    <Link 
      href={href}
      className={className}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      ref={ref}
      {...props}
    >
      {children}
    </Link>
  );
});
