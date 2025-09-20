import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { useSWRConfig } from 'swr';

import { prefetchAdjacentData, prefetchPageData } from '@/lib/prefetchUtils';

/**
 * Hook for progressive loading of data based on current page
 * Prefetches relevant data for the current page and adjacent pages
 */
export function useProgressiveLoading() {
  const { mutate } = useSWRConfig();
  const pathname = usePathname();

  useEffect(() => {
    // Delay prefetching to not block initial load
    const timer = setTimeout(() => {
      // Prefetch data specific to current page
      prefetchPageData(pathname);
      
      // Prefetch adjacent data for smooth navigation
      prefetchAdjacentData();
    }, 2000); // Wait 2 seconds after initial load (reduced from 3s)

    return () => clearTimeout(timer);
  }, [mutate, pathname]);
}
