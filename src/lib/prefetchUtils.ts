import { getDashboardMetrics } from '@/app/(admin)/dashboard/actions';
import { getDailyPlan } from '@/app/(admin)/execution/daily-sync/actions/dailyPlanActions';
import { getWeeklyRules } from '@/app/(admin)/execution/weekly-sync/actions/weeklyRulesActions';
import { getWeeklySyncUltraFast } from '@/app/(admin)/execution/weekly-sync/actions/ultraFastSyncActions';
import { getAllQuestsForQuarter, getQuests } from '@/app/(admin)/planning/main-quests/actions/questActions';
import { getVisions } from '@/app/(admin)/planning/vision/actions';
import { getWeekOfYear } from '@/lib/quarterUtils';
import { getWeekDates } from '@/lib/dateUtils';
import { questKeys, visionKeys, weeklySyncKeys, dailyPlanKeys } from '@/lib/swr';

/**
 * Convert array key to SWR-compatible string key
 * SWR uses array keys internally but stores them as strings in cache
 */
function toSWRKey(key: readonly unknown[]): string {
  return JSON.stringify(key);
}

/**
 * Prefetch critical data for instant navigation experience
 * OPTIMIZED: Only prefetch essential data to reduce initial load time
 */
export async function prefetchCriticalData() {
  try {
    // OPTIMIZATION: Only prefetch dashboard data initially
    // Other data will be loaded progressively
    const prefetchedData = await Promise.allSettled([
      // Dashboard Data (High Priority - Only essential metrics)
      prefetchDashboardMetrics(),
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
 * Prefetch only essential dashboard metrics (optimized)
 * ✅ SINGLE API CALL - Much faster than multiple calls
 */
async function prefetchDashboardMetrics() {
  try {
    // ✅ SINGLE API CALL - Get all metrics at once
    const metrics = await getDashboardMetrics();

    return {
      [toSWRKey(['dashboard-metrics'])]: metrics,
    };
  } catch (error) {
    console.error('❌ Failed to prefetch dashboard metrics:', error);
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
 * ✅ SINGLE API CALL - Much faster than multiple calls
 */
async function prefetchDashboardData() {
  try {
    // ✅ SINGLE API CALL - Get all metrics at once
    const metrics = await getDashboardMetrics();

    return {
      [toSWRKey(['dashboard-metrics'])]: metrics,
    };
  } catch (error) {
    console.error('❌ Failed to prefetch dashboard data:', error);
    return {};
  }
}

/**
 * Prefetch weekly data for current week - ULTRA OPTIMIZED VERSION
 */
async function prefetchWeeklyData(year: number, weekNumber: number) {
  try {
    // 🚀 ULTRA OPTIMIZED: Use single RPC call instead of multiple queries
    const currentDate = new Date();
    const currentQuarter = Math.ceil((currentDate.getMonth() + 1) / 3);
    const weekDates = getWeekDates(currentDate);
    const startDate = weekDates[0].toISOString().slice(0, 10);
    const endDate = weekDates[6].toISOString().slice(0, 10);

    const [ultraFastData, weeklyRules] = await Promise.all([
      getWeeklySyncUltraFast(year, currentQuarter, weekNumber, startDate, endDate),
      getWeeklyRules(year, weekNumber)
    ]);

    return {
      [toSWRKey(['weekly-sync-ultra-fast', year, currentQuarter, weekNumber, startDate, endDate])]: ultraFastData,
      [toSWRKey(weeklySyncKeys.weeklyRules(year, weekNumber))]: weeklyRules,
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
 * Progressive loading: Prefetch data based on user's current page
 * This is called after initial load to prefetch relevant data
 */
export async function prefetchPageData(pathname: string) {
  try {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentQuarter = Math.ceil((currentDate.getMonth() + 1) / 3);
    const currentWeek = getWeekOfYear(currentDate);
    const today = currentDate.toISOString().split('T')[0];

    // Prefetch data based on current page
    if (pathname.includes('/planning/12-week-quests') || pathname.includes('/planning/main-quests')) {
      await Promise.allSettled([
        prefetchQuests(currentYear, currentQuarter),
        prefetchVisions(),
      ]);
    } else if (pathname.includes('/execution/weekly-sync')) {
      await Promise.allSettled([
        prefetchWeeklyData(currentYear, currentWeek),
      ]);
    } else if (pathname.includes('/execution/daily-sync')) {
      await Promise.allSettled([
        prefetchDailyData(today),
      ]);
    } else if (pathname.includes('/dashboard')) {
      // Dashboard already has basic data, prefetch additional metrics
      await Promise.allSettled([
        prefetchDashboardData(),
      ]);
    }
  } catch (error) {
    console.error('❌ Page-specific prefetching failed:', error);
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