/**
 * Performance monitoring utilities for Better Planner
 * Tracks page load times, SWR cache performance, and user interactions
 */

export interface PerformanceMetrics {
  pageName: string;
  loadTime: number;
  cacheHitRate: number;
  networkRequests: number;
  swrCacheSize: number;
  memoryUsage: number;
  timestamp: string;
  userAgent: string;
  environment: 'development' | 'production';
  url: string;
  referrer?: string;
}

export interface PageLoadMetrics {
  navigationStart: number;
  domContentLoaded: number;
  loadComplete: number;
  firstPaint?: number;
  firstContentfulPaint?: number;
  largestContentfulPaint?: number;
  firstInputDelay?: number;
  cumulativeLayoutShift?: number;
}

/**
 * Get current performance metrics
 */
export function getCurrentPerformanceMetrics(pageName: string, startTime?: number): PerformanceMetrics {
  const now = performance.now();
  const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  
  // Calculate load time properly
  let loadTime = 0;
  if (startTime) {
    loadTime = now - startTime;
  } else if (navigationEntry) {
    loadTime = now - navigationEntry.startTime;
  } else {
    loadTime = now;
  }
  
  return {
    pageName,
    loadTime: Math.round(loadTime), // Round to nearest ms
    cacheHitRate: calculateCacheHitRate(),
    networkRequests: getNetworkRequestCount(),
    swrCacheSize: getSWRCacheSize(),
    memoryUsage: getMemoryUsage(),
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    environment: process.env.NODE_ENV as 'development' | 'production',
    url: window.location.href,
    referrer: document.referrer || undefined,
  };
}

/**
 * Get detailed page load metrics using Performance API
 */
export function getPageLoadMetrics(): PageLoadMetrics {
  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  
  return {
    navigationStart: navigation?.startTime || 0,
    domContentLoaded: navigation?.domContentLoadedEventEnd || 0,
    loadComplete: navigation?.loadEventEnd || 0,
    firstPaint: getFirstPaint(),
    firstContentfulPaint: getFirstContentfulPaint(),
    largestContentfulPaint: getLargestContentfulPaint(),
    firstInputDelay: getFirstInputDelay(),
    cumulativeLayoutShift: getCumulativeLayoutShift(),
  };
}

/**
 * Calculate SWR cache hit rate
 */
function calculateCacheHitRate(): number {
  try {
    const cache = localStorage.getItem('swr-cache');
    if (!cache) return 0;
    
    const cacheData = JSON.parse(cache);
    const totalEntries = cacheData.length;
    
    if (totalEntries === 0) return 0;
    
    // More realistic cache hit rate calculation
    // Based on cache size and recent activity
    const now = Date.now();
    let recentEntries = 0;
    let totalAge = 0;
    
    cacheData.forEach((entry: unknown) => {
      const entryTime = (entry as [string, unknown, number])[2] || now; // timestamp
      const age = now - entryTime;
      totalAge += age;
      
      // Consider entries from last 5 minutes as recent
      if (age < 5 * 60 * 1000) {
        recentEntries++;
      }
    });
    
    const averageAge = totalAge / totalEntries;
    const ageInMinutes = averageAge / (1000 * 60);
    
    // Calculate hit rate based on cache activity
    // More recent activity = higher hit rate
    const recencyFactor = Math.min(1, recentEntries / Math.max(1, totalEntries * 0.1));
    const ageFactor = Math.max(0.1, Math.min(0.9, 1 - (ageInMinutes / 30)));
    
    return Math.min(0.95, Math.max(0.1, (recencyFactor + ageFactor) / 2));
  } catch {
    return 0;
  }
}

  /**
 * Get network request count
 */
function getNetworkRequestCount(): number {
  return performance.getEntriesByType('resource').length;
}

/**
 * Get SWR cache size
 */
function getSWRCacheSize(): number {
  try {
    const cache = localStorage.getItem('swr-cache');
    return cache ? JSON.parse(cache).length : 0;
  } catch {
    return 0;
  }
}

/**
 * Get memory usage
 */
