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
  const [isFirstVisit, setIsFirstVisit] = useState(true);
  const [isPreloading, setIsPreloading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('Initializing...');

  useEffect(() => {
    const checkFirstVisit = () => {
      const cacheKey = `better-planner-${pageName.toLowerCase().replace(/\s+/g, '-')}`;
      const hasVisited = localStorage.getItem(`${cacheKey}-visited`);
      return !hasVisited;
    };

    const preloadData = async () => {
      const firstVisit = checkFirstVisit();
      setIsFirstVisit(firstVisit);

      if (firstVisit) {
        // First visit - comprehensive preload
        setLoadingMessage('First time setup...');
        setLoadingProgress(10);
        
        // Simulate preloading critical data
        await new Promise(resolve => setTimeout(resolve, 500));
        setLoadingProgress(30);
        
        setLoadingMessage('Building cache...');
        await new Promise(resolve => setTimeout(resolve, 800));
        setLoadingProgress(60);
        
        setLoadingMessage('Optimizing performance...');
        await new Promise(resolve => setTimeout(resolve, 600));
        setLoadingProgress(90);
        
        // Mark as visited
        const cacheKey = `better-planner-${pageName.toLowerCase().replace(/\s+/g, '-')}`;
        localStorage.setItem(`${cacheKey}-visited`, 'true');
        
        setLoadingMessage('Ready!');
        setLoadingProgress(100);
        
        // Small delay for smooth transition
        await new Promise(resolve => setTimeout(resolve, 300));
      } else {
        // Subsequent visits - quick preload
        setLoadingMessage('Loading from cache...');
        setLoadingProgress(50);
        
        // Quick cache check
        await new Promise(resolve => setTimeout(resolve, 200));
        setLoadingProgress(100);
        
        setLoadingMessage('Ready!');
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      setIsPreloading(false);
    };

    preloadData();
  }, [pageName]);

  // Show cold start loader for first visit
  if (isPreloading && isFirstVisit) {
    return (
      <ColdStartLoader
        isLoading={isPreloading}
        isFirstVisit={isFirstVisit}
        loadingProgress={loadingProgress}
        loadingMessage={loadingMessage}
        estimatedTime={isFirstVisit ? '2-3 seconds' : '< 500ms'}
      />
    );
  }

  // Show quick loader for subsequent visits
  if (isPreloading && !isFirstVisit) {
    return <QuickLoader />;
  }

  // Show streaming loader for content
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
