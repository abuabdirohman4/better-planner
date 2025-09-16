"use client";

import { Suspense, useEffect, useState } from 'react';

import Spinner from '@/components/ui/spinner/Spinner';

import ColdStartLoader, { QuickLoader } from './ColdStartLoader';

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
