"use server";

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

// Generate unique device ID
function getDeviceId(): string {
  if (typeof window !== 'undefined') {
    let deviceId = localStorage.getItem('device-id');
    if (!deviceId) {
      deviceId = crypto.randomUUID();
      localStorage.setItem('device-id', deviceId);
    }
    return deviceId;
  }
  // For server-side, use a consistent device ID
  return 'server-device';
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
    // First, try to find existing running session for this user and task
    const { data: existingSession, error: findError } = await supabase
      .from('timer_sessions')
      .select('id')
      .eq('user_id', user.id)
      .eq('task_id', sessionData.taskId)
      .eq('status', 'RUNNING')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    let data, error;


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
      .eq('status', 'RUNNING')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('[getActiveTimerSession] Supabase error:', error);
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

    // Move to activity_logs
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

    // Log completion event
    await logTimerEvent(sessionId, 'stop', {
      finalDuration: session.current_duration_seconds,
      completed: true
    });

    revalidatePath('/execution/daily-sync');
    return { success: true };
  } catch (error) {
    console.error('[completeTimerSession] Exception:', error);
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
        status: 'RUNNING',
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
