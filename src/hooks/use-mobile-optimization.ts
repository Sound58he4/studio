// Mobile-specific performance optimizations hook
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';

interface MobileOptimizationConfig {
  enableAnimations: boolean;
  enableParallax: boolean;
  enableHeavyComponents: boolean;
  reducedMotion: boolean;
  connectionType: 'slow' | 'fast' | 'unknown';
  batteryLevel: number | null;
  isLowPowerMode: boolean;
}

interface PerformanceMetrics {
  renderTime: number;
  loadTime: number;
  interactionTime: number;
  memoryUsage: number;
}

export const useMobileOptimization = () => {
  const [config, setConfig] = useState<MobileOptimizationConfig>({
    enableAnimations: true,
    enableParallax: true,
    enableHeavyComponents: true,
    reducedMotion: false,
    connectionType: 'unknown',
    batteryLevel: null,
    isLowPowerMode: false,
  });

  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    loadTime: 0,
    interactionTime: 0,
    memoryUsage: 0,
  });

  const [isMobile, setIsMobile] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState({
    isLowEndDevice: false,
    cores: 1,
    memory: 1,
    pixelRatio: 1,
  });

  const observerRef = useRef<PerformanceObserver | null>(null);

  // Detect device capabilities
  useEffect(() => {
    const detectDeviceCapabilities = () => {
      if (typeof window === 'undefined') return;

      const isMobileDevice = window.innerWidth < 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(isMobileDevice);

      // Detect hardware capabilities
      const cores = (navigator as any).hardwareConcurrency || 1;
      const memory = (navigator as any).deviceMemory || 1;
      const pixelRatio = window.devicePixelRatio || 1;
      
      // Consider device low-end if it has limited resources
      const isLowEndDevice = cores <= 2 || memory <= 2 || (isMobileDevice && pixelRatio <= 1.5);

      setDeviceInfo({
        isLowEndDevice,
        cores,
        memory,
        pixelRatio,
      });

      // Detect connection type
      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
      if (connection) {
        const connectionType = connection.effectiveType === '4g' || connection.effectiveType === '5g' ? 'fast' : 'slow';
        setConfig(prev => ({ ...prev, connectionType }));
      }

      // Detect reduced motion preference
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      
      // Battery API (if available)
      if ('getBattery' in navigator) {
        (navigator as any).getBattery().then((battery: any) => {
          const batteryLevel = battery.level * 100;
          const isLowPowerMode = batteryLevel < 20 || battery.charging === false;
          
          setConfig(prev => ({
            ...prev,
            batteryLevel,
            isLowPowerMode,
          }));
        });
      }

      // Update optimization config based on device capabilities
      setConfig(prev => ({
        ...prev,
        enableAnimations: !isLowEndDevice && !reducedMotion,
        enableParallax: !isLowEndDevice && !isMobileDevice,
        enableHeavyComponents: !isLowEndDevice,
        reducedMotion,
      }));
    };

    detectDeviceCapabilities();

    // Listen for changes
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleMotionChange = () => {
      setConfig(prev => ({ ...prev, reducedMotion: mediaQuery.matches }));
    };
    
    mediaQuery.addEventListener('change', handleMotionChange);
    window.addEventListener('resize', detectDeviceCapabilities);

    return () => {
      mediaQuery.removeEventListener('change', handleMotionChange);
      window.removeEventListener('resize', detectDeviceCapabilities);
    };
  }, []);

  // Performance monitoring
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Measure performance metrics
    const measurePerformance = () => {
      if ('performance' in window) {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        const loadTime = navigation.loadEventEnd - navigation.loadEventStart;
        
        // Memory usage (if available)
        const memoryInfo = (performance as any).memory;
        const memoryUsage = memoryInfo ? memoryInfo.usedJSHeapSize / 1024 / 1024 : 0;

        setMetrics(prev => ({
          ...prev,
          loadTime,
          memoryUsage,
        }));
      }
    };

    // Set up Performance Observer for real-time metrics
    if ('PerformanceObserver' in window) {
      observerRef.current = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'measure') {
            setMetrics(prev => ({
              ...prev,
              renderTime: entry.duration,
            }));
          }
          
          if (entry.entryType === 'first-input') {
            setMetrics(prev => ({
              ...prev,
              interactionTime: (entry as any).processingStart - entry.startTime,
            }));
          }
        }
      });

      observerRef.current.observe({ entryTypes: ['measure', 'first-input'] });
    }

    measurePerformance();

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  // Optimize component based on conditions
  const shouldOptimize = useCallback((component: 'animations' | 'images' | 'heavy-computation' | 'background-tasks') => {
    switch (component) {
      case 'animations':
        return !config.enableAnimations || config.reducedMotion || config.isLowPowerMode;
      case 'images':
        return config.connectionType === 'slow' || deviceInfo.isLowEndDevice;
      case 'heavy-computation':
        return !config.enableHeavyComponents || deviceInfo.cores <= 2;
      case 'background-tasks':
        return config.isLowPowerMode || deviceInfo.memory <= 2;
      default:
        return false;
    }
  }, [config, deviceInfo]);

  // Get optimized animation props
  const getAnimationProps = useCallback((defaultProps: any) => {
    if (shouldOptimize('animations')) {
      return {
        initial: defaultProps.animate || {},
        animate: defaultProps.animate || {},
        transition: { duration: 0 },
      };
    }
    return defaultProps;
  }, [shouldOptimize]);

  // Get optimized image props
  const getImageProps = useCallback((defaultProps: any) => {
    if (shouldOptimize('images')) {
      return {
        ...defaultProps,
        priority: false,
        quality: 60,
        placeholder: 'blur' as const,
      };
    }
    return defaultProps;
  }, [shouldOptimize]);

  // Debounced function for expensive operations
  const debounce = useCallback((func: Function, delay: number) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
  }, []);

  // Throttled function for frequent events
  const throttle = useCallback((func: Function, delay: number) => {
    let lastCall = 0;
    return (...args: any[]) => {
      const now = Date.now();
      if (now - lastCall >= delay) {
        lastCall = now;
        return func.apply(null, args);
      }
    };
  }, []);

  return {
    config,
    metrics,
    isMobile,
    deviceInfo,
    shouldOptimize,
    getAnimationProps,
    getImageProps,
    debounce,
    throttle,
    // Helper methods for performance optimization
    isLowEndDevice: deviceInfo.isLowEndDevice,
    isSlowConnection: config.connectionType === 'slow',
    shouldReduceAnimations: config.reducedMotion || config.isLowPowerMode,
    shouldLazyLoad: isMobile || deviceInfo.isLowEndDevice,
  };
};

// HOC for mobile-optimized components
export const withMobileOptimization = <P extends object>(
  Component: React.ComponentType<P>
) => {
  const OptimizedComponent: React.FC<P> = (props: P) => {
    const { shouldOptimize, isLowEndDevice } = useMobileOptimization();

    // Skip heavy components on low-end devices
    if (shouldOptimize('heavy-computation')) {
      return null;
    }

    return React.createElement(Component, props);
  };

  OptimizedComponent.displayName = `withMobileOptimization(${Component.displayName || Component.name})`;

  return React.memo(OptimizedComponent);
};

export default useMobileOptimization;
