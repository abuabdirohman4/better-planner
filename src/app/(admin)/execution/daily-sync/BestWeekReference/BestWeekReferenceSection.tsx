"use client";

import React from 'react';
import Link from 'next/link';
import CollapsibleCard from '@/components/common/CollapsibleCard';
import { useUIPreferencesStore } from '@/stores/uiPreferencesStore';
import { useTodayBlocks } from './hooks/useTodayBlocks';
import { CATEGORY_CONFIG, DAY_LABELS } from '@/lib/best-week/constants';
import type { ActivityCategory } from '@/lib/best-week/types';

export default function BestWeekReferenceSection() {
  const { cardCollapsed, toggleCardCollapsed } = useUIPreferencesStore();
  const { todayBlocks, currentBlock, todayCode, hasTemplate, isLoading } = useTodayBlocks();

  return (
    <div className="mt-6">
      <CollapsibleCard
        isCollapsed={cardCollapsed.bestWeekRef}
        onToggle={() => toggleCardCollapsed('bestWeekRef')}
      >
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 pt-5 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-gray-100">
            📅 Best Week Reference
          </h3>

          {isLoading ? (
            <div className="animate-pulse space-y-2">
              {[1, 2, 3].map(i => <div key={i} className="h-8 bg-gray-100 dark:bg-gray-700 rounded" />)}
            </div>
          ) : !hasTemplate ? (
            <div className="text-center py-6">
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-3">
                Belum ada template Best Week.
              </p>
              <Link
                href="/planning/best-week"
                className="text-sm text-blue-500 hover:text-blue-600 font-medium"
              >
                Buat Template →
              </Link>
            </div>
          ) : todayBlocks.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Tidak ada jadwal untuk hari ini.
            </p>
          ) : (
            <>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                Jadwal Ideal — {DAY_LABELS[todayCode]}
              </p>
              <div className="space-y-1 mb-4">
                {todayBlocks.map(block => {
                  const config = CATEGORY_CONFIG[block.category];
                  const isActive = currentBlock?.id === block.id;
                  return (
                    <div
                      key={block.id}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
                        isActive
                          ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'
                      }`}
                    >
                      <span className="text-gray-400 dark:text-gray-500 text-xs w-24 shrink-0">
                        {block.start_time.substring(0, 5)} - {block.end_time.substring(0, 5)}
                      </span>
                      <span style={{ color: config.color }} className="shrink-0">{config.icon}</span>
                      <span className={`flex-1 ${isActive ? 'font-semibold text-gray-900 dark:text-gray-100' : 'text-gray-700 dark:text-gray-300'}`}>
                        {isActive ? '► ' : ''}{block.title}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="flex flex-wrap gap-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                {(['high_lifetime_value', 'high_rupiah_value', 'low_rupiah_value'] as ActivityCategory[]).map(cat => {
                  const todayCatBlocks = todayBlocks.filter(b => b.category === cat);
                  if (todayCatBlocks.length === 0) return null;
                  const config = CATEGORY_CONFIG[cat];
                  const hours = todayCatBlocks.reduce((sum, b) => {
                    const [sh, sm] = b.start_time.split(':').map(Number);
                    const [eh, em] = b.end_time.split(':').map(Number);
                    return sum + (eh * 60 + em - (sh * 60 + sm)) / 60;
                  }, 0);
                  return (
                    <span key={cat} className="text-xs" style={{ color: config.color }}>
                      {config.icon} {hours.toFixed(1)}j
                    </span>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </CollapsibleCard>
    </div>
  );
}
