"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Performance Aggregation Service
 *
 * Aggregates user performance data for email notifications
 * - Daily: Focus time, sessions, task completions from activity_logs
 * - Weekly: Aggregate daily data + weekly goals progress
 * - Monthly: 4-week rollup + trends
 * - Quarterly: 13-week summary + goal achievement
 */

export interface PerformanceMetrics {
  periodType: "daily" | "weekly" | "monthly" | "quarterly";
  periodStart: string; // ISO date
  periodEnd: string; // ISO date
  totalFocusMinutes: number;
  totalBreakMinutes: number;
  totalSessions: number;
  tasksCompleted: number;
  tasksTotal: number;
  completionRate: number;
  weeklyGoalsCompleted?: number;
  weeklyGoalsTotal?: number;
  previousFocusMinutes: number;
  previousCompletionRate: number;
}

/**
 * Get daily performance metrics for a user
 */
export async function getDailyPerformance(
  userId: string,
  date: Date
): Promise<PerformanceMetrics> {
  const supabase = await createClient();
  const dateStr = date.toISOString().split("T")[0];

  // Get focus time and sessions from activity_logs
  const { data: activityData } = await supabase
    .from("activity_logs")
    .select("type, duration_minutes")
    .eq("user_id", userId)
    .eq("local_date", dateStr);

  const totalFocusMinutes =
    activityData
      ?.filter((log) => log.type === "FOCUS")
      .reduce((sum, log) => sum + (log.duration_minutes || 0), 0) || 0;

  const totalBreakMinutes =
    activityData
      ?.filter((log) => log.type !== "FOCUS")
      .reduce((sum, log) => sum + (log.duration_minutes || 0), 0) || 0;

  const totalSessions = activityData?.length || 0;

  // Get tasks completed on this day from daily_plan_items
  const { data: dailyPlanData } = await supabase
    .from("daily_plans")
    .select("id, plan_date")
    .eq("user_id", userId)
    .eq("plan_date", dateStr)
    .single();

  let tasksCompleted = 0;
  let tasksTotal = 0;

  if (dailyPlanData) {
    const { data: planItems } = await supabase
      .from("daily_plan_items")
      .select("id, status")
      .eq("daily_plan_id", dailyPlanData.id);

    tasksTotal = planItems?.length || 0;
    tasksCompleted =
      planItems?.filter((item) => item.status === "DONE").length || 0;
  }
  const completionRate = tasksTotal > 0 ? (tasksCompleted / tasksTotal) * 100 : 0;

  // Get previous day data for comparison
  const previousDate = new Date(date);
  previousDate.setDate(previousDate.getDate() - 1);
  const previousDateStr = previousDate.toISOString().split("T")[0];

  const { data: previousActivity } = await supabase
    .from("activity_logs")
    .select("type, duration_minutes")
    .eq("user_id", userId)
    .eq("local_date", previousDateStr);

  const previousFocusMinutes =
    previousActivity
      ?.filter((log) => log.type === "FOCUS")
      .reduce((sum, log) => sum + (log.duration_minutes || 0), 0) || 0;

  const { data: previousDailyPlan } = await supabase
    .from("daily_plans")
    .select("id")
    .eq("user_id", userId)
    .eq("plan_date", previousDateStr)
    .single();

  let previousCompleted = 0;
  let previousTotal = 0;

  if (previousDailyPlan) {
    const { data: previousPlanItems } = await supabase
      .from("daily_plan_items")
      .select("id, status")
      .eq("daily_plan_id", previousDailyPlan.id);

    previousTotal = previousPlanItems?.length || 0;
    previousCompleted =
      previousPlanItems?.filter((item) => item.status === "DONE").length || 0;
  }
  const previousCompletionRate =
    previousTotal > 0 ? (previousCompleted / previousTotal) * 100 : 0;

  return {
    periodType: "daily",
    periodStart: dateStr,
    periodEnd: dateStr,
    totalFocusMinutes,
    totalBreakMinutes,
    totalSessions,
    tasksCompleted,
    tasksTotal,
    completionRate: Math.round(completionRate * 100) / 100,
    previousFocusMinutes,
    previousCompletionRate: Math.round(previousCompletionRate * 100) / 100,
  };
}

/**
 * Get weekly performance metrics for a user
 */
