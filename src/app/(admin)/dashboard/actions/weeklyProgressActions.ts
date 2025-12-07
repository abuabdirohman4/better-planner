"use server";

import { createClient } from '@/lib/supabase/server';
import { getQuarterWeekRange, getDateFromWeek } from '@/lib/quarterUtils';
import { getWeekDates } from '@/lib/dateUtils';

export interface WeeklyProgressData {
  weekNumber: number;        // Week number in quarter (1-13)
  weekLabel: string;         // "Week 1", "Week 2", etc.
  total: number;             // Total tasks in the week
  completed: number;         // Completed tasks (status = 'DONE')
  percentage: number;         // Completion percentage (0-100)
}

export async function getWeeklyProgressForQuarter(year: number, quarter: number): Promise<WeeklyProgressData[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  try {
    const { startWeek, endWeek } = getQuarterWeekRange(year, quarter);
    const totalWeeks = endWeek - startWeek + 1;

    // Get all weekly goals for all weeks in the quarter
    // IMPORTANT: week_number is stored as relative (1-13 per quarter) in weekly_goals table
    const { data: weeklyGoals, error: goalsError } = await supabase
      .from('weekly_goals')
      .select('id, week_number, quarter')
      .eq('user_id', user.id)
      .eq('year', year)
      .eq('quarter', quarter)
      .gte('week_number', 1)
      .lte('week_number', 13)
      .order('week_number', { ascending: true });

    if (goalsError) {
      throw goalsError;
      console.log('tes')
    }

    if (!weeklyGoals || weeklyGoals.length === 0) {
      // Return empty data for all weeks
      return Array.from({ length: totalWeeks }, (_, i) => {
        const weekNumber = startWeek + i;
        const weekInQuarter = i + 1;
        return {
          weekNumber: weekInQuarter,
          weekLabel: `W${weekInQuarter}`,
          total: 0,
          completed: 0,
          percentage: 0
        };
      });
    }

    const weeklyGoalIds = weeklyGoals.map(g => g.id);

    // Get all weekly goal items with status
    // Use weekly_goal_items.status (same as weekly sync) instead of tasks.status
    const { data: goalItems, error: itemsError } = await supabase
      .from('weekly_goal_items')
      .select('id, weekly_goal_id, item_id, status')
      .in('weekly_goal_id', weeklyGoalIds);

    if (itemsError) {
      throw itemsError;
    }

    // Create a map of week_number -> weekly_goal_ids
    // week_number is stored as relative (1-13), so use it directly as key
    const weekGoalsMap = new Map<number, string[]>();

    weeklyGoals.forEach(goal => {
      // week_number is relative (1-13), use directly
      const weekKey = goal.week_number;

      if (!weekGoalsMap.has(weekKey)) {
        weekGoalsMap.set(weekKey, []);
      }
      weekGoalsMap.get(weekKey)!.push(goal.id);
    });

    // Create a map of weekly_goal_id -> items
    const goalItemsMap = new Map<string, any[]>();
    (goalItems || []).forEach(item => {
      if (!goalItemsMap.has(item.weekly_goal_id)) {
        goalItemsMap.set(item.weekly_goal_id, []);
      }
      goalItemsMap.get(item.weekly_goal_id)!.push(item);
    });

    // Calculate progress for each week
    // Uses same calculation as Weekly Sync completion rate:
    // - Averages per-goal percentages (equal weight per goal)
    // - Example: Goal1=50% (10 tasks, 5 done), Goal2=90% (20 tasks, 18 done)
    //   Completion Rate = (50 + 90) / 2 = 70%
    // - Only counts goals that have items (total > 0)
    const progressData: WeeklyProgressData[] = [];

    for (let i = 0; i < totalWeeks; i++) {
      const weekInQuarter = i + 1;
      // Use relative week number (1-13) to look up in weekGoalsMap
      const weeklyGoalIdsForWeek = weekGoalsMap.get(weekInQuarter) || [];

      let total = 0;
      let completed = 0;
      const goalPercentages: number[] = [];

      weeklyGoalIdsForWeek.forEach(goalId => {
        const items = goalItemsMap.get(goalId) || [];
        const goalTotal = items.length;

        // Only process goals that have items
        if (goalTotal > 0) {
          // Calculate completed items for this goal
          // Use status from weekly_goal_items (same as weekly sync)
          const goalCompleted = items.filter(item => {
            const itemStatus = item.status || 'TODO';
            return itemStatus === 'DONE';
          }).length;

          // Calculate percentage for this goal
          const goalPercentage = Math.round((goalCompleted / goalTotal) * 100);
          goalPercentages.push(goalPercentage);

          // Add to totals for summary stats
          total += goalTotal;
          completed += goalCompleted;
        }
      });

      // Calculate average percentage (same as weekly sync completion rate)
      const percentage = goalPercentages.length > 0
        ? Math.round(goalPercentages.reduce((sum, p) => sum + p, 0) / goalPercentages.length)
        : 0;

      progressData.push({
        weekNumber: weekInQuarter,
        weekLabel: `W${weekInQuarter}`,
        total,
        completed,
        percentage
      });
    }

    return progressData;
  } catch (error) {
    // Return empty data for all weeks on error
    const { startWeek, endWeek } = getQuarterWeekRange(year, quarter);
    const totalWeeks = endWeek - startWeek + 1;
    return Array.from({ length: totalWeeks }, (_, i) => {
      const weekInQuarter = i + 1;
      return {
        weekNumber: weekInQuarter,
        weekLabel: `Week ${weekInQuarter}`,
        total: 0,
        completed: 0,
        percentage: 0
      };
    });
  }
}
