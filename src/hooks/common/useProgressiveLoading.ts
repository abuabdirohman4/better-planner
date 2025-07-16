import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { useSWRConfig } from 'swr';

import { prefetchPageData } from '@/lib/prefetchUtils';

/**
 * OPTIMIZED: Hook for progressive loading with reduced frequency
 * Prefetches relevant data for the current page only when needed
 */
export function useProgressiveLoading() {
  const { mutate } = useSWRConfig();
  const pathname = usePathname();

  useEffect(() => {
    // OPTIMIZATION: Increased delay to reduce initial load impact
    // Only prefetch data after user has been on page for 5 seconds
    const timer = setTimeout(() => {
      // OPTIMIZATION: Only prefetch data for current page
      // Removed adjacent data prefetching to reduce network requests
      prefetchPageData(pathname);
    }, 5000); // Increased from 2s to 5s to reduce initial load impact

    return () => clearTimeout(timer);
  }, [mutate, pathname]);
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