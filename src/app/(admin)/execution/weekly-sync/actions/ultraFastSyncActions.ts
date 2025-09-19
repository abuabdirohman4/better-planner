"use server";

import { createClient } from '@/lib/supabase/server';

// 🚀 ULTRA FAST: Use existing optimized functions for maximum performance
export async function getWeeklySyncUltraFast(year: number, quarter: number, weekNumber: number, startDate: string, endDate: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return {
      goals: [],
      progress: {},
      rules: [],
      weekDates: []
    };
  }

  try {
    const { data, error } = await supabase.rpc('get_weekly_sync_ultra_fast', {
      p_user_id: user.id,
      p_year: year,
      p_quarter: quarter,
      p_week_number: weekNumber,
      p_start_date: startDate,
      p_end_date: endDate
    });

    if (error) {
      console.error("Error calling get_weekly_sync_ultra_fast:", error);
      return {
        goals: [],
        progress: {},
        rules: [],
        weekDates: []
      };
    }

    // 🚀 OPTIMIZED: Only return data that's actually used
    const optimizedData = {
      goals: data?.goals || [],
      progress: data?.progress || {},
      rules: data?.rules || []
    };

    return optimizedData;
  } catch (error) {
    console.error("Error in getWeeklySyncUltraFast:", error);
    return {
      goals: [],
      progress: {},
      rules: [],
      weekDates: []
    };
  }
}
