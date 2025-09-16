"use client";

import { Suspense } from 'react';

import Spinner from '@/components/ui/spinner/Spinner';

interface StreamingLoaderProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Streaming Loader Component
 * Provides immediate UI feedback while data streams in
 */
export default function StreamingLoader({ 
  children, 
  fallback = <Spinner size={64} />
}: StreamingLoaderProps) {
  return (
    <Suspense fallback={fallback}>
      {children}
    </Suspense>
  );
}

/**
 * Immediate UI Component
 * Shows UI immediately while data loads in background
 */
export function ImmediateUI({ 
  children, 
  isLoading, 
  fallback 
}: { 
  children: React.ReactNode; 
  isLoading: boolean; 
  fallback?: React.ReactNode; 
}) {
  if (isLoading) {
    return fallback || <Spinner size={64} />;
  }
  
  return children;
}

/**
 * Progressive Content Component
 * Shows content progressively as it becomes available
 */
export function ProgressiveContent({ 
  children, 
  isReady, 
  fallback 
}: { 
  children: React.ReactNode; 
  isReady: boolean; 
  fallback?: React.ReactNode; 
}) {
  return isReady ? children : (fallback || <Spinner size={64} />);
}
