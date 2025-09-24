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

// Helper function to get client-side device ID
function getClientDeviceId(): string {
  if (typeof window === 'undefined') return 'server-unknown';
  
  let deviceId = localStorage.getItem('device-id');
  if (!deviceId) {
    // Create more meaningful device ID
    const userAgent = navigator.userAgent;
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    const browser = getBrowserName(userAgent);
    const deviceType = isMobile ? 'mobile' : 'desktop';
    
    // Generate UUID but prefix with device info
    const uuid = crypto.randomUUID();
    deviceId = `${deviceType}-${browser}-${uuid.substring(0, 8)}`;
    localStorage.setItem('device-id', deviceId);
  }
  return deviceId;
}

// Helper function to detect browser
function getBrowserName(userAgent: string): string {
  if (userAgent.includes('Chrome')) return 'chrome';
  if (userAgent.includes('Firefox')) return 'firefox';
  if (userAgent.includes('Safari')) return 'safari';
  if (userAgent.includes('Edge')) return 'edge';
  if (userAgent.includes('Arc')) return 'arc';
  return 'unknown';
}

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
      // ✅ FIX: Validasi session sebelum save
      const existingSession = await getActiveTimerSession();
      const deviceId = getClientDeviceId(); // ✅ Get client-side device ID
      
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
          deviceId: deviceId // ✅ Send device ID
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
          deviceId: deviceId // ✅ Send device ID
        });
      }
    } catch (error) {
      console.error('❌ Failed to save timer session:', error);
    } finally {
      globalIsSaving = false;
    }
  }, [activeTask, startTime, secondsElapsed, timerState]);

  // Auto-save dengan interval berdasarkan environment
  useEffect(() => {
    if (timerState === 'FOCUSING' && activeTask && startTime && !isRecovering && globalRecoveryCompleted) {
      // Environment-based auto-save interval
      const isDevelopment = process.env.NODE_ENV === 'development';
      const saveInterval = isDevelopment ? 5000 : 30000; // 5s dev, 30s prod
      
      const interval = setInterval(debouncedSave, saveInterval);
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

  // Recovery on app load - FIXED
  useEffect(() => {
    const recoverSession = async () => {
      // ✅ FIX: Hanya jalankan jika belum pernah recovery
      if (globalRecoveryInProgress || globalRecoveryCompleted) return;
      
      globalRecoveryInProgress = true;
      setIsRecovering(true);
      
      try {
        const activeSession = await getActiveTimerSession();
        
        if (activeSession) {
          // ✅ FIX: Gunakan current_duration_seconds dari database, bukan hitung ulang
          const currentDuration = activeSession.current_duration_seconds;
          const targetDuration = activeSession.target_duration_seconds;
          
          console.log('🔄 Recovery session:', {
            sessionId: activeSession.id,
            currentDuration,
            targetDuration,
            status: activeSession.status
          });
          
          // Check if timer should be completed
          if (currentDuration >= targetDuration) {
            // Timer should be completed, mark as completed
            console.log('⏰ Timer should be completed, marking as completed');
            await completeTimerSession(activeSession.id);
          } else {
            // Resume with database duration (not calculated)
            console.log('▶️ Resuming timer with database duration:', currentDuration);
            useTimerStore.getState().resumeFromDatabase({
              taskId: activeSession.task_id,
              taskTitle: activeSession.task_title,
              startTime: activeSession.start_time,
              currentDuration: currentDuration, // ✅ Use database value
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

    // ✅ FIX: Hanya jalankan recovery jika belum pernah dilakukan
    if (!globalRecoveryCompleted) {
      recoverSession();
    }
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

  // ✅ FIX: Browser tab detection untuk handle multi-browser access
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab tidak aktif - pause timer dan save state
        if (timerState === 'FOCUSING' && activeTask && startTime && !isRecovering && globalRecoveryCompleted) {
          debouncedSave();
        }
      } else {
        // Tab aktif kembali - resume timer jika perlu
        if (timerState === 'PAUSED' && activeTask && startTime && !isRecovering && globalRecoveryCompleted) {
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
      if (timerState === 'FOCUSING' && activeTask && startTime && !isRecovering && globalRecoveryCompleted) {
        debouncedSave();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [timerState, activeTask, startTime, isRecovering, globalRecoveryCompleted, debouncedSave]);

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
