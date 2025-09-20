import useSWR from 'swr';

import { getDailySyncCompleteData, getTasksForWeek } from '@/app/(admin)/execution/daily-sync/actions/weeklyTasksActions';
import { dailySyncKeys } from '@/lib/swr';

/**
 * 🚀 ULTRA-FAST DAILY SYNC HOOK
 * Uses single RPC call to get all data at once
 * Replaces multiple separate hooks for maximum performance
 */
export function useDailySyncUltraFast(year: number, weekNumber: number, selectedDate: string) {
  const { 
    data = {
      dailyPlan: null,
      weeklyTasks: [],
      completedSessions: {}
    }, 
    error, 
    isLoading,
    mutate 
  } = useSWR(
    year && weekNumber && selectedDate ? dailySyncKeys.dailySyncBatched(year, weekNumber, selectedDate) : null,
    () => getDailySyncCompleteData(year, weekNumber, selectedDate),
    {
      revalidateOnFocus: false,
      dedupingInterval: 2 * 60 * 1000, // 2 minutes - shorter cache for real-time data
      errorRetryCount: 1, // Reduced retry for faster failure
      keepPreviousData: true, // Show previous data while revalidating
    }
  );


  return {
    // Daily plan data
    dailyPlan: data.dailyPlan,
    
    // Weekly tasks for selection modal
    weeklyTasks: data.weeklyTasks,
    
    // Completed sessions for all tasks (pre-calculated)
    completedSessions: data.completedSessions,
    
    // Loading and error states
    isLoading,
    error,
    
    // Mutate function for manual refresh
    mutate,
    
    // Helper function to get completed sessions for specific task
    getCompletedSessions: (taskId: string) => data.completedSessions[taskId] || 0,
  };
}

/**
 * Custom hook for fetching tasks for week selection
 * Fallback for when ultra-fast hook doesn't work
 */
export function useTasksForWeek(year: number, weekNumber: number) {
  const { 
    data: tasks = [], 
    error, 
    isLoading,
    mutate 
  } = useSWR(
    dailySyncKeys.tasksForWeek(year, weekNumber),
    () => getTasksForWeek(year, weekNumber),
    {
      revalidateOnFocus: false,
      dedupingInterval: 5 * 60 * 1000, // 5 minutes
      errorRetryCount: 3,
    }
  );

  return {
    tasks,
    error,
    isLoading,
    mutate,
  };
} 