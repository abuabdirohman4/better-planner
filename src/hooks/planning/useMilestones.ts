import useSWR from 'swr';

import { getMilestonesForQuest } from '@/app/(admin)/planning/quests/actions';
import { milestoneKeys } from '@/lib/swr';

/**
 * Custom hook for fetching milestones for a specific quest
 */
export function useMilestones(questId: string) {
  const { 
    data: milestones = [], 
    error, 
    isLoading,
    mutate 
  } = useSWR(
    questId ? milestoneKeys.list(questId) : null,
    () => getMilestonesForQuest(questId),
    {
      revalidateOnFocus: false,
      dedupingInterval: 3 * 60 * 1000, // 3 minutes
      errorRetryCount: 3,
    }
  );

  return {
    milestones,
    error,
    isLoading,
    mutate,
  };
} 