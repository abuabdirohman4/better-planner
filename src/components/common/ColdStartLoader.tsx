"use client";

import { useEffect, useState } from 'react';

import Spinner from '@/components/ui/spinner/Spinner';

interface ColdStartLoaderProps {
  isLoading: boolean;
  isFirstVisit: boolean;
  loadingProgress: number;
  loadingMessage: string;
  estimatedTime: string;
}

/**
 * Cold Start Loader Component
 * Shows different loading experience for first visit vs cached visits
 */
export default function ColdStartLoader({
  isLoading,
  isFirstVisit,
  loadingProgress,
  loadingMessage,
  estimatedTime
}: ColdStartLoaderProps) {
  const [showProgress, setShowProgress] = useState(false);

  useEffect(() => {
    if (isLoading) {
      // Show progress after a short delay
      const timer = setTimeout(() => setShowProgress(true), 100);
      return () => clearTimeout(timer);
    } else {
      setShowProgress(false);
    }
  }, [isLoading]);

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 bg-white dark:bg-gray-900 z-50 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-6">
        {/* Logo/Icon */}
        <div className="mb-8">
          <div className="w-16 h-16 mx-auto bg-blue-600 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Better Planner
          </h1>
        </div>

        {/* Loading Spinner */}
        <div className="mb-6">
          <Spinner size={64} />
        </div>

        {/* Loading Message */}
        <div className="mb-4">
          <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
            {loadingMessage}
          </p>
          {isFirstVisit ? <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              First time setup - this will only happen once
            </p> : null}
        </div>

        {/* Progress Bar */}
        {showProgress ? <div className="mb-4">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${loadingProgress}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>{loadingProgress}%</span>
              <span>{estimatedTime}</span>
            </div>
          </div> : null}

        {/* First Visit Benefits */}
        {isFirstVisit ? <div className="text-left bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              🚀 What&apos;s happening:
            </h3>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• Preloading all your data</li>
              <li>• Building smart cache</li>
              <li>• Optimizing performance</li>
              <li>• Next visits will be instant!</li>
            </ul>
          </div> : null}

        {/* Cached Visit Message */}
        {!isFirstVisit && (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Loading from cache...
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Quick Loader for cached visits
 */
export function QuickLoader({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <Spinner size={48} />
        <p className="mt-4 text-gray-600 dark:text-gray-400">{message}</p>
      </div>
    </div>
  );
}
