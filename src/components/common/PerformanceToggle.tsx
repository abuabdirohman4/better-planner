"use client";

import { useState, useEffect } from 'react';

/**
 * Performance Toggle Component
 * Allows users to enable/disable performance monitoring globally
 */
export default function PerformanceToggle() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [showMetrics, setShowMetrics] = useState(false);

  useEffect(() => {
    // Load settings from localStorage
    const enabled = localStorage.getItem('better-planner-performance-enabled') === 'true';
    const show = localStorage.getItem('better-planner-performance-show') === 'true';
    setIsEnabled(enabled);
    setShowMetrics(show);
  }, []);

  const toggleEnabled = () => {
    const newEnabled = !isEnabled;
    setIsEnabled(newEnabled);
    localStorage.setItem('better-planner-performance-enabled', newEnabled.toString());
    
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('performance-toggle', { 
      detail: { enabled: newEnabled } 
    }));
  };

  const toggleShowMetrics = () => {
    const newShow = !showMetrics;
    setShowMetrics(newShow);
    localStorage.setItem('better-planner-performance-show', newShow.toString());
    
    // Dispatch custom event to notify PerformanceMonitor components
    window.dispatchEvent(new CustomEvent('performance-show-toggle', { 
      detail: { show: newShow } 
    }));
  };

  if (!isEnabled) {
    return (
      <div className="fixed bottom-4 left-4 z-50">
        <button
          onClick={toggleEnabled}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg shadow-lg hover:bg-blue-700 transition-colors"
        >
          Enable Performance Monitoring
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 flex gap-2">
      <button
        onClick={toggleEnabled}
        className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg shadow-lg hover:bg-red-700 transition-colors"
      >
        Disable Monitoring
      </button>
      
      <button
        onClick={toggleShowMetrics}
        className={`px-4 py-2 text-sm rounded-lg shadow-lg transition-colors ${
          showMetrics 
            ? 'bg-green-600 text-white hover:bg-green-700' 
            : 'bg-gray-600 text-white hover:bg-gray-700'
        }`}
      >
        {showMetrics ? 'Hide Metrics' : 'Show Metrics'}
      </button>
    </div>
  );
}
