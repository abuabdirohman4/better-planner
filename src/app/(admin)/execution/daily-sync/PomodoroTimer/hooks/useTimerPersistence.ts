"use client";

import { useEffect, useState, useCallback } from 'react';
import { useTimer, useTimerStore } from '@/stores/timerStore';
import { 
  saveTimerSession, 
  getActiveTimerSession, 
  completeTimerSession,
  pauseTimerSession,
  resumeTimerSession,
  updateSessionWithActualTime
} from '../actions/timerSessionActions';
import { createClient } from '@/lib/supabase/client';

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
  const [user, setUser] = useState<any>(null);
  
  // Get user for real-time sync
  useEffect(() => {
    const supabase = createClient();
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  // Debounced save function with global state
  const debouncedSave = useCallback(async () => {
    if (globalIsSaving || !activeTask || !startTime) {
      return;
    }
    
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
      
      const interval = setInterval(() => {
        debouncedSave();
      }, saveInterval);
      
      return () => {
        clearInterval(interval);
      };
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
          // ✅ SERVER-SIDE TIMER: Update session with actual elapsed time
          try {
            const result = await updateSessionWithActualTime(activeSession.id);
            
            if (result.completed) {
              // ✅ FIX: Timer completed while app was closed - trigger completion
              console.log('⏰ Timer completed while app was closed');
              
              // Trigger timer completion in frontend
              useTimerStore.getState().completeTimerFromDatabase({
                taskId: activeSession.task_id,
                taskTitle: activeSession.task_title,
                startTime: activeSession.start_time,
                duration: result.elapsedSeconds, // ✅ Use elapsed seconds
                status: 'COMPLETED'
              });
            } else {
              // Resume with actual elapsed time from server
              console.log('▶️ Resuming timer with server-calculated duration:', result.elapsedSeconds);
              useTimerStore.getState().resumeFromDatabase({
                taskId: activeSession.task_id,
                taskTitle: activeSession.task_title,
                startTime: activeSession.start_time,
                currentDuration: result.elapsedSeconds, // ✅ Use elapsed seconds
                status: activeSession.status
              });
            }
          } catch (error) {
            console.error('❌ Failed to update session with actual time:', error);
            // Fallback to database duration
            const currentDuration = activeSession.current_duration_seconds;
            useTimerStore.getState().resumeFromDatabase({
              taskId: activeSession.task_id,
              taskTitle: activeSession.task_title,
              startTime: activeSession.start_time,
              currentDuration: currentDuration,
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

    // ✅ MOBILE FIX: Handle mobile background/foreground transitions
    const handleFocus = () => {
      if (timerState === 'FOCUSING' && activeTask && startTime && !isRecovering && globalRecoveryCompleted) {
        debouncedSave();
      }
    };

    const handleBlur = () => {
      if (timerState === 'FOCUSING' && activeTask && startTime && !isRecovering && globalRecoveryCompleted) {
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

  // ✅ REAL-TIME SYNC: Subscribe to timer_sessions changes
  useEffect(() => {
    const supabase = createClient();
    
    // Subscribe to timer_sessions changes
    const channel = supabase
      .channel('timer-sessions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'timer_sessions',
          filter: `user_id=eq.${user?.id}`
        },
        async (payload) => {
          console.log('🔄 Real-time timer session update:', payload);
          
          // Handle different event types
          if (payload.eventType === 'UPDATE') {
            const session = payload.new;
            
            // Check if this is our current active session
            if (session.status === 'COMPLETED' && session.task_id === activeTask?.id) {
              console.log('⏰ Timer completed on another device - syncing...');
              
              // Sync timer state with database
              useTimerStore.getState().completeTimerFromDatabase({
                taskId: session.task_id,
                taskTitle: session.task_title || 'Unknown Task',
                startTime: session.start_time,
                duration: session.current_duration_seconds,
                status: session.status
              });
            } else if (session.status === 'FOCUSING' && session.task_id === activeTask?.id) {
              console.log('🔄 Timer session updated on another device - syncing...');
              
              // Sync current duration
              useTimerStore.getState().resumeFromDatabase({
                taskId: session.task_id,
                taskTitle: session.task_title || 'Unknown Task',
                startTime: session.start_time,
                currentDuration: session.current_duration_seconds,
                status: session.status
              });
            }
          } else if (payload.eventType === 'INSERT') {
            const session = payload.new;
            
            // Check if this is a new session for the same task
            if (session.status === 'FOCUSING' && session.task_id === activeTask?.id) {
              console.log('⚠️ New timer session created on another device for same task');
              
              // This might indicate a race condition
              // We should handle this appropriately
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, activeTask?.id]);

  // ✅ REAL-TIME SYNC: Subscribe to activity_logs changes
  useEffect(() => {
    const supabase = createClient();
    
    // Subscribe to activity_logs changes
    const channel = supabase
      .channel('activity-logs-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activity_logs',
          filter: `user_id=eq.${user?.id}`
        },
        async (payload) => {
          console.log('📝 New activity log created:', payload);
          
          const activityLog = payload.new;
          
          // Check if this is for our current active task
          if (activityLog.task_id === activeTask?.id && activeTask) {
            console.log('⏰ Activity log created for current task - timer should be completed');
            
            // Complete timer state
            useTimerStore.getState().completeTimerFromDatabase({
              taskId: activityLog.task_id,
              taskTitle: activeTask.title,
              startTime: activityLog.start_time,
              duration: activityLog.duration_minutes * 60,
              status: 'COMPLETED'
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, activeTask?.id]);

  return {
    isOnline,
    isRecovering,
    handleTimerComplete,
    handleTimerPause,
    handleTimerResume
  };
}
