import useSWR from 'swr';

import { getVisions } from '@/app/(admin)/planning/vision/actions';
import { visionKeys } from '@/lib/swr';

export interface Vision {
  life_area: string;
  vision_3_5_year?: string;
  vision_10_year?: string;
}

/**
 * Custom hook for fetching visions
 */
export function useVisions() {
  const { 
    data: visions = [], 
    error, 
    isLoading,
    mutate 
  } = useSWR(
    visionKeys.list(),
    () => getVisions(),
    {
      revalidateOnFocus: false,
      dedupingInterval: 10 * 60 * 1000, // 10 minutes
      errorRetryCount: 3,
    }
  );

  return {
    visions,
    error,
    isLoading,
    mutate,
  };
} 