export async function getWeeklyPerformance(
  userId: string,
  weekStartDate: Date
): Promise<PerformanceMetrics> {
  const supabase = await createClient();
  const weekEndDate = new Date(weekStartDate);
  weekEndDate.setDate(weekEndDate.getDate() + 6);

  const startStr = weekStartDate.toISOString().split("T")[0];
  const endStr = weekEndDate.toISOString().split("T")[0];

  // Get weekly activity data
  const { data: activityData } = await supabase
    .from("activity_logs")
    .select("type, duration_minutes")
    .eq("user_id", userId)
    .gte("local_date", startStr)
    .lte("local_date", endStr);

  const totalFocusMinutes =
    activityData
      ?.filter((log) => log.type === "FOCUS")
      .reduce((sum, log) => sum + (log.duration_minutes || 0), 0) || 0;

  const totalBreakMinutes =
    activityData
      ?.filter((log) => log.type !== "FOCUS")
      .reduce((sum, log) => sum + (log.duration_minutes || 0), 0) || 0;

  const totalSessions = activityData?.length || 0;

  // Get tasks for the week from daily_plan_items
  const { data: weeklyPlans } = await supabase
    .from("daily_plans")
    .select("id")
    .eq("user_id", userId)
    .gte("plan_date", startStr)
    .lte("plan_date", endStr);

  let tasksCompleted = 0;
  let tasksTotal = 0;

  if (weeklyPlans && weeklyPlans.length > 0) {
    const planIds = weeklyPlans.map((p) => p.id);
    const { data: planItems } = await supabase
      .from("daily_plan_items")
      .select("id, status")
      .in("daily_plan_id", planIds);

    tasksTotal = planItems?.length || 0;
    tasksCompleted =
      planItems?.filter((item) => item.status === "DONE").length || 0;
  }
  const completionRate = tasksTotal > 0 ? (tasksCompleted / tasksTotal) * 100 : 0;

  // Get weekly goals progress
  const { data: weeklyGoals } = await supabase
    .from("weekly_goal_items")
    .select("status, week_date")
    .eq("week_date", startStr)
    .in("status", ["TODO", "IN_PROGRESS", "COMPLETED"]);

  const weeklyGoalsCompleted =
    weeklyGoals?.filter((goal) => goal.status === "COMPLETED").length || 0;
  const weeklyGoalsTotal = weeklyGoals?.length || 0;

  // Get previous week data
  const previousWeekStart = new Date(weekStartDate);
  previousWeekStart.setDate(previousWeekStart.getDate() - 7);
  const previousWeekEnd = new Date(previousWeekStart);
  previousWeekEnd.setDate(previousWeekEnd.getDate() + 6);

  const prevStartStr = previousWeekStart.toISOString().split("T")[0];
  const prevEndStr = previousWeekEnd.toISOString().split("T")[0];

  const { data: previousActivity } = await supabase
    .from("activity_logs")
    .select("type, duration_minutes")
    .eq("user_id", userId)
    .gte("local_date", prevStartStr)
    .lte("local_date", prevEndStr);

  const previousFocusMinutes =
    previousActivity
      ?.filter((log) => log.type === "FOCUS")
      .reduce((sum, log) => sum + (log.duration_minutes || 0), 0) || 0;

  const { data: previousPlans } = await supabase
    .from("daily_plans")
    .select("id")
    .eq("user_id", userId)
    .gte("plan_date", prevStartStr)
    .lte("plan_date", prevEndStr);

  let previousCompleted = 0;
  let previousTotal = 0;

  if (previousPlans && previousPlans.length > 0) {
    const prevPlanIds = previousPlans.map((p) => p.id);
    const { data: prevPlanItems } = await supabase
      .from("daily_plan_items")
      .select("id, status")
      .in("daily_plan_id", prevPlanIds);

    previousTotal = prevPlanItems?.length || 0;
    previousCompleted =
      prevPlanItems?.filter((item) => item.status === "DONE").length || 0;
  }

  const previousCompletionRate =
    previousTotal > 0 ? (previousCompleted / previousTotal) * 100 : 0;

  return {
    periodType: "weekly",
    periodStart: startStr,
    periodEnd: endStr,
    totalFocusMinutes,
    totalBreakMinutes,
    totalSessions,
    tasksCompleted,
    tasksTotal,
    completionRate: Math.round(completionRate * 100) / 100,
    weeklyGoalsCompleted,
    weeklyGoalsTotal,
    previousFocusMinutes,
    previousCompletionRate: Math.round(previousCompletionRate * 100) / 100,
  };
}

/**
 * Get monthly performance metrics for a user (4-week rollup)
 */
