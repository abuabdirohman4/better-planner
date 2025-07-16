import { useEffect, useRef, useState } from 'react';

/**
 * Custom hook untuk mengukur waktu loading halaman/data
 * @param isLoading boolean - true jika masih loading
 * @returns waktu loading dalam detik (float, 1 desimal)
 */
export function usePageLoadTimer(isLoading: boolean): number {
  const [elapsed, setElapsed] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isLoading) {
      startTimeRef.current = Date.now();
      setElapsed(0);
      timerRef.current = setInterval(() => {
        if (startTimeRef.current) {
          setElapsed(((Date.now() - startTimeRef.current) / 1000));
        }
      }, 50);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (startTimeRef.current) {
        setElapsed(((Date.now() - startTimeRef.current) / 1000));
      }
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