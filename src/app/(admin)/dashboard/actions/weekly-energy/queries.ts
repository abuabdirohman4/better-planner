import type { SupabaseClient } from '@supabase/supabase-js';

// Embed tasks bisa objek atau array tergantung inferensi PostgREST.
type EnergyRow = { energy: number | null; tasks: { title: string } | { title: string }[] | null };

export async function queryEnergyRows(
  supabase: SupabaseClient,
  userId: string,
  startDate: string,
  endDate: string
): Promise<EnergyRow[]> {
  const { data, error } = await supabase
    .from('activity_logs')
    .select('energy, tasks(title)')
    .eq('user_id', userId)
    .gte('local_date', startDate)
    .lte('local_date', endDate);

  if (error) throw error;
  return (data ?? []) as EnergyRow[];
}
