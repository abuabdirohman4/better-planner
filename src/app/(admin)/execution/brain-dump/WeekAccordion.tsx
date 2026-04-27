"use client";

import React from 'react';
import { ChevronDownIcon } from '@/lib/icons';
import { getDateFromWeek } from '@/lib/quarterUtils';
import { getLocalDateString } from '@/lib/dateUtils';
import type { BrainDumpItem } from '@/types/brain-dump';
import DayBrainDump from './DayBrainDump';

interface WeekAccordionProps {
  weekInQuarter: number;          // 1–13, untuk display "Week 1"
  weekNumber: number;             // absolute week number (1–52), untuk getDateFromWeek
  year: number;
  isOpen: boolean;
  onToggle: () => void;
  dumpsByDate: Map<string, BrainDumpItem>;
  saveDump: (date: string, content: string) => Promise<void>;
  isSaving: boolean;
}

const WeekAccordion: React.FC<WeekAccordionProps> = ({
  weekInQuarter,
  weekNumber,
  year,
  isOpen,
  onToggle,
  dumpsByDate,
  saveDump,
  isSaving,
}) => {
  // Hitung 7 tanggal untuk minggu ini (Senin=1 s.d. Minggu=7)
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = getDateFromWeek(year, weekNumber, i + 1);
    return getLocalDateString(date);
  });

  // Subtitle rentang tanggal: "28 Apr – 4 Mei"
  const firstDay = new Date(days[0] + 'T12:00:00');
  const lastDay = new Date(days[6] + 'T12:00:00');
  const rangeLabel = `${firstDay.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} – ${lastDay.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}`;

  // Hitung berapa hari yang ada konten (untuk badge)
  const filledCount = days.filter((d) => dumpsByDate.has(d)).length;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header accordion */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3">
          <span className="font-semibold text-gray-900 dark:text-gray-100">
            Week {weekInQuarter}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {rangeLabel}
          </span>
          {filledCount > 0 && (
            <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
              {filledCount}/7
            </span>
          )}
        </div>
        <ChevronDownIcon
          className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Body dengan animasi max-h */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-[4000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-5 pb-5 space-y-4 border-t border-gray-100 dark:border-gray-700 pt-4">
          {days.map((date) => (
            <DayBrainDump
              key={date}
              date={date}
              existingDump={dumpsByDate.get(date)}
              saveDump={saveDump}
              isSaving={isSaving}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default WeekAccordion;
