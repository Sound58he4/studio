// Performance monitoring hook
import { useEffect, useRef } from 'react';

interface PerformanceMetrics {
  renderTime: number;
  componentName: string;
}

export const usePerformanceMonitor = (componentName: string) => {
  const renderStartTime = useRef<number>(0);
  const renderCount = useRef<number>(0);

  useEffect(() => {
    renderStartTime.current = performance.now();
    renderCount.current += 1;
  });

  useEffect(() => {
    const renderEndTime = performance.now();
    const renderTime = renderEndTime - renderStartTime.current;
    
    // Only log in development and if render time is significant
    if (process.env.NODE_ENV === 'development' && renderTime > 16) { // 16ms = 60fps threshold
      console.warn(`🐌 Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms (render #${renderCount.current})`);
    }
  });

  return {
    renderCount: renderCount.current,
    measureRender: (callback: () => void) => {
      const start = performance.now();
      callback();
      const end = performance.now();
      const duration = end - start;
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`⏱️ ${componentName} operation took ${duration.toFixed(2)}ms`);
      }
      
      return duration;
    }
  };
};

// Hook to detect memory leaks
export const useMemoryMonitor = (componentName: string) => {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && 'memory' in performance) {
      const checkMemory = () => {
        const memory = (performance as any).memory;
        if (memory) {
          console.log(`💾 ${componentName} Memory: ${Math.round(memory.usedJSHeapSize / 1048576)}MB used`);
        }
      };

      const interval = setInterval(checkMemory, 5000); // Check every 5 seconds
      return () => clearInterval(interval);
    }
  }, [componentName]);
};

// Hook to monitor Firebase operations
export const useFirebasePerformance = () => {
  const measureFirebaseOperation = async <T>(
    operationName: string,
    operation: () => Promise<T>
  ): Promise<T> => {
    const start = performance.now();
    
    try {
      const result = await operation();
      const end = performance.now();
      const duration = end - start;
      
      if (process.env.NODE_ENV === 'development') {
        if (duration > 1000) {
          console.warn(`🔥 Slow Firebase operation: ${operationName} took ${duration.toFixed(2)}ms`);
        } else {
          console.log(`🔥 Firebase ${operationName}: ${duration.toFixed(2)}ms`);
        }
      }
      
      return result;
    } catch (error) {
      const end = performance.now();
      const duration = end - start;
      console.error(`🔥 Firebase ${operationName} failed after ${duration.toFixed(2)}ms:`, error);
      throw error;
    }
  };

  return { measureFirebaseOperation };
};

// Hook to optimize re-renders
export const useRenderOptimization = (dependencies: any[], componentName: string) => {
  const previousDeps = useRef(dependencies);
  const renderCount = useRef(0);

  useEffect(() => {
    renderCount.current += 1;
    
    if (process.env.NODE_ENV === 'development') {
      const changedDeps = dependencies.filter((dep, index) => dep !== previousDeps.current[index]);
      
      if (changedDeps.length > 0 && renderCount.current > 1) {
        console.log(`🔄 ${componentName} re-rendered (${renderCount.current}x) due to:`, changedDeps);
      }
    }
    
    previousDeps.current = dependencies;
  });

  return renderCount.current;
};