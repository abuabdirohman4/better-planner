"use client";

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeftIcon, ChevronRightIcon } from '@/lib/icons';
import {
  getQuarterWeekRange,
  getWeekOfYear,
  formatQParam,
  getPrevQuarter,
  getNextQuarter,
} from '@/lib/quarterUtils';
import { useBrainDumpQuarter } from './hooks/useBrainDumpQuarter';
import WeekAccordion from './WeekAccordion';

interface BrainDumpPageClientProps {
  year: number;
  quarter: number;
}

const BrainDumpPageClient: React.FC<BrainDumpPageClientProps> = ({ year, quarter }) => {
  const router = useRouter();
  const { startWeek, endWeek } = getQuarterWeekRange(year, quarter);
  const totalWeeks = endWeek - startWeek + 1; // selalu 13

  // Tentukan index minggu aktif (0-based dalam quarter)
  const currentWeekIndex = useMemo(() => {
    const currentWeek = getWeekOfYear(new Date());
    const idx = currentWeek - startWeek;
    // Clamp ke dalam range quarter
    return Math.min(Math.max(idx, 0), totalWeeks - 1);
  }, [startWeek, totalWeeks]);

  // Accordion state: array boolean[13], default hanya minggu aktif terbuka
  const [openStates, setOpenStates] = useState<boolean[]>(() =>
    Array.from({ length: totalWeeks }, (_, i) => i === currentWeekIndex)
  );

  const toggleWeek = (index: number) => {
    setOpenStates((prev) => prev.map((v, i) => (i === index ? !v : v)));
  };

  const { dumpsByDate, isLoading, saveDump, isSaving } = useBrainDumpQuarter({ year, quarter });

  const navigateQuarter = (direction: 'prev' | 'next') => {
    const { year: nextYear, quarter: nextQuarter } =
      direction === 'prev' ? getPrevQuarter(year, quarter) : getNextQuarter(year, quarter);
    router.push(`/execution/brain-dump?q=${formatQParam(nextYear, nextQuarter)}`);
  };

  // Generate list minggu dalam quarter ini
  const weeks = Array.from({ length: totalWeeks }, (_, i) => ({
    weekInQuarter: i + 1,            // 1–13
    weekNumber: startWeek + i,       // absolute week number
  }));

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Quarter header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Brain Dump
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigateQuarter('prev')}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Quarter sebelumnya"
          >
            <ChevronLeftIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[80px] text-center">
            Q{quarter} {year}
          </span>
          <button
            onClick={() => navigateQuarter('next')}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Quarter berikutnya"
          >
            <ChevronRightIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-16 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse"
            />
          ))}
        </div>
      )}

      {/* 13 Week Accordions */}
      {!isLoading && (
        <div className="space-y-3">
          {weeks.map(({ weekInQuarter, weekNumber }, index) => (
            <WeekAccordion
              key={weekNumber}
              weekInQuarter={weekInQuarter}
              weekNumber={weekNumber}
              year={year}
              isOpen={openStates[index]}
              onToggle={() => toggleWeek(index)}
              dumpsByDate={dumpsByDate}
              saveDump={saveDump}
              isSaving={isSaving}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default BrainDumpPageClient;
