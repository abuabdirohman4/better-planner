"use client";

import { useState, useEffect } from 'react';

import Spinner from '@/components/ui/spinner/Spinner';

interface ProgressiveLoaderProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  delay?: number;
  minLoadingTime?: number;
}

/**
 * Progressive Loader Component
 * Shows content progressively to improve perceived performance
 */
export default function ProgressiveLoader({ 
  children, 
  fallback = <Spinner size={64} />, 
  delay = 100,
  minLoadingTime = 500 
}: ProgressiveLoaderProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Show loader immediately
    const showTimer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    // Show content after minimum loading time
    const contentTimer = setTimeout(() => {
      setShowContent(true);
    }, minLoadingTime);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(contentTimer);
    };
  }, [delay, minLoadingTime]);

  if (!isVisible) {
    return null;
  }

  if (!showContent) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        {fallback}
      </div>
    );
  }

  return children;
}

/**
 * Skeleton Loader for specific content types
 */
export function SkeletonLoader({ 
  lines = 3, 
  className = "" 
}: { 
  lines?: number; 
  className?: string; 
}) {
  return (
    <div className={`animate-pulse ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={`skeleton-${i}`}
          className={`h-4 bg-gray-200 rounded mb-2 ${
            i === lines - 1 ? 'w-3/4' : 'w-full'
          }`}
        />
      ))}
    </div>
  );
}

/**
 * Card Skeleton Loader
 */
export function CardSkeletonLoader() {
  return (
    <div className="animate-pulse">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-12 h-12 bg-gray-200 rounded-full" />
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
            <div className="h-3 bg-gray-200 rounded w-1/2" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 rounded" />
          <div className="h-3 bg-gray-200 rounded w-5/6" />
          <div className="h-3 bg-gray-200 rounded w-4/6" />
        </div>
      </div>
    </div>
  );
}
