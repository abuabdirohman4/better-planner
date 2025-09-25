// Browser events handling (visibility, focus, blur, etc.)

import { useEffect } from 'react';
import { useTimer, useTimerStore } from '@/stores/timerStore';
import { getActiveTimerSession } from '../actions/timerSessionActions';
import { getGlobalState } from './globalState';

interface UseBrowserEventsProps {
  debouncedSave: () => Promise<void>;
}

export function useBrowserEvents({ debouncedSave }: UseBrowserEventsProps) {
  const { 
    timerState, 
    activeTask, 
    startTime 
  } = useTimer();

  // Browser tab detection untuk handle multi-browser access
  useEffect(() => {
    const { recoveryInProgress, recoveryCompleted } = getGlobalState();
    
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab tidak aktif - pause timer dan save state
        if (timerState === 'FOCUSING' && activeTask && startTime && !recoveryInProgress && recoveryCompleted) {
          debouncedSave();
        }
      } else {
        // Tab aktif kembali - resume timer jika perlu
        if (timerState === 'PAUSED' && activeTask && startTime && !recoveryInProgress && recoveryCompleted) {
          // Resume timer dari database state
          const resumeTimer = async () => {
            try {
              const activeSession = await getActiveTimerSession();
              if (activeSession && activeSession.task_id === activeTask.id) {
                useTimerStore.getState().resumeFromDatabase({
                  taskId: activeSession.task_id,
                  taskTitle: activeSession.task_title,
                  startTime: activeSession.start_time,
                  currentDuration: activeSession.current_duration_seconds,
                  status: activeSession.status
                });
              }
            } catch (error) {
              console.error('❌ Failed to resume timer from database:', error);
            }
          };
          resumeTimer();
        }
      }
    };

    const handleBeforeUnload = () => {
      // Tab ditutup - save state terakhir
      if (timerState === 'FOCUSING' && activeTask && startTime && !recoveryInProgress && recoveryCompleted) {
        debouncedSave();
      }
    };

    // ✅ MOBILE FIX: Handle mobile background/foreground transitions
    const handleFocus = () => {
      if (timerState === 'FOCUSING' && activeTask && startTime && !recoveryInProgress && recoveryCompleted) {
        debouncedSave();
      }
    };

    const handleBlur = () => {
      if (timerState === 'FOCUSING' && activeTask && startTime && !recoveryInProgress && recoveryCompleted) {
        debouncedSave();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, [timerState, activeTask, startTime, debouncedSave]);
}
