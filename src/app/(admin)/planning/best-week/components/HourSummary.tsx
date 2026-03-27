import React from 'react';
import { CATEGORY_CONFIG } from '@/lib/best-week/constants';
import { calcTotalHours } from '../actions/blocks/logic';
import type { BestWeekBlock, ActivityCategory } from '@/lib/best-week/types';

interface HourSummaryProps {
  blocks: BestWeekBlock[];
}

export default function HourSummary({ blocks }: HourSummaryProps) {
  const categories: ActivityCategory[] = [
    'high_lifetime_value', 'high_rupiah_value', 'low_rupiah_value', 'zero_rupiah_value', 'transition'
  ];

  return (
    <div className="flex flex-wrap gap-3 px-4 py-3 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
      {categories.map(cat => {
        const hours = calcTotalHours(blocks, cat);
        if (hours === 0) return null;
        const config = CATEGORY_CONFIG[cat];
        return (
          <span key={cat} className="text-sm" style={{ color: config.color }}>
            {config.icon} {hours.toFixed(1)}j/minggu
          </span>
        );
      })}
      {blocks.length === 0 && (
        <span className="text-sm text-gray-400">Belum ada blocks. Drag di grid untuk menambah.</span>
      )}
    </div>
  );
}
