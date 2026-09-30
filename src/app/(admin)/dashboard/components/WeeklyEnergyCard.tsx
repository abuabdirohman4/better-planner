"use client";

import React from 'react';
import { useWeeklyEnergy } from '../hooks/useWeeklyEnergy';

export default function WeeklyEnergyCard() {
  const { energySummary, isLoading, error } = useWeeklyEnergy();

  return (
    <div
      data-testid="weekly-energy-card"
      className="bg-white dark:bg-white/[0.03] rounded-xl border border-gray-200 dark:border-gray-800 p-5"
    >
      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">
        Energi minggu ini
      </h3>

      {isLoading ? (
        <div className="flex gap-6 items-center">
          <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
          <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
          <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
        </div>
      ) : error ? (
        <p className="text-sm text-rose-600 dark:text-rose-400">Gagal memuat energi minggu ini</p>
      ) : energySummary.total === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Belum ada tanda energi minggu ini
        </p>
      ) : (
        <div>
          <div className="flex items-center gap-6">
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">+</span>
              <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">{energySummary.plus}</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold text-gray-500 dark:text-gray-400">=</span>
              <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">{energySummary.neutral}</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold text-rose-600 dark:text-rose-400">−</span>
              <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">{energySummary.minus}</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            dari {energySummary.total} sesi yang diberi tanda
          </p>
          {energySummary.worstTask && (
            <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">
              Paling menguras: {energySummary.worstTask}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
