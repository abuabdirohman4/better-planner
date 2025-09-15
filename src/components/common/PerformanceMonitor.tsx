"use client";

import { useEffect, useState } from 'react';

import { logPerformanceDebug } from '@/lib/performanceDebug';
import { getCurrentPerformanceMetrics, getPageLoadMetrics, savePerformanceMetrics, sendPerformanceMetrics, type PerformanceMetrics, type PageLoadMetrics } from '@/lib/performanceUtils';

interface PerformanceMonitorProps {
  pageName: string;
  showMetrics?: boolean;
  autoSave?: boolean;
  autoSend?: boolean;
}

/**
 * Performance monitoring component that tracks page load times and metrics
 * Displays real-time performance data and saves metrics for analysis
 */
export default function PerformanceMonitor({ 
  pageName, 
  showMetrics = false, 
  autoSave = true, 
  autoSend = false 
}: PerformanceMonitorProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [pageLoadMetrics, setPageLoadMetrics] = useState<PageLoadMetrics | null>(null);
  const [isVisible, setIsVisible] = useState(showMetrics);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Set start time immediately when component mounts
    const startTime = performance.now();
    
    // Wait for page to be fully loaded
    const handleLoadComplete = () => {
      const loadTime = performance.now() - startTime;
      
      // Debug logging
      logPerformanceDebug(pageName, startTime);
      
      // Get detailed metrics with proper start time
      const currentMetrics = getCurrentPerformanceMetrics(pageName, startTime);
      const loadMetrics = getPageLoadMetrics();
      
      // Use the calculated load time
      const finalMetrics: PerformanceMetrics = {
        ...currentMetrics,
        loadTime: Math.round(loadTime), // Round to nearest ms
      };
      
      console.warn(`📊 Performance Metrics for ${pageName}:`, finalMetrics);
      
      setMetrics(finalMetrics);
      setPageLoadMetrics(loadMetrics);
      setIsLoading(false);
      
      // Auto-save metrics
      if (autoSave) {
        savePerformanceMetrics(finalMetrics);
        console.warn(`💾 Metrics saved for ${pageName}`);
      }
      
      // Auto-send metrics to server
      if (autoSend) {
        sendPerformanceMetrics(finalMetrics);
        console.warn(`🌐 Metrics sent to server for ${pageName}`);
      }
    };

    // Wait for all resources to load
    if (document.readyState === 'complete') {
      // Page already loaded, but wait a bit for SWR data
      setTimeout(handleLoadComplete, 100);
    } else {
      window.addEventListener('load', handleLoadComplete);
      return () => window.removeEventListener('load', handleLoadComplete);
    }
  }, [pageName, autoSave, autoSend]);

  // Handle visibility toggle
  const toggleVisibility = () => setIsVisible(!isVisible);

  if (!showMetrics && !isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Toggle Button */}
      <button
        onClick={toggleVisibility}
        className="mb-2 px-3 py-1 bg-blue-600 text-white text-xs rounded-full hover:bg-blue-700 transition-colors"
      >
        {isVisible ? 'Hide' : 'Show'} Performance
      </button>

      {/* Performance Metrics Panel */}
      {isVisible ? <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 min-w-[300px] max-w-[400px]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Performance Metrics
            </h3>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {pageName}
            </span>
          </div>

          {isLoading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto" />
              <p className="text-xs text-gray-500 mt-2">Measuring performance...</p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Basic Metrics */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded">
                  <div className="text-gray-600 dark:text-gray-400">Load Time</div>
                  <div className="font-mono font-semibold text-green-600">
                    {metrics?.loadTime.toFixed(0)}ms
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded">
                  <div className="text-gray-600 dark:text-gray-400">Cache Hit Rate</div>
                  <div className="font-mono font-semibold text-blue-600">
                    {((metrics?.cacheHitRate || 0) * 100).toFixed(1)}%
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded">
                  <div className="text-gray-600 dark:text-gray-400">Network Requests</div>
                  <div className="font-mono font-semibold text-orange-600">
                    {metrics?.networkRequests}
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded">
                  <div className="text-gray-600 dark:text-gray-400">Cache Size</div>
                  <div className="font-mono font-semibold text-purple-600">
                    {metrics?.swrCacheSize}
                  </div>
                </div>
              </div>

              {/* Advanced Metrics */}
              {pageLoadMetrics ? <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                  <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Core Web Vitals
                  </div>
                  <div className="space-y-1 text-xs">
                    {pageLoadMetrics.firstPaint ? <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">First Paint:</span>
                        <span className="font-mono">{pageLoadMetrics.firstPaint.toFixed(0)}ms</span>
                      </div> : null}
                    {pageLoadMetrics.firstContentfulPaint ? <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">FCP:</span>
                        <span className="font-mono">{pageLoadMetrics.firstContentfulPaint.toFixed(0)}ms</span>
                      </div> : null}
                    {pageLoadMetrics.largestContentfulPaint ? <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">LCP:</span>
                        <span className="font-mono">{pageLoadMetrics.largestContentfulPaint.toFixed(0)}ms</span>
                      </div> : null}
                    {pageLoadMetrics.firstInputDelay ? <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">FID:</span>
                        <span className="font-mono">{pageLoadMetrics.firstInputDelay.toFixed(0)}ms</span>
                      </div> : null}
                    {pageLoadMetrics.cumulativeLayoutShift ? <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">CLS:</span>
                        <span className="font-mono">{pageLoadMetrics.cumulativeLayoutShift.toFixed(3)}</span>
                      </div> : null}
                  </div>
                </div> : null}

              {/* Memory Usage */}
              {metrics?.memoryUsage ? <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                  <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Memory Usage
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {(metrics.memoryUsage / 1024 / 1024).toFixed(2)} MB
                  </div>
                </div> : null}

              {/* Environment Info */}
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  <div>Environment: {metrics?.environment}</div>
                  <div>Time: {new Date(metrics?.timestamp || '').toLocaleTimeString()}</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600 flex gap-2">
                <button
                  onClick={() => {
                    if (metrics) {
                      savePerformanceMetrics(metrics);
                      // Metrics saved to localStorage
                    }
                  }}
                  className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    if (metrics) {
                      sendPerformanceMetrics(metrics);
                      // Metrics sent to server
                    }
                  }}
                  className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                >
                  Send
                </button>
                <button
                  onClick={() => {
                    const data = JSON.stringify(metrics, null, 2);
                    navigator.clipboard.writeText(data);
                    // Metrics copied to clipboard
                  }}
                  className="px-2 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700 transition-colors"
                >
                  Copy
                </button>
              </div>
            </div>
          )}
        </div> : null}
    </div>
  );
}
