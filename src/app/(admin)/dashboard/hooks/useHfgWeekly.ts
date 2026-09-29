"use client";

import useSWR from 'swr';
import { getHfgWeeklyStatus, type HfgWeeklySummary } from '../actions/hfg-weekly/actions';

export function useHfgWeekly() {
  return useSWR<HfgWeeklySummary>(['hfg-weekly-status'], () => getHfgWeeklyStatus(), {
    revalidateOnFocus: true, // jam bertambah dari timer di tab lain
    revalidateIfStale: true,
    dedupingInterval: 30 * 1000,
    errorRetryCount: 1,
    keepPreviousData: true,
  });
}
