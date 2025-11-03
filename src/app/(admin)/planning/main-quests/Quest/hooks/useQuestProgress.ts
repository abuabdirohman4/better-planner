"use client";

import { useMemo, useCallback, useState, useEffect } from 'react';
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
      revalidateOnFocus: true, // ✅ OPTIMIZED: Enabled for progress data - update when tab refocused
      revalidateIfStale: true,
      revalidateOnReconnect: true,
      dedupingInterval: 10 * 1000, // ✅ OPTIMIZED: 10 seconds cache - progress data needs faster updates
      // Removed refreshInterval: 1000 - only update on user actions, not continuous polling
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
      revalidateOnFocus: true, // ✅ OPTIMIZED: Enabled for progress data - update when tab refocused
      revalidateIfStale: true,
      revalidateOnReconnect: true,
      dedupingInterval: 10 * 1000, // ✅ OPTIMIZED: 10 seconds cache - progress data needs faster updates
      // Removed refreshInterval: 1000 - only update on user actions, not continuous polling
      errorRetryCount: 3,
    }
  );

  return { allSubtasks, isLoading };
}

/**
 * Hook to calculate comprehensive quest progress including milestones, tasks, and subtasks
 * Now fetches real data from all levels for accurate progress calculation
 * ✅ OPTIMIZED: Includes optimistic updates for instant progress bar feedback
 */
