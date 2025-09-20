"use client";

import { Suspense, useEffect, useState } from 'react';

import Spinner from '@/components/ui/spinner/Spinner';

// QuickLoader component moved inline since ColdStartLoader is no longer needed

interface SmartLoaderProps {
  children: React.ReactNode;
  pageName: string;
  fallback?: React.ReactNode;
}

/**
 * Smart Loader Component
 * Combines Cold Start + Streaming for optimal UX
 * - First visit: Cold start with comprehensive preload
 * - Subsequent visits: Quick streaming with cache
 */
export default function SmartLoader({ 
  children, 
  pageName, 
  fallback 
}: SmartLoaderProps) {
  // ✅ SIMPLIFIED - No more complex state management!
  useEffect(() => {
    // Mark as visited immediately (no delays)
    const cacheKey = `better-planner-${pageName.toLowerCase().replace(/\s+/g, '-')}`;
    localStorage.setItem(`${cacheKey}-visited`, 'true');
  }, [pageName]);

  // ✅ INSTANT RENDER - No loading states!
  return (
    <Suspense fallback={fallback || <QuickLoader />}>
      {children}
    </Suspense>
  );
}

/**
 * Quick Loader for cached visits
 */
function QuickLoader({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <Spinner size={48} />
        <p className="mt-4 text-gray-600 dark:text-gray-400">{message}</p>
      </div>
    </div>
  );
}

/**
 * Lightweight streaming loader for non-critical pages
 */
export function StreamingLoader({ 
  children, 
  fallback 
}: { 
  children: React.ReactNode; 
  fallback?: React.ReactNode; 
}) {
  return (
    <Suspense fallback={fallback || <div className="flex justify-center items-center min-h-[400px]"><Spinner size={48} /></div>}>
      {children}
    </Suspense>
  );
}

/**
 * Instant loader for cached content
 */
export function InstantLoader({ 
  children, 
  fallback 
}: { 
  children: React.ReactNode; 
  fallback?: React.ReactNode; 
}) {
  return (
    <Suspense fallback={fallback || <div className="animate-pulse bg-gray-200 h-4 rounded w-3/4" />}>
      {children}
    </Suspense>
  );
}
