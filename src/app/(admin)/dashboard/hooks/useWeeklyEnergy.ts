"use client";

import useSWR from 'swr';
import { getWeeklyEnergySummary } from '../actions/weekly-energy/actions';
import { getLocalDateString } from '@/lib/dateUtils';

export function useWeeklyEnergy() {
  const { data, error, isLoading, mutate } = useSWR(
    // Tanggal WIB di key: cache localStorage tidak menampilkan angka minggu lalu setelah minggu berganti.
    ['dashboard', 'weekly-energy-v2', getLocalDateString(new Date())],
    getWeeklyEnergySummary,
    {
      revalidateOnFocus: false,
    }
  );

  return {
    energySummary: data ?? { plus: 0, neutral: 0, minus: 0, total: 0, worstTask: null as string | null },
    isLoading,
    error,
    mutate,
  };
}
