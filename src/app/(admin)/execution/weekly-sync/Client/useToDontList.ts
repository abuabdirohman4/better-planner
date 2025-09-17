import { useEffect } from 'react';
import { useWeeklyRules } from '@/hooks/execution/useWeeklySync';

export function useToDontList(year: number, displayWeek: number, refreshFlag: number) {
  const { rules: toDontList, isLoading: toDontListLoading, mutate } = useWeeklyRules(year, displayWeek);
  
  // Trigger refresh when refreshFlag changes
  useEffect(() => {
    if (refreshFlag > 0) {
      mutate();
    }
  }, [refreshFlag, mutate]);

  return { toDontList, toDontListLoading, mutate };
}
