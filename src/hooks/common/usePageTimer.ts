import { useState, useEffect } from 'react';

/**
 * Custom hook untuk tracking berapa lama halaman terbuka
 * @returns {number} Jumlah detik sejak halaman dibuka
 */
export function usePageTimer(): number {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return elapsedSeconds;
} 