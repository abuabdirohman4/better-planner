// Auto-save logic for timer persistence

import { useEffect, useCallback } from 'react';
import { useTimerStore } from '@/stores/timerStore';
import { saveTimerSession } from '../../actions/timerSessionActions';
import { getClientDeviceId } from '../deviceUtils';
import { getGlobalState, setGlobalLastSaveTime, setGlobalIsSaving } from '../globalState';
import { isTimerEnabledInDev } from '@/lib/timerDevUtils';

export function useAutoSave() {
  const timerState = useTimerStore((s) => s.timerState);
  const activeTaskId = useTimerStore((s) => s.activeTask?.id);
  const startTime = useTimerStore((s) => s.startTime);

  // Reads the latest store state at call time, so identity is stable and the interval
  // below is not reset every second by secondsElapsed ticking.
  const debouncedSave = useCallback(async () => {
    // ✅ DEV CONTROL: Don't save if timer is disabled in development
    if (!isTimerEnabledInDev()) {
      return;
    }

    const { activeTask, startTime, secondsElapsed, timerState, sessionId } = useTimerStore.getState();
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
      // saveTimerSession updates this session's row (by sessionId) or creates it
      const row = await saveTimerSession({
        taskId: activeTask.id,
        taskTitle: activeTask.title,
        sessionType: 'FOCUS',
        startTime,
        targetDuration: (activeTask.focus_duration || 25) * 60,
        currentDuration: secondsElapsed,
        status: timerState,
        deviceId: getClientDeviceId(),
        focusDuration: activeTask.focus_duration,
        sessionId,
      });
      if (row?.id && !useTimerStore.getState().sessionId && useTimerStore.getState().startTime === startTime) {
        useTimerStore.setState({ sessionId: row.id });
      }
    } catch (error) {
      console.error('❌ Failed to save timer session:', error);
    } finally {
      setGlobalIsSaving(false);
    }
  }, []);

  // Auto-save interval. Deps exclude secondsElapsed on purpose (it changes every second).
  useEffect(() => {
    // ✅ DEV CONTROL: Don't auto-save if timer is disabled in development
    if (!isTimerEnabledInDev()) {
      return;
    }

    const { recoveryInProgress, recoveryCompleted } = getGlobalState();

    if (timerState === 'FOCUSING' && activeTaskId && startTime && !recoveryInProgress && recoveryCompleted) {
      const saveInterval = process.env.NODE_ENV === 'development' ? 5000 : 30000; // 5s dev, 30s prod
      const interval = setInterval(() => { debouncedSave(); }, saveInterval);
      return () => clearInterval(interval);
    }
  }, [timerState, activeTaskId, startTime, debouncedSave]);

  return { debouncedSave };
}
