'use server';

import { handleApiError } from '@/lib/errorUtils';
import { createClient } from '@/lib/supabase/server';

/**
 * Get today's tasks count
 */
export async function getTodayTasks(): Promise<number> {
  try {
    const supabase = await createClient();
    const today = new Date().toISOString().split('T')[0];
    
    const { count, error } = await supabase
      .from('daily_plan_items')
      .select('*', { count: 'exact', head: true })
      .eq('plan_date', today)
      .eq('status', 'TODO');

    if (error) {
      throw error;
    }

    return count || 0;
  } catch (error) {
    handleApiError(error, 'memuat data');
    return 0;
  }
}

/**
 * Get active quests count
 */
export async function getActiveQuests(): Promise<number> {
  try {
    const supabase = await createClient();
    
    const { count, error } = await supabase
      .from('quests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'ACTIVE');

    if (error) {
      throw error;
    }

    return count || 0;
  } catch (error) {
    handleApiError(error, 'memuat data');
    return 0;
  }
}

/**
 * Get habits streak count (based on completed daily plan items)
 */
export async function getHabitsStreak(): Promise<number> {
  try {
    const supabase = await createClient();
    
    // Calculate streak based on completed daily plan items in the last 7 days
    const { count, error } = await supabase
      .from('daily_plan_items')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'DONE')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    if (error) {
      throw error;
    }

    return Math.min(count || 0, 7); // Max 7 days streak
  } catch (error) {
    handleApiError(error, 'memuat data');
    return 0;
  }
}

/**
 * Get weekly progress percentage
 */
export async function getWeeklyProgress(): Promise<number> {
  try {
    const supabase = await createClient();
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    
    const { count: totalTasks, error: totalError } = await supabase
      .from('daily_plan_items')
      .select('*', { count: 'exact', head: true })
      .gte('plan_date', startOfWeek.toISOString().split('T')[0])
      .lte('plan_date', endOfWeek.toISOString().split('T')[0]);

    if (totalError) {
      throw totalError;
    }

    const { count: completedTasks, error: completedError } = await supabase
      .from('daily_plan_items')
      .select('*', { count: 'exact', head: true })
      .gte('plan_date', startOfWeek.toISOString().split('T')[0])
      .lte('plan_date', endOfWeek.toISOString().split('T')[0])
      .eq('status', 'DONE');

    if (completedError) {
      throw completedError;
    }

    if (!totalTasks || totalTasks === 0) {
      return 0;
    }

    return Math.round((completedTasks || 0) / totalTasks * 100);
  } catch (error) {
    handleApiError(error, 'memuat data');
    return 0;
  }
} 