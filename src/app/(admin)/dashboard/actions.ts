'use server';

import { handleApiError } from '@/lib/errorUtils';
import { createClient } from '@/lib/supabase/server';

/**
 * Get all dashboard metrics in a single optimized call
 * ✅ BATCHED QUERIES - Much faster than 4 separate calls
 */
export async function getDashboardMetrics(): Promise<{
  todayTasks: number;
  activeQuests: number;
  habitsStreak: number;
  weeklyProgress: number;
}> {
  // ✅ DEBUG: Log when this function is called
  console.log('🔍 getDashboardMetrics called at:', new Date().toISOString());
  
  try {
    const supabase = await createClient();
    const today = new Date().toISOString().split('T')[0];
    
    // Calculate week range for weekly progress
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    
    const startOfWeekStr = startOfWeek.toISOString().split('T')[0];
    const endOfWeekStr = endOfWeek.toISOString().split('T')[0];
    
    // Calculate 7 days ago for habits streak
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // ✅ PARALLEL QUERIES - All at once!
    const [
      todayTasksResult,
      activeQuestsResult,
      habitsResult,
      weeklyTotalResult,
      weeklyCompletedResult
    ] = await Promise.all([
      // Today's tasks
      supabase
        .from('daily_plan_items')
        .select('*', { count: 'exact', head: true })
        .eq('plan_date', today)
        .eq('status', 'TODO'),
      
      // Active quests
      supabase
        .from('quests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'ACTIVE'),
      
      // Habits streak (last 7 days)
      supabase
        .from('daily_plan_items')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'DONE')
        .gte('created_at', sevenDaysAgo),
      
      // Weekly total tasks
      supabase
        .from('daily_plan_items')
        .select('*', { count: 'exact', head: true })
        .gte('plan_date', startOfWeekStr)
        .lte('plan_date', endOfWeekStr),
      
      // Weekly completed tasks
      supabase
        .from('daily_plan_items')
        .select('*', { count: 'exact', head: true })
        .gte('plan_date', startOfWeekStr)
        .lte('plan_date', endOfWeekStr)
        .eq('status', 'DONE')
    ]);

    // Check for errors
    if (todayTasksResult.error) throw todayTasksResult.error;
    if (activeQuestsResult.error) throw activeQuestsResult.error;
    if (habitsResult.error) throw habitsResult.error;
    if (weeklyTotalResult.error) throw weeklyTotalResult.error;
    if (weeklyCompletedResult.error) throw weeklyCompletedResult.error;

    // Calculate weekly progress
    const totalTasks = weeklyTotalResult.count || 0;
    const completedTasks = weeklyCompletedResult.count || 0;
    const weeklyProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      todayTasks: todayTasksResult.count || 0,
      activeQuests: activeQuestsResult.count || 0,
      habitsStreak: Math.min(habitsResult.count || 0, 7), // Max 7 days streak
      weeklyProgress,
    };
  } catch (error) {
    handleApiError(error, 'memuat data');
    return { todayTasks: 0, activeQuests: 0, habitsStreak: 0, weeklyProgress: 0 };
  }
}

// ✅ KEEP INDIVIDUAL FUNCTIONS for backward compatibility
export async function getTodayTasks(): Promise<number> {
  const metrics = await getDashboardMetrics();
  return metrics.todayTasks;
}

export async function getActiveQuests(): Promise<number> {
  const metrics = await getDashboardMetrics();
  return metrics.activeQuests;
}

export async function getHabitsStreak(): Promise<number> {
  const metrics = await getDashboardMetrics();
  return metrics.habitsStreak;
}

export async function getWeeklyProgress(): Promise<number> {
  const metrics = await getDashboardMetrics();
  return metrics.weeklyProgress;
} 