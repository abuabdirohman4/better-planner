import useSWR from 'swr';
import { getTodayActivityLogs } from '../actions/activityLoggingActions';
import { dailySyncKeys } from '@/lib/swr';

export interface ActivityLogItem {
  id: string;
  type: 'FOCUS' | 'SHORT_BREAK' | 'LONG_BREAK' | 'BREAK';
  task_id?: string;
  task_title?: string | null;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  milestone_id?: string;
  milestone_title?: string | null;
  quest_id?: string;
  quest_title?: string | null;
  what_done?: string | null;
  what_think?: string | null;
}

export interface UseActivityLogsOptions {
  date: string;
  refreshKey?: number;
  lastActivityTimestamp?: number;
}

export interface UseActivityLogsReturn {
  logs: ActivityLogItem[];
  isLoading: boolean;
  error: string | null;
  mutate: () => void;
}

export function useActivityLogs({ 
  date, 
  refreshKey, 
  lastActivityTimestamp 
}: UseActivityLogsOptions): UseActivityLogsReturn {
  const { 
    data: logs = [], 
    error, 
    isLoading,
    mutate 
  } = useSWR(
    // Create a unique key that includes all dependencies
    dailySyncKeys.activityLogs(date, refreshKey, lastActivityTimestamp),
    () => getTodayActivityLogs(date),
    {
      revalidateOnFocus: true, // ✅ ENABLED - Allow revalidation on focus for fresh data
      revalidateIfStale: true, // ✅ ENABLED - Allow revalidation of stale data
      revalidateOnReconnect: true,
      dedupingInterval: 10 * 1000, // ✅ 10 seconds for very fresh activity data
      errorRetryCount: 3,
      // Keep previous data while revalidating for smooth UX
      keepPreviousData: true,
    }
  );

  return {
    logs,
    isLoading,
    error: error?.message || null,
    mutate,
  };
}
