// NO "use server" — pure functions
import { RawScheduleWithItem } from './queries';

/**
 * Convert WIB date string (YYYY-MM-DD) to UTC day boundaries as ISO strings.
 */
export function wibDateToUtcRange(date: string): { startUTC: string; endUTC: string } {
  const startUTC = new Date(`${date}T00:00:00+07:00`).toISOString();
  const endUTC = new Date(`${date}T23:59:59.999+07:00`).toISOString();
  return { startUTC, endUTC };
}

/**
 * Attach task titles to schedule items using a pre-built title map.
 */
export function attachTaskTitles(
  schedules: RawScheduleWithItem[],
  taskTitles: { id: string; title: string }[]
): RawScheduleWithItem[] {
  const titleMap = new Map(taskTitles.map(t => [t.id, t.title]));
  return schedules.map(s => ({
    ...s,
    daily_plan_item: s.daily_plan_item
      ? {
          ...s.daily_plan_item,
          title: titleMap.get(s.daily_plan_item.item_id) ?? 'Untitled Task',
        }
      : null,
  }));
}
