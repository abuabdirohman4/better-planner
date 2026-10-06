"use server";

// Timer session control actions (pause, resume)

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { logTimerEvent } from './timerEventActions';

export async function pauseTimerSession(sessionId: string, currentDurationSeconds?: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  try {
    const { data, error } = await supabase
      .from('timer_sessions')
      .update({ 
        status: 'PAUSED',
        ...(currentDurationSeconds != null ? { current_duration_seconds: Math.round(currentDurationSeconds) } : {}),
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .in('status', ['FOCUSING', 'PAUSED'])
      .select('id');

    if (error) {
      console.error('[pauseTimerSession] Supabase error:', error);
      throw error;
    }

    // Row already closed by the server (e.g. idle pause > 6h): don't touch it, tell the caller
    if (!data?.length) return { success: true, updated: false };

    // Log pause event
    await logTimerEvent(sessionId, 'pause', {
      paused: true,
      timestamp: new Date().toISOString()
    });

    revalidatePath('/execution/daily-sync');
    return { success: true, updated: true };
  } catch (error) {
    console.error('[pauseTimerSession] Exception:', error);
    throw error;
  }
}

/** startTime = the shifted start (now - elapsed) so the server clock keeps matching the local one. */
export async function resumeTimerSession(sessionId: string, startTime?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  try {
    const { data, error } = await supabase
      .from('timer_sessions')
      .update({ 
        status: 'FOCUSING',
        ...(startTime ? { start_time: startTime } : {}),
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .in('status', ['FOCUSING', 'PAUSED'])
      .select('id');

    if (error) {
      console.error('[resumeTimerSession] Supabase error:', error);
      throw error;
    }

    if (!data?.length) return { success: true, updated: false };

    // Log resume event
    await logTimerEvent(sessionId, 'resume', {
      resumed: true,
      timestamp: new Date().toISOString()
    });

    revalidatePath('/execution/daily-sync');
    return { success: true, updated: true };
  } catch (error) {
    console.error('[resumeTimerSession] Exception:', error);
    throw error;
  }
}
