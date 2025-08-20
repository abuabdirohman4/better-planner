import useSWR from 'swr';

import { getAllQuestsForQuarter, getPairwiseResults, getMainQuestsWithDetails } from '@/app/(admin)/planning/quests/actions';
import { questKeys, pairwiseKeys } from '@/lib/swr';

/**
 * Custom hook for fetching quests for a specific quarter
 */
export function useQuests(year: number, quarter: number) {
  const { 
    data: quests = [], 
    error, 
    isLoading,
    mutate 
  } = useSWR(
    questKeys.list(year, quarter),
    () => getAllQuestsForQuarter(year, quarter),
    {
      revalidateOnFocus: false,
      dedupingInterval: 5 * 60 * 1000, // 5 minutes
      errorRetryCount: 3,
    }
  );

  return {
    quests,
    error,
    isLoading,
    mutate,
  };
}

/**
 * Custom hook for fetching committed quests (Main Quests) - top 3 only
 */
export function useMainQuests(year: number, quarter: number) {
  const { 
    data: quests = [], 
    error, 
    isLoading,
    mutate 
  } = useSWR(
    questKeys.mainQuests(year, quarter),
    () => getMainQuestsWithDetails(year, quarter), // Menggunakan fungsi baru yang dioptimalkan
    {
      revalidateOnFocus: false,
      dedupingInterval: 5 * 60 * 1000, // 5 minutes
      errorRetryCount: 3,
      keepPreviousData: true,
    }
  );

  return {
    quests,
    error,
    isLoading,
    mutate,
  };
}

/**
 * Custom hook for fetching pairwise results
 */
export function usePairwiseResults(year: number, quarter: number) {
  const { 
    data: pairwiseResults = {}, 
    error, 
    isLoading,
    mutate 
  } = useSWR(
    pairwiseKeys.list(year, quarter),
    () => getPairwiseResults(year, quarter),
    {
      revalidateOnFocus: false,
      dedupingInterval: 5 * 60 * 1000, // 5 minutes
      errorRetryCount: 3,
      keepPreviousData: true, // Keep previous data while revalidating
    }
  );

  return {
    pairwiseResults,
    error,
    isLoading,
    mutate,
  };
}

/**
 * Custom hook for fetching both quests and pairwise results
 */
export function useQuestsAndPairwise(year: number, quarter: number) {
  const questsHook = useQuests(year, quarter);
  const pairwiseHook = usePairwiseResults(year, quarter);

  return {
    quests: questsHook.quests,
    pairwiseResults: pairwiseHook.pairwiseResults,
    error: questsHook.error || pairwiseHook.error,
    isLoading: questsHook.isLoading || pairwiseHook.isLoading,
    mutate: {
      quests: questsHook.mutate,
      pairwise: pairwiseHook.mutate,
    },
  };
} 