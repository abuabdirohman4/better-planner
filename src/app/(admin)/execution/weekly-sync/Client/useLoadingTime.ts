import { useState, useEffect } from 'react';

declare global {
  interface Window {
    __WEEKLY_SYNC_START__?: number;
  }
}

export function useLoadingTime(
  ultraFastLoading: boolean,
  toDontListLoading: boolean,
  goalsLoading: boolean
) {
  const [loadingTime, setLoadingTime] = useState<number | null>(null);

  useEffect(() => {
    if (!ultraFastLoading && !toDontListLoading && !goalsLoading && loadingTime === null) {
      const start = typeof window !== 'undefined' && window.__WEEKLY_SYNC_START__ ? window.__WEEKLY_SYNC_START__ : performance.now();
      const elapsed = (performance.now() - start) / 1000;
      setLoadingTime(Math.round(elapsed * 10) / 10);
      // Reset agar navigasi berikutnya fresh
      if (typeof window !== 'undefined') {
        window.__WEEKLY_SYNC_START__ = performance.now();
      }
    }
  }, [ultraFastLoading, toDontListLoading, goalsLoading, loadingTime]);

  return loadingTime;
}
