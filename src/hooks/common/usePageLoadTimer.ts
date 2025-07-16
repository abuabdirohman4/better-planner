import { useEffect, useRef, useState } from 'react';

/**
 * Custom hook untuk mengukur waktu loading halaman/data
 * @param isLoading boolean - true jika masih loading
 * @returns waktu loading dalam detik (float, 1 desimal)
 */
export function usePageLoadTimer(isLoading: boolean): number {
  const [elapsed, setElapsed] = useState(0);
  const startTimeRef = useRef<number>(Date.now());
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isStoppedRef = useRef(false);

  useEffect(() => {
    // Mulai timer segera saat komponen mount
    if (!isStoppedRef.current) {
      timerRef.current = setInterval(() => {
        if (!isStoppedRef.current) {
          setElapsed(((Date.now() - startTimeRef.current) / 1000));
        }
      }, 50);
    }

    // Stop timer ketika loading selesai
    if (!isLoading && !isStoppedRef.current) {
      isStoppedRef.current = true;
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      // Set final time
      setElapsed(((Date.now() - startTimeRef.current) / 1000));
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isLoading]);

  // Format ke 1 desimal
  return Math.round(elapsed * 10) / 10;
} 