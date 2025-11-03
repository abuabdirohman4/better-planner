"use client";

import { useMemo } from 'react';
import useSWR from 'swr';
import { useMilestones, useTasks } from '../../hooks/useMainQuestsSWR';
import { getTasksForMilestone } from '../../actions/taskActions';
import { getSubtasksForTask } from '../../actions/subTaskActions';

interface QuestProgress {
  totalMilestones: number;
  completedMilestones: number;
  totalTasks: number;
  completedTasks: number;
  totalSubtasks: number;
  completedSubtasks: number;
  overallProgress: number;
  milestoneProgress: number;
  taskProgress: number;
  subtaskProgress: number;
  isLoading: boolean;
}

/**
 * Helper hook to fetch all tasks for all milestones in a quest
 */
function useAllTasksForQuest(milestoneIds: string[]) {
  const swrKey = milestoneIds.length > 0 ? `quest-tasks-${milestoneIds.join(',')}` : null;
  
  const { data: allTasks = [], isLoading } = useSWR(
    swrKey,
    async () => {
      if (milestoneIds.length === 0) return [];
      
      // Fetch tasks for all milestones in parallel
      const taskPromises = milestoneIds.map(milestoneId => 
        getTasksForMilestone(milestoneId).catch(() => [])
      );
      const taskArrays = await Promise.all(taskPromises);
      
      // Flatten all tasks into a single array
      return taskArrays.flat();
    },
    {
      revalidateOnFocus: true,
      revalidateIfStale: true,
      revalidateOnReconnect: true,
      dedupingInterval: 10 * 1000,
      errorRetryCount: 3,
    }
  );

  return { allTasks, isLoading };
}

/**
 * Helper hook to fetch all subtasks for all tasks
 */
function useAllSubtasksForQuest(taskIds: string[]) {
  const swrKey = taskIds.length > 0 ? `quest-subtasks-${taskIds.join(',')}` : null;
  
  const { data: allSubtasks = [], isLoading } = useSWR(
    swrKey,
    async () => {
      if (taskIds.length === 0) return [];
      
      // Fetch subtasks for all tasks in parallel
      const subtaskPromises = taskIds.map(taskId => 
        getSubtasksForTask(taskId).catch(() => [])
      );
      const subtaskArrays = await Promise.all(subtaskPromises);
      
      // Flatten all subtasks into a single array
      return subtaskArrays.flat();
    },
    {
      revalidateOnFocus: true,
      revalidateIfStale: true,
      revalidateOnReconnect: true,
      dedupingInterval: 10 * 1000,
      errorRetryCount: 3,
    }
  );

  return { allSubtasks, isLoading };
}

/**
 * Hook to calculate comprehensive quest progress including milestones, tasks, and subtasks
 * Now fetches real data from all levels for accurate progress calculation
 */
export function useQuestProgress(questId: string): QuestProgress {
  const { milestones, isLoading: milestonesLoading } = useMilestones(questId);
  
  // Collect all milestone IDs
  const milestoneIds = useMemo(() => 
    milestones?.map((m: any) => m.id) || [], 
    [milestones]
  );

  // Fetch all tasks from all milestones
  const { allTasks, isLoading: tasksLoading } = useAllTasksForQuest(milestoneIds);
  
  // Collect all task IDs
  const taskIds = useMemo(() => 
    allTasks?.map((t: any) => t.id) || [], 
    [allTasks]
  );

  // Fetch all subtasks from all tasks
  const { allSubtasks, isLoading: subtasksLoading } = useAllSubtasksForQuest(taskIds);

  // Calculate milestone progress
  const milestoneProgress = useMemo(() => {
    if (!milestones || milestones.length === 0) return { total: 0, completed: 0, percentage: 0 };
    
    const total = milestones.length;
    const completed = milestones.filter((milestone: any) => milestone.status === 'DONE').length;
    const percentage = total > 0 ? (completed / total) * 100 : 0;
    
    return { total, completed, percentage };
  }, [milestones]);

  // Calculate task progress from real data
  const taskProgress = useMemo(() => {
    if (!allTasks || allTasks.length === 0) return { total: 0, completed: 0, percentage: 0 };
    
    const total = allTasks.length;
    const completed = allTasks.filter((task: any) => task.status === 'DONE').length;
    const percentage = total > 0 ? (completed / total) * 100 : 0;
    
    return { total, completed, percentage };
  }, [allTasks]);

  // Calculate subtask progress from real data
  const subtaskProgress = useMemo(() => {
    if (!allSubtasks || allSubtasks.length === 0) return { total: 0, completed: 0, percentage: 0 };
    
    const total = allSubtasks.length;
    const completed = allSubtasks.filter((subtask: any) => subtask.status === 'DONE').length;
    const percentage = total > 0 ? (completed / total) * 100 : 0;
    
    return { total, completed, percentage };
  }, [allSubtasks]);

  // Calculate overall progress (weighted average)
  const overallProgress = useMemo(() => {
    const milestoneWeight = 0.6; // 60% weight for milestones (primary focus)
    const taskWeight = 0.3;      // 30% weight for tasks
    const subtaskWeight = 0.1;   // 10% weight for subtasks
    
    const weightedProgress = 
      (milestoneProgress.percentage * milestoneWeight) +
      (taskProgress.percentage * taskWeight) +
      (subtaskProgress.percentage * subtaskWeight);
    
    return Math.round(weightedProgress);
  }, [milestoneProgress.percentage, taskProgress.percentage, subtaskProgress.percentage]);

  // Loading state: true if any data is still loading
  const isLoading = milestonesLoading || tasksLoading || subtasksLoading;

  return {
    totalMilestones: milestoneProgress.total,
    completedMilestones: milestoneProgress.completed,
    totalTasks: taskProgress.total,
    completedTasks: taskProgress.completed,
    totalSubtasks: subtaskProgress.total,
    completedSubtasks: subtaskProgress.completed,
    overallProgress,
    milestoneProgress: milestoneProgress.percentage,
    taskProgress: taskProgress.percentage,
    subtaskProgress: subtaskProgress.percentage,
    isLoading,
  };
}

/**
 * Hook to calculate progress for a specific milestone and its tasks/subtasks
 */
export function useMilestoneProgress(milestoneId: string) {
  const { tasks, isLoading: tasksLoading } = useTasks(milestoneId);
  
  const taskProgress = useMemo(() => {
    if (!tasks || tasks.length === 0) return { total: 0, completed: 0, percentage: 0 };
    
    const total = tasks.length;
    const completed = tasks.filter((task: any) => task.status === 'DONE').length;
    const percentage = total > 0 ? (completed / total) * 100 : 0;
    
    return { total, completed, percentage };
  }, [tasks]);

  // Calculate subtask progress for all tasks in this milestone
  const subtaskProgress = useMemo(() => {
    if (!tasks || tasks.length === 0) return { total: 0, completed: 0, percentage: 0 };
    
    // This would need to be calculated by fetching subtasks for each task
    // For now, return placeholder values
    return { total: 0, completed: 0, percentage: 0 };
  }, [tasks]);

  return {
    taskProgress,
    subtaskProgress,
    isLoading: tasksLoading,
  };
}
