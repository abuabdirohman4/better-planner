"use client";

import React from 'react';

interface ProgressIndicatorProps {
  progress: {
    completed: number;
    total: number;
    percentage: number;
  };
}

export default function ProgressIndicator({ progress }: ProgressIndicatorProps) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-gray-600 dark:text-gray-400">Progress</span>
        <span className="font-semibold">{progress.percentage}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress.percentage}%` }}
         />
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        {progress.completed}/{progress.total}
      </p>
    </div>
  );
}
