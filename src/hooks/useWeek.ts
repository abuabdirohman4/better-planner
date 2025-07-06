import { useState, useEffect } from 'react';
import { useQuarter } from './useQuarter';
import { getWeekOfYear, getQuarterWeekRange } from '@/lib/quarterUtils';

export function useWeek() {
  const { year, quarter } = useQuarter();
  const [weekNumber, setWeekNumber] = useState(1);

  // Calculate current week in quarter
  useEffect(() => {
    const now = new Date();
    const currentWeekNumber = getWeekOfYear(now);
    const { startWeek, endWeek } = getQuarterWeekRange(year, quarter);
    const weekInQuarter = Math.max(1, Math.min(endWeek - startWeek + 1, currentWeekNumber - startWeek + 1));
    setWeekNumber(weekInQuarter);
  }, [year, quarter]);

  return {
    year,
    quarter,
    weekNumber,
    setWeekNumber
  };
} 