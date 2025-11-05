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

    // Get all weekly goal items
    const { data: goalItems, error: itemsError } = await supabase
      .from('weekly_goal_items')
      .select('id, weekly_goal_id, item_id')
      .in('weekly_goal_id', weeklyGoalIds);

    if (itemsError) {
      throw itemsError;
    }

    // Get status from tasks table (source of truth)
    const itemIds = (goalItems || []).map(item => item.item_id);
    let taskStatusMap = new Map<string, string>();
    
    if (itemIds.length > 0) {
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('id, status')
        .in('id', itemIds);

      if (tasksError) {
        throw tasksError;
      }

      // Create map of task_id -> status
      (tasks || []).forEach(task => {
        taskStatusMap.set(task.id, task.status);
      });
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
    const progressData: WeeklyProgressData[] = [];
    
    for (let i = 0; i < totalWeeks; i++) {
      const weekInQuarter = i + 1;
      // Use relative week number (1-13) to look up in weekGoalsMap
      const weeklyGoalIdsForWeek = weekGoalsMap.get(weekInQuarter) || [];
      
      let total = 0;
      let completed = 0;
      
      weeklyGoalIdsForWeek.forEach(goalId => {
        const items = goalItemsMap.get(goalId) || [];
        total += items.length;
        // Get status from tasks table via taskStatusMap
        completed += items.filter(item => {
          const taskStatus = taskStatusMap.get(item.item_id) || 'TODO';
          return taskStatus === 'DONE';
        }).length;
      });
      
      const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
      
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

