import type { SupabaseClient } from '@supabase/supabase-js';

export interface IcalCalendar {
  url: string;
  name: string;
}

export interface TimelineProfile {
  timeline_start_hour: number;
  timeline_end_hour: number;
  ical_calendars: IcalCalendar[];
}

export async function queryTimelineProfile(supabase: SupabaseClient, userId: string): Promise<TimelineProfile | null> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('timeline_start_hour, timeline_end_hour, ical_calendars')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** Update baris profil; kalau user belum punya baris profil, buat dulu. */
export async function saveTimelineProfile(
  supabase: SupabaseClient,
  userId: string,
  fields: Partial<TimelineProfile>,
) {
  const { data, error } = await supabase
    .from('user_profiles')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .select('id');
  if (error) throw error;
  if (data && data.length > 0) return;
  const { error: insertError } = await supabase.from('user_profiles').insert({ user_id: userId, ...fields });
  if (insertError) throw insertError;
}
