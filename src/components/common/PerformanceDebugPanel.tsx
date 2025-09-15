"use client";

import { useState, useEffect } from 'react';

import { getPerformanceDebugInfo, logPerformanceDebug } from '@/lib/performanceDebug';

interface PerformanceDebugPanelProps {
  pageName: string;
  startTime?: number;
}

/**
 * Debug panel for performance monitoring
 * Shows real-time debug information
 */
export default function PerformanceDebugPanel({ pageName, startTime }: PerformanceDebugPanelProps) {
  const [debugInfo, setDebugInfo] = useState(getPerformanceDebugInfo(pageName, startTime));
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setDebugInfo(getPerformanceDebugInfo(pageName, startTime));
    }, 1000);

    return () => clearInterval(interval);
  }, [pageName, startTime]);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed top-4 left-4 z-50 px-3 py-1 bg-red-600 text-white text-xs rounded-full hover:bg-red-700 transition-colors"
      >
        Debug
      </button>
    );
  }

  return (
    <div className="fixed top-4 left-4 z-50 bg-black bg-opacity-90 text-white p-4 rounded-lg text-xs font-mono max-w-sm">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold text-green-400">Performance Debug</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-red-400 hover:text-red-300"
        >
          ×
        </button>
      </div>
      
      <div className="space-y-1">
        <div><span className="text-blue-400">Page:</span> {debugInfo.pageName}</div>
        <div><span className="text-blue-400">Load Time:</span> <span className="text-yellow-400">{debugInfo.loadTime}ms</span></div>
        <div><span className="text-blue-400">Start Time:</span> {debugInfo.startTime.toFixed(2)}ms</div>
        <div><span className="text-blue-400">Current Time:</span> {debugInfo.currentTime.toFixed(2)}ms</div>
        <div><span className="text-blue-400">Document State:</span> <span className="text-purple-400">{debugInfo.documentReadyState}</span></div>
        <div><span className="text-blue-400">Network Requests:</span> <span className="text-orange-400">{debugInfo.networkRequests}</span></div>
        <div><span className="text-blue-400">SWR Cache Size:</span> <span className="text-cyan-400">{debugInfo.swrCacheSize}</span></div>
        <div><span className="text-blue-400">Perf Entries:</span> {debugInfo.performanceEntries}</div>
      </div>
      
      <div className="mt-3 pt-2 border-t border-gray-600">
        <button
          onClick={() => logPerformanceDebug(pageName, startTime)}
          className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
        >
          Log Debug
        </button>
      </div>
    </div>
  );
}
