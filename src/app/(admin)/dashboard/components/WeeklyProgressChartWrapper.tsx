"use client";

import { useQuarterStore } from '@/stores/quarterStore';
import { useWeeklyProgress } from '../hooks/useWeeklyProgress';
import WeeklyProgressChart from './WeeklyProgressChart';

export default function WeeklyProgressChartWrapper() {
  const { year, quarter } = useQuarterStore();
  const { data, isLoading, error } = useWeeklyProgress(year, quarter);

  return (
    <WeeklyProgressChart data={data} isLoading={isLoading} error={error} />
  );
}