export async function getMonthlyPerformance(
  userId: string,
  monthStartDate: Date
): Promise<PerformanceMetrics> {
  const supabase = await createClient();
  const monthEndDate = new Date(monthStartDate);
  monthEndDate.setDate(monthEndDate.getDate() + 27); // 4 weeks = 28 days

  const startStr = monthStartDate.toISOString().split("T")[0];
  const endStr = monthEndDate.toISOString().split("T")[0];

  // Get monthly activity data
  const { data: activityData } = await supabase
    .from("activity_logs")
    .select("type, duration_minutes")
    .eq("user_id", userId)
    .gte("local_date", startStr)
    .lte("local_date", endStr);

  const totalFocusMinutes =
    activityData
      ?.filter((log) => log.type === "FOCUS")
      .reduce((sum, log) => sum + (log.duration_minutes || 0), 0) || 0;

  const totalBreakMinutes =
    activityData
      ?.filter((log) => log.type !== "FOCUS")
      .reduce((sum, log) => sum + (log.duration_minutes || 0), 0) || 0;

  const totalSessions = activityData?.length || 0;

  // Get tasks for the month from daily_plan_items
  const { data: monthlyPlans } = await supabase
    .from("daily_plans")
    .select("id")
    .eq("user_id", userId)
    .gte("plan_date", startStr)
    .lte("plan_date", endStr);

  let tasksCompleted = 0;
  let tasksTotal = 0;

  if (monthlyPlans && monthlyPlans.length > 0) {
    const planIds = monthlyPlans.map((p) => p.id);
    const { data: planItems } = await supabase
      .from("daily_plan_items")
      .select("id, status")
      .in("daily_plan_id", planIds);

    tasksTotal = planItems?.length || 0;
    tasksCompleted =
      planItems?.filter((item) => item.status === "DONE").length || 0;
  }

  const completionRate = tasksTotal > 0 ? (tasksCompleted / tasksTotal) * 100 : 0;

  // Get previous month data (previous 4 weeks)
  const previousMonthStart = new Date(monthStartDate);
  previousMonthStart.setDate(previousMonthStart.getDate() - 28);
  const previousMonthEnd = new Date(previousMonthStart);
  previousMonthEnd.setDate(previousMonthEnd.getDate() + 27);

  const prevStartStr = previousMonthStart.toISOString().split("T")[0];
  const prevEndStr = previousMonthEnd.toISOString().split("T")[0];

  const { data: previousActivity } = await supabase
    .from("activity_logs")
    .select("type, duration_minutes")
    .eq("user_id", userId)
    .gte("local_date", prevStartStr)
    .lte("local_date", prevEndStr);

  const previousFocusMinutes =
    previousActivity
      ?.filter((log) => log.type === "FOCUS")
      .reduce((sum, log) => sum + (log.duration_minutes || 0), 0) || 0;

  const { data: previousPlans } = await supabase
    .from("daily_plans")
    .select("id")
    .eq("user_id", userId)
    .gte("plan_date", prevStartStr)
    .lte("plan_date", prevEndStr);

  let previousCompleted = 0;
  let previousTotal = 0;

  if (previousPlans && previousPlans.length > 0) {
    const prevPlanIds = previousPlans.map((p) => p.id);
    const { data: prevPlanItems } = await supabase
      .from("daily_plan_items")
      .select("id, status")
      .in("daily_plan_id", prevPlanIds);

    previousTotal = prevPlanItems?.length || 0;
    previousCompleted =
      prevPlanItems?.filter((item) => item.status === "DONE").length || 0;
  }

  const previousCompletionRate =
    previousTotal > 0 ? (previousCompleted / previousTotal) * 100 : 0;

  return {
    periodType: "monthly",
    periodStart: startStr,
    periodEnd: endStr,
    totalFocusMinutes,
    totalBreakMinutes,
    totalSessions,
    tasksCompleted,
    tasksTotal,
    completionRate: Math.round(completionRate * 100) / 100,
    previousFocusMinutes,
    previousCompletionRate: Math.round(previousCompletionRate * 100) / 100,
  };
}

/**
 * Get quarterly performance metrics for a user (13-week rollup)
 */