function getMemoryUsage(): number {
  if ('memory' in performance) {
    return (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory?.usedJSHeapSize || 0;
  }
  return 0;
}

/**
 * Get First Paint time
 */
function getFirstPaint(): number | undefined {
  const paintEntries = performance.getEntriesByType('paint');
  const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
  return firstPaint ? firstPaint.startTime : undefined;
}

/**
 * Get First Contentful Paint time
 */
function getFirstContentfulPaint(): number | undefined {
  const paintEntries = performance.getEntriesByType('paint');
  const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');
  return fcp ? fcp.startTime : undefined;
}

/**
 * Get Largest Contentful Paint time
 */
function getLargestContentfulPaint(): number | undefined {
  const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
  const lcp = lcpEntries[lcpEntries.length - 1];
  return lcp ? lcp.startTime : undefined;
}

/**
 * Get First Input Delay
 */
function getFirstInputDelay(): number | undefined {
  const fidEntries = performance.getEntriesByType('first-input');
  const fid = fidEntries[0] as PerformanceEventTiming;
  return fid ? fid.processingStart - fid.startTime : undefined;
}

/**
 * Get Cumulative Layout Shift
 */
function getCumulativeLayoutShift(): number | undefined {
  const clsEntries = performance.getEntriesByType('layout-shift');
  return clsEntries.reduce((sum, entry) => {
    return sum + (entry as PerformanceEntry & { value: number }).value;
  }, 0);
}

/**
 * Save performance metrics to localStorage
 */
export function savePerformanceMetrics(metrics: PerformanceMetrics): void {
  try {
    const existingData = localStorage.getItem('better-planner-performance');
    const performanceData = existingData ? JSON.parse(existingData) : [];
    
    // Add new metrics
    performanceData.push(metrics);
    
    // Keep only last 100 entries to prevent localStorage overflow
    if (performanceData.length > 100) {
      performanceData.splice(0, performanceData.length - 100);
    }
    
    localStorage.setItem('better-planner-performance', JSON.stringify(performanceData));
  } catch (error) {
    console.warn('Failed to save performance metrics:', error);
  }
}

/**
 * Get performance metrics from localStorage
 */
export function getPerformanceMetrics(): PerformanceMetrics[] {
  try {
    const data = localStorage.getItem('better-planner-performance');
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

/**
 * Clear performance metrics
 */
export function clearPerformanceMetrics(): void {
  localStorage.removeItem('better-planner-performance');
}

/**
 * Export performance metrics as JSON
 */
export function exportPerformanceMetrics(): string {
  const metrics = getPerformanceMetrics();
  return JSON.stringify(metrics, null, 2);
}

/**
 * Get performance summary
 */
export function getPerformanceSummary(): {
  totalPages: number;
  averageLoadTime: number;
  averageCacheHitRate: number;
  averageNetworkRequests: number;
  environment: string;
  dateRange: { start: string; end: string };
} {
  const metrics = getPerformanceMetrics();
  
  if (metrics.length === 0) {
    return {
      totalPages: 0,
      averageLoadTime: 0,
      averageCacheHitRate: 0,
      averageNetworkRequests: 0,
      environment: 'unknown',
      dateRange: { start: '', end: '' },
    };
  }
  
  const loadTimes = metrics.map(m => m.loadTime);
  const cacheHitRates = metrics.map(m => m.cacheHitRate);
  const networkRequests = metrics.map(m => m.networkRequests);
  
  const timestamps = metrics.map(m => new Date(m.timestamp).getTime());
  
  return {
    totalPages: metrics.length,
    averageLoadTime: loadTimes.reduce((a, b) => a + b, 0) / loadTimes.length,
    averageCacheHitRate: cacheHitRates.reduce((a, b) => a + b, 0) / cacheHitRates.length,
    averageNetworkRequests: networkRequests.reduce((a, b) => a + b, 0) / networkRequests.length,
    environment: metrics[0]?.environment || 'unknown',
    dateRange: {
      start: new Date(Math.min(...timestamps)).toISOString(),
      end: new Date(Math.max(...timestamps)).toISOString(),
    },
  };
}

/**
 * Send performance metrics to server
 */
export async function sendPerformanceMetrics(metrics: PerformanceMetrics): Promise<void> {
  try {
    const response = await fetch('/api/performance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(metrics),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to send metrics: ${response.status}`);
    }
  } catch (error) {
    console.warn('Failed to send performance metrics to server:', error);
    // Fallback to localStorage
    savePerformanceMetrics(metrics);
  }
}

/**
 * Performance monitoring hook
 */
export function usePerformanceMonitor(pageName: string) {
  const startTime = performance.now();
  
  return {
    startTime,
    getMetrics: () => getCurrentPerformanceMetrics(pageName),
    saveMetrics: (metrics: PerformanceMetrics) => savePerformanceMetrics(metrics),
    sendMetrics: (metrics: PerformanceMetrics) => sendPerformanceMetrics(metrics),
  };
}

/**
 * Performance Monitoring Control Functions
 * Allow users to enable/disable performance monitoring
 */

const MONITORING_KEY = 'better-planner-performance-monitoring-enabled';

/**
 * Check if performance monitoring is enabled
 */
export function isPerformanceMonitoringEnabled(): boolean {
  if (typeof window === 'undefined') return false; // Default to disabled on server
  
  try {
    const stored = localStorage.getItem(MONITORING_KEY);
    return stored === 'true'; // Default to false if not set
  } catch (error) {
    console.warn('Failed to check monitoring status:', error);
    return false; // Default to disabled on error
  }
}

/**
 * Set performance monitoring enabled/disabled
 */
export function setPerformanceMonitoringEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(MONITORING_KEY, enabled.toString());
    
    // Update global monitoring state
    if (typeof window !== 'undefined') {
      (window as { __PERFORMANCE_MONITORING_ENABLED__?: boolean }).__PERFORMANCE_MONITORING_ENABLED__ = enabled;
    }
  } catch (error) {
    console.warn('Failed to set monitoring status:', error);
  }
}

/**
 * Get monitoring status with fallback
 */
export function getPerformanceMonitoringStatus(): {
  enabled: boolean;
  canToggle: boolean;
} {
  return {
    enabled: isPerformanceMonitoringEnabled(),
    canToggle: typeof window !== 'undefined' && 'localStorage' in window,
  };
}