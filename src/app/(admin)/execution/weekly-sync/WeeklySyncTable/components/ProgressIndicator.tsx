"use client";

import React from 'react';

import type { ProgressIndicatorProps } from '../types';

export default function ProgressIndicator({ progress, slotNumber }: ProgressIndicatorProps) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-gray-600 dark:text-gray-400">Progress Goal {slotNumber}</span>
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
