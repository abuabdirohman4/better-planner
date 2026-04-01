import type { SupabaseClient } from '@supabase/supabase-js';

export async function queryGetQuestProgress(
  supabase: SupabaseClient,
  questId: string | null
): Promise<{ overallProgress: number }> {
  if (!questId) return { overallProgress: 0 };

  // Fetch milestones + tasks (subtasks are tasks with parent_task_id != null)
  const { data: milestones, error: mErr } = await supabase
    .from('milestones')
    .select('id, status')
    .eq('quest_id', questId);

  if (mErr) throw mErr;
  if (!milestones || milestones.length === 0) return { overallProgress: 0 };

  const milestoneIds = milestones.map(m => m.id);

  const { data: allTasks, error: tErr } = await supabase
    .from('tasks')
    .select('id, status, parent_task_id')
    .in('milestone_id', milestoneIds);

  if (tErr) throw tErr;

  const tasks = (allTasks ?? []).filter(t => !t.parent_task_id);
  const subtasks = (allTasks ?? []).filter(t => !!t.parent_task_id);

  const getPercentage = (items: { status: string }[]) => {
    if (items.length === 0) return 0;
    const completed = items.filter(item => item.status === 'DONE').length;
    return (completed / items.length) * 100;
  };

  const milestoneProgress = getPercentage(milestones);
  const taskProgress = getPercentage(tasks);
  const subtaskProgress = getPercentage(subtasks);

  // Same formula as useQuestProgress.ts: average of 3 levels
  const divisor = [milestones, tasks, subtasks].filter(arr => arr.length > 0).length || 1;
  const overallProgress = Math.round(
    (milestoneProgress + taskProgress + subtaskProgress) / divisor
  );

  return { overallProgress };
}
