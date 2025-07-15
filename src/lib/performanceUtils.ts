import React from 'react';

/**
 * Performance monitoring utilities
 * Provides tools for tracking and optimizing application performance
 */

export interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, unknown>;
}

export interface ComponentPerformanceData {
  componentName: string;
  renderCount: number;
  averageRenderTime: number;
  totalRenderTime: number;
  lastRenderTime: number;
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric> = new Map();
  private componentData: Map<string, ComponentPerformanceData> = new Map();

  /**
   * Start timing a performance metric
   */
  startTimer(name: string, metadata?: Record<string, unknown>): void {
    this.metrics.set(name, {
      name,
      startTime: performance.now(),
      metadata,
    });
  }

  /**
   * End timing a performance metric
   */
  endTimer(name: string): number | null {
    const metric = this.metrics.get(name);
    if (!metric) {
      console.warn(`Performance metric '${name}' not found`);
      return null;
    }

    metric.endTime = performance.now();
    metric.duration = metric.endTime - metric.startTime;

    // Log if duration is significant
    if (metric.duration > 100) {
      console.warn(`[PERFORMANCE] ${name} took ${metric.duration.toFixed(2)}ms`, metric.metadata);
    }

    this.metrics.delete(name);
    return metric.duration;
  }

  /**
   * Track component render performance
   */
  trackComponentRender(componentName: string, renderTime: number): void {
    const existing = this.componentData.get(componentName);
    
    if (existing) {
      existing.renderCount++;
      existing.totalRenderTime += renderTime;
      existing.averageRenderTime = existing.totalRenderTime / existing.renderCount;
      existing.lastRenderTime = renderTime;
    } else {
      this.componentData.set(componentName, {
        componentName,
        renderCount: 1,
        averageRenderTime: renderTime,
        totalRenderTime: renderTime,
        lastRenderTime: renderTime,
      });
    }

    // Log slow renders
    if (renderTime > 50) {
      console.warn(`[PERFORMANCE] ${componentName} render took ${renderTime.toFixed(2)}ms`);
    }
  }

  /**
   * Get performance report
   */
  getReport(): {
    metrics: PerformanceMetric[];
    components: ComponentPerformanceData[];
    summary: {
      totalComponents: number;
      averageRenderTime: number;
      slowestComponent: ComponentPerformanceData | null;
    };
  } {
    const components = Array.from(this.componentData.values());
    const totalRenderTime = components.reduce((sum, comp) => sum + comp.totalRenderTime, 0);
    const totalRenders = components.reduce((sum, comp) => sum + comp.renderCount, 0);
    const averageRenderTime = totalRenders > 0 ? totalRenderTime / totalRenders : 0;
    const slowestComponent = components.reduce((slowest, current) => 
      current.averageRenderTime > (slowest?.averageRenderTime || 0) ? current : slowest, 
      null as ComponentPerformanceData | null
    );

    return {
      metrics: Array.from(this.metrics.values()),
      components,
      summary: {
        totalComponents: components.length,
        averageRenderTime,
        slowestComponent,
      },
    };
  }

  /**
   * Clear all performance data
   */
  clear(): void {
    this.metrics.clear();
    this.componentData.clear();
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * Hook for tracking component render performance
 */
export const usePerformanceMonitor = (componentName: string) => {
  const startTime = React.useRef(performance.now());
  
  React.useEffect(() => {
    const renderTime = performance.now() - startTime.current;
    performanceMonitor.trackComponentRender(componentName, renderTime);
    startTime.current = performance.now();
  });
};

/**
 * Higher-order component for performance monitoring
 */
export const withPerformanceMonitor = <P extends Record<string, unknown>>(
  Component: React.ComponentType<P>,
  componentName?: string
): React.ComponentType<P> => {
  const WrappedComponent: React.ComponentType<P> = (props: P) => {
    const name = componentName || Component.displayName || Component.name || 'Unknown';
    usePerformanceMonitor(name);
    return React.createElement(Component, props);
  };

  WrappedComponent.displayName = `withPerformanceMonitor(${componentName || Component.name})`;
  return WrappedComponent;
};

/**
 * Utility for measuring async operation performance
 */
export const measureAsync = async <T>(
  name: string,
  operation: () => Promise<T>,
  metadata?: Record<string, unknown>
): Promise<T> => {
  performanceMonitor.startTimer(name, metadata);
  try {
    const result = await operation();
    return result;
  } finally {
    performanceMonitor.endTimer(name);
  }
};

/**
 * Utility for measuring sync operation performance
 */
export const measureSync = <T>(
  name: string,
  operation: () => T,
  metadata?: Record<string, unknown>
): T => {
  performanceMonitor.startTimer(name, metadata);
  try {
    const result = operation();
    return result;
  } finally {
    performanceMonitor.endTimer(name);
  }
};

/**
 * Debounce utility with performance tracking
 */
export const debounceWithPerformance = <T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number,
  name?: string
): T => {
  const timerName = name || `debounced_${func.name || 'function'}`;
  let timeout: NodeJS.Timeout;

  return ((...args: unknown[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      measureSync(timerName, () => func(...args));
    }, wait);
  }) as T;
};

/**
 * Throttle utility with performance tracking
 */
export const throttleWithPerformance = <T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number,
  name?: string
): T => {
  const timerName = name || `throttled_${func.name || 'function'}`;
  let inThrottle: boolean;

  return ((...args: unknown[]) => {
    if (!inThrottle) {
      measureSync(timerName, () => func(...args));
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  }) as T;
}; 