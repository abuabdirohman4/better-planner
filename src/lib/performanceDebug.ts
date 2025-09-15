/**
 * Performance Debug Utilities
 * Helper functions for debugging performance monitoring issues
 */

export interface DebugInfo {
  pageName: string;
  startTime: number;
  currentTime: number;
  loadTime: number;
  documentReadyState: string;
  performanceEntries: number;
  swrCacheSize: number;
  networkRequests: number;
}

/**
 * Get debug information for performance monitoring
 */
export function getPerformanceDebugInfo(pageName: string, startTime?: number): DebugInfo {
  const now = performance.now();
  const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  
  let loadTime = 0;
  if (startTime) {
    loadTime = now - startTime;
  } else if (navigationEntry) {
    loadTime = now - navigationEntry.startTime;
  }
  
  return {
    pageName,
    startTime: startTime || 0,
    currentTime: now,
    loadTime: Math.round(loadTime),
    documentReadyState: document.readyState,
    performanceEntries: performance.getEntriesByType('navigation').length,
    swrCacheSize: getSWRCacheSize(),
    networkRequests: getNetworkRequestCount(),
  };
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
 * Get network request count
 */
function getNetworkRequestCount(): number {
  return performance.getEntriesByType('resource').length;
}

/**
 * Log performance debug info
 */
export function logPerformanceDebug(pageName: string, startTime?: number): void {
  const debugInfo = getPerformanceDebugInfo(pageName, startTime);
  
  console.warn(`🔍 Performance Debug - ${pageName}`);
  console.warn('📊 Debug Info:', debugInfo);
  console.warn('⏱️ Load Time:', `${debugInfo.loadTime}ms`);
  console.warn('📄 Document State:', debugInfo.documentReadyState);
  console.warn('🌐 Network Requests:', debugInfo.networkRequests);
  console.warn('💾 SWR Cache Size:', debugInfo.swrCacheSize);
  console.warn('🎯 Performance Entries:', debugInfo.performanceEntries);
  // Debug info logged
}

/**
 * Monitor performance over time
 */
export function startPerformanceMonitoring(pageName: string): () => void {
  const startTime = performance.now();
  let intervalId: NodeJS.Timeout | null = null;
  
  console.warn(`🚀 Starting performance monitoring for: ${pageName}`);
  
  // Log every 500ms for debugging
  intervalId = setInterval(() => {
    const debugInfo = getPerformanceDebugInfo(pageName, startTime);
    console.warn(`⏱️ ${pageName} - Load Time: ${debugInfo.loadTime}ms, State: ${debugInfo.documentReadyState}`);
  }, 500);
  
  // Stop monitoring after 10 seconds
  setTimeout(() => {
    if (intervalId) {
      clearInterval(intervalId);
      console.warn(`✅ Performance monitoring completed for: ${pageName}`);
    }
  }, 10000);
  
  // Return cleanup function
  return () => {
    if (intervalId) {
      clearInterval(intervalId);
    }
  };
}
