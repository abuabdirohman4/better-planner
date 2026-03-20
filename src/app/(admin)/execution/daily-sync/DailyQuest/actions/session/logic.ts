// NO "use server" — pure functions
import { RawDailyPlanItem } from './queries';

/**
 * Validate that a daily_plan_item row exists and contains a non-empty item_id.
 * Throws if the item is null/undefined or has no item_id value.
 */
export function validateItemId(item: RawDailyPlanItem | null): string {
  if (!item || !item.item_id) throw new Error('Item ID not found');
  return item.item_id;
}
