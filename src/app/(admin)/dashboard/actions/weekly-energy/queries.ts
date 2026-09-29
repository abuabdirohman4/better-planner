import type { SupabaseClient } from '@supabase/supabase-js';

export async function queryEnergyRows(
  supabase: SupabaseClient,
  userId: string,
  startDate: string,
  endDate: string
): Promise<{ energy: number | null }[]> {
  const { data, error } = await supabase
    .from('activity_logs')
    .select('energy')
    .eq('user_id', userId)
    .gte('local_date', startDate)
    .lte('local_date', endDate);

  if (error) throw error;
  return data ?? [];
}
