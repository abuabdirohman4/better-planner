"use server";

import { createClient } from '@/lib/supabase/server';

// Get hierarchical data (Quest -> Milestone -> Task -> Sub-task) for the current quarter - OPTIMIZED VERSION
export async function getHierarchicalData(year: number, quarter: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  try {
    // Step 1: Get all committed quests for the quarter
    const { data: quests, error: questError } = await supabase
      .from('quests')
      .select('id, title')
      .eq('user_id', user.id)
      .eq('year', year)
      .eq('quarter', quarter)
      .eq('is_committed', true)
      .order('priority_score', { ascending: false });

    if (questError) throw questError;
    if (!quests || quests.length === 0) return [];

    // Step 2: Get all milestones for all quests in one query
    const questIds = quests.map(q => q.id);
    const { data: allMilestones, error: milestoneError } = await supabase
      .from('milestones')
      .select('id, title, quest_id')
      .in('quest_id', questIds)
      .order('display_order', { ascending: true });

    if (milestoneError) throw milestoneError;

    // Step 3: Get all parent tasks for all milestones in one query
    const milestoneIds = allMilestones?.map(m => m.id) || [];
    const { data: allParentTasks, error: taskError } = await supabase
      .from('tasks')
      .select('id, title, status, milestone_id')
      .in('milestone_id', milestoneIds)
      .is('parent_task_id', null) // Only parent tasks
      .order('display_order', { ascending: true });

    if (taskError) throw taskError;

    // Step 4: Get all subtasks for all parent tasks in one query
    const parentTaskIds = allParentTasks?.map(t => t.id) || [];
    const { data: allSubtasks, error: subtaskError } = await supabase
      .from('tasks')
      .select('id, title, status, parent_task_id')
      .in('parent_task_id', parentTaskIds)
      .order('display_order', { ascending: true });

    if (subtaskError) throw subtaskError;

    // Step 5: Create lookup maps for efficient data access
    const milestoneMap = new Map<string, typeof allMilestones>();
    const taskMap = new Map<string, typeof allParentTasks>();
    const subtaskMap = new Map<string, typeof allSubtasks>();

    // Group milestones by quest_id
    allMilestones?.forEach(milestone => {
      const questMilestones = milestoneMap.get(milestone.quest_id) || [];
      questMilestones.push(milestone);
      milestoneMap.set(milestone.quest_id, questMilestones);
    });

    // Group tasks by milestone_id
    allParentTasks?.forEach(task => {
      const milestoneTasks = taskMap.get(task.milestone_id) || [];
      milestoneTasks.push(task);
      taskMap.set(task.milestone_id, milestoneTasks);
    });

    // Group subtasks by parent_task_id
    allSubtasks?.forEach(subtask => {
      const taskSubtasks = subtaskMap.get(subtask.parent_task_id) || [];
      taskSubtasks.push(subtask);
      subtaskMap.set(subtask.parent_task_id, taskSubtasks);
    });

    // Step 6: Build hierarchical structure with in-memory mapping
    const hierarchicalData = quests.map(quest => {
      const questMilestones = milestoneMap.get(quest.id) || [];
      
      const milestonesWithTasks = questMilestones.map(milestone => {
        const milestoneTasks = taskMap.get(milestone.id) || [];
        
        const tasksWithSubtasks = milestoneTasks.map(task => {
          const taskSubtasks = subtaskMap.get(task.id) || [];
          
          return {
            ...task,
            subtasks: taskSubtasks
          };
        });

        return {
          ...milestone,
          tasks: tasksWithSubtasks
        };
      });

      return {
        ...quest,
        milestones: milestonesWithTasks
      };
    });

    return hierarchicalData;
  } catch (error) {
    console.error('Error fetching hierarchical data:', error);
    return [];
  }
}
