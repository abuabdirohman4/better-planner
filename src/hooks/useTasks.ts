import useSWR from 'swr';

import { getTasksForMilestone } from '@/app/(admin)/planning/quests/actions';
import { taskKeys } from '@/lib/swr';

/**
 * Custom hook for fetching tasks for a specific milestone
 */
export function useTasks(milestoneId: string) {
  const { 
    data: tasks = [], 
    error, 
    isLoading,
    mutate 
  } = useSWR(
    milestoneId ? taskKeys.list(milestoneId) : null,
    () => getTasksForMilestone(milestoneId),
    {
      revalidateOnFocus: false,
      dedupingInterval: 2 * 60 * 1000, // 2 minutes
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