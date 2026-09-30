"use client";

import React from 'react';
import WeeklyGrid from './WeeklyGrid';
import { useRealWeekSchedules } from '../hooks/useRealWeekSchedules';
import { HFG_COLORS, type HfgRank } from '../actions/real-week/logic';
import { formatDateIndo } from '@/lib/dateUtils';

// Berdiri sendiri (ambil data sendiri) supaya bisa dipindah ke tab Mingguan (app-5r0j) tanpa prop.
export default function RealWeekView() {
  const { weekStart, blocks, hfgs, isLoading, error } = useRealWeekSchedules();

  if (isLoading) return <div className="animate-pulse h-96 bg-gray-100 dark:bg-gray-800" />;
  if (error) return <p className="p-4 text-sm text-red-500">Gagal memuat jadwal minggu ini.</p>;

  const legend = [
    ...hfgs.map(h => ({ key: `hfg-${h.rank}`, label: `HFG #${h.rank} · ${h.title}`, colors: HFG_COLORS[h.rank as HfgRank] })),
    { key: 'other', label: 'Lainnya', colors: HFG_COLORS[0] },
  ];

  return (
    <div data-testid="real-week-view">
      <WeeklyGrid blocks={blocks} />
      <div
        data-testid="real-week-legend"
        className="flex flex-wrap items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 text-sm"
      >
        <span className="text-gray-500 dark:text-gray-400">
          Minggu mulai {formatDateIndo(new Date(`${weekStart}T12:00:00+07:00`))}
        </span>
        {legend.map(item => (
          <span key={item.key} className="inline-flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
            <span
              className="inline-block w-3 h-3 rounded-sm"
              style={{ backgroundColor: item.colors.bgColor, border: `1px solid ${item.colors.borderColor}` }}
            />
            {item.label}
          </span>
        ))}
        {blocks.length === 0 && (
          <span className="text-gray-400">
            Belum ada jadwal minggu ini. Jadwalkan task lewat Activity Plan di Daily Sync.
          </span>
        )}
      </div>
    </div>
  );
}
