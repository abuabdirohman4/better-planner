// Backward compatibility re-exports — DO NOT add business logic here

export {
  setDailyPlan,
  updateDailyPlanItemFocusDuration,
  updateDailyPlanItemAndTaskStatus,
  removeDailyPlanItem,
  convertToChecklist,
  convertToQuest,
  updateDailyPlanItemsDisplayOrder,
} from './daily-plan/actions';

export {
  createSchedule,
  updateSchedule,
  deleteSchedule,
  getTaskSchedules,
  getScheduledTasksByDate,
} from './schedule/actions';

export type { TaskSchedule } from './schedule/actions';

export {
  addDailyQuest,
  archiveDailyQuest,
  deleteDailyQuest,
  getDailyQuests,
  updateDailyQuest,
} from './daily-quest/actions';

export { getTasksForWeek } from './weekly-tasks/actions';

export { addSideQuest } from './side-quest/actions';

export { countCompletedSessions } from './session/actions';
