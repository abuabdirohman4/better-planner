import type { SupabaseClient } from '@supabase/supabase-js';

export async function querySubtasksByParentId(supabase: SupabaseClient, parentTaskId: string) {
  const { data, error } = await supabase
    .from('tasks')
    .select('id, title, status, display_order, parent_task_id, milestone_id, created_at')
    .eq('parent_task_id', parentTaskId)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: true });
  if (error) return [];
  return data ?? [];
}
