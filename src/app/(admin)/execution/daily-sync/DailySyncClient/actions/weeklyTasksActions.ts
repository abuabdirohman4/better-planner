"use server";

import { createClient } from '@/lib/supabase/server';
import { getDailyPlan } from './dailyPlanActions';

// Get tasks available for selection from weekly goals for the current week
export async function getTasksForWeek(year: number, weekNumber: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');
  const user_id = user.id;

  try {
    // Get all weekly goals for the week
    const { data: weeklyGoals, error: wgError } = await supabase
      .from('weekly_goals')
      .select('id, goal_slot')
      .eq('user_id', user_id)
      .eq('year', year)
      .eq('week_number', weekNumber);

    if (wgError) throw wgError;
    if (!weeklyGoals?.length) return [];

    const weeklyGoalIds = weeklyGoals.map(g => g.id);

    // Get all weekly goal items
    const { data: items, error: itemsError } = await supabase
      .from('weekly_goal_items')
      .select('id, weekly_goal_id, item_id, item_type')
      .in('weekly_goal_id', weeklyGoalIds);

    if (itemsError) throw itemsError;
    if (!items?.length) return [];

    // Get details for each item
    const itemsWithDetails = await Promise.all(
      items.map(async (item) => {
        let title = '';
        let status = 'TODO';
        let quest_title = '';
        const goal_slot = weeklyGoals.find(g => g.id === item.weekly_goal_id)?.goal_slot || 0;

        if (item.item_type === 'QUEST') {
          const { data: quest } = await supabase
            .from('quests')
            .select('id, title')
            .eq('id', item.item_id)
            .single();
          title = quest?.title || '';
          quest_title = title;
        } else if (item.item_type === 'MILESTONE') {
          const { data: milestone } = await supabase
            .from('milestones')
            .select('id, title, quest_id')
            .eq('id', item.item_id)
            .single();
          title = milestone?.title || '';
          
          if (milestone?.quest_id) {
            const { data: quest } = await supabase
              .from('quests')
              .select('id, title')
              .eq('id', milestone.quest_id)
              .single();
            quest_title = quest?.title || '';
          }
        } else if (item.item_type === 'TASK' || item.item_type === 'SUBTASK') {
          const { data: task } = await supabase
            .from('tasks')
            .select('id, title, status, milestone_id')
            .eq('id', item.item_id)
            .single();
          title = task?.title || '';
          status = task?.status || 'TODO';
          
          if (task?.milestone_id) {
            const { data: milestone } = await supabase
              .from('milestones')
              .select('id, title, quest_id')
              .eq('id', task.milestone_id)
              .single();
            
            if (milestone?.quest_id) {
              const { data: quest } = await supabase
                .from('quests')
                .select('id, title')
                .eq('id', milestone.quest_id)
                .single();
              quest_title = quest?.title || '';
            }
          }
        }

        return {
          id: item.item_id,
          type: item.item_type,
          title,
          status,
          quest_title,
          goal_slot
        };
      })
    );

    // Remove duplicates based on item_id and goal_slot combination
    const uniqueItems = itemsWithDetails.reduce((acc, item) => {
      const key = `${item.id}-${item.goal_slot}`;
      if (!acc.find(existing => `${existing.id}-${existing.goal_slot}` === key)) {
        acc.push(item);
      }
      return acc;
    }, [] as typeof itemsWithDetails);

    return uniqueItems;
  } catch (error) {
    console.error('Error fetching tasks for week:', error);
    throw error;
  }
}

// Get daily plan for a specific date
// ULTRA OPTIMIZED: Get all daily sync data in single call
export async function getDailySyncCompleteData(year: number, weekNumber: number, selectedDate: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return {
      dailyPlan: null,
      weeklyTasks: [],
      completedSessions: {}
    };
  }

  try {
    // FALLBACK: Use existing functions but in parallel for better performance
    const [dailyPlan, weeklyTasks] = await Promise.all([
      getDailyPlan(selectedDate),
      getTasksForWeek(year, weekNumber)
    ]);

    // Get completed sessions for all tasks in parallel
    const completedSessions: Record<string, number> = {};
    
    if (dailyPlan?.daily_plan_items) {
      // Import countCompletedSessions dynamically to avoid circular dependency
      const { countCompletedSessions } = await import('../../MainQuest/actions/sessionActions');
      
      const sessionPromises = dailyPlan.daily_plan_items.map(async (item: any) => {
        try {
          const count = await countCompletedSessions(item.id, selectedDate);
          return { itemId: item.id, count };
        } catch (error) {
          console.error(`Error getting completed sessions for item ${item.id}:`, error);
          return { itemId: item.id, count: 0 };
        }
      });

      const sessionResults = await Promise.all(sessionPromises);
      sessionResults.forEach(({ itemId, count }) => {
        completedSessions[itemId] = count;
      });
    }

    return {
      dailyPlan,
      weeklyTasks,
      completedSessions
    };
  } catch (error) {
    console.error("Error in getDailySyncCompleteData:", error);
    return {
      dailyPlan: null,
      weeklyTasks: [],
      completedSessions: {}
    };
  }
}
