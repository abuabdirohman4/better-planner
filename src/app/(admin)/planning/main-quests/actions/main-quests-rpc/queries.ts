import type { SupabaseClient } from '@supabase/supabase-js';

export async function rpcUpdateMainQuests(
  supabase: SupabaseClient,
  userId: string,
  taskId: string,
  title: string,
  status: 'TODO' | 'DONE',
  displayOrder: number
) {
  const { data, error } = await supabase.rpc('update_main_quests', {
    p_task_id: taskId,
    p_title: title,
    p_status: status,
    p_display_order: displayOrder,
    p_user_id: userId,
  });
  if (error) throw error;
  return data;
}
