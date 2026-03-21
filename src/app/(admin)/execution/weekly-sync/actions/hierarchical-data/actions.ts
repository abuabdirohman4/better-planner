"use server";

import { createClient } from '@/lib/supabase/server';
import {
  queryCommittedQuests,
  querySelectedTaskIds,
  queryMilestonesByQuestIds,
  queryParentTasksByMilestoneIds,
  querySubtasksByParentIds,
} from './queries';
import {
  buildMilestoneMap,
  buildTaskMap,
  buildSubtaskMap,
  assembleHierarchy,
} from './logic';

export async function getHierarchicalData(year: number, quarter: number): Promise<any[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  try {
    const quests = await queryCommittedQuests(supabase, user.id, year, quarter);
    if (quests.length === 0) return [];

    // Query selected task IDs (used for context; kept for future orphan feature)
    await querySelectedTaskIds(supabase, year, quarter);

    const questIds = quests.map((q) => q.id);
    const milestones = await queryMilestonesByQuestIds(supabase, questIds);

    const milestoneIds = milestones.map((m) => m.id);
    const parentTasks = await queryParentTasksByMilestoneIds(supabase, milestoneIds);

    const parentTaskIds = parentTasks.map((t) => t.id);
    const subtasks = await querySubtasksByParentIds(supabase, parentTaskIds);

    const milestoneMap = buildMilestoneMap(milestones);
    const taskMap = buildTaskMap(parentTasks);
    const subtaskMap = buildSubtaskMap(subtasks);

    return assembleHierarchy(quests, milestoneMap, taskMap, subtaskMap);
  } catch (error) {
    console.error('Error fetching hierarchical data:', error);
    return [];
  }
}
