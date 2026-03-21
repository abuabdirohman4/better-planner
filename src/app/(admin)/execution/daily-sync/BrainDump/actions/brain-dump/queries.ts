import type { SupabaseClient } from '@supabase/supabase-js';

export async function queryBrainDumpByDate(
  supabase: SupabaseClient,
  userId: string,
  date: string,
) {
  const { data, error } = await supabase
    .from('brain_dumps')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)
    .single();

  if (error) throw error;
  return data;
}

export async function upsertBrainDumpRecord(
  supabase: SupabaseClient,
  userId: string,
  content: string,
  date: string,
) {
  const { data, error } = await supabase
    .from('brain_dumps')
    .upsert(
      {
        content,
        date,
        user_id: userId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,date' },
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function queryBrainDumpByDateRange(
  supabase: SupabaseClient,
  userId: string,
  startDate: string,
  endDate: string,
) {
  const { data, error } = await supabase
    .from('brain_dumps')
    .select('*')
    .eq('user_id', userId)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}
