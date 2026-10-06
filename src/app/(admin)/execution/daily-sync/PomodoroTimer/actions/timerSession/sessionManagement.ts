"use server";

// Timer session management actions

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getDeviceId } from './deviceUtils';
import { logTimerEvent } from './timerEventActions';
import { cleanupAbandonedSessions } from './cleanupActions';
import { pickSessionToComplete, pickRecoverableSession } from '@/lib/timerSessionLogic';

export async function saveTimerSession(sessionData: {
  taskId: string;
  taskTitle: string;
  sessionType: string;
  startTime: string;
  targetDuration: number;
  currentDuration: number;
  status: string;
  deviceId?: string;
  focusDuration?: number;
  sessionId?: string | null;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  try {
    // Cleanup abandoned breaks first
    await cleanupAbandonedSessions();

    // Reuse the row only if it is THIS session (by id, or same task + start within 120s).
    // A FOCUSING row with another start_time is a different/older session: leave it for
    // the server to finish, and open a new row.
    const { data: openRows } = await supabase
      .from('timer_sessions')
      .select('id, task_id, start_time')
      .eq('user_id', user.id)
      .eq('task_id', sessionData.taskId)
      .in('status', ['FOCUSING', 'PAUSED']);
    const existingSession = pickSessionToComplete(
      openRows ?? [], sessionData.taskId, sessionData.startTime, sessionData.sessionId,
    );

    let data, error;
    // ✅ currentDuration must not exceed targetDuration
    const validCurrentDuration = Math.min(sessionData.currentDuration, sessionData.targetDuration);

    if (existingSession) {
      const result = await supabase
        .from('timer_sessions')
        .update({
          task_title: sessionData.taskTitle,
          session_type: sessionData.sessionType,
          // start_time only moves for the session the client explicitly owns (pause/resume
          // shifts it); a fuzzy match must never overwrite another session's start.
          ...(existingSession.id === sessionData.sessionId ? { start_time: sessionData.startTime } : {}),
          target_duration_seconds: sessionData.targetDuration,
          current_duration_seconds: validCurrentDuration,
          status: sessionData.status,
          device_id: sessionData.deviceId || getDeviceId(),
          focus_duration: sessionData.focusDuration,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingSession.id)
        .select()
        .single();

      data = result.data;
      error = result.error;
    } else {
      const result = await supabase
        .from('timer_sessions')
        .insert({
          user_id: user.id,
          task_id: sessionData.taskId,
          task_title: sessionData.taskTitle,
          session_type: sessionData.sessionType,
          start_time: sessionData.startTime,
          target_duration_seconds: sessionData.targetDuration,
          current_duration_seconds: validCurrentDuration,
          status: sessionData.status,
          device_id: sessionData.deviceId || getDeviceId(),
          focus_duration: sessionData.focusDuration,
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

/**
 * FOCUSING session to resume. Pass the store's sessionId/taskId so a session of another
 * task or device is never picked up by mistake; with neither (store IDLE) it returns the
 * newest not-yet-due session.
 */
export async function getActiveTimerSession(hint: { sessionId?: string | null; taskId?: string | null } = {}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  try {
    const { data, error } = await supabase
      .from('timer_sessions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'FOCUSING')
      .order('start_time', { ascending: false });

    if (error) throw error;
    return pickRecoverableSession(data ?? [], hint, Date.now());
  } catch (error) {
    console.error('[getActiveTimerSession] Exception:', error);
    throw error;
  }
}

/** FOCUSING row to complete for a finished session: by id, else same task + start ±120s. Null if the server already closed it. */
export async function findFocusSession(sessionId: string | null | undefined, taskId: string, startTime: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('timer_sessions')
    .select('*')
    .eq('user_id', user.id)
    .in('status', ['FOCUSING', 'PAUSED']);
  if (error) throw error;
  return pickSessionToComplete(data ?? [], taskId, startTime, sessionId);
}
