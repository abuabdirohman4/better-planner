import { useEffect, useRef } from 'react';
import { useTimer, useTimerStore, BREAK_DURATIONS } from '@/stores/timerStore';
import { isTimerEnabledInDev } from '@/lib/timerDevUtils';
import { notifyActivityLogsChanged } from '@/lib/swr';
import { endBreakSession } from '../actions/timerSession/breakSession';

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
  const { timerState, secondsElapsed, activeTask, startTime } = useTimer();
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
    // ✅ DEV CONTROL: Don't run timer if disabled in development
    if (!isTimerEnabledInDev()) {
      // Clear any existing interval
      if (globalIntervalRef) {
        clearInterval(globalIntervalRef);
        globalIntervalRef = null;
      }
      return;
    }

    // Clear existing global interval
    if (globalIntervalRef) {
      clearInterval(globalIntervalRef);
      globalIntervalRef = null;
    }

    if (timerState === 'FOCUSING' || timerState === 'BREAK') {
      globalIntervalRef = setInterval(() => {
        const state = useTimerStore.getState();

        // ✅ TIME-BASED CALCULATION: Calculate elapsed time from startTime
        // Only calculate if not paused (startTime exists)
        if (state.startTime && state.timerState !== 'PAUSED') {
          const now = Date.now();
          const startTimeMs = new Date(state.startTime).getTime();
          const elapsedSeconds = Math.floor((now - startTimeMs) / 1000);

          // Update secondsElapsed with calculated value
          useTimerStore.setState({ secondsElapsed: elapsedSeconds });

          // ✅ AUTO-COMPLETION CHECK: Check if timer should be completed
          // ✅ FIX: Gunakan state.activeTask (live Zustand state) bukan closure activeTask.
          // Setelah resumeFromDatabase update Zustand, closure lama masih aktif hingga
          // useEffect re-run. state selalu up-to-date karena diambil via getState() di atas.
          if (state.activeTask && state.timerState === 'FOCUSING') {
            const targetDuration = (state.activeTask.focus_duration || 25) * 60;

            if (elapsedSeconds >= targetDuration) {
              useTimerStore.getState().completeTimerFromDatabase({
                taskId: state.activeTask.id,
                taskTitle: state.activeTask.title,
                startTime: state.startTime!,
                duration: targetDuration,
                status: 'COMPLETED'
              });
              return;
            }
          }

          // ✅ BREAK COMPLETION CHECK
          if (state.timerState === 'BREAK' && state.breakType) {
            const breakDuration = BREAK_DURATIONS[state.breakType];

            if (elapsedSeconds >= breakDuration) {
              useTimerStore.getState().stopFocusSound();
              // Tutup baris break di server (dulu tertinggal RUNNING) sekaligus mencatatnya sebagai log BREAK.
              endBreakSession().then(() => notifyActivityLogsChanged()).catch(console.error);
              useTimerStore.setState({
                timerState: 'IDLE',
                breakType: null,
                secondsElapsed: 0,
                startTime: null
              });
              return;
            }
          }
        }

        lastActiveTimeRef.current = Date.now();
      }, 1000);
    }

    return () => {
      if (globalIntervalRef) {
        clearInterval(globalIntervalRef);
        globalIntervalRef = null;
      }
    };
  }, [timerState, activeTask, startTime]);
}
