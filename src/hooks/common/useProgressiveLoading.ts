import { useEffect } from 'react';
import { useSWRConfig } from 'swr';

import { prefetchAdjacentData } from '@/lib/prefetchUtils';

/**
 * Hook for progressive loading of adjacent data
 * Prefetches data for pages user might visit next
 */
export function useProgressiveLoading() {
  const { mutate } = useSWRConfig();

  useEffect(() => {
    // Delay prefetching to not block initial load
    const timer = setTimeout(() => {
      prefetchAdjacentData();
    }, 3000); // Wait 3 seconds after initial load

    return () => clearTimeout(timer);
  }, [mutate]);
}

/**
 * Hook for prefetching specific data on demand
 */
export function usePrefetchOnDemand() {
  // These are placeholders for future on-demand prefetch logic
  const prefetchQuestsForQuarter = () => {};
  const prefetchWeeklyDataForWeek = () => {};

  return {
    prefetchQuestsForQuarter,
    prefetchWeeklyDataForWeek,
  };
} 