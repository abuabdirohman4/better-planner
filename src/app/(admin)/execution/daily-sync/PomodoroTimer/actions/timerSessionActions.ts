"use server";

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getClientDeviceId } from '../hooks/deviceUtils';

// Generate unique device ID
function getDeviceId(): string {
  if (typeof window !== 'undefined') {
    // CLIENT-SIDE: Use centralized device ID function
    return getClientDeviceId();
  }
  // SERVER-SIDE: Generate meaningful device ID based on request context
  // This will be called from server actions, so we need to generate a unique ID
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `server-${timestamp}-${random}`;
}

export async function saveTimerSession(sessionData: {
  taskId: string;
  taskTitle: string;
  sessionType: string;
  startTime: string;
  targetDuration: number;
  currentDuration: number;
  status: string;
  deviceId?: string; // ✅ Add deviceId parameter
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  try {
    // Cleanup abandoned sessions first
    await cleanupAbandonedSessions();
    
    // First, try to find existing running session for this user and task
    const { data: existingSession, error: findError } = await supabase
      .from('timer_sessions')
      .select('id')
      .eq('user_id', user.id)
      .eq('task_id', sessionData.taskId)
      .eq('status', 'FOCUSING')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    let data, error;

    // Cleanup any abandoned sessions for this user and task before creating/updating
    if (!existingSession) {
      await supabase
        .from('timer_sessions')
        .update({ status: 'COMPLETED' })
        .eq('user_id', user.id)
        .eq('task_id', sessionData.taskId)
        .eq('status', 'FOCUSING');
    }

    if (existingSession) {
      // ✅ FIX: Validasi currentDuration tidak boleh lebih besar dari targetDuration
      const validCurrentDuration = Math.min(sessionData.currentDuration, sessionData.targetDuration);
      
      // Update existing session
      const result = await supabase
        .from('timer_sessions')
        .update({
          task_title: sessionData.taskTitle,
          session_type: sessionData.sessionType,
          start_time: sessionData.startTime,
          target_duration_seconds: sessionData.targetDuration,
          current_duration_seconds: validCurrentDuration, // ✅ Use validated duration
          status: sessionData.status,
          device_id: sessionData.deviceId || getDeviceId(), // ✅ Use provided deviceId or generate new one
          updated_at: new Date().toISOString()
        })
        .eq('id', existingSession.id)
        .select()
        .single();
      
      data = result.data;
      error = result.error;
    } else {
      // ✅ FIX: Validasi currentDuration tidak boleh lebih besar dari targetDuration
      const validCurrentDuration = Math.min(sessionData.currentDuration, sessionData.targetDuration);
      
      // Create new session
      const result = await supabase
        .from('timer_sessions')
        .insert({
          user_id: user.id,
          task_id: sessionData.taskId,
          task_title: sessionData.taskTitle,
          session_type: sessionData.sessionType,
          start_time: sessionData.startTime,
          target_duration_seconds: sessionData.targetDuration,
          current_duration_seconds: validCurrentDuration, // ✅ Use validated duration
          status: sessionData.status,
          device_id: sessionData.deviceId || getDeviceId(), // ✅ Use provided deviceId or generate new one
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      data = result.data;
      error = result.error;
    }

    if (error) {
      throw error;
    }

    // ✅ TAMBAHKAN: Log start event untuk session baru, sync event untuk session yang sudah ada
    if (!existingSession) {
      // New session - log start event
      await logTimerEvent(data.id, 'start', {
        taskId: sessionData.taskId,
        taskTitle: sessionData.taskTitle,
        startTime: sessionData.startTime,
        targetDuration: sessionData.targetDuration,
        sessionType: sessionData.sessionType
      }, sessionData.deviceId);
    } else {
      // Existing session - log sync event
      await logTimerEvent(data.id, 'sync', {
        currentDuration: sessionData.currentDuration,
        status: sessionData.status
      }, sessionData.deviceId);
    }

    revalidatePath('/execution/daily-sync');
    return data;
  } catch (error) {
    throw error;
  }
}

export async function getActiveTimerSession() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  try {
    const { data, error } = await supabase
      .from('timer_sessions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'FOCUSING')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('[getActiveTimerSession] Exception:', error);
    throw error;
  }
}

export async function completeTimerSession(sessionId: string, deviceId?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  try {
    // Get session data
    const { data: session, error: sessionError } = await supabase
      .from('timer_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError) {
      console.error('[completeTimerSession] Session fetch error:', sessionError);
      throw sessionError;
    }

    // ✅ FIX: Check if activity log already exists to prevent duplicates
    const { data: existingLog } = await supabase
      .from('activity_logs')
      .select('id')
      .eq('user_id', user.id)
      .eq('task_id', session.task_id)
      .eq('start_time', session.start_time)
      .maybeSingle();

    if (!existingLog) {
      // Only create activity log if it doesn't exist
      const { error: logError } = await supabase
        .from('activity_logs')
        .insert({
          user_id: user.id,
          task_id: session.task_id,
          type: session.session_type,
          start_time: session.start_time,
          end_time: new Date().toISOString(),
          duration_minutes: Math.round(session.current_duration_seconds / 60),
          local_date: new Date().toISOString().slice(0, 10)
        });

      if (logError) {
        console.error('[completeTimerSession] Activity log error:', logError);
        throw logError;
      }
    } else {
      console.log('[completeTimerSession] Activity log already exists, skipping creation');
    }

    // Mark session as completed
    const { error: updateError } = await supabase
      .from('timer_sessions')
      .update({ 
        status: 'COMPLETED',
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId);

    if (updateError) {
      console.error('[completeTimerSession] Update error:', updateError);
      throw updateError;
    }

    // ✅ FIX: Check if stop event already exists to prevent duplicates
    const { data: existingStopEvent } = await supabase
      .from('timer_events')
      .select('id')
      .eq('session_id', sessionId)
      .eq('event_type', 'stop')
      .maybeSingle();

    if (!existingStopEvent) {
      // Only log stop event if it doesn't exist
      await logTimerEvent(sessionId, 'stop', {
        finalDuration: session.current_duration_seconds,
        completed: true
      }, deviceId);
    } else {
      console.log('[completeTimerSession] Stop event already exists, skipping creation');
    }

    revalidatePath('/execution/daily-sync');
    return { success: true };
  } catch (error) {
    console.error('[completeTimerSession] Exception:', error);
    throw error;
  }
}

// ✅ FIX: Get activity log ID for a specific session
export async function getActivityLogId(sessionId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  try {
    // Get session info first
    const { data: session, error: sessionError } = await supabase
      .from('timer_sessions')
      .select('task_id, start_time')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single();

    if (sessionError) {
      console.error('[getActivityLogId] Session error:', sessionError);
      throw sessionError;
    }

    // Find activity log for this session
    const { data: activityLog, error: logError } = await supabase
      .from('activity_logs')
      .select('id')
      .eq('user_id', user.id)
      .eq('task_id', session.task_id)
      .eq('start_time', session.start_time)
      .maybeSingle();

    if (logError) {
      console.error('[getActivityLogId] Log error:', logError);
      throw logError;
    }

    return activityLog?.id || null;
  } catch (error) {
    console.error('[getActivityLogId] Exception:', error);
    throw error;
  }
}

// ✅ FIX: Handle multiple journal inputs from different devices
export async function updateActivityLogJournal(logId: string, whatDone: string, whatThink: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  try {
    // Update existing activity log with journal data
    const { error } = await supabase
      .from('activity_logs')
      .update({
        what_done: whatDone,
        what_think: whatThink,
        updated_at: new Date().toISOString()
      })
      .eq('id', logId)
      .eq('user_id', user.id);

    if (error) {
      console.error('[updateActivityLogJournal] Error:', error);
      throw error;
    }

    revalidatePath('/execution/daily-sync');
    return { success: true };
  } catch (error) {
    console.error('[updateActivityLogJournal] Exception:', error);
    throw error;
  }
}

export async function pauseTimerSession(sessionId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  try {
    const { error } = await supabase
      .from('timer_sessions')
      .update({ 
        status: 'PAUSED',
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId)
      .eq('user_id', user.id);

    if (error) {
      console.error('[pauseTimerSession] Supabase error:', error);
      throw error;
    }

    // Log pause event
    await logTimerEvent(sessionId, 'pause', {
      paused: true,
      timestamp: new Date().toISOString()
    });

    revalidatePath('/execution/daily-sync');
    return { success: true };
  } catch (error) {
    console.error('[pauseTimerSession] Exception:', error);
    throw error;
  }
}

export async function resumeTimerSession(sessionId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  try {
    const { error } = await supabase
      .from('timer_sessions')
      .update({ 
        status: 'FOCUSING',
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId)
      .eq('user_id', user.id);

    if (error) {
      console.error('[resumeTimerSession] Supabase error:', error);
      throw error;
    }

    // Log resume event
    await logTimerEvent(sessionId, 'resume', {
      resumed: true,
      timestamp: new Date().toISOString()
    });

    revalidatePath('/execution/daily-sync');
    return { success: true };
  } catch (error) {
    console.error('[resumeTimerSession] Exception:', error);
    throw error;
  }
}

// Helper function to log timer events
async function logTimerEvent(sessionId: string, eventType: string, eventData: any, deviceId?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  try {
    await supabase
      .from('timer_events')
      .insert({
        session_id: sessionId,
        event_type: eventType,
        event_data: eventData,
        device_id: deviceId || getDeviceId() // ✅ Use provided deviceId or generate new one
      });
  } catch (error) {
    console.error('[logTimerEvent] Error:', error);
    // Don't throw error for logging failures
  }
}

// ✅ SERVER-SIDE TIMER: Calculate actual elapsed time from start_time
// FIXED: Auto-complete timer when target duration is exceeded
// 
// CORRECT LOGIC:
// - Timer 25 min: Start 10:00, Close 10:05, Resume 11:05 → COMPLETED (25 min) ✅
// - Timer 60 min: Start 10:00, Close 10:30, Resume 11:30 → COMPLETED (60 min) ✅  
// - Timer 90 min: Start 10:00, Close 10:45, Resume 11:45 → COMPLETED (90 min) ✅
//
// HOW IT WORKS:
// 1. Calculate actual elapsed time since start
// 2. If elapsed >= target duration → Mark as COMPLETED with target duration
// 3. If elapsed < target duration → Use conservative approach for remaining time
// 4. Auto-complete prevents timer from running beyond intended duration
export async function calculateActualElapsedTime(sessionId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  try {
    // Get session data
    const { data: session, error } = await supabase
      .from('timer_sessions')
      .select('start_time, target_duration_seconds, status, current_duration_seconds')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single();

    if (error || !session) {
      throw new Error('Session not found');
    }

    // ✅ FIX: Check if timer should be completed based on actual elapsed time
    const now = new Date();
    const timeSinceStart = Math.floor((now.getTime() - new Date(session.start_time).getTime()) / 1000);
    const targetDuration = session.target_duration_seconds;
    
    // ✅ CRITICAL FIX: If actual elapsed time >= target duration, timer should be completed
    if (timeSinceStart >= targetDuration) {
      // Timer should be completed - return target duration
      return {
        actualElapsedSeconds: timeSinceStart,
        cappedElapsedSeconds: targetDuration, // ✅ Use target duration, not actual elapsed
        shouldComplete: true, // ✅ Mark as should complete
        status: session.status,
        lastKnownDuration: session.current_duration_seconds || 0,
        timeSinceLastUpdate: timeSinceStart
      };
    }
    
    // ✅ FIX: Use actual elapsed time for accurate timer display
    // This ensures timer shows correct time when app is reopened
    const newDuration = Math.min(timeSinceStart, targetDuration);
    
    return {
      actualElapsedSeconds: timeSinceStart,
      cappedElapsedSeconds: newDuration,
      shouldComplete: newDuration >= session.target_duration_seconds,
      status: session.status,
      lastKnownDuration: session.current_duration_seconds || 0,
      timeSinceLastUpdate: timeSinceStart
    };
  } catch (error) {
    console.error('[calculateActualElapsedTime] Error:', error);
    throw error;
  }
}

// ✅ SERVER-SIDE TIMER: Update session with actual elapsed time
export async function updateSessionWithActualTime(sessionId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  try {
    // Calculate actual elapsed time
    const { actualElapsedSeconds, cappedElapsedSeconds, shouldComplete } = await calculateActualElapsedTime(sessionId);
    
    if (shouldComplete) {
      // Complete the session
      await completeTimerSession(sessionId);
      return { completed: true, elapsedSeconds: actualElapsedSeconds };
    } else {
      // Update with actual elapsed time
      const { error } = await supabase
        .from('timer_sessions')
        .update({
          current_duration_seconds: cappedElapsedSeconds,
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId)
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      // Log the update event
      await logTimerEvent(sessionId, 'sync', {
        actualElapsedSeconds,
        cappedElapsedSeconds,
        source: 'server-side-calculation'
      });

      return { completed: false, elapsedSeconds: cappedElapsedSeconds };
    }
  } catch (error) {
    console.error('[updateSessionWithActualTime] Error:', error);
    throw error;
  }
}

// Cleanup abandoned sessions (sessions that haven't been updated for more than 1 hour)
export async function cleanupAbandonedSessions() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    const { error } = await supabase
      .from('timer_sessions')
      .update({ status: 'COMPLETED' })
      .eq('user_id', user.id)
      .eq('status', 'FOCUSING')
      .lt('updated_at', oneHourAgo);

    if (error) {
      console.error('[cleanupAbandonedSessions] Error:', error);
    }
  } catch (error) {
    console.error('[cleanupAbandonedSessions] Exception:', error);
  }
}
