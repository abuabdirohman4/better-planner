// Planning Hooks
export { useQuests, useMainQuests } from './planning/useQuests';
export { useMilestones } from './planning/useMilestones';
export { useTasks } from './planning/useTasks';
export { useVisions } from './planning/useVision';

// Execution Hooks
export { useUnscheduledTasks, useScheduledTasksForWeek, useWeeklyGoals, useWeeklyGoalsWithProgress, useWeeklyRules } from './execution/useWeeklySync';
export { useDailyPlan, useCompletedSessions, useTasksForWeek } from './execution/useDailySync';

// Dashboard Hooks
export { useTodayTasks, useActiveQuests, useHabitsStreak, useWeeklyProgress } from './dashboard/useDashboard';

// Common Hooks
export { useQuarter } from './common/useQuarter';
export { useWeek } from './common/useWeek';
export { useProgressiveLoading, usePrefetchOnDemand } from './common/useProgressiveLoading'; 