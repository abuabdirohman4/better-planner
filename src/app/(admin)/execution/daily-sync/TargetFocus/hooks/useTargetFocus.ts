import { useMemo } from 'react';
import useSWR from 'swr';
import { createClient } from '@/lib/supabase/client';
import { dailySyncKeys } from '@/lib/swr';

interface UseTargetFocusOptions {
  selectedDate: string;
}

interface UseTargetFocusReturn {
  totalTimeTarget: number; // Total target in minutes
  totalTimeActual: number; // Total actual focus time in minutes
  totalSessionsTarget: number; // Total target sessions
  totalSessionsActual: number; // Total completed sessions
  progressPercentage: number; // Progress percentage for progress bar
  isLoading: boolean;
  error: string | null;
}

// Fetch daily plan items and their targets
async function getDailyPlanTargets(selectedDate: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { targets: [], totalTimeTarget: 0 };

  try {
    const { data: plan, error } = await supabase
      .from('daily_plans')
      .select(`
        daily_plan_items(
          id,
          item_id,
          item_type,
          daily_session_target,
          focus_duration
        )
      `)
      .eq('plan_date', selectedDate)
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    
    if (!plan?.daily_plan_items) return { targets: [], totalTimeTarget: 0 };

    // Calculate total target
    const targets = plan.daily_plan_items.map((item: any) => ({
      id: item.id,
      itemId: item.item_id,
      itemType: item.item_type,
      sessionTarget: item.daily_session_target || 1,
      focusDuration: item.focus_duration || 25, // Default 25 minutes
      totalTimeTarget: (item.daily_session_target || 1) * (item.focus_duration || 25)
    }));

    const totalTimeTarget = targets.reduce((sum, item) => sum + item.totalTimeTarget, 0);

    return { targets, totalTimeTarget };
  } catch (error) {
    console.error('Error fetching daily plan targets:', error);
    return { targets: [], totalTimeTarget: 0 };
  }
}

// Fetch actual focus time from activity logs
async function getActualFocusTime(selectedDate: string, taskIds: string[]) {
  if (taskIds.length === 0) return 0;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  try {
    const { data: activityLogs, error } = await supabase
      .from('activity_logs')
      .select('duration_minutes')
      .eq('user_id', user.id)
      .eq('local_date', selectedDate)
      .eq('type', 'FOCUS')
      .in('task_id', taskIds);

    if (error) {
      console.error('Error fetching focus time:', error);
      return 0;
    }

    return activityLogs?.reduce((sum, log) => sum + (log.duration_minutes || 0), 0) || 0;
  } catch (error) {
    console.error('Error in getActualFocusTime:', error);
    return 0;
  }
}

export function useTargetFocus({ selectedDate }: UseTargetFocusOptions): UseTargetFocusReturn {
  // Fetch daily plan targets
  const { 
    data: targetsData, 
    error: targetsError, 
    isLoading: targetsLoading 
  } = useSWR(
    selectedDate ? dailySyncKeys.targetFocusData(selectedDate) : null,
    () => getDailyPlanTargets(selectedDate),
    {
      revalidateOnFocus: true,
      revalidateIfStale: true,
      revalidateOnReconnect: true,
      dedupingInterval: 30 * 1000, // 30 seconds
      errorRetryCount: 3,
    }
  );

  // Get task IDs for focus time query
  const taskIds = targetsData?.targets?.map((item: any) => item.itemId) || [];

  // Fetch actual focus time
  const { 
    data: actualFocusTime = 0, 
    error: focusError, 
    isLoading: focusLoading 
  } = useSWR(
    selectedDate && taskIds.length > 0 
      ? dailySyncKeys.actualFocusTime(selectedDate, taskIds) 
      : null,
    () => getActualFocusTime(selectedDate, taskIds),
    {
      revalidateOnFocus: true,
      revalidateIfStale: true,
      revalidateOnReconnect: true,
      dedupingInterval: 10 * 1000, // 10 seconds for fresher data
      errorRetryCount: 3,
    }
  );

  // Calculate derived values
  const result = useMemo(() => {
    const totalTimeTarget = targetsData?.totalTimeTarget || 0;
    const totalTimeActual = actualFocusTime || 0;

    // Assuming 25 minutes per session
    const totalSessionsTarget = Math.floor(totalTimeTarget / 25);
    const totalSessionsActual = Math.floor(totalTimeActual / 25);
    // const totalSessionsActual = 8;
    // const totalSessionsTarget = 14;

    // Calculate progress percentage (capped at 100%)
    const progressPercentage = totalTimeTarget > 0 ? Math.min((totalTimeActual / totalTimeTarget) * 100, 100) : 0;

    return {
      totalTimeTarget,
      totalTimeActual,
      totalSessionsTarget,
      totalSessionsActual,
      progressPercentage,
    };
  }, [targetsData, actualFocusTime]);

  return {
    ...result,
    isLoading: targetsLoading || focusLoading,
    error: targetsError?.message || focusError?.message || null,
  };
}
