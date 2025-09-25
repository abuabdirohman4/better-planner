// Timer actions (complete, pause, resume)

import { useCallback } from 'react';
import { 
  completeTimerSession,
  pauseTimerSession,
  resumeTimerSession
} from '../actions/timerSessionActions';

export function useTimerActions() {
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
    handleTimerComplete,
    handleTimerPause,
    handleTimerResume
  };
}
