import React from 'react';

interface ErrorStateProps {
  error: string;
  retryCount: number;
  onRetry: () => void;
}

export function ErrorState({ error, retryCount, onRetry }: ErrorStateProps) {
  return (
    <div className="container mx-auto py-8 pt-0">
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <div className="flex items-center">
          <div className="text-red-600 dark:text-red-400 mr-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-medium text-red-800 dark:text-red-200">Error Loading Data</h3>
            <p className="text-sm text-red-600 dark:text-red-400 mt-1">{error}</p>
            <div className="mt-2 flex gap-2">
              <button 
                onClick={onRetry}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
              >
                Try Again ({retryCount}/3)
              </button>
              <button 
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg text-sm hover:bg-gray-700 transition-colors"
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
