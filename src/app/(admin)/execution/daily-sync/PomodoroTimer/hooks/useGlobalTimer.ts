import { useEffect, useRef } from 'react';
import { useTimer } from '@/stores/timerStore';

/**
 * Global Timer Hook - Singleton pattern
 * Hanya ada 1 interval yang berjalan untuk seluruh aplikasi
 * Mencegah multiple interval yang menyebabkan timer berjalan 2x lebih cepat
 * 
 * ✅ MOBILE FIX: Background timer recovery untuk handphone yang dikunci
 */
// Global interval reference to prevent multiple instances
let globalIntervalRef: NodeJS.Timeout | null = null;

export function useGlobalTimer() {
  const { timerState, incrementSeconds, secondsElapsed, activeTask, startTime } = useTimer();
  const lastActiveTimeRef = useRef<number>(Date.now());

  // ✅ MOBILE FIX: Background timer recovery
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && timerState === 'FOCUSING') {
        // App kembali aktif, cek apakah timer perlu di-recover
        const now = Date.now();
        const timeSinceLastActive = now - lastActiveTimeRef.current;
        
        // Jika lebih dari 5 detik, kemungkinan timer terhenti
        if (timeSinceLastActive > 5000) {
          // Timer akan di-recover oleh useTimerPersistence hook
        }
      }
    };

    const handleFocus = () => {
      lastActiveTimeRef.current = Date.now();
    };

    const handleBlur = () => {
      lastActiveTimeRef.current = Date.now();
    };

    // Event listeners untuk mobile recovery
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, [timerState]);

  useEffect(() => {
    // Clear existing global interval
    if (globalIntervalRef) {
      clearInterval(globalIntervalRef);
      globalIntervalRef = null;
    }

    if (timerState === 'FOCUSING' || timerState === 'BREAK' || timerState === 'PAUSED') {
      globalIntervalRef = setInterval(() => {
        incrementSeconds();
        lastActiveTimeRef.current = Date.now(); // Update last active time
      }, 1000);
    }

    return () => {
      if (globalIntervalRef) {
        clearInterval(globalIntervalRef);
        globalIntervalRef = null;
      }
    };
  }, [timerState]); // Remove incrementSeconds from deps to prevent multiple intervals
}
