import { getTodayTasks, getActiveQuests, getHabitsStreak, getWeeklyProgress } from '@/app/(admin)/dashboard/actions';
import { getDailyPlan } from '@/app/(admin)/execution/daily-sync/actions';
import { getWeeklyGoals, getWeeklyRules, calculateGoalProgress } from '@/app/(admin)/execution/weekly-sync/actions';
import { getAllQuestsForQuarter, getQuests, getUnscheduledTasks, getScheduledTasksForWeek } from '@/app/(admin)/planning/quests/actions';
import type { WeeklyGoal } from '@/hooks/execution/useWeeklySync';
import { getWeekOfYear } from '@/lib/quarterUtils';
import { questKeys, dashboardKeys, weeklyGoalKeys, weeklySyncKeys, dailyPlanKeys } from '@/lib/swr';

/**
 * Convert array key to SWR-compatible string key
 * SWR uses array keys internally but stores them as strings in cache
 */
function toSWRKey(key: readonly unknown[]): string {
  return JSON.stringify(key);
}

/**
 * OPTIMIZED: Minimal prefetching for critical data only
 * Reduces initial load time and network requests
 */
export async function prefetchCriticalData() {
  try {
    // OPTIMIZATION: Only prefetch essential dashboard data
    // Remove aggressive prefetching to reduce initial load
    const prefetchedData = await Promise.allSettled([
      // Only fetch today's tasks initially (most important metric)
      prefetchTodayTasksOnly(),
    ]);

    // Convert to SWR fallback format using proper key format
    const fallback: Record<string, unknown> = {};
    
    prefetchedData.forEach((result) => {
      if (result.status === 'fulfilled') {
        Object.assign(fallback, result.value);
      } else {
        console.warn('⚠️ Prefetch failed:', result.reason);
      }
    });

    return fallback;
  } catch (error) {
    console.error('❌ Critical data prefetching failed:', error);
    return {};
  }
}

/**
 * OPTIMIZED: Prefetch only today's tasks (minimal data)
 */
async function prefetchTodayTasksOnly() {
  try {
    const todayTasks = await getTodayTasks();
    return {
      [toSWRKey(dashboardKeys.todayTasks())]: todayTasks,
    };
  } catch (error) {
    console.error('❌ Failed to prefetch today tasks:', error);
    return {};
  }
}

/**
 * Prefetch quests data for current quarter
 */
async function prefetchQuests(year: number, quarter: number) {
  try {
    const [allQuests, mainQuests] = await Promise.all([
      getAllQuestsForQuarter(year, quarter),
      getQuests(year, quarter, true),
    ]);

    return {
      [toSWRKey(questKeys.list(year, quarter))]: allQuests,
      [toSWRKey(questKeys.mainQuests(year, quarter))]: mainQuests,
    };
  } catch (error) {
    console.error('❌ Failed to prefetch quests:', error);
    return {};
  }
}

// Removed unused functions to reduce bundle size and fix linting errors

/**
 * Prefetch weekly data for current week
 */
