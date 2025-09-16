import useSWR from 'swr';

import { getAllQuestsForQuarter, getPairwiseResults, getQuests } from '@/app/(admin)/planning/quests/actions';
import { questKeys, pairwiseKeys } from '@/lib/swr';

/**
 * Custom hook for fetching quests for a specific quarter
 * ✅ OPTIMIZED: Conservative settings for better performance
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
      revalidateOnFocus: false, // ✅ Disabled aggressive revalidation
      revalidateIfStale: false, // ✅ Disabled stale revalidation
      dedupingInterval: 10 * 60 * 1000, // ✅ 10 minutes - longer cache
      errorRetryCount: 1, // ✅ Reduced retry count
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
    () => getQuests(year, quarter, true), // isCommitted = true
    {
      revalidateOnFocus: false,
      dedupingInterval: 10 * 60 * 1000, // OPTIMIZED: 10 minutes instead of 5
      errorRetryCount: 2, // OPTIMIZED: Reduced retry count
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
 * ✅ OPTIMIZED: Conservative settings for better performance
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
      revalidateOnFocus: false, // ✅ Disabled aggressive revalidation
      revalidateIfStale: false, // ✅ Disabled stale revalidation
      dedupingInterval: 10 * 60 * 1000, // ✅ 10 minutes - longer cache
      errorRetryCount: 1, // ✅ Reduced retry count
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
 * ✅ OPTIMIZED: Single SWR hook for both data types
 */
export function useQuestsAndPairwise(year: number, quarter: number) {
  const { 
    data = { quests: [], pairwiseResults: {} }, 
    error, 
    isLoading,
    mutate 
  } = useSWR(
    ['quests-and-pairwise-optimized', year, quarter],
    async () => {
      // ✅ BATCH API CALLS - Get both data types in parallel
      const [quests, pairwiseResults] = await Promise.all([
        getAllQuestsForQuarter(year, quarter),
        getPairwiseResults(year, quarter)
      ]);
      
      return { quests, pairwiseResults };
    },
    {
      revalidateOnFocus: false, // ✅ Disabled aggressive revalidation
      revalidateIfStale: false, // ✅ Disabled stale revalidation
      dedupingInterval: 10 * 60 * 1000, // ✅ 10 minutes - longer cache
      errorRetryCount: 1, // ✅ Reduced retry count
      keepPreviousData: true, // Keep previous data while revalidating
    }
  );

  return {
    quests: data.quests,
    pairwiseResults: data.pairwiseResults,
    error,
    isLoading,
    mutate,
  };
} 