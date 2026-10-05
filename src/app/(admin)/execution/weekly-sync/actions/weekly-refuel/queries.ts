// NO "use server" — importable in tests
import { SupabaseClient } from '@supabase/supabase-js';
import type { WeeklyRefuel } from '@/types/weekly-sync';

export async function queryWeeklyRefuel(
  supabase: SupabaseClient,
  userId: string,
  year: number,
  quarter: number,
  weekNumber: number
): Promise<WeeklyRefuel | null> {
  const { data, error } = await supabase
    .from('weekly_refuels')
    .select('activities, achievements')
    .eq('user_id', userId)
    .eq('year', year)
    .eq('quarter', quarter)
    .eq('week_number', weekNumber)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function upsertWeeklyRefuel(
  supabase: SupabaseClient,
  userId: string,
  year: number,
  quarter: number,
  weekNumber: number,
  values: WeeklyRefuel
): Promise<void> {
  const { error } = await supabase.from('weekly_refuels').upsert(
    {
      user_id: userId,
      year,
      quarter,
      week_number: weekNumber,
      ...values,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,year,quarter,week_number' }
  );
  if (error) throw error;
}
