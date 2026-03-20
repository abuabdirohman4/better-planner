"use server";

import { createClient } from '@/lib/supabase/server';
import {
  queryWeeklyGoals,
  queryWeeklyGoalItems,
  queryTasksByIds,
  queryMilestonesByIds,
  queryQuestsByIds,
  queryCompletedPreviousDayItems,
  queryTodayPlanItems,
} from './queries';
import {
  combineItemsWithDetails,
  deduplicateItems,
  filterTodoItems,
  getPreviousDaysInWeek,
  filterOutCompletedPreviousDays,
} from './logic';

export async function getTasksForWeek(
  year: number,
  weekNumber: number,
  selectedDate?: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');
  const userId = user.id;

  // 1. Get weekly goals
  const weeklyGoals = await queryWeeklyGoals(supabase, userId, year, weekNumber);
  if (!weeklyGoals.length) return [];

  const weeklyGoalIds = weeklyGoals.map(g => g.id);

  // 2. Get weekly goal items
  const items = await queryWeeklyGoalItems(supabase, weeklyGoalIds);
  if (!items.length) return [];

  const itemIds = items.map(item => item.item_id);

  // 3. Batch fetch tasks
  const allTasks = await queryTasksByIds(supabase, itemIds);
  const taskMap = new Map(allTasks.map(task => [task.id, task]));

  // 4. Batch fetch milestones and quests
  const milestoneIds = [...new Set(allTasks.map(t => t.milestone_id).filter((id): id is string => id !== null))];
  const allMilestones = await queryMilestonesByIds(supabase, milestoneIds);
  const milestoneMap = new Map(allMilestones.map(m => [m.id, m]));

  const questIds = [...new Set(allMilestones.map(m => m.quest_id).filter((id): id is string => id !== null))];
  const allQuests = await queryQuestsByIds(supabase, questIds);
  const questMap = new Map(allQuests.map(q => [q.id, q]));

  // 5. Combine, deduplicate, and filter TODO only
  const combined = combineItemsWithDetails(items, weeklyGoals, taskMap, milestoneMap, questMap);
  const deduplicated = deduplicateItems(combined);
  let result = filterTodoItems(deduplicated);

  // 6. Filter tasks completed on previous days this week
  if (selectedDate) {
    const previousDays = getPreviousDaysInWeek(selectedDate);
    const completedRows = await queryCompletedPreviousDayItems(supabase, userId, previousDays);
    const todayRows = await queryTodayPlanItems(supabase, userId, selectedDate);

    if (completedRows.length) {
      const completedIds = new Set(completedRows.map(r => r.item_id));
      const todayIds = new Set(todayRows.map(r => r.item_id));
      result = filterOutCompletedPreviousDays(result, completedIds, todayIds);
    }
  }

  return result;
}
