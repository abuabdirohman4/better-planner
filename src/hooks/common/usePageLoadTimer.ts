import { useEffect, useLayoutEffect, useRef, useState } from 'react';

/**
 * Custom hook untuk mengukur waktu loading halaman/data
 * @param isLoading boolean - true jika masih loading
 * @returns waktu loading dalam detik (float, 1 desimal)
 */
export function usePageLoadTimer(isLoading: boolean): number {
  const [elapsed, setElapsed] = useState(0);
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isStoppedRef = useRef(false);

  // Mulai timer segera dengan useLayoutEffect (sebelum render)
  useLayoutEffect(() => {
    // Set start time immediately
    startTimeRef.current = performance.now();
    
    // Mulai interval timer
    if (!isStoppedRef.current) {
      timerRef.current = setInterval(() => {
        if (!isStoppedRef.current && startTimeRef.current > 0) {
          const currentTime = performance.now();
          const elapsedMs = currentTime - startTimeRef.current;
          setElapsed(elapsedMs / 1000);
        }
      }, 50); // Update setiap 50ms untuk responsivitas
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []); // Empty dependency array - hanya jalankan sekali

  // Handle loading state changes
  useEffect(() => {
    if (!isLoading && !isStoppedRef.current) {
      isStoppedRef.current = true;
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      // Set final time
      const finalTime = performance.now();
      const finalElapsed = (finalTime - startTimeRef.current) / 1000;
      setElapsed(finalElapsed);
    }
  }, [isLoading]);

  // Format ke 1 desimal
  return Math.round(elapsed * 10) / 10;
} 