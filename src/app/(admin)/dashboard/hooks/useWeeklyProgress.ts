"use client";

import useSWR from 'swr';
import { getWeeklyProgressForQuarter } from '../actions/weeklyProgressActions';
import type { WeeklyProgressData } from '../actions/weeklyProgressActions';

export function useWeeklyProgress(year: number, quarter: number) {
  const swrKey = ['weekly-progress', year, quarter];

  const { 
    data = [],
    error, 
    isLoading,
    mutate
  } = useSWR<WeeklyProgressData[]>(
    swrKey,
    () => getWeeklyProgressForQuarter(year, quarter),
    {
      revalidateOnFocus: false,
      revalidateIfStale: true,
      revalidateOnReconnect: true,
      dedupingInterval: 2 * 1000,
      errorRetryCount: 2,
      errorRetryInterval: 500,
      keepPreviousData: true,
    }
  );

  return {
    data,
    isLoading,
    error,
    mutate
  };
}

