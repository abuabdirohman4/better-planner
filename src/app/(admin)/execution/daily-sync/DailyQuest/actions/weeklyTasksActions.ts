"use server";

import { createClient } from '@/lib/supabase/server';

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
      .select('id, weekly_goal_id, item_id')
      .in('weekly_goal_id', weeklyGoalIds);

    if (itemsError) throw itemsError;
    if (!items?.length) return [];

    // Get details for each item by fetching from tasks table
    const itemsWithDetails = await Promise.all(
      items.map(async (item) => {
        let title = '';
        let status = 'TODO';
        let quest_title = '';
        let task_type = '';
        const goal_slot = weeklyGoals.find(g => g.id === item.weekly_goal_id)?.goal_slot || 0;

        // Fetch task details directly from tasks table
        const { data: task } = await supabase
          .from('tasks')
          .select('id, title, status, milestone_id, type')
          .eq('id', item.item_id)
          .single();
        
        if (task) {
          title = task.title || '';
          status = task.status || 'TODO';
          task_type = task.type || '';
          
          if (task.milestone_id) {
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
          type: task_type,
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

