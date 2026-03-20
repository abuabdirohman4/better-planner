// NO "use server" — importable in tests
import { SupabaseClient } from '@supabase/supabase-js';

export interface RawDailyPlan {
  id: string;
  user_id: string;
  plan_date: string;
}

export interface RawDailyPlanItem {
  id: string;
  item_id: string;
  item_type: string;
  status: string;
  daily_session_target: number;
  focus_duration: number;
  daily_plan_id?: string;
}

export interface RawTaskSchedule {
  scheduled_start_time: string;
  scheduled_end_time: string;
  duration_minutes: number;
  session_count: number;
  daily_plan_items: { item_id: string };
}

export async function upsertDailyPlan(
  supabase: SupabaseClient,
  userId: string,
  date: string
): Promise<RawDailyPlan> {
  const { data, error } = await supabase
    .from('daily_plans')
    .upsert({ user_id: userId, plan_date: date }, { onConflict: 'user_id,plan_date' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function queryExistingPlanItems(
  supabase: SupabaseClient,
  dailyPlanId: string
): Promise<RawDailyPlanItem[]> {
  const { data } = await supabase
    .from('daily_plan_items')
    .select('id, item_id, status, item_type, daily_session_target, focus_duration')
    .eq('daily_plan_id', dailyPlanId);
  return data || [];
}

export async function querySchedulesByPlanItemIds(
  supabase: SupabaseClient,
  itemIds: string[]
): Promise<RawTaskSchedule[]> {
  if (itemIds.length === 0) return [];
  const { data } = await supabase
    .from('task_schedules')
    .select('*, daily_plan_items!inner(item_id)')
    .in('daily_plan_item_id', itemIds);
  return data || [];
}

export async function deletePlanItemsByTypes(
  supabase: SupabaseClient,
  dailyPlanId: string,
  itemTypes: string[]
): Promise<void> {
  if (itemTypes.length === 0) return;
  const { error } = await supabase
    .from('daily_plan_items')
    .delete()
    .eq('daily_plan_id', dailyPlanId)
    .in('item_type', itemTypes);
  if (error) throw error;
}

export async function insertPlanItems(
  supabase: SupabaseClient,
  items: object[]
): Promise<{ id: string; item_id: string }[]> {
  const { data, error } = await supabase
    .from('daily_plan_items')
    .insert(items)
    .select('id, item_id');
  if (error) throw error;
  return data || [];
}

export async function insertTaskSchedules(
  supabase: SupabaseClient,
  schedules: object[]
): Promise<void> {
  if (schedules.length === 0) return;
  const { error } = await supabase.from('task_schedules').insert(schedules);
  if (error) console.error('Error restoring task schedules:', error);
  // Don't throw — items saved, schedules can be recreated by user
}

export async function updatePlanItemField(
  supabase: SupabaseClient,
  itemId: string,
  fields: Record<string, unknown>
): Promise<void> {
  const { error } = await supabase
    .from('daily_plan_items')
    .update(fields)
    .eq('id', itemId);
  if (error) throw error;
}

export async function updatePlanItemStatusRpc(
  supabase: SupabaseClient,
  taskId: string,
  status: string,
  userId: string,
  date: string,
  dailyPlanItemId: string | null
): Promise<unknown> {
  const { data, error } = await supabase.rpc('update_task_and_daily_plan_status', {
    p_task_id: taskId,
    p_status: status,
    p_user_id: userId,
    p_goal_slot: null,
    p_date: date,
    p_daily_plan_item_id: dailyPlanItemId,
  });
  if (error) throw error;
  return data;
}

export async function updateWeeklyGoalItemsStatus(
  supabase: SupabaseClient,
  taskId: string,
  status: string
): Promise<void> {
  const { error } = await supabase
    .from('weekly_goal_items')
    .update({ status })
    .eq('item_id', taskId);
  if (error) console.warn('Error updating weekly_goal_items status:', error);
  // Don't throw — task status is already updated
}

export async function deletePlanItem(
  supabase: SupabaseClient,
  itemId: string
): Promise<void> {
  const { error } = await supabase
    .from('daily_plan_items')
    .delete()
    .eq('id', itemId);
  if (error) throw error;
}

export async function updatePlanItemsDisplayOrderBatch(
  supabase: SupabaseClient,
  items: { id: string; display_order: number }[]
): Promise<void> {
  // Fix N+1: run all updates concurrently
  await Promise.all(
    items.map(async (item) => {
      const { error } = await supabase
        .from('daily_plan_items')
        .update({ display_order: item.display_order })
        .eq('id', item.id);
      if (error) throw error;
    })
  );
}
