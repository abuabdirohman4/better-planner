import { useState, useEffect, useCallback } from 'react';
import { getDateFromWeek } from '@/lib/quarterUtils';

// Helper: pastikan date adalah hari Senin
function ensureMonday(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1 - day);
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function useWeekNavigation(
  year: number,
  weekCalculations: any
) {
  const [currentWeek, setCurrentWeek] = useState(() => ensureMonday(new Date()));
  const [isWeekDropdownOpen, setIsWeekDropdownOpen] = useState(false);
  const [selectedWeekInQuarter, setSelectedWeekInQuarter] = useState<number | undefined>(undefined);

  // Memoized week navigation handlers
  const handleSelectWeek = useCallback((weekIdx: number) => {
    const { startWeek } = weekCalculations;
    const weekNumber = startWeek + weekIdx - 1;
    const monday = ensureMonday(getDateFromWeek(year, weekNumber, 1));
    setCurrentWeek(monday);
    setSelectedWeekInQuarter(weekIdx);
  }, [weekCalculations, year]);

  const goPrevWeek = useCallback(() => {
    if (weekCalculations.displayWeek <= 1) return;
    const prev = new Date(currentWeek);
    prev.setDate(currentWeek.getDate() - 7);
    setCurrentWeek(ensureMonday(prev));
    setSelectedWeekInQuarter(undefined);
  }, [weekCalculations.displayWeek, currentWeek]);
  
  const goNextWeek = useCallback(() => {
    if (weekCalculations.displayWeek >= weekCalculations.totalWeeks) return;
    const next = new Date(currentWeek);
    next.setDate(currentWeek.getDate() + 7);
    setCurrentWeek(ensureMonday(next));
    setSelectedWeekInQuarter(undefined);
  }, [weekCalculations.displayWeek, weekCalculations.totalWeeks, currentWeek]);

  // Close dropdown when week changes
  useEffect(() => {
    if (isWeekDropdownOpen) {
      setIsWeekDropdownOpen(false);
    }
  }, [currentWeek, isWeekDropdownOpen]);

  return {
    currentWeek,
    setCurrentWeek,
    isWeekDropdownOpen,
    setIsWeekDropdownOpen,
    selectedWeekInQuarter,
    setSelectedWeekInQuarter,
    handleSelectWeek,
    goPrevWeek,
    goNextWeek
  };
}
