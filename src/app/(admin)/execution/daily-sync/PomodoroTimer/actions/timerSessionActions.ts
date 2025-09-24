"use server";

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

// Generate unique device ID
function getDeviceId(): string {
  if (typeof window !== 'undefined') {
    // CLIENT-SIDE: Generate device ID based on browser + device info
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
  // SERVER-SIDE: Use user-specific device ID
  return 'server-user-device';
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

export async function saveTimerSession(sessionData: {
  taskId: string;
  taskTitle: string;
  sessionType: string;
  startTime: string;
  targetDuration: number;
  currentDuration: number;
  status: string;
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
      // Update existing session
      const result = await supabase
        .from('timer_sessions')
        .update({
          task_title: sessionData.taskTitle,
          session_type: sessionData.sessionType,
          start_time: sessionData.startTime,
          target_duration_seconds: sessionData.targetDuration,
          current_duration_seconds: sessionData.currentDuration,
          status: sessionData.status,
          device_id: getDeviceId(),
          updated_at: new Date().toISOString()
        })
        .eq('id', existingSession.id)
        .select()
        .single();
      
      data = result.data;
      error = result.error;
    } else {
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
          current_duration_seconds: sessionData.currentDuration,
          status: sessionData.status,
          device_id: getDeviceId(),
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

    // Log event
    await logTimerEvent(data.id, 'sync', {
      currentDuration: sessionData.currentDuration,
      status: sessionData.status
    });

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

export async function completeTimerSession(sessionId: string) {
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
      });
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
async function logTimerEvent(sessionId: string, eventType: string, eventData: any) {
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
        device_id: getDeviceId()
      });
  } catch (error) {
    console.error('[logTimerEvent] Error:', error);
    // Don't throw error for logging failures
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
