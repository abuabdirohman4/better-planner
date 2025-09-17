import React from 'react';

interface LoadingStateProps {
  isMobile: boolean;
}

export function LoadingState({ isMobile }: LoadingStateProps) {
  return (
    <div className="container mx-auto py-8 pt-0">
      {/* 🚀 OPTIMIZED: Faster loading header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">
          Weekly Sync
          <div className="inline-block ml-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          </div>
        </h2>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
          <div className="w-24 h-8 bg-gray-200 rounded animate-pulse"></div>
          <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
      
      {/* 🚀 OPTIMIZED: Progressive loading message */}
      <div className="text-center py-4 mb-6">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {isMobile 
            ? "Loading data... This may take a moment on mobile networks."
            : "Loading data..."
          }
        </div>
        <div className="mt-2">
          <div className="w-48 h-1 bg-gray-200 rounded-full mx-auto">
            <div className="h-1 bg-blue-600 rounded-full animate-pulse" style={{ width: '60%' }}></div>
          </div>
        </div>
      </div>

      {/* Skeleton for Goals Table */}
      <div className="mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="text-center text-xl font-extrabold mb-4">
            <div className="h-6 bg-gray-200 rounded w-1/3 mx-auto animate-pulse"></div>
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-4 p-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
                <div className="flex-1 h-12 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-32 h-12 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Skeleton for To Don't List */}
      <div className="my-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="text-center text-xl font-extrabold mb-4">
            <div className="h-6 bg-gray-200 rounded w-1/4 mx-auto animate-pulse"></div>
          </div>
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center space-x-2 py-2">
                <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-6 h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="flex-1 h-8 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile-optimized loading message */}
      <div className="text-center py-8">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {isMobile 
            ? "Loading data... This may take a moment on mobile networks."
            : "Loading data..."
          }
        </div>
      </div>
    </div>
  );
}