async function prefetchWeeklyData(year: number, weekNumber: number) {
  try {
    // OPTIMIZATION: Prefetch all weekly data in parallel with aggressive caching
    const [weeklyGoals, weeklyRules, unscheduledTasks, scheduledTasks] = await Promise.all([
      getWeeklyGoals(year, weekNumber),
      getWeeklyRules(year, weekNumber),
      getUnscheduledTasks(year, Math.ceil((new Date().getMonth() + 1) / 3)), // current quarter
      getScheduledTasksForWeek(
        new Date().toISOString().slice(0, 10), // today
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10) // next week
      ),
    ]);

          // OPTIMIZATION: Prefetch progress data for weekly goals to avoid N+1 queries
      const progressData: { [key: number]: { completed: number; total: number; percentage: number } } = {};
      await Promise.all(
        weeklyGoals.map(async (goal: WeeklyGoal) => {
          if (goal.items.length > 0) {
            const progress = await calculateGoalProgress(goal.items);
            progressData[goal.goal_slot as number] = progress;
          } else {
            progressData[goal.goal_slot as number] = { completed: 0, total: 0, percentage: 0 };
          }
        })
      );

    return {
      [toSWRKey(weeklyGoalKeys.list(year, weekNumber))]: weeklyGoals,
      [toSWRKey(weeklySyncKeys.weeklyRules(year, weekNumber))]: weeklyRules,
      [toSWRKey(weeklySyncKeys.unscheduledTasks(year, Math.ceil((new Date().getMonth() + 1) / 3)))]: unscheduledTasks,
      [toSWRKey(weeklySyncKeys.scheduledTasks(
        new Date().toISOString().slice(0, 10),
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
      ))]: scheduledTasks,
      // Prefetch progress data with the same key format as useWeeklyGoalsWithProgress
      [toSWRKey(['weekly-goals-progress', year, weekNumber, weeklyGoals])]: progressData,
    };
  } catch (error) {
    console.error('❌ Failed to prefetch weekly data:', error);
    return {};
  }
}

/**
 * Prefetch daily data for today
 */
async function prefetchDailyData(date: string) {
  try {
    const dailyPlan = await getDailyPlan(date);
    return {
      [toSWRKey(dailyPlanKeys.list(date))]: dailyPlan,
    };
  } catch (error) {
    console.error('❌ Failed to prefetch daily data:', error);
    return {};
  }
}

/**
 * OPTIMIZED: Progressive loading with reduced frequency
 * Prefetch data based on user's current page with better timing
 */
export async function prefetchPageData(pathname: string) {
  try {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentQuarter = Math.ceil((currentDate.getMonth() + 1) / 3);
    const currentWeek = getWeekOfYear(currentDate);
    const today = currentDate.toISOString().split('T')[0];

    // OPTIMIZATION: Only prefetch data for the specific page user is on
    // Don't prefetch adjacent data automatically
    if (pathname.includes('/planning/12-week-quests') || pathname.includes('/planning/main-quests')) {
      // Only prefetch quests data when user is actually on quests page
      await Promise.allSettled([
        prefetchQuests(currentYear, currentQuarter),
      ]);
    } else if (pathname.includes('/execution/weekly-sync')) {
      // Only prefetch weekly data when user is on weekly sync page
      await Promise.allSettled([
        prefetchWeeklyData(currentYear, currentWeek),
      ]);
    } else if (pathname.includes('/execution/daily-sync')) {
      // Only prefetch daily data when user is on daily sync page
      await Promise.allSettled([
        prefetchDailyData(today),
      ]);
    } else if (pathname.includes('/dashboard')) {
      // Dashboard: only prefetch remaining metrics if not already loaded
      await Promise.allSettled([
        prefetchRemainingDashboardMetrics(),
      ]);
    }
  } catch (error) {
    console.error('❌ Page-specific prefetching failed:', error);
  }
}

/**
 * OPTIMIZED: Prefetch only remaining dashboard metrics
 */
async function prefetchRemainingDashboardMetrics() {
  try {
    const [activeQuests, habitsStreak, weeklyProgress] = await Promise.all([
      getActiveQuests(),
      getHabitsStreak(),
      getWeeklyProgress(),
    ]);

    return {
      [toSWRKey(dashboardKeys.activeQuests())]: activeQuests,
      [toSWRKey(dashboardKeys.habitsStreak())]: habitsStreak,
      [toSWRKey(dashboardKeys.weeklyProgress())]: weeklyProgress,
    };
  } catch (error) {
    console.error('❌ Failed to prefetch remaining dashboard metrics:', error);
    return {};
  }
}

/**
 * OPTIMIZED: Disabled automatic adjacent data prefetching
 * This was causing too many unnecessary requests
 */
export async function prefetchAdjacentData() {
  // OPTIMIZATION: Disabled automatic adjacent data prefetching
  // This was causing excessive network requests
  // Users can manually navigate to adjacent periods when needed
  return;
} 