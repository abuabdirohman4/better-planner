import { useState, useTransition, useEffect, useCallback } from 'react';
import { useTimer } from '@/stores/timerStore';
import { useActivityStore } from '@/stores/activityStore';
import { logActivity } from '../../ActivityLog/actions/activityLoggingActions';

export function useTimerManagement(selectedDateStr: string, openJournalModal: (data: {
  activityId?: string;
  taskId: string;
  date: string;
  startTime: string;
  endTime: string;
  taskTitle?: string;
  duration: number;
}) => void) {
  const { startFocusSession, timerState, secondsElapsed, activeTask: activeTaskCtx, lastSessionComplete, setLastSessionComplete } = useTimer();
  const [activityLogRefreshKey, setActivityLogRefreshKey] = useState(0);
  const [, startTransition] = useTransition();

  useEffect(() => {
    const defaultTitle = 'Daily Sync | Better Planner';
    function formatTime(secs: number) {
      const m = Math.floor(secs / 60).toString().padStart(2, '0');
      const s = (secs % 60).toString().padStart(2, '0');
      return `${m}:${s}`;
    }
    if (timerState === 'FOCUSING' && activeTaskCtx) {
      document.title = `${formatTime(secondsElapsed)} ${activeTaskCtx.title}`;
    } else {
      document.title = defaultTitle;
    }
    return () => {
      document.title = defaultTitle;
    };
  }, [timerState, secondsElapsed, activeTaskCtx]);

  const handleSessionComplete = useCallback(async (sessionData: {
    taskId: string;
    taskTitle: string;
    type: 'FOCUS' | 'SHORT_BREAK' | 'LONG_BREAK';
    startTime: string;
    endTime: string;
  }) => {
    startTransition(async () => {
      try {
        if (!sessionData.taskId || !sessionData.type || !sessionData.startTime || !sessionData.endTime) {
          console.error('Missing required fields', sessionData);
          return;
        }
        const formData = new FormData();
        formData.append('taskId', sessionData.taskId);
        formData.append('taskTitle', sessionData.taskTitle);
        formData.append('sessionType', sessionData.type);
        formData.append('date', selectedDateStr);
        formData.append('startTime', sessionData.startTime);
        formData.append('endTime', sessionData.endTime);
        await logActivity(formData);
        setActivityLogRefreshKey((k) => k + 1);
        useActivityStore.getState().triggerRefresh();
        
        // Open journal modal for FOCUS sessions only
        if (sessionData.type === 'FOCUS') {
          const durationInSeconds = Math.round((new Date(sessionData.endTime).getTime() - new Date(sessionData.startTime).getTime()) / 1000);
          const durationInMinutes = Math.max(1, Math.round(durationInSeconds / 60));
          openJournalModal({
            taskId: sessionData.taskId,
            date: selectedDateStr,
            startTime: sessionData.startTime,
            endTime: sessionData.endTime,
            taskTitle: sessionData.taskTitle,
            duration: durationInMinutes,
          });
        }
      } catch (err) {
        console.error('Error logging session:', err);
      }
    });
  }, [selectedDateStr, setActivityLogRefreshKey, openJournalModal]);

  const handleSetActiveTask = (task: { id: string; title: string; item_type: string; focus_duration?: number }) => {
    startFocusSession(task);
    // Auto-scroll to top when timer starts
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    if (lastSessionComplete) {
      handleSessionComplete(lastSessionComplete);
      setLastSessionComplete(null);
    }
  }, [lastSessionComplete, handleSessionComplete, setLastSessionComplete]);

  return {
    handleSetActiveTask,
    activityLogRefreshKey
  };
}
