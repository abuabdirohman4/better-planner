"use client";

import { useEffect, useState, useCallback } from 'react';
import { useTimer, useTimerStore } from '@/stores/timerStore';
import { 
  saveTimerSession, 
  getActiveTimerSession, 
  completeTimerSession,
  pauseTimerSession,
  resumeTimerSession
} from '../actions/timerSessionActions';

// Global state to prevent multiple instances (Strict Mode safe)
let globalRecoveryInProgress = false;
let globalLastSaveTime = 0;
let globalIsSaving = false;
let globalRecoveryCompleted = false;

// Reset function for development mode
export const resetTimerPersistence = () => {
  globalRecoveryInProgress = false;
  globalRecoveryCompleted = false;
  globalLastSaveTime = 0;
  globalIsSaving = false;
};

// Make it available in development mode
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).resetTimerPersistence = resetTimerPersistence;
}

export function useTimerPersistence() {
  const { 
    timerState, 
    activeTask, 
    secondsElapsed, 
    startTime,
    sessionCount,
    breakType 
  } = useTimer();
  
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isRecovering, setIsRecovering] = useState(globalRecoveryInProgress);

  // Debounced save function with global state
  const debouncedSave = useCallback(async () => {
    if (globalIsSaving || !activeTask || !startTime) return;
    
    const now = Date.now();
    if (now - globalLastSaveTime < 5000) { // Prevent saves within 5 seconds
      return;
    }
    
    globalIsSaving = true;
    globalLastSaveTime = now;
    
    try {
      await saveTimerSession({
        taskId: activeTask.id,
        taskTitle: activeTask.title,
        sessionType: 'FOCUS',
        startTime: startTime,
        targetDuration: (activeTask.focus_duration || 25) * 60,
        currentDuration: secondsElapsed,
        status: timerState
      });
    } catch (error) {
      console.error('❌ Failed to save timer session:', error);
    } finally {
      globalIsSaving = false;
    }
  }, [activeTask, startTime, secondsElapsed, timerState]);

  // Auto-save setiap 30 detik - OPTIMIZED
  useEffect(() => {
    if (timerState === 'FOCUSING' && activeTask && startTime && !isRecovering && globalRecoveryCompleted) {
      const interval = setInterval(debouncedSave, 30000);
      return () => clearInterval(interval);
    }
  }, [timerState, activeTask, startTime, isRecovering, debouncedSave]);

  // Clear timer state when stopped - OPTIMIZED
  useEffect(() => {
    if (timerState === 'IDLE' && activeTask && startTime) {
      useTimerStore.getState().stopTimer();
    }
  }, [timerState, activeTask, startTime]);

  // Validate session during recovery - OPTIMIZED
  useEffect(() => {
    if (globalRecoveryCompleted && !isRecovering && timerState === 'FOCUSING' && activeTask && startTime && globalRecoveryInProgress) {
      const checkSession = async () => {
        try {
          const activeSession = await getActiveTimerSession();
          if (!activeSession) {
            useTimerStore.getState().stopTimer();
          }
        } catch (error) {
          console.error('❌ Failed to check session:', error);
        }
      };
      checkSession();
    }
  }, [globalRecoveryCompleted, isRecovering, timerState, activeTask, startTime]);

  // Save on page visibility change - OPTIMIZED
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && timerState === 'FOCUSING' && activeTask && startTime && !isRecovering && globalRecoveryCompleted) {
        debouncedSave();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [timerState, activeTask, startTime, isRecovering, debouncedSave]);

  // Recovery on app load - OPTIMIZED
  useEffect(() => {
    const recoverSession = async () => {
      // Reset global state untuk testing
      if (globalRecoveryCompleted) {
        globalRecoveryCompleted = false;
        globalRecoveryInProgress = false;
      }
      
      if (globalRecoveryInProgress) return;
      
      globalRecoveryInProgress = true;
      setIsRecovering(true);
      
      try {
        const activeSession = await getActiveTimerSession();
        
        if (activeSession) {
          // Calculate actual elapsed time based on start_time
          const now = new Date();
          const startTime = new Date(activeSession.start_time);
          const actualElapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
          
          // Check if timer should be completed
          const targetDuration = activeSession.target_duration_seconds;
          if (actualElapsed >= targetDuration) {
            // Timer should be completed, mark as completed
            await completeTimerSession(activeSession.id);
          } else {
            // Resume with actual elapsed time
            useTimerStore.getState().resumeFromDatabase({
              taskId: activeSession.task_id,
              taskTitle: activeSession.task_title,
              startTime: activeSession.start_time,
              currentDuration: actualElapsed,
              status: activeSession.status
            });
          }
        }
      } catch (error) {
        console.error('❌ Failed to recover timer session:', error);
      } finally {
        globalRecoveryCompleted = true;
        globalRecoveryInProgress = false;
        setIsRecovering(false);
      }
    };

    recoverSession();
  }, []);

  // Online/Offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Handle timer completion
  const handleTimerComplete = useCallback(async (sessionId: string) => {
    try {
      await completeTimerSession(sessionId);
    } catch (error) {
      console.error('❌ Failed to complete timer session:', error);
    }
  }, []);

  // Handle timer pause
  const handleTimerPause = useCallback(async (sessionId: string) => {
    try {
      await pauseTimerSession(sessionId);
    } catch (error) {
      console.error('❌ Failed to pause timer session:', error);
    }
  }, []);

  // Handle timer resume
  const handleTimerResume = useCallback(async (sessionId: string) => {
    try {
      await resumeTimerSession(sessionId);
    } catch (error) {
      console.error('❌ Failed to resume timer session:', error);
    }
  }, []);

  return {
    isOnline,
    isRecovering,
    handleTimerComplete,
    handleTimerPause,
    handleTimerResume
  };
}
