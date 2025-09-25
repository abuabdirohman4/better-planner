// Auto-save logic for timer persistence

import { useEffect, useCallback } from 'react';
import { useTimer } from '@/stores/timerStore';
import { saveTimerSession, getActiveTimerSession } from '../../actions/timerSessionActions';
import { getClientDeviceId } from '../deviceUtils';
import { getGlobalState, setGlobalLastSaveTime, setGlobalIsSaving } from '../globalState';

export function useAutoSave() {
  const { 
    timerState, 
    activeTask, 
    secondsElapsed, 
    startTime,
    breakType 
  } = useTimer();

  // Debounced save function with global state
  const debouncedSave = useCallback(async () => {
    const { isSaving } = getGlobalState();
    
    if (isSaving || !activeTask || !startTime) {
      return;
    }
    
    const now = Date.now();
    if (now - getGlobalState().lastSaveTime < 5000) { // Prevent saves within 5 seconds
      return;
    }
    
    setGlobalIsSaving(true);
    setGlobalLastSaveTime(now);
    
    try {
      // ✅ FIX: Validasi session sebelum save
      const existingSession = await getActiveTimerSession();
      const deviceId = getClientDeviceId();
      
      if (existingSession && existingSession.task_id === activeTask.id) {
        // Session sudah ada, update saja
        await saveTimerSession({
          taskId: activeTask.id,
          taskTitle: activeTask.title,
          sessionType: 'FOCUS',
          startTime: startTime,
          targetDuration: (activeTask.focus_duration || 25) * 60,
          currentDuration: secondsElapsed,
          status: timerState,
          deviceId: deviceId
        });
      } else {
        // Session belum ada, buat baru
        await saveTimerSession({
          taskId: activeTask.id,
          taskTitle: activeTask.title,
          sessionType: 'FOCUS',
          startTime: startTime,
          targetDuration: (activeTask.focus_duration || 25) * 60,
          currentDuration: secondsElapsed,
          status: timerState,
          deviceId: deviceId
        });
      }
    } catch (error) {
      console.error('❌ Failed to save timer session:', error);
    } finally {
      setGlobalIsSaving(false);
    }
  }, [activeTask, startTime, secondsElapsed, timerState]);

  // Auto-save dengan interval berdasarkan environment
  useEffect(() => {
    const { recoveryInProgress, recoveryCompleted } = getGlobalState();
    
    if (timerState === 'FOCUSING' && activeTask && startTime && !recoveryInProgress && recoveryCompleted) {
      // Environment-based auto-save interval
      const isDevelopment = process.env.NODE_ENV === 'development';
      const saveInterval = isDevelopment ? 5000 : 30000; // 5s dev, 30s prod
      
      const interval = setInterval(() => {
        debouncedSave();
      }, saveInterval);
      
      return () => {
        clearInterval(interval);
      };
    }
  }, [timerState, activeTask, startTime, debouncedSave]);

  return { debouncedSave };
}
