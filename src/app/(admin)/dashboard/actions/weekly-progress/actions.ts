"use server";

import { createClient } from '@/lib/supabase/server';
import { getQuarterWeekRange } from '@/lib/quarterUtils';
import { queryWeeklyGoals, queryGoalItems } from './queries';
import {
  buildEmptyWeeks,
  buildWeekGoalsMap,
  buildGoalItemsMap,
  buildProgressData,
  type WeeklyProgressData,
} from './logic';

export type { WeeklyProgressData };

export async function getWeeklyProgressForQuarter(
  year: number,
  quarter: number,
): Promise<WeeklyProgressData[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { startWeek, endWeek } = getQuarterWeekRange(year, quarter);
  const totalWeeks = endWeek - startWeek + 1;

  try {
    const weeklyGoals = await queryWeeklyGoals(supabase, user.id, year, quarter);

    if (weeklyGoals.length === 0) {
      return buildEmptyWeeks(totalWeeks);
    }

    const weeklyGoalIds = weeklyGoals.map((g) => g.id);
    const goalItems = await queryGoalItems(supabase, weeklyGoalIds);

    const weekGoalsMap = buildWeekGoalsMap(weeklyGoals);
    const goalItemsMap = buildGoalItemsMap(goalItems);

    return buildProgressData(totalWeeks, weekGoalsMap, goalItemsMap);
  } catch {
    return Array.from({ length: totalWeeks }, (_, i) => {
      const weekInQuarter = i + 1;
      return {
        weekNumber: weekInQuarter,
        weekLabel: `Week ${weekInQuarter}`,
        total: 0,
        completed: 0,
        percentage: 0,
      };
    });
  }
}
