import { getTodayTasks, getActiveQuests, getHabitsStreak, getWeeklyProgress } from '@/app/(admin)/dashboard/actions';
import { getDailyPlan } from '@/app/(admin)/execution/daily-sync/actions';
import { getWeeklyGoals, getWeeklyRules, calculateGoalProgress } from '@/app/(admin)/execution/weekly-sync/actions';
import { getAllQuestsForQuarter, getQuests } from '@/app/(admin)/planning/quests/actions';
import { getVisions } from '@/app/(admin)/planning/vision/actions';
import { getWeekOfYear } from '@/lib/quarterUtils';
import { questKeys, visionKeys, dashboardKeys, weeklyGoalKeys, weeklySyncKeys, dailyPlanKeys } from '@/lib/swr';

/**
 * Convert array key to SWR-compatible string key
 * SWR uses array keys internally but stores them as strings in cache
 */
function toSWRKey(key: readonly unknown[]): string {
  return JSON.stringify(key);
}

/**
 * Prefetch critical data for instant navigation experience
 * This function fetches all essential data that users commonly access
 */
export async function prefetchCriticalData() {
  try {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentQuarter = Math.ceil((currentDate.getMonth() + 1) / 3);
    const currentWeek = getWeekOfYear(currentDate);
    const today = currentDate.toISOString().split('T')[0];

    // Prefetch all critical data in parallel
    const prefetchedData = await Promise.allSettled([
      // Planning Data (High Priority)
      prefetchQuests(currentYear, currentQuarter),
      prefetchVisions(),
      
      // Dashboard Data (High Priority)
      prefetchDashboardData(),
      
      // Execution Data (Medium Priority)
      prefetchWeeklyData(currentYear, currentWeek),
      prefetchDailyData(today),
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

/**
 * Prefetch visions data
 */
async function prefetchVisions() {
  try {
    const visions = await getVisions();
    return {
      [toSWRKey(visionKeys.list())]: visions,
    };
  } catch (error) {
    console.error('❌ Failed to prefetch visions:', error);
    return {};
  }
}

/**
 * Prefetch dashboard data
 */
async function prefetchDashboardData() {
  try {
    const [todayTasks, activeQuests, habitsStreak, weeklyProgress] = await Promise.all([
      getTodayTasks(),
      getActiveQuests(),
      getHabitsStreak(),
      getWeeklyProgress(),
    ]);

    return {
      [toSWRKey(dashboardKeys.todayTasks())]: todayTasks,
      [toSWRKey(dashboardKeys.activeQuests())]: activeQuests,
      [toSWRKey(dashboardKeys.habitsStreak())]: habitsStreak,
      [toSWRKey(dashboardKeys.weeklyProgress())]: weeklyProgress,
    };
  } catch (error) {
    console.error('❌ Failed to prefetch dashboard data:', error);
    return {};
  }
}

/**
 * Prefetch weekly data for current week
 */
async function prefetchWeeklyData(year: number, weekNumber: number) {
  try {
    const [weeklyGoals, weeklyRules] = await Promise.all([
      getWeeklyGoals(year, weekNumber),
      getWeeklyRules(year, weekNumber),
    ]);

    // Prefetch progress data for weekly goals to avoid N+1 queries
    const progressData: { [key: number]: { completed: number; total: number; percentage: number } } = {};
    await Promise.all(
      weeklyGoals.map(async (goal) => {
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
 * Prefetch adjacent data (next/previous quarter/week) for smooth navigation
 */
export async function prefetchAdjacentData() {
  try {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentQuarter = Math.ceil((currentDate.getMonth() + 1) / 3);
    const currentWeek = getWeekOfYear(currentDate);

    // Prefetch next and previous quarter data
    await Promise.allSettled([
      prefetchQuests(currentYear, currentQuarter + 1),
      prefetchQuests(currentYear, currentQuarter - 1),
    ]);

    // Prefetch next and previous week data
    await Promise.allSettled([
      prefetchWeeklyData(currentYear, currentWeek + 1),
      prefetchWeeklyData(currentYear, currentWeek - 1),
    ]);
  } catch (error) {
    console.error('❌ Adjacent data prefetching failed:', error);
  }
} 