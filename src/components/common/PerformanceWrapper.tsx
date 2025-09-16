"use client";

import { useEffect } from 'react';

import PerformanceMonitor from './PerformanceMonitor';

interface PerformanceWrapperProps {
  children: React.ReactNode;
  pageName: string;
  showMetrics?: boolean;
  autoSave?: boolean;
  autoSend?: boolean;
}

/**
 * Performance Wrapper Component
 * Wraps pages with performance monitoring capabilities
 * Can be used to easily add performance tracking to any page
 */
export default function PerformanceWrapper({
  children,
  pageName,
  showMetrics = false,
  autoSave = true,
  autoSend = false,
}: PerformanceWrapperProps) {
  // Track page load start time
  useEffect(() => {
    // Set global start time for this page
    if (typeof window !== 'undefined') {
      window.__PAGE_LOAD_START__ = performance.now();
      console.warn(`🚀 Performance monitoring started for: ${pageName}`);
    }
  }, [pageName]);

  return (
    <>
      {children}
      <PerformanceMonitor
        pageName={pageName}
        showMetrics={showMetrics}
        autoSave={autoSave}
        autoSend={autoSend}
      />
    </>
  );
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    __PAGE_LOAD_START__?: number;
  }
}