export async function getQuarterlyPerformance(
  userId: string,
  quarterStartDate: Date
): Promise<PerformanceMetrics> {
  const supabase = await createClient();
  const quarterEndDate = new Date(quarterStartDate);
  quarterEndDate.setDate(quarterEndDate.getDate() + 90); // ~13 weeks

  const startStr = quarterStartDate.toISOString().split("T")[0];
  const endStr = quarterEndDate.toISOString().split("T")[0];

  // Get quarterly activity data
  const { data: activityData } = await supabase
    .from("activity_logs")
    .select("type, duration_minutes")
    .eq("user_id", userId)
    .gte("local_date", startStr)
    .lte("local_date", endStr);

  const totalFocusMinutes =
    activityData
      ?.filter((log) => log.type === "FOCUS")
      .reduce((sum, log) => sum + (log.duration_minutes || 0), 0) || 0;

  const totalBreakMinutes =
    activityData
      ?.filter((log) => log.type !== "FOCUS")
      .reduce((sum, log) => sum + (log.duration_minutes || 0), 0) || 0;

  const totalSessions = activityData?.length || 0;

  // Get tasks for the quarter
  const { data: tasksData } = await supabase
    .from("tasks")
    .select("id, status")
    .eq("user_id", userId)
    .gte("updated_at", `${startStr}T00:00:00`)
    .lte("updated_at", `${endStr}T23:59:59`);

  const tasksCompleted =
    tasksData?.filter((task) => task.status === "COMPLETED").length || 0;
  const tasksTotal = tasksData?.length || 0;
  const completionRate = tasksTotal > 0 ? (tasksCompleted / tasksTotal) * 100 : 0;

  // Get weekly goals for the quarter
  const quarterNumber = Math.floor(quarterStartDate.getMonth() / 3) + 1;
  const { data: weeklyGoals } = await supabase
    .from("weekly_goals")
    .select("id, quarter")
    .eq("user_id", userId)
    .eq("quarter", quarterNumber);

  const weeklyGoalsTotal = weeklyGoals?.length || 0;

  // Get previous quarter data
  const previousQuarterStart = new Date(quarterStartDate);
  previousQuarterStart.setDate(previousQuarterStart.getDate() - 91);
  const previousQuarterEnd = new Date(previousQuarterStart);
  previousQuarterEnd.setDate(previousQuarterEnd.getDate() + 90);

  const prevStartStr = previousQuarterStart.toISOString().split("T")[0];
  const prevEndStr = previousQuarterEnd.toISOString().split("T")[0];

  const { data: previousActivity } = await supabase
    .from("activity_logs")
    .select("type, duration_minutes")
    .eq("user_id", userId)
    .gte("local_date", prevStartStr)
    .lte("local_date", prevEndStr);

  const previousFocusMinutes =
    previousActivity
      ?.filter((log) => log.type === "FOCUS")
      .reduce((sum, log) => sum + (log.duration_minutes || 0), 0) || 0;

  const { data: previousPlans } = await supabase
    .from("daily_plans")
    .select("id")
    .eq("user_id", userId)
    .gte("plan_date", prevStartStr)
    .lte("plan_date", prevEndStr);

  let previousCompleted = 0;
  let previousTotal = 0;

  if (previousPlans && previousPlans.length > 0) {
    const prevPlanIds = previousPlans.map((p) => p.id);
    const { data: prevPlanItems } = await supabase
      .from("daily_plan_items")
      .select("id, status")
      .in("daily_plan_id", prevPlanIds);

    previousTotal = prevPlanItems?.length || 0;
    previousCompleted =
      prevPlanItems?.filter((item) => item.status === "DONE").length || 0;
  }

  const previousCompletionRate =
    previousTotal > 0 ? (previousCompleted / previousTotal) * 100 : 0;

  return {
    periodType: "quarterly",
    periodStart: startStr,
    periodEnd: endStr,
    totalFocusMinutes,
    totalBreakMinutes,
    totalSessions,
    tasksCompleted,
    tasksTotal,
    completionRate: Math.round(completionRate * 100) / 100,
    weeklyGoalsTotal,
    previousFocusMinutes,
    previousCompletionRate: Math.round(previousCompletionRate * 100) / 100,
  };
}

/**
 * Save performance metrics to performance_summaries table
 */
export async function savePerformanceSummary(
  userId: string,
  metrics: PerformanceMetrics
): Promise<void> {
  const supabase = await createClient();

  await supabase.from("performance_summaries").upsert(
    {
      user_id: userId,
      period_type: metrics.periodType,
      period_start: metrics.periodStart,
      period_end: metrics.periodEnd,
      total_focus_minutes: metrics.totalFocusMinutes,
      total_break_minutes: metrics.totalBreakMinutes,
      total_sessions: metrics.totalSessions,
      tasks_completed: metrics.tasksCompleted,
      tasks_total: metrics.tasksTotal,
      completion_rate: metrics.completionRate,
      weekly_goals_completed: metrics.weeklyGoalsCompleted || 0,
      weekly_goals_total: metrics.weeklyGoalsTotal || 0,
      previous_focus_minutes: metrics.previousFocusMinutes,
      previous_completion_rate: metrics.previousCompletionRate,
    },
    {
      onConflict: "user_id,period_type,period_start,period_end",
    }
  );
}

/**
 * Aggregate and save performance data for a specific period
 */
export async function aggregatePerformance(
  userId: string,
  periodType: "daily" | "weekly" | "monthly" | "quarterly",
  date: Date
): Promise<PerformanceMetrics> {
  let metrics: PerformanceMetrics;

  switch (periodType) {
    case "daily":
      metrics = await getDailyPerformance(userId, date);
      break;
    case "weekly":
      metrics = await getWeeklyPerformance(userId, date);
      break;
    case "monthly":
      metrics = await getMonthlyPerformance(userId, date);
      break;
    case "quarterly":
      metrics = await getQuarterlyPerformance(userId, date);
      break;
  }

  await savePerformanceSummary(userId, metrics);
  return metrics;
}
