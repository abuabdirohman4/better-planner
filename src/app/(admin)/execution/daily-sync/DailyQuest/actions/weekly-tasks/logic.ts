// NO "use server" — pure functions only
import { RawWeeklyGoal, RawWeeklyGoalItem, RawTask, RawMilestone, RawQuest } from './queries';

export interface WeeklyTaskItem {
  id: string;
  type: 'MAIN_QUEST' | 'WORK' | 'SIDE_QUEST' | 'LEARNING';
  title: string;
  status: string;
  quest_title: string;
  goal_slot: number;
  parent_task_id: string | null;
}

const VALID_TYPES = ['MAIN_QUEST', 'WORK', 'SIDE_QUEST', 'LEARNING'] as const;

/**
 * Combine weekly goal items with task, milestone, and quest details
 * to produce a flat WeeklyTaskItem array.
 */
export function combineItemsWithDetails(
  items: RawWeeklyGoalItem[],
  weeklyGoals: RawWeeklyGoal[],
  taskMap: Map<string, RawTask>,
  milestoneMap: Map<string, RawMilestone>,
  questMap: Map<string, RawQuest>
): WeeklyTaskItem[] {
  return items.map((item) => {
    let title = '';
    let status = 'TODO';
    let quest_title = '';
    let task_type = '';
    const goal_slot = weeklyGoals.find(g => g.id === item.weekly_goal_id)?.goal_slot ?? 0;
    const task = taskMap.get(item.item_id);

    if (task) {
      title = task.title || '';
      status = task.status || 'TODO';
      task_type = task.type || '';
      if (task.milestone_id) {
        const milestone = milestoneMap.get(task.milestone_id);
        if (milestone?.quest_id) {
          const quest = questMap.get(milestone.quest_id);
          if (quest) quest_title = quest.title || '';
        }
      }
    }

    const validType = VALID_TYPES.includes(task_type as (typeof VALID_TYPES)[number])
      ? (task_type as WeeklyTaskItem['type'])
      : 'MAIN_QUEST';

    return {
      id: item.item_id,
      type: validType,
      title,
      status,
      quest_title,
      goal_slot,
      parent_task_id: task?.parent_task_id ?? null,
    };
  });
}

/**
 * Remove duplicate items by id (first occurrence wins).
 */
export function deduplicateItems(items: WeeklyTaskItem[]): WeeklyTaskItem[] {
  return items.reduce((acc, item) => {
    if (!acc.find(existing => existing.id === item.id)) acc.push(item);
    return acc;
  }, [] as WeeklyTaskItem[]);
}

/**
 * Keep only items with status === 'TODO'.
 */
export function filterTodoItems(items: WeeklyTaskItem[]): WeeklyTaskItem[] {
  return items.filter(item => item.status === 'TODO');
}

/**
 * Given a selectedDate (YYYY-MM-DD), return all dates from Monday of
 * the same week up to (but NOT including) selectedDate.
 *
 * Uses UTC date methods throughout to stay timezone-safe:
 * `new Date('YYYY-MM-DD')` is parsed as UTC midnight, so we must
 * read/write with getUTCDay/setUTCDate to avoid local-timezone shifts.
 */
export function getPreviousDaysInWeek(selectedDate: string): string[] {
  // Parse as UTC midnight to avoid timezone drift
  const selectedDateObj = new Date(selectedDate + 'T00:00:00Z');
  const dayOfWeek = selectedDateObj.getUTCDay(); // 0=Sun, 1=Mon, …
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  const startOfWeek = new Date(selectedDateObj);
  startOfWeek.setUTCDate(selectedDateObj.getUTCDate() + diff);

  const previousDays: string[] = [];
  const current = new Date(startOfWeek);
  while (current < selectedDateObj) {
    previousDays.push(current.toISOString().split('T')[0]);
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return previousDays;
}

/**
 * Filter out items that were completed on previous days of the same week,
 * unless they also appear in today's plan.
 */
export function filterOutCompletedPreviousDays(
  items: WeeklyTaskItem[],
  completedIds: Set<string>,
  todayIds: Set<string>
): WeeklyTaskItem[] {
  return items.filter(item => !completedIds.has(item.id) || todayIds.has(item.id));
}
