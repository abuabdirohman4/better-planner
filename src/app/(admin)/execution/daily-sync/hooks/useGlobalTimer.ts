import { useEffect } from 'react';
import { useTimer } from '@/stores/timerStore';

/**
 * Global Timer Hook - Singleton pattern
 * Hanya ada 1 interval yang berjalan untuk seluruh aplikasi
 * Mencegah multiple interval yang menyebabkan timer berjalan 2x lebih cepat
 */
export function useGlobalTimer() {
  const { timerState, incrementSeconds } = useTimer();

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (timerState === 'FOCUSING' || timerState === 'BREAK' || timerState === 'PAUSED') {
      interval = setInterval(() => {
        incrementSeconds();
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [timerState]); // Hanya depend pada timerState
}
