import { SWRConfiguration } from 'swr';

/**
 * Enhanced SWR configuration for optimal prefetching and caching
 */
export const swrConfig: SWRConfiguration = {
  // Prefetching configuration
  revalidateOnFocus: true, // ✅ ENABLED - Revalidate on focus for fresh data
  revalidateOnReconnect: true, // Revalidate when internet comes back
  revalidateIfStale: true, // ✅ ENABLED - Revalidate stale data
  
  // Cache configuration
  dedupingInterval: 2 * 60 * 1000, // ✅ 2 minutes - shorter cache for fresher data
  focusThrottleInterval: 2000, // ✅ Reduced to 2 seconds for faster updates
  
  // Error handling
  errorRetryCount: 2, // ✅ Increased to 2 retries
  errorRetryInterval: 1000, // ✅ 1 second retry interval
  
  // Keep data in cache longer
  keepPreviousData: true, // Show previous data while revalidating
  
  // Refresh interval (disabled by default, enable per use case)
  refreshInterval: 0,
};

/**
 * Fetcher function for SWR
 * Handles API routes
 */
export const fetcher = async (url: string) => {
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return response.json();
};

/**
 * SWR key generator for quests
 */
export const questKeys = {
  all: ['quests'] as const,
  lists: () => [...questKeys.all, 'list'] as const,
  list: (year: number, quarter: number) => [...questKeys.lists(), year, quarter] as const,
  mainQuests: (year: number, quarter: number) => [...questKeys.all, 'main-quests', year, quarter] as const,
  details: () => [...questKeys.all, 'detail'] as const,
  detail: (id: string) => [...questKeys.details(), id] as const,
};

/**
 * SWR key generator for milestones
 */
export const milestoneKeys = {
  all: ['milestones'] as const,
  lists: () => [...milestoneKeys.all, 'list'] as const,
  list: (questId: string) => [...milestoneKeys.lists(), questId] as const,
  details: () => [...milestoneKeys.all, 'detail'] as const,
  detail: (id: string) => [...milestoneKeys.details(), id] as const,
};

/**
 * SWR key generator for tasks
 */
export const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all, 'list'] as const,
  list: (milestoneId: string) => [...taskKeys.lists(), milestoneId] as const,
  details: () => [...taskKeys.all, 'detail'] as const,
  detail: (id: string) => [...taskKeys.details(), id] as const,
};

/**
 * SWR key generator for weekly goals
 */
export const weeklyGoalKeys = {
  all: ['weekly-goals'] as const,
  lists: () => [...weeklyGoalKeys.all, 'list'] as const,
  list: (year: number, weekNumber: number) => [...weeklyGoalKeys.lists(), year, weekNumber] as const,
  details: () => [...weeklyGoalKeys.all, 'detail'] as const,
  detail: (id: string) => [...weeklyGoalKeys.details(), id] as const,
};

/**
 * SWR key generator for daily plans
 */
export const dailyPlanKeys = {
  all: ['daily-plans'] as const,
  lists: () => [...dailyPlanKeys.all, 'list'] as const,
  list: (date: string) => [...dailyPlanKeys.lists(), date] as const,
  details: () => [...dailyPlanKeys.all, 'detail'] as const,
  detail: (id: string) => [...dailyPlanKeys.details(), id] as const,
};

/**
 * SWR key generator for weekly sync
 */
export const weeklySyncKeys = {
  all: ['weekly-sync'] as const,
  // 🚀 OPTIMIZED: Removed unused task scheduling keys
  weeklyRules: (year: number, weekNumber: number) => [...weeklySyncKeys.all, 'weekly-rules', year, weekNumber] as const,
  // OPTIMIZED: Batched keys
  weeklySyncBatched: (year: number, weekNumber: number) => [...weeklySyncKeys.all, 'batched', year, weekNumber] as const,
  weeklySyncConditional: (year: number, weekNumber: number) => [...weeklySyncKeys.all, 'conditional', year, weekNumber] as const,
};

/**
 * SWR key generator for daily sync
 */
export const dailySyncKeys = {
  all: ['daily-sync'] as const,
  completedSessions: (taskId: string, date: string) => [...dailySyncKeys.all, 'completed-sessions', taskId, date] as const,
  tasksForWeek: (year: number, weekNumber: number, selectedDate?: string) => [...dailySyncKeys.all, 'tasks-for-week', year, weekNumber, selectedDate || 'all'] as const,
  dailyPlan: (date: string) => [...dailySyncKeys.all, 'daily-plan', date] as const,
  // ✅ NEW: Batch completed sessions key
  allCompletedSessions: (taskIds: string[], date: string) => [...dailySyncKeys.all, 'all-completed-sessions', taskIds.sort().join(','), date] as const,
  // OPTIMIZED: Batched keys
  dailySyncBatched: (year: number, weekNumber: number, selectedDate: string) => [...dailySyncKeys.all, 'batched', year, weekNumber, selectedDate] as const,
  dailySyncConditional: (year: number, weekNumber: number, selectedDate: string) => [...dailySyncKeys.all, 'conditional', year, weekNumber, selectedDate] as const,
};

/**
 * SWR key generator for dashboard
 */
export const dashboardKeys = {
  all: ['dashboard'] as const,
  todayTasks: () => [...dashboardKeys.all, 'today-tasks'] as const,
  activeQuests: () => [...dashboardKeys.all, 'active-quests'] as const,
  habitsStreak: () => [...dashboardKeys.all, 'habits-streak'] as const,
  weeklyProgress: () => [...dashboardKeys.all, 'weekly-progress'] as const,
};

/**
 * SWR key generator for vision
 */
export const visionKeys = {
  all: ['vision'] as const,
  lists: () => [...visionKeys.all, 'list'] as const,
  list: () => [...visionKeys.lists()] as const,
  details: () => [...visionKeys.all, 'detail'] as const,
  detail: (id: string) => [...visionKeys.details(), id] as const,
};

/**
 * SWR key generator for pairwise results
 */
export const pairwiseKeys = {
  all: ['pairwise-results'] as const,
  lists: () => [...pairwiseKeys.all, 'list'] as const,
  list: (year: number, quarter: number) => [...pairwiseKeys.lists(), year, quarter] as const,
  details: () => [...pairwiseKeys.all, 'detail'] as const,
  detail: (id: string) => [...pairwiseKeys.details(), id] as const,
}; 