import type { SupabaseClient } from '@supabase/supabase-js';

export interface HourlyNote {
  hour: number;
  content: string;
}

export async function queryHourlyNotes(supabase: SupabaseClient, userId: string, date: string): Promise<HourlyNote[]> {
  const { data, error } = await supabase
    .from('hourly_notes')
    .select('hour, content')
    .eq('user_id', userId)
    .eq('date', date)
    .order('hour', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function upsertHourlyNoteRecord(
  supabase: SupabaseClient,
  userId: string,
  date: string,
  hour: number,
  content: string,
) {
  const { error } = await supabase
    .from('hourly_notes')
    .upsert(
      { user_id: userId, date, hour, content, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,date,hour' },
    );
  if (error) throw error;
}

export async function deleteHourlyNoteRecord(supabase: SupabaseClient, userId: string, date: string, hour: number) {
  const { error } = await supabase
    .from('hourly_notes')
    .delete()
    .eq('user_id', userId)
    .eq('date', date)
    .eq('hour', hour);
  if (error) throw error;
}
