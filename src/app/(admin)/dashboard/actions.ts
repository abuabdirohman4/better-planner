'use server';

import { handleApiError } from '@/lib/errorUtils';
import { createClient } from '@/lib/supabase/server';

export async function getDashboardMetrics() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  try {
    const { data, error } = await supabase.rpc('get_dashboard_metrics', { p_user_id: user.id });
    if (error) {
      throw error;
    }
    return data;
  } catch (error) {
    handleApiError(error, 'memuat data');
    return {
      todayTasks: 0,
      activeQuests: 0,
      habitsStreak: 0,
      weeklyProgress: 0,
    };
  }
} 