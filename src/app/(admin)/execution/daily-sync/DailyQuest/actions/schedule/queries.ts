// NO "use server"
import { SupabaseClient } from '@supabase/supabase-js';

export interface RawSchedule {
  id: string;
  daily_plan_item_id: string;
  scheduled_start_time: string;
  scheduled_end_time: string;
  duration_minutes: number;
  session_count: number;
  created_at: string;
  updated_at: string;
}

export interface RawScheduleWithItem extends RawSchedule {
  daily_plan_item: {
    id: string;
    item_id: string;
    status: string;
    item_type: string;
    focus_duration: number;
    daily_session_target: number;
  } | null;
}

export async function verifyPlanItemOwnership(
  supabase: SupabaseClient,
  itemId: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from('daily_plan_items')
    .select('id, daily_plans (user_id)')
    .eq('id', itemId)
    .single();
  if (error || !data) return null;
  const plan = data.daily_plans;
  // @ts-ignore
  return Array.isArray(plan) ? plan[0]?.user_id : plan?.user_id;
}

export async function insertSchedule(
  supabase: SupabaseClient,
  payload: {
    daily_plan_item_id: string;
    scheduled_start_time: string;
    scheduled_end_time: string;
    duration_minutes: number;
    session_count: number;
  }
): Promise<RawSchedule> {
  const { data, error } = await supabase
    .from('task_schedules')
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateScheduleById(
  supabase: SupabaseClient,
  scheduleId: string,
  payload: {
    scheduled_start_time: string;
    scheduled_end_time: string;
    duration_minutes: number;
    session_count: number;
  }
): Promise<RawSchedule | undefined> {
  const { data, error } = await supabase
    .from('task_schedules')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', scheduleId)
    .select()
    .single();
  if (error) {
    if (error.code === 'PGRST116') return undefined; // deleted — silently return
    throw error;
  }
  return data;
}

export async function deleteScheduleById(
  supabase: SupabaseClient,
  scheduleId: string
): Promise<void> {
  const { error } = await supabase
    .from('task_schedules')
    .delete()
    .eq('id', scheduleId);
  if (error) throw error;
}

export async function querySchedulesByItemId(
  supabase: SupabaseClient,
  itemId: string
): Promise<RawSchedule[]> {
  const { data, error } = await supabase
    .from('task_schedules')
    .select('*')
    .eq('daily_plan_item_id', itemId)
    .order('scheduled_start_time', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function querySchedulesByDateRange(
  supabase: SupabaseClient,
  startUTC: string,
  endUTC: string
): Promise<RawScheduleWithItem[]> {
  const { data, error } = await supabase
    .from('task_schedules')
    .select(`
      *,
      daily_plan_item:daily_plan_items (
        id, item_id, status, item_type, focus_duration, daily_session_target
      )
    `)
    .gte('scheduled_start_time', startUTC)
    .lte('scheduled_end_time', endUTC)
    .order('scheduled_start_time', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function queryTaskTitlesByIds(
  supabase: SupabaseClient,
  itemIds: string[]
): Promise<{ id: string; title: string }[]> {
  if (itemIds.length === 0) return [];
  const { data } = await supabase
    .from('tasks')
    .select('id, title')
    .in('id', itemIds);
  return data || [];
}
