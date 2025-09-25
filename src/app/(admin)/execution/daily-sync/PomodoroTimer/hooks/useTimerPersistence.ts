// Main timer persistence hook - optimized and modular

import { useEffect } from 'react';
import { useTimer, useTimerStore } from '@/stores/timerStore';
import { getActiveTimerSession } from '../actions/timerSessionActions';
import { getGlobalState } from './globalState';
import { useAutoSave } from './useAutoSave';
import { useRecovery } from './useRecovery';
import { useOnlineStatus } from './useOnlineStatus';
import { useBrowserEvents } from './useBrowserEvents';
import { useRealtimeSync } from './useRealtimeSync';
import { useTimerActions } from './useTimerActions';

export function useTimerPersistence() {
  const { 
    timerState, 
    activeTask, 
    startTime
  } = useTimer();

  // Initialize all sub-hooks
  const { debouncedSave } = useAutoSave();
  const { isRecovering } = useRecovery();
  const { isOnline } = useOnlineStatus();
  const { 
    handleTimerComplete, 
    handleTimerPause, 
    handleTimerResume 
  } = useTimerActions();

  // Setup browser events
  useBrowserEvents({ debouncedSave });

  // Setup real-time sync
  useRealtimeSync();

  // Clear timer state when stopped
  useEffect(() => {
    if (timerState === 'IDLE' && activeTask && startTime) {
      useTimerStore.getState().stopTimer();
    }
  }, [timerState, activeTask, startTime]);

  // Validate session during recovery
  useEffect(() => {
    const { recoveryCompleted, recoveryInProgress } = getGlobalState();
    
    if (recoveryCompleted && !isRecovering && timerState === 'FOCUSING' && activeTask && startTime && recoveryInProgress) {
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
  }, [isRecovering, timerState, activeTask, startTime]);

  // Save on page visibility change
  useEffect(() => {
    const { recoveryInProgress, recoveryCompleted } = getGlobalState();
    
    const handleVisibilityChange = () => {
      if (document.hidden && timerState === 'FOCUSING' && activeTask && startTime && !recoveryInProgress && recoveryCompleted) {
        debouncedSave();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [timerState, activeTask, startTime, debouncedSave]);

  return {
    isOnline,
    isRecovering,
    handleTimerComplete,
    handleTimerPause,
    handleTimerResume
  };
}

// Re-export utilities for external use
export { resetTimerPersistence } from './globalState';
export { getClientDeviceId, isMobileDevice } from './deviceUtils';
