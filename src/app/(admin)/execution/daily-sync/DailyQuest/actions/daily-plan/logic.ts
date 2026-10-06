// NO "use server" — pure functions only
import { RawDailyPlanItem, RawTaskSchedule } from './queries';

export interface SelectedItem {
  item_id: string;
  item_type: string;
}

export interface ScheduleBackup {
  item_id: string;
  scheduled_start_time: string;
  scheduled_end_time: string;
  duration_minutes: number;
  session_count: number;
}

export interface RestoredSchedule {
  daily_plan_item_id: string;
  scheduled_start_time: string;
  scheduled_end_time: string;
  duration_minutes: number;
  session_count: number;
}

/**
 * Build a map of existing plan items keyed by item_id for O(1) lookup.
 */
export function buildExistingItemsMap(
  items: RawDailyPlanItem[]
): Map<string, RawDailyPlanItem> {
  const map = new Map<string, RawDailyPlanItem>();
  items.forEach(item => map.set(item.item_id, item));
  return map;
}

/**
 * Get unique item types from selected items.
 */
export function getItemTypes(items: SelectedItem[]): string[] {
  return [...new Set(items.map(i => i.item_type))];
}

/**
 * Get IDs of existing plan items that match the given types.
 */
export function getItemIdsToDelete(
  existingItems: RawDailyPlanItem[],
  itemTypes: string[]
): string[] {
  return existingItems
    .filter(item => itemTypes.includes(item.item_type))
    .map(item => item.id);
}

/**
 * Extract schedule backups from raw schedule rows (with nested item_id).
 */
export function extractScheduleBackups(
  schedules: RawTaskSchedule[]
): ScheduleBackup[] {
  return schedules.map(s => ({
    item_id: s.daily_plan_items.item_id,
    scheduled_start_time: s.scheduled_start_time,
    scheduled_end_time: s.scheduled_end_time,
    duration_minutes: s.duration_minutes,
    session_count: s.session_count,
  }));
}

/** Siklus fokus bawaan item baru: HFG 90/15, Work 60/10, sisanya 25/5 (app-70vs). */
export function defaultFocusDuration(itemType: string): number {
  if (itemType === 'MAIN_QUEST') return 90;
  if (itemType === 'WORK_QUEST') return 60;
  return 25;
}

/**
 * Build items to insert into daily_plan_items, preserving existing
 * status/target/duration/display_order.
 */
export function buildItemsToInsert(
  selectedItems: SelectedItem[],
  dailyPlanId: string,
  existingItemsMap: Map<string, RawDailyPlanItem>
): object[] {
  // Item baru ditaruh di ujung urutan (kolom bawaannya 0 = akan melompat ke atas).
  let nextOrder = Math.max(0, ...[...existingItemsMap.values()].map(i => i.display_order ?? 0)) + 1;
  return selectedItems.map(item => {
    const existing = existingItemsMap.get(item.item_id);
    return {
      ...item,
      daily_plan_id: dailyPlanId,
      status: existing?.status ?? 'TODO',
      daily_session_target: existing?.daily_session_target ?? 1,
      focus_duration: existing?.focus_duration ?? defaultFocusDuration(item.item_type),
      display_order: existing?.display_order ?? nextOrder++,
    };
  });
}

/**
 * Map backed-up schedules to new daily_plan_item IDs after re-insert.
 * Returns only schedules where a matching new item was found.
 */
export function remapSchedules(
  backups: ScheduleBackup[],
  newItems: { id: string; item_id: string }[]
): RestoredSchedule[] {
  const newItemMap = new Map(newItems.map(i => [i.item_id, i.id]));
  return backups
    .map(s => {
      const newId = newItemMap.get(s.item_id);
      if (!newId) return null;
      return {
        daily_plan_item_id: newId,
        scheduled_start_time: s.scheduled_start_time,
        scheduled_end_time: s.scheduled_end_time,
        duration_minutes: s.duration_minutes,
        session_count: s.session_count,
      };
    })
    .filter((s): s is RestoredSchedule => s !== null);
}

/** Hari (0=Min..6=Sab) dari tanggal "YYYY-MM-DD", tanpa pengaruh zona waktu proses. */
export const dayOfWeek = (date: string) => new Date(date + 'T00:00:00Z').getUTCDay();

/**
 * Rutin (Daily Quest berulang) yang perlu dimasukkan ke rencana `date` (app-fj81):
 * repeat_days memuat hari itu dan belum ada di rencana. repeat_days NULL = tidak berulang.
 */
export function pickRoutinesToSeed(
  tasks: { id: string; repeat_days: number[] | null }[],
  date: string,
  existingItemIds: Set<string>
): string[] {
  const dow = dayOfWeek(date);
  return tasks.filter((t) => t.repeat_days?.includes(dow) && !existingItemIds.has(t.id)).map((t) => t.id);
}
