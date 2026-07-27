"use server";

// Timer session completion actions

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { logTimerEvent } from './timerEventActions';
import { getLocalDateString } from '@/lib/dateUtils';

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

    const now = new Date();
    const startTimeDate = new Date(session.start_time);
    const rawDurationSeconds = Math.floor((now.getTime() - startTimeDate.getTime()) / 1000);
    // Cap to target: timer stops at target duration, never records more.
    // (App closed & reopened later must still record only the target, not wall-clock gap.)
    const cappedDurationSeconds = Math.min(rawDurationSeconds, session.target_duration_seconds);
    // end_time = start_time + capped duration, so end_time - start_time stays consistent.
    const endTime = new Date(startTimeDate.getTime() + cappedDurationSeconds * 1000).toISOString();

    // Update session duration if significantly different
    if (Math.abs(cappedDurationSeconds - session.current_duration_seconds) > 5) {
      await supabase
        .from('timer_sessions')
        .update({
          current_duration_seconds: cappedDurationSeconds,
          updated_at: now.toISOString()
        })
        .eq('id', sessionId);
    }

    // Check if activity log already exists to prevent duplicates
    const { data: existingLog } = await supabase
      .from('activity_logs')
      .select('id')
      .eq('user_id', user.id)
      .eq('task_id', session.task_id)
      .eq('start_time', session.start_time)
      .maybeSingle();

    let activityLogId: string | undefined;

    if (!existingLog) {
      const durationMinutes = Math.max(1, Math.round(cappedDurationSeconds / 60));
      const localDate = getLocalDateString(new Date(endTime));

      const { data: newLog, error: logError } = await supabase
        .from('activity_logs')
        .insert({
          user_id: user.id,
          task_id: session.task_id,
          type: session.session_type,
          start_time: session.start_time,
          end_time: endTime,
          duration_minutes: durationMinutes,
          local_date: localDate
        })
        .select('id')
        .single();

      if (logError) {
        // 23505 = unique_violation: two completion paths raced, second can skip
        if (logError.code === '23505') {
          console.log('[completeTimerSession] Activity log already exists (unique constraint), skipping duplicate');
        } else {
          console.error('[completeTimerSession] Activity log error:', logError);
          throw logError;
        }
      } else {
        activityLogId = newLog?.id;
      }
    } else {
      console.log('[completeTimerSession] Activity log already exists, skipping creation');
      activityLogId = existingLog.id;
    }

    // Mark session as completed
    const { error: updateError } = await supabase
      .from('timer_sessions')
      .update({
        status: 'COMPLETED',
        end_time: endTime,
        current_duration_seconds: cappedDurationSeconds,
        updated_at: now.toISOString()
      })
      .eq('id', sessionId);

    if (updateError) {
      console.error('[completeTimerSession] Update error:', updateError);
      throw updateError;
    }

    console.log(`✅ Timer completed: ${cappedDurationSeconds}s (target: ${session.target_duration_seconds}s)`);

    // Check if stop event already exists to prevent duplicates
    const { data: existingStopEvent } = await supabase
      .from('timer_events')
      .select('id')
      .eq('session_id', sessionId)
      .eq('event_type', 'stop')
      .maybeSingle();

    if (!existingStopEvent) {
      await logTimerEvent(sessionId, 'stop', {
        finalDuration: cappedDurationSeconds,
        completed: true
      }, deviceId);
    } else {
      console.log('[completeTimerSession] Stop event already exists, skipping creation');
    }

    revalidatePath('/execution/daily-sync');
    return { success: true, activityLogId };
  } catch (error) {
    console.error('[completeTimerSession] Exception:', error);
    throw error;
  }
}
