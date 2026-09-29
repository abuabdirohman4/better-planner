// NO "use server" — importable in tests
import type { SupabaseClient } from '@supabase/supabase-js';
import type { CarryOverType, SourceTask } from './logic';

const COLS = 'id, title, description, status, is_archived, focus_duration, parent_task_id, created_at';

export async function queryTopTasksBefore(
  supabase: SupabaseClient,
  userId: string,
  type: CarryOverType,
  beforeIso: string
): Promise<SourceTask[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select(COLS)
    .eq('user_id', userId)
    .eq('type', type)
    .is('parent_task_id', null)
    .lt('created_at', beforeIso)
    .order('created_at', { ascending: false })
    .limit(1000); // ponytail: batas PostgREST, urut terbaru dulu supaya yang terpotong quest tertua
  if (error) throw error;
  return data ?? [];
}

export async function queryTopTasksInRange(
  supabase: SupabaseClient,
  userId: string,
  type: CarryOverType,
  startIso: string,
  endExclusiveIso: string
): Promise<SourceTask[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select(COLS)
    .eq('user_id', userId)
    .eq('type', type)
    .is('parent_task_id', null)
    .gte('created_at', startIso)
    .lt('created_at', endExclusiveIso)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function queryTasksByIds(
  supabase: SupabaseClient,
  userId: string,
  type: CarryOverType,
  ids: string[]
): Promise<SourceTask[]> {
  if (ids.length === 0) return [];
  const { data, error } = await supabase
    .from('tasks')
    .select(COLS)
    .eq('user_id', userId)
    .eq('type', type)
    .in('id', ids);
  if (error) throw error;
  return data ?? [];
}

export async function queryChildren(
  supabase: SupabaseClient,
  userId: string,
  parentIds: string[]
): Promise<SourceTask[]> {
  if (parentIds.length === 0) return [];
  const { data, error } = await supabase
    .from('tasks')
    .select(COLS)
    .eq('user_id', userId)
    .in('parent_task_id', parentIds)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function insertTasks(supabase: SupabaseClient, rows: Record<string, unknown>[]) {
  if (rows.length === 0) return [];
  const { data, error } = await supabase.from('tasks').insert(rows).select('id');
  if (error) throw error;
  return (data ?? []) as { id: string }[];
}
