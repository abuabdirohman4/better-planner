// NO "use server" — importable in tests
import { SupabaseClient } from '@supabase/supabase-js';

export async function rpcGetWeeklySync(
  supabase: SupabaseClient,
  userId: string,
  year: number,
  quarter: number,
  weekNumber: number,
  startDate: string,
  endDate: string
): Promise<any> {
  const { data, error } = await supabase.rpc('get_weekly_sync', {
    p_user_id: userId,
    p_year: year,
    p_quarter: quarter,
    p_week_number: weekNumber,
    p_start_date: startDate,
    p_end_date: endDate,
  });
  if (error) throw error;
  return data;
}
