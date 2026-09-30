// NO "use server" — importable in tests
import type { SupabaseClient } from '@supabase/supabase-js';

export interface RawWeekSchedule {
  id: string;
  scheduled_start_time: string;
  scheduled_end_time: string;
  daily_plan_items: { item_id: string } | null;
}

// ponytail: tanpa .range() — PostgREST cap 1000 baris, seminggu jadwal jauh di bawah itu.
export async function queryWeekSchedules(
  supabase: SupabaseClient,
  userId: string,
  startUTC: string,
  endUTC: string
): Promise<RawWeekSchedule[]> {
  const { data, error } = await supabase
    .from('task_schedules')
    .select('id, scheduled_start_time, scheduled_end_time, daily_plan_items!inner(item_id, daily_plans!inner(user_id))')
    .eq('daily_plan_items.daily_plans.user_id', userId)
    .gte('scheduled_start_time', startUTC)
    .lte('scheduled_start_time', endUTC)
    .order('scheduled_start_time', { ascending: true });
  if (error) throw error;
  return (data || []) as unknown as RawWeekSchedule[];
}
