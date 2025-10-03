// Browser events handling (visibility, focus, blur, etc.)

import { useEffect } from 'react';
import { useTimer, useTimerStore } from '@/stores/timerStore';
import { getActiveTimerSession, updateSessionWithActualTime } from '../../actions/timerSessionActions';
import { getGlobalState } from '../globalState';
import { isTimerEnabledInDev } from '@/lib/timerDevUtils';

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
    // ✅ DEV CONTROL: Don't handle browser events if timer is disabled in development
    if (!isTimerEnabledInDev()) {
      return;
    }
    
    const { recoveryInProgress, recoveryCompleted } = getGlobalState();
    
    const handleVisibilityChange = async () => {
      if (document.hidden) {
        // Tab tidak aktif - save state
        if (timerState === 'FOCUSING' && activeTask && startTime && !recoveryInProgress && recoveryCompleted) {
          debouncedSave();
        }
      } else {
        // Tab aktif kembali - sync drift dengan server
        if (timerState === 'FOCUSING' && activeTask && startTime && !recoveryInProgress && recoveryCompleted) {
          try {
            const activeSession = await getActiveTimerSession();
            if (!activeSession) return;
            
            const result = await updateSessionWithActualTime(activeSession.id);
            
            if (result.completed) {
              // Timer selesai - trigger completion
              useTimerStore.getState().completeTimerFromDatabase({
                taskId: activeSession.task_id,
                taskTitle: activeSession.task_title,
                startTime: activeSession.start_time,
                duration: result.elapsedSeconds,
                status: 'COMPLETED'
              });
              console.log('⏰ Timer completed while tab was inactive');
            } else {
              // Timer masih berjalan - resume dengan waktu yang akurat
              useTimerStore.getState().resumeFromDatabase({
                taskId: activeSession.task_id,
                taskTitle: activeSession.task_title,
                startTime: activeSession.start_time,
                currentDuration: result.elapsedSeconds,
                status: activeSession.status,
                focus_duration: activeSession.focus_duration // ✅ TAMBAHKAN
              });
              console.log('🔄 Timer synced with server:', result.elapsedSeconds, 'seconds');
            }
          } catch (error) {
            console.error('❌ Failed to sync timer with server:', error);
          }
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
