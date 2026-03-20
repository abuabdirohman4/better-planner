export interface WeeklyProgressData {
  weekNumber: number;
  weekLabel: string;
  total: number;
  completed: number;
  percentage: number;
}

export function buildEmptyWeeks(totalWeeks: number): WeeklyProgressData[] {
  return Array.from({ length: totalWeeks }, (_, i) => {
    const weekInQuarter = i + 1;
    return {
      weekNumber: weekInQuarter,
      weekLabel: `W${weekInQuarter}`,
      total: 0,
      completed: 0,
      percentage: 0,
    };
  });
}

export function buildWeekGoalsMap(
  weeklyGoals: Array<{ id: string; week_number: number }>,
): Map<number, string[]> {
  const map = new Map<number, string[]>();
  weeklyGoals.forEach((goal) => {
    const weekKey = goal.week_number;
    if (!map.has(weekKey)) map.set(weekKey, []);
    map.get(weekKey)!.push(goal.id);
  });
  return map;
}

export function buildGoalItemsMap(
  goalItems: Array<{ weekly_goal_id: string; status?: string | null; [key: string]: unknown }>,
): Map<string, typeof goalItems> {
  const map = new Map<string, typeof goalItems>();
  goalItems.forEach((item) => {
    if (!map.has(item.weekly_goal_id)) map.set(item.weekly_goal_id, []);
    map.get(item.weekly_goal_id)!.push(item);
  });
  return map;
}

export function calculateWeekProgress(
  weeklyGoalIds: string[],
  goalItemsMap: Map<string, Array<{ status?: string | null; [key: string]: unknown }>>,
): { total: number; completed: number; percentage: number } {
  let total = 0;
  let completed = 0;
  const goalPercentages: number[] = [];

  weeklyGoalIds.forEach((goalId) => {
    const items = goalItemsMap.get(goalId) ?? [];
    const goalTotal = items.length;
    if (goalTotal > 0) {
      const goalCompleted = items.filter(
        (item) => (item.status ?? 'TODO') === 'DONE',
      ).length;
      const goalPercentage = Math.round((goalCompleted / goalTotal) * 100);
      goalPercentages.push(goalPercentage);
      total += goalTotal;
      completed += goalCompleted;
    }
  });

  const percentage =
    goalPercentages.length > 0
      ? Math.round(
          goalPercentages.reduce((sum, p) => sum + p, 0) / goalPercentages.length,
        )
      : 0;

  return { total, completed, percentage };
}

export function buildProgressData(
  totalWeeks: number,
  weekGoalsMap: Map<number, string[]>,
  goalItemsMap: Map<string, Array<{ status?: string | null; [key: string]: unknown }>>,
): WeeklyProgressData[] {
  const progressData: WeeklyProgressData[] = [];

  for (let i = 0; i < totalWeeks; i++) {
    const weekInQuarter = i + 1;
    const weeklyGoalIds = weekGoalsMap.get(weekInQuarter) ?? [];
    const { total, completed, percentage } = calculateWeekProgress(
      weeklyGoalIds,
      goalItemsMap,
    );
    progressData.push({
      weekNumber: weekInQuarter,
      weekLabel: `W${weekInQuarter}`,
      total,
      completed,
      percentage,
    });
  }

  return progressData;
}
