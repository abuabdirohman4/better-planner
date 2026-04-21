import { useEffect } from 'react';
import useSWR, { KeyedMutator } from 'swr';
import { getTodayActivityLogs } from '../actions/activityLoggingActions';
import { dailySyncKeys } from '@/lib/swr';

import type { ActivityLogItem } from '@/types/activity-log';

export interface UseActivityLogsOptions {
  date: string;
  refreshKey?: number;
  lastActivityTimestamp?: number;
}

export interface UseActivityLogsReturn {
  logs: ActivityLogItem[];
  isLoading: boolean;
  error: string | null;
  mutate: KeyedMutator<ActivityLogItem[]>;
  updateLogJournal: (logId: string, whatDone: string, whatThink: string) => void;
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
    // ✅ FIX: Use stable key that only changes with date
    dailySyncKeys.activityLogs(date),
    () => getTodayActivityLogs(date),
    {
      revalidateOnFocus: false, // Data di-refresh via mutate() setelah Pomodoro selesai
      revalidateIfStale: false, // Jangan auto-stale — data valid selama 5 menit
      revalidateOnReconnect: true,
      dedupingInterval: 5 * 60 * 1000, // 5 menit
      errorRetryCount: 3,
      // Keep previous data while revalidating for smooth UX
      keepPreviousData: true,
    }
  );

  // ✅ NEW: Manual revalidation when refreshKey or lastActivityTimestamp changes
  useEffect(() => {
    if (refreshKey || lastActivityTimestamp) {
      // Trigger revalidation when there's new activity
      mutate();
    }
  }, [refreshKey, lastActivityTimestamp, mutate]);

  // ✅ NEW: Optimistic update for journal data
  const updateLogJournal = (logId: string, whatDone: string, whatThink: string) => {
    mutate(
      (currentLogs) => {
        if (!currentLogs) return currentLogs;

        return currentLogs.map((log) =>
          log.id === logId
            ? { ...log, what_done: whatDone, what_think: whatThink }
            : log
        );
      },
      false // Don't revalidate immediately
    );
  };

  return {
    logs,
    isLoading,
    error: error?.message || null,
    mutate,
    updateLogJournal,
  };
}