export function useQuestProgress(questId: string): QuestProgress {
  const { milestones, isLoading: milestonesLoading } = useMilestones(questId);
  
  // ✅ OPTIMISTIC: Subscribe to optimistic state changes from module-level store
  const [optimisticVersion, setOptimisticVersion] = useState(0);
  
  useEffect(() => {
    const unsubscribe = optimisticStore.subscribe(() => {
      setOptimisticVersion(optimisticStore.version); // Trigger re-render when optimistic state changes
    });
    return () => {
      unsubscribe(); // Cleanup subscription
    };
  }, []);

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

  // ✅ SYNC: Clear optimistic state when SWR data updates (server confirms the change)
  useEffect(() => {
    if (milestones && milestones.length > 0) {
      milestones.forEach((m: any) => {
        // Clear optimistic state if it matches server state
        if (optimisticStore.milestones.get(m.id) === m.status) {
          optimisticStore.clearMilestone(m.id);
        }
      });
    }
  }, [milestones]);

  useEffect(() => {
    if (allTasks && allTasks.length > 0) {
      allTasks.forEach((t: any) => {
        // Clear optimistic state if it matches server state
        if (optimisticStore.tasks.get(t.id) === t.status) {
          optimisticStore.clearTask(t.id);
        }
      });
    }
  }, [allTasks]);

  useEffect(() => {
    if (allSubtasks && allSubtasks.length > 0) {
      allSubtasks.forEach((s: any) => {
        // Clear optimistic state if it matches server state
        if (optimisticStore.subtasks.get(s.id) === s.status) {
          optimisticStore.clearSubtask(s.id);
        }
      });
    }
  }, [allSubtasks]);

  // ✅ OPTIMISTIC: Calculate milestone progress with optimistic updates
  const milestoneProgress = useMemo(() => {
    if (!milestones || milestones.length === 0) return { total: 0, completed: 0, percentage: 0 };
    
    const total = milestones.length;
    // Use optimistic status if available, otherwise use server status
    const completed = milestones.filter((milestone: any) => {
      const status = optimisticStore.milestones.get(milestone.id) || milestone.status;
      return status === 'DONE';
    }).length;
    const percentage = total > 0 ? (completed / total) * 100 : 0;
    
    return { total, completed, percentage };
  }, [milestones, optimisticVersion]); // ✅ Include optimisticVersion to force recalculation

  // ✅ OPTIMISTIC: Calculate task progress with optimistic updates
  const taskProgress = useMemo(() => {
    if (!allTasks || allTasks.length === 0) return { total: 0, completed: 0, percentage: 0 };
    
    const total = allTasks.length;
    // Use optimistic status if available, otherwise use server status
    const completed = allTasks.filter((task: any) => {
      const status = optimisticStore.tasks.get(task.id) || task.status;
      return status === 'DONE';
    }).length;
    const percentage = total > 0 ? (completed / total) * 100 : 0;
    
    return { total, completed, percentage };
  }, [allTasks, optimisticVersion]); // ✅ Include optimisticVersion to force recalculation

  // ✅ OPTIMISTIC: Calculate subtask progress with optimistic updates
  const subtaskProgress = useMemo(() => {
    if (!allSubtasks || allSubtasks.length === 0) return { total: 0, completed: 0, percentage: 0 };
    
    const total = allSubtasks.length;
    // Use optimistic status if available, otherwise use server status
    const completed = allSubtasks.filter((subtask: any) => {
      const status = optimisticStore.subtasks.get(subtask.id) || subtask.status;
      return status === 'DONE';
    }).length;
    const percentage = total > 0 ? (completed / total) * 100 : 0;
    
    return { total, completed, percentage };
  }, [allSubtasks, optimisticVersion]); // ✅ Include optimisticVersion to force recalculation

  // Calculate overall progress (simple average - all levels have equal weight)
  // ✅ OPTIMIZED: Simple average is faster than weighted average calculation
  const overallProgress = useMemo(() => {
    // Calculate simple average: (milestone% + task% + subtask%) / 3
    // All 3 levels have equal weight (33.33% each)
    // If a level has no data, it contributes 0% to the average
    const sumProgress = milestoneProgress.percentage + taskProgress.percentage + subtaskProgress.percentage;
    const averageProgress = sumProgress / 3; // All 3 levels have equal weight
    
    return Math.round(averageProgress);
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

// ✅ OPTIMISTIC: Module-level store for optimistic updates (shared across hook instances)
const optimisticStore = {
  milestones: new Map<string, 'TODO' | 'DONE'>(),
  tasks: new Map<string, 'TODO' | 'DONE'>(),
  subtasks: new Map<string, 'TODO' | 'DONE'>(),
  listeners: new Set<() => void>(),
  version: 0, // Version counter to force useMemo recalculation
  
  // Subscribe to optimistic state changes
  subscribe: (callback: () => void) => {
    optimisticStore.listeners.add(callback);
    return () => optimisticStore.listeners.delete(callback);
  },
  
  // Notify all listeners and increment version
  notify: () => {
    optimisticStore.version += 1;
    optimisticStore.listeners.forEach(cb => cb());
  },
  
  // Update optimistic milestone status
  updateMilestone: (id: string, status: 'TODO' | 'DONE') => {
    optimisticStore.milestones.set(id, status);
    optimisticStore.notify();
  },
  
  // Update optimistic task status
  updateTask: (id: string, status: 'TODO' | 'DONE') => {
    optimisticStore.tasks.set(id, status);
    optimisticStore.notify();
  },
  
  // Update optimistic subtask status
  updateSubtask: (id: string, status: 'TODO' | 'DONE') => {
    optimisticStore.subtasks.set(id, status);
    optimisticStore.notify();
  },
  
  // Clear optimistic state for an item (when server confirms)
  clearMilestone: (id: string) => {
    optimisticStore.milestones.delete(id);
    optimisticStore.notify();
  },
  
  clearTask: (id: string) => {
    optimisticStore.tasks.delete(id);
    optimisticStore.notify();
  },
  
  clearSubtask: (id: string) => {
    optimisticStore.subtasks.delete(id);
    optimisticStore.notify();
  },
};

/**
 * Hook to invalidate quest progress cache
 * ✅ OPTIMIZED: Now also updates optimistic state for instant progress bar updates
 * Use this after task/subtask status changes to trigger immediate progress bar update
 */
export function useQuestProgressInvalidation() {
  // ✅ OPTIMIZED: Removed useSWRConfig() hook - no longer needed since we don't invalidate cache
  // This prevents "Rendered fewer hooks than expected" error when hook is conditionally called
  
  /**
   * Invalidate quest progress cache for tasks
   * ✅ OPTIMIZED: Only updates optimistic state for QuestProgressBar, doesn't invalidate task cache
   * Note: Task cache should be updated optimistically in TaskItem.tsx, so we don't need to invalidate here
   * Call this after task status changes
   */
  const invalidateTasksProgress = useCallback((taskId?: string, newStatus?: 'TODO' | 'DONE') => {
    // ✅ OPTIMIZED: Only update optimistic state for QuestProgressBar instant update
    // Don't invalidate task cache here - it should be handled optimistically in TaskItem.tsx
    // This prevents triggering loading skeleton
    if (taskId && newStatus) {
      optimisticStore.updateTask(taskId, newStatus);
    }
    
    // ✅ REMOVED: Cache invalidation that triggers loading state
    // Task cache should be updated optimistically in TaskItem.tsx
    // Background revalidation will happen automatically when needed
  }, []);
  
  /**
   * Invalidate quest progress cache for subtasks
   * ✅ OPTIMIZED: Only updates optimistic state for QuestProgressBar, doesn't invalidate subtask cache
   * Note: Subtask cache is updated optimistically in useSubtaskCRUD.handleCheck, so we don't need to invalidate here
   * Call this after subtask status changes
   */
  const invalidateSubtasksProgress = useCallback((subtaskId?: string, newStatus?: 'TODO' | 'DONE') => {
    // ✅ OPTIMIZED: Only update optimistic state for QuestProgressBar instant update
    // Don't invalidate subtask cache here - it's handled optimistically in useSubtaskCRUD.handleCheck
    // This prevents triggering loading skeleton
    if (subtaskId && newStatus) {
      optimisticStore.updateSubtask(subtaskId, newStatus);
    }
    
    // ✅ REMOVED: Cache invalidation that triggers loading state
    // Subtask cache is already updated optimistically in useSubtaskCRUD.handleCheck (line 117 with revalidate: false)
    // Background revalidation will happen automatically when needed
  }, []);
  
  /**
   * Invalidate quest progress cache for milestones
   * ✅ OPTIMIZED: Only updates optimistic state for QuestProgressBar, doesn't invalidate milestone cache
   * Note: Milestone cache is updated optimistically in Milestone.tsx, so we don't need to invalidate here
   * Call this after milestone status changes
   */
  const invalidateMilestonesProgress = useCallback((milestoneId?: string, newStatus?: 'TODO' | 'DONE') => {
    // ✅ OPTIMIZED: Only update optimistic state for QuestProgressBar instant update
    // Don't invalidate milestone cache here - it's handled optimistically in Milestone.tsx
    // This prevents triggering loading skeleton
    if (milestoneId && newStatus) {
      optimisticStore.updateMilestone(milestoneId, newStatus);
    }
    
    // ✅ REMOVED: Cache invalidation that triggers loading state
    // Milestone cache is already updated optimistically in Milestone.tsx (line 123-131)
    // Background revalidation will happen automatically when needed
  }, []);
  
  /**
   * Invalidate all quest progress cache (both tasks and subtasks)
   */
  const invalidateAllProgress = useCallback(() => {
    invalidateTasksProgress();
    invalidateSubtasksProgress();
  }, [invalidateTasksProgress, invalidateSubtasksProgress]);
  
  return {
    invalidateTasksProgress,
    invalidateSubtasksProgress,
    invalidateMilestonesProgress,
    invalidateAllProgress,
  };
}
