import useSWR from 'swr';
import { useState, useEffect, useCallback } from 'react';

import { getAllQuestsForQuarter, getPairwiseResults, getQuests } from '@/app/(admin)/planning/main-quests/actions/questActions';
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
 * Using useState + useEffect instead of SWR for better CRUD performance
 */
export function useMainQuests(year: number, quarter: number) {
  const [quests, setQuests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch quests on mount and when year/quarter changes
  useEffect(() => {
    const fetchQuests = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getQuests(year, quarter, true);
        setQuests(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch quests'));
        setQuests([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuests();
  }, [year, quarter]);

  // Manual refetch function (replaces mutate)
  const refetch = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getQuests(year, quarter, true);
      setQuests(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch quests'));
    } finally {
      setIsLoading(false);
    }
  }, [year, quarter]);

  return {
    quests,
    error,
    isLoading,
    mutate: refetch, // Alias for compatibility
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