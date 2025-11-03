"use server";

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function logActivity(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');
  
  const taskId = formData.get('taskId')?.toString();
  const sessionType = formData.get('sessionType')?.toString() as 'FOCUS' | 'SHORT_BREAK' | 'LONG_BREAK';
  const date = formData.get('date')?.toString();
  const startTime = formData.get('startTime')?.toString();
  const endTime = formData.get('endTime')?.toString();
  const whatDone = formData.get('whatDone')?.toString();
  const whatThink = formData.get('whatThink')?.toString();

  if (!taskId || !sessionType || !date || !startTime || !endTime) {
    console.error('[logActivity] Missing required fields', { taskId, sessionType, date, startTime, endTime });
    throw new Error('Missing required fields');
  }

  // ✅ FIX: Calculate actual elapsed time with proper rounding
  const startTimeDate = new Date(startTime);
  const endTimeDate = new Date(endTime);
  const durationInSeconds = Math.floor((endTimeDate.getTime() - startTimeDate.getTime()) / 1000);
  const durationInMinutes = Math.max(1, Math.round(durationInSeconds / 60));

  try {
    // Check for duplicate session first
    const { data: existingSession } = await supabase
      .from('activity_logs')
      .select('id')
      .eq('user_id', user.id)
      .eq('task_id', taskId)
      .eq('start_time', startTime)
      .eq('end_time', endTime)
      .single();

    if (existingSession) {
      console.log('[logActivity] Duplicate session detected, skipping insert');
      return existingSession;
    }

    const { data: activity, error } = await supabase
      .from('activity_logs')
      .insert({
        user_id: user.id,
        task_id: taskId,
        type: sessionType,
        start_time: startTime,
        end_time: endTime,
        duration_minutes: durationInMinutes,
        local_date: date,
        what_done: whatDone || null,
        what_think: whatThink || null,
      })
      .select()
      .single();

    if (error) {
      console.error('[logActivity] Supabase error:', error);
      throw error;
    }
    
    revalidatePath('/execution/daily-sync');
    return activity;
  } catch (error) {
    console.error('[logActivity] Exception:', error);
    throw error;
  }
} 

export async function getTodayActivityLogs(date: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');
  const user_id = user.id;

  // Query semua activity_logs milik user pada tanggal lokal tsb
  const { data: logs, error } = await supabase
    .from('activity_logs')
    .select('*')
    .eq('user_id', user_id)
    .eq('local_date', date)
    .order('start_time', { ascending: false });

  if (error) throw error;
  if (!logs || logs.length === 0) return [];

  // ✅ OPTIMIZED: Batch queries instead of N+1 queries
  // Extract unique task_ids from all logs
  const taskIds = [...new Set(logs.map(log => log.task_id).filter(Boolean))];
  
  if (taskIds.length === 0) {
    // No task_ids, return logs as-is
    return logs.map(log => ({
      ...log,
      task_title: null,
      task_type: null,
      milestone_id: null,
      milestone_title: null,
      quest_id: null,
      quest_title: null,
    }));
  }

  // Batch fetch all tasks
  const { data: allTasks, error: tasksError } = await supabase
    .from('tasks')
    .select('id, title, type, milestone_id')
    .in('id', taskIds);

  if (tasksError) throw tasksError;

  // Extract unique milestone_ids from tasks
  const milestoneIds = [...new Set(
    (allTasks || [])
      .map(task => task.milestone_id)
      .filter(Boolean)
  )];

  // Batch fetch all milestones
  let allMilestones: any[] = [];
  if (milestoneIds.length > 0) {
    const { data: milestones, error: milestonesError } = await supabase
      .from('milestones')
      .select('id, title, quest_id')
      .in('id', milestoneIds);

    if (milestonesError) throw milestonesError;
    allMilestones = milestones || [];
  }

  // Extract unique quest_ids from milestones
  const questIds = [...new Set(
    allMilestones
      .map(milestone => milestone.quest_id)
      .filter(Boolean)
  )];

  // Batch fetch all quests
  let allQuests: any[] = [];
  if (questIds.length > 0) {
    const { data: quests, error: questsError } = await supabase
      .from('quests')
      .select('id, title')
      .in('id', questIds);

    if (questsError) throw questsError;
    allQuests = quests || [];
  }

  // Create lookup maps for O(1) access
  const taskMap = new Map((allTasks || []).map(task => [task.id, task]));
  const milestoneMap = new Map(allMilestones.map(milestone => [milestone.id, milestone]));
  const questMap = new Map(allQuests.map(quest => [quest.id, quest]));

  // Combine data in-memory (fast, no network calls)
  const logsWithHierarchy = logs.map((log) => {
    let task_title = null;
    let task_type = null;
    let milestone_id = null;
    let milestone_title = null;
    let quest_id = null;
    let quest_title = null;

    if (log.task_id) {
      const task = taskMap.get(log.task_id);
      if (task) {
        task_title = task.title;
        task_type = task.type;
        milestone_id = task.milestone_id || null;

        if (milestone_id) {
          const milestone = milestoneMap.get(milestone_id);
          if (milestone) {
            milestone_title = milestone.title;
            quest_id = milestone.quest_id || null;

            if (quest_id) {
              const quest = questMap.get(quest_id);
              if (quest) {
                quest_title = quest.title;
              }
            }
          }
        }
      }
    }

    return {
      ...log,
      task_title,
      task_type,
      milestone_id,
      milestone_title,
      quest_id,
      quest_title,
    };
  });

  return logsWithHierarchy;
}

