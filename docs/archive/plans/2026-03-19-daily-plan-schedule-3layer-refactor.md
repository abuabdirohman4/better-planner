# Daily Plan + Schedule Actions 3-Layer Refactor

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Refactor `dailyPlanActions.ts` (313 lines) dan `scheduleActions.ts` (238 lines) ke 3-layer architecture mengikuti pattern sm-d15 / work-quests pilot.

**Architecture:**
- `actions/daily-plan/queries.ts` — DB calls only, NO "use server"
- `actions/daily-plan/logic.ts` — pure functions, NO "use server", testable
- `actions/daily-plan/actions.ts` — thin orchestrator, HAS "use server"
- `actions/schedule/queries.ts` — DB calls only, NO "use server"
- `actions/schedule/logic.ts` — pure functions, NO "use server", testable
- `actions/schedule/actions.ts` — thin orchestrator, HAS "use server"
- `actions/index.ts` — backward compat re-exports

**Tech Stack:** Next.js 15 App Router, Supabase, Vitest, TypeScript

---

## Peta Fungsi

### dailyPlanActions.ts
| Fungsi | Layer | Notes |
|--------|-------|-------|
| `setDailyPlan` | query + logic | CASCADE backup/restore — logic paling complex |
| `updateDailyPlanItemFocusDuration` | simple action | |
| `updateDailyPlanItemAndTaskStatus` | action | calls RPC |
| `removeDailyPlanItem` | simple action | |
| `convertToChecklist` | simple action | |
| `convertToQuest` | simple action | |
| `updateDailyPlanItemsDisplayOrder` | action | N+1 loop — bisa di-fix ke batch |

### scheduleActions.ts
| Fungsi | Layer | Notes |
|--------|-------|-------|
| `createSchedule` | action | verify ownership inline — extract to logic |
| `updateSchedule` | action | |
| `deleteSchedule` | action | |
| `getTaskSchedules` | query | |
| `getScheduledTasksByDate` | query + logic | timezone convert + manual join = testable logic |

**Bugs ditemukan:**
1. `updateDailyPlanItemsDisplayOrder` — N+1 loop, bisa di-fix ke Promise.all
2. `getScheduledTasksByDate` — timezone conversion & task title join bisa jadi pure logic functions

---

## Task 0: Buat `actions/daily-plan/queries.ts`

### Files
- Create: `src/app/(admin)/execution/daily-sync/DailyQuest/actions/daily-plan/queries.ts`

### Content

```typescript
// NO "use server" — importable in tests
import { SupabaseClient } from '@supabase/supabase-js';

export interface RawDailyPlan {
  id: string;
  user_id: string;
  plan_date: string;
}

export interface RawDailyPlanItem {
  id: string;
  item_id: string;
  item_type: string;
  status: string;
  daily_session_target: number;
  focus_duration: number;
  daily_plan_id: string;
}

export interface RawTaskSchedule {
  scheduled_start_time: string;
  scheduled_end_time: string;
  duration_minutes: number;
  session_count: number;
  daily_plan_items: { item_id: string };
}

export async function upsertDailyPlan(
  supabase: SupabaseClient,
  userId: string,
  date: string
): Promise<RawDailyPlan> {
  const { data, error } = await supabase
    .from('daily_plans')
    .upsert({ user_id: userId, plan_date: date }, { onConflict: 'user_id,plan_date' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function queryExistingPlanItems(
  supabase: SupabaseClient,
  dailyPlanId: string
): Promise<RawDailyPlanItem[]> {
  const { data } = await supabase
    .from('daily_plan_items')
    .select('id, item_id, status, item_type, daily_session_target, focus_duration')
    .eq('daily_plan_id', dailyPlanId);
  return data || [];
}

export async function querySchedulesByPlanItemIds(
  supabase: SupabaseClient,
  itemIds: string[]
): Promise<RawTaskSchedule[]> {
  if (itemIds.length === 0) return [];
  const { data } = await supabase
    .from('task_schedules')
    .select('*, daily_plan_items!inner(item_id)')
    .in('daily_plan_item_id', itemIds);
  return data || [];
}

export async function deletePlanItemsByTypes(
  supabase: SupabaseClient,
  dailyPlanId: string,
  itemTypes: string[]
): Promise<void> {
  if (itemTypes.length === 0) return;
  const { error } = await supabase
    .from('daily_plan_items')
    .delete()
    .eq('daily_plan_id', dailyPlanId)
    .in('item_type', itemTypes);
  if (error) throw error;
}

export async function insertPlanItems(
  supabase: SupabaseClient,
  items: object[]
): Promise<{ id: string; item_id: string }[]> {
  const { data, error } = await supabase
    .from('daily_plan_items')
    .insert(items)
    .select('id, item_id');
  if (error) throw error;
  return data || [];
}

export async function insertTaskSchedules(
  supabase: SupabaseClient,
  schedules: object[]
): Promise<void> {
  if (schedules.length === 0) return;
  const { error } = await supabase.from('task_schedules').insert(schedules);
  if (error) console.error('Error restoring task schedules:', error);
  // Don't throw — items saved, schedules can be recreated by user
}

export async function updatePlanItemField(
  supabase: SupabaseClient,
  itemId: string,
  fields: Record<string, unknown>
): Promise<void> {
  const { error } = await supabase
    .from('daily_plan_items')
    .update(fields)
    .eq('id', itemId);
  if (error) throw error;
}

export async function updatePlanItemStatusRpc(
  supabase: SupabaseClient,
  taskId: string,
  status: string,
  userId: string,
  date: string,
  dailyPlanItemId: string | null
): Promise<unknown> {
  const { data, error } = await supabase.rpc('update_task_and_daily_plan_status', {
    p_task_id: taskId,
    p_status: status,
    p_user_id: userId,
    p_goal_slot: null,
    p_date: date,
    p_daily_plan_item_id: dailyPlanItemId,
  });
  if (error) throw error;
  return data;
}

export async function updateWeeklyGoalItemsStatus(
  supabase: SupabaseClient,
  taskId: string,
  status: string
): Promise<void> {
  const { error } = await supabase
    .from('weekly_goal_items')
    .update({ status })
    .eq('item_id', taskId);
  if (error) console.warn('Error updating weekly_goal_items status:', error);
  // Don't throw — task status is already updated
}

export async function deletePlanItem(
  supabase: SupabaseClient,
  itemId: string
): Promise<void> {
  const { error } = await supabase
    .from('daily_plan_items')
    .delete()
    .eq('id', itemId);
  if (error) throw error;
}

export async function updatePlanItemsDisplayOrderBatch(
  supabase: SupabaseClient,
  items: { id: string; display_order: number }[]
): Promise<void> {
  // Fix N+1: run all updates concurrently
  await Promise.all(
    items.map(async (item) => {
      const { error } = await supabase
        .from('daily_plan_items')
        .update({ display_order: item.display_order })
        .eq('id', item.id);
      if (error) throw error;
    })
  );
}
```

### Verify
```bash
npm run type-check
```
Expected: 0 errors.

---

## Task 1: Buat `actions/daily-plan/logic.ts` + tests

### Files
- Create: `src/app/(admin)/execution/daily-sync/DailyQuest/actions/daily-plan/logic.ts`
- Create: `src/app/(admin)/execution/daily-sync/DailyQuest/actions/daily-plan/__tests__/logic.test.ts`

### Content `logic.ts`

```typescript
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

/**
 * Build items to insert into daily_plan_items, preserving existing status/target/duration.
 */
export function buildItemsToInsert(
  selectedItems: SelectedItem[],
  dailyPlanId: string,
  existingItemsMap: Map<string, RawDailyPlanItem>
): object[] {
  return selectedItems.map(item => {
    const existing = existingItemsMap.get(item.item_id);
    return {
      ...item,
      daily_plan_id: dailyPlanId,
      status: existing?.status ?? 'TODO',
      daily_session_target: existing?.daily_session_target ?? 1,
      focus_duration: existing?.focus_duration ?? 25,
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
```

### Content `__tests__/logic.test.ts`

```typescript
// @vitest-environment node
import { describe, it, expect } from 'vitest';
import {
  buildExistingItemsMap,
  getItemTypes,
  getItemIdsToDelete,
  extractScheduleBackups,
  buildItemsToInsert,
  remapSchedules,
} from '../logic';
import { RawDailyPlanItem, RawTaskSchedule } from '../queries';

const makeItem = (overrides: Partial<RawDailyPlanItem> = {}): RawDailyPlanItem => ({
  id: 'dpi-1',
  item_id: 'task-1',
  item_type: 'DAILY',
  status: 'TODO',
  daily_session_target: 1,
  focus_duration: 25,
  daily_plan_id: 'plan-1',
  ...overrides,
});

const makeSchedule = (overrides: Partial<RawTaskSchedule> = {}): RawTaskSchedule => ({
  scheduled_start_time: '2026-01-01T10:00:00Z',
  scheduled_end_time: '2026-01-01T10:25:00Z',
  duration_minutes: 25,
  session_count: 1,
  daily_plan_items: { item_id: 'task-1' },
  ...overrides,
});

describe('buildExistingItemsMap', () => {
  it('creates map keyed by item_id', () => {
    const items = [makeItem({ item_id: 'task-1' }), makeItem({ id: 'dpi-2', item_id: 'task-2' })];
    const map = buildExistingItemsMap(items);
    expect(map.size).toBe(2);
    expect(map.get('task-1')?.id).toBe('dpi-1');
    expect(map.get('task-2')?.id).toBe('dpi-2');
  });

  it('returns empty map for empty input', () => {
    expect(buildExistingItemsMap([])).toEqual(new Map());
  });
});

describe('getItemTypes', () => {
  it('returns unique item types', () => {
    const items = [
      { item_id: 'a', item_type: 'DAILY' },
      { item_id: 'b', item_type: 'WORK' },
      { item_id: 'c', item_type: 'DAILY' },
    ];
    const types = getItemTypes(items);
    expect(types).toHaveLength(2);
    expect(types).toContain('DAILY');
    expect(types).toContain('WORK');
  });

  it('returns empty array for empty input', () => {
    expect(getItemTypes([])).toEqual([]);
  });
});

describe('getItemIdsToDelete', () => {
  it('returns ids of items matching the given types', () => {
    const items = [
      makeItem({ id: 'dpi-1', item_type: 'DAILY' }),
      makeItem({ id: 'dpi-2', item_type: 'WORK' }),
      makeItem({ id: 'dpi-3', item_type: 'DAILY' }),
    ];
    const ids = getItemIdsToDelete(items, ['DAILY']);
    expect(ids).toEqual(['dpi-1', 'dpi-3']);
  });

  it('returns empty array when no items match', () => {
    const items = [makeItem({ item_type: 'WORK' })];
    expect(getItemIdsToDelete(items, ['DAILY'])).toEqual([]);
  });
});

describe('extractScheduleBackups', () => {
  it('extracts backup data from raw schedules', () => {
    const schedules = [
      makeSchedule({ daily_plan_items: { item_id: 'task-1' }, session_count: 2 }),
    ];
    const backups = extractScheduleBackups(schedules);
    expect(backups).toHaveLength(1);
    expect(backups[0].item_id).toBe('task-1');
    expect(backups[0].session_count).toBe(2);
  });

  it('returns empty array for empty input', () => {
    expect(extractScheduleBackups([])).toEqual([]);
  });
});

describe('buildItemsToInsert', () => {
  it('preserves existing status and session_target', () => {
    const selected = [{ item_id: 'task-1', item_type: 'DAILY' }];
    const existingMap = new Map([
      ['task-1', makeItem({ status: 'IN_PROGRESS', daily_session_target: 3, focus_duration: 30 })],
    ]);
    const items = buildItemsToInsert(selected, 'plan-1', existingMap);
    expect(items[0]).toMatchObject({
      item_id: 'task-1',
      daily_plan_id: 'plan-1',
      status: 'IN_PROGRESS',
      daily_session_target: 3,
      focus_duration: 30,
    });
  });

  it('uses defaults for new items not in existing map', () => {
    const selected = [{ item_id: 'new-task', item_type: 'WORK' }];
    const items = buildItemsToInsert(selected, 'plan-1', new Map());
    expect(items[0]).toMatchObject({
      status: 'TODO',
      daily_session_target: 1,
      focus_duration: 25,
    });
  });
});

describe('remapSchedules', () => {
  it('maps backups to new daily_plan_item_ids', () => {
    const backups = [
      { item_id: 'task-1', scheduled_start_time: 'T1', scheduled_end_time: 'T2', duration_minutes: 25, session_count: 1 },
    ];
    const newItems = [{ id: 'new-dpi-1', item_id: 'task-1' }];
    const result = remapSchedules(backups, newItems);
    expect(result).toHaveLength(1);
    expect(result[0].daily_plan_item_id).toBe('new-dpi-1');
  });

  it('skips backups with no matching new item', () => {
    const backups = [
      { item_id: 'task-DELETED', scheduled_start_time: 'T1', scheduled_end_time: 'T2', duration_minutes: 25, session_count: 1 },
    ];
    const result = remapSchedules(backups, []);
    expect(result).toHaveLength(0);
  });

  it('returns empty array for empty inputs', () => {
    expect(remapSchedules([], [])).toEqual([]);
  });
});
```

### Steps
1. Create test file
2. `npm run test:run` → FAIL (logic.ts missing)
3. Create logic.ts
4. `npm run test:run` → all PASS

---

## Task 2: Buat `actions/daily-plan/actions.ts`

### Files
- Create: `src/app/(admin)/execution/daily-sync/DailyQuest/actions/daily-plan/actions.ts`

### Content

```typescript
"use server";

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  upsertDailyPlan,
  queryExistingPlanItems,
  querySchedulesByPlanItemIds,
  deletePlanItemsByTypes,
  insertPlanItems,
  insertTaskSchedules,
  updatePlanItemField,
  updatePlanItemStatusRpc,
  updateWeeklyGoalItemsStatus,
  deletePlanItem,
  updatePlanItemsDisplayOrderBatch,
} from './queries';
import {
  buildExistingItemsMap,
  getItemTypes,
  getItemIdsToDelete,
  extractScheduleBackups,
  buildItemsToInsert,
  remapSchedules,
} from './logic';

function revalidatePlanning() {
  revalidatePath('/planning/main-quests');
}

export async function setDailyPlan(
  date: string,
  selectedItems: { item_id: string; item_type: string }[]
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  try {
    const plan = await upsertDailyPlan(supabase, user.id, date);
    const existingItems = await queryExistingPlanItems(supabase, plan.id);
    const existingItemsMap = buildExistingItemsMap(existingItems);
    const itemTypes = getItemTypes(selectedItems);
    const itemIdsToDelete = getItemIdsToDelete(existingItems, itemTypes);

    // Backup schedules before CASCADE delete
    const rawSchedules = await querySchedulesByPlanItemIds(supabase, itemIdsToDelete);
    const backups = extractScheduleBackups(rawSchedules);

    await deletePlanItemsByTypes(supabase, plan.id, itemTypes);

    if (selectedItems.length > 0) {
      const itemsToInsert = buildItemsToInsert(selectedItems, plan.id, existingItemsMap);
      const newItems = await insertPlanItems(supabase, itemsToInsert);

      // Restore schedules with new IDs
      const schedulesToRestore = remapSchedules(backups, newItems);
      await insertTaskSchedules(supabase, schedulesToRestore);
    }

    revalidatePlanning();
    return { success: true };
  } catch (error) {
    console.error('Error setting daily plan:', error);
    throw error;
  }
}

export async function updateDailyPlanItemFocusDuration(
  dailyPlanItemId: string,
  focusDuration: number
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  try {
    await updatePlanItemField(supabase, dailyPlanItemId, { focus_duration: focusDuration });
    revalidatePlanning();
    return { success: true };
  } catch (error) {
    console.error('Error updating focus duration:', error);
    throw error;
  }
}

export async function updateDailyPlanItemAndTaskStatus(
  dailyPlanItemId: string,
  taskId: string,
  status: 'TODO' | 'IN_PROGRESS' | 'DONE',
  itemType?: string,
  date?: string
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const resolvedDate = date ?? new Date().toISOString().split('T')[0];
    const resolvedItemId = dailyPlanItemId.startsWith('virtual-') ? null : dailyPlanItemId;

    const data = await updatePlanItemStatusRpc(supabase, taskId, status, user.id, resolvedDate, resolvedItemId);
    await updateWeeklyGoalItemsStatus(supabase, taskId, status);
    revalidatePlanning();
    return data;
  } catch (error) {
    console.error('Error in updateDailyPlanItemAndTaskStatus:', error);
    throw error;
  }
}

export async function removeDailyPlanItem(dailyPlanItemId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  try {
    await deletePlanItem(supabase, dailyPlanItemId);
    revalidatePlanning();
    return { success: true };
  } catch (error) {
    console.error('Error removing daily plan item:', error);
    throw error;
  }
}

export async function convertToChecklist(dailyPlanItemId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  try {
    await updatePlanItemField(supabase, dailyPlanItemId, { focus_duration: 0, daily_session_target: 0 });
    revalidatePlanning();
    return { success: true };
  } catch (error) {
    console.error('Error converting to checklist:', error);
    throw error;
  }
}

export async function convertToQuest(dailyPlanItemId: string, defaultFocusDuration: number = 25) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  try {
    await updatePlanItemField(supabase, dailyPlanItemId, { focus_duration: defaultFocusDuration, daily_session_target: 1 });
    revalidatePlanning();
    return { success: true };
  } catch (error) {
    console.error('Error converting to quest:', error);
    throw error;
  }
}

export async function updateDailyPlanItemsDisplayOrder(
  items: { id: string; display_order: number }[]
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  try {
    await updatePlanItemsDisplayOrderBatch(supabase, items);
    revalidatePlanning();
    return { success: true, message: 'Urutan task berhasil diupdate!' };
  } catch (error) {
    console.error('Error updating daily plan items order:', error);
    throw new Error('Gagal update urutan task: ' + ((error as Error).message || ''));
  }
}
```

### Verify
```bash
npm run type-check && npm run test:run
```
Expected: 0 errors, all tests pass.

---

## Task 3: Buat `actions/schedule/queries.ts` + `logic.ts` + `actions.ts` + tests

### Files
- Create: `src/app/(admin)/execution/daily-sync/DailyQuest/actions/schedule/queries.ts`
- Create: `src/app/(admin)/execution/daily-sync/DailyQuest/actions/schedule/logic.ts`
- Create: `src/app/(admin)/execution/daily-sync/DailyQuest/actions/schedule/__tests__/logic.test.ts`
- Create: `src/app/(admin)/execution/daily-sync/DailyQuest/actions/schedule/actions.ts`

### `queries.ts`

```typescript
// NO "use server"
import { SupabaseClient } from '@supabase/supabase-js';

export interface RawSchedule {
  id: string;
  daily_plan_item_id: string;
  scheduled_start_time: string;
  scheduled_end_time: string;
  duration_minutes: number;
  session_count: number;
  created_at: string;
  updated_at: string;
}

export interface RawScheduleWithItem extends RawSchedule {
  daily_plan_item: {
    id: string;
    item_id: string;
    status: string;
    item_type: string;
    focus_duration: number;
    daily_session_target: number;
  } | null;
}

export async function verifyPlanItemOwnership(
  supabase: SupabaseClient,
  itemId: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from('daily_plan_items')
    .select('id, daily_plans (user_id)')
    .eq('id', itemId)
    .single();
  if (error || !data) return null;
  const plan = data.daily_plans;
  // @ts-ignore
  return Array.isArray(plan) ? plan[0]?.user_id : plan?.user_id;
}

export async function insertSchedule(
  supabase: SupabaseClient,
  payload: {
    daily_plan_item_id: string;
    scheduled_start_time: string;
    scheduled_end_time: string;
    duration_minutes: number;
    session_count: number;
  }
): Promise<RawSchedule> {
  const { data, error } = await supabase
    .from('task_schedules')
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateScheduleById(
  supabase: SupabaseClient,
  scheduleId: string,
  payload: {
    scheduled_start_time: string;
    scheduled_end_time: string;
    duration_minutes: number;
    session_count: number;
  }
): Promise<RawSchedule | undefined> {
  const { data, error } = await supabase
    .from('task_schedules')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', scheduleId)
    .select()
    .single();
  if (error) {
    if (error.code === 'PGRST116') return undefined; // deleted — silently return
    throw error;
  }
  return data;
}

export async function deleteScheduleById(
  supabase: SupabaseClient,
  scheduleId: string
): Promise<void> {
  const { error } = await supabase
    .from('task_schedules')
    .delete()
    .eq('id', scheduleId);
  if (error) throw error;
}

export async function querySchedulesByItemId(
  supabase: SupabaseClient,
  itemId: string
): Promise<RawSchedule[]> {
  const { data, error } = await supabase
    .from('task_schedules')
    .select('*')
    .eq('daily_plan_item_id', itemId)
    .order('scheduled_start_time', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function querySchedulesByDateRange(
  supabase: SupabaseClient,
  startUTC: string,
  endUTC: string
): Promise<RawScheduleWithItem[]> {
  const { data, error } = await supabase
    .from('task_schedules')
    .select(`
      *,
      daily_plan_item:daily_plan_items (
        id, item_id, status, item_type, focus_duration, daily_session_target
      )
    `)
    .gte('scheduled_start_time', startUTC)
    .lte('scheduled_end_time', endUTC)
    .order('scheduled_start_time', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function queryTaskTitlesByIds(
  supabase: SupabaseClient,
  itemIds: string[]
): Promise<{ id: string; title: string }[]> {
  if (itemIds.length === 0) return [];
  const { data } = await supabase
    .from('tasks')
    .select('id, title')
    .in('id', itemIds);
  return data || [];
}
```

### `logic.ts`

```typescript
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
```

### `__tests__/logic.test.ts`

```typescript
// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { wibDateToUtcRange, attachTaskTitles } from '../logic';
import { RawScheduleWithItem } from '../queries';

describe('wibDateToUtcRange', () => {
  it('converts WIB midnight to UTC (UTC-7h = previous day 17:00)', () => {
    const { startUTC } = wibDateToUtcRange('2026-02-13');
    expect(startUTC).toBe('2026-02-12T17:00:00.000Z');
  });

  it('converts WIB end-of-day to UTC (23:59:59 WIB = 16:59:59 UTC)', () => {
    const { endUTC } = wibDateToUtcRange('2026-02-13');
    expect(endUTC).toBe('2026-02-13T16:59:59.999Z');
  });

  it('startUTC is before endUTC', () => {
    const { startUTC, endUTC } = wibDateToUtcRange('2026-02-13');
    expect(new Date(startUTC) < new Date(endUTC)).toBe(true);
  });
});

const makeSchedule = (itemId: string): RawScheduleWithItem => ({
  id: 's-1',
  daily_plan_item_id: 'dpi-1',
  scheduled_start_time: '2026-02-13T10:00:00Z',
  scheduled_end_time: '2026-02-13T10:25:00Z',
  duration_minutes: 25,
  session_count: 1,
  created_at: '2026-02-13T10:00:00Z',
  updated_at: '2026-02-13T10:00:00Z',
  daily_plan_item: {
    id: 'dpi-1',
    item_id: itemId,
    status: 'TODO',
    item_type: 'DAILY',
    focus_duration: 25,
    daily_session_target: 1,
  },
});

describe('attachTaskTitles', () => {
  it('attaches title from task map', () => {
    const schedules = [makeSchedule('task-1')];
    const titles = [{ id: 'task-1', title: 'My Task' }];
    const result = attachTaskTitles(schedules, titles);
    // @ts-ignore
    expect(result[0].daily_plan_item?.title).toBe('My Task');
  });

  it('uses Untitled Task when task not found', () => {
    const schedules = [makeSchedule('task-unknown')];
    const result = attachTaskTitles(schedules, []);
    // @ts-ignore
    expect(result[0].daily_plan_item?.title).toBe('Untitled Task');
  });

  it('handles null daily_plan_item gracefully', () => {
    const schedule = { ...makeSchedule('task-1'), daily_plan_item: null };
    const result = attachTaskTitles([schedule], [{ id: 'task-1', title: 'T' }]);
    expect(result[0].daily_plan_item).toBeNull();
  });
});
```

### `actions.ts`

```typescript
"use server";

import { createClient } from "@/lib/supabase/server";
import {
  verifyPlanItemOwnership,
  insertSchedule,
  updateScheduleById,
  deleteScheduleById,
  querySchedulesByItemId,
  querySchedulesByDateRange,
  queryTaskTitlesByIds,
  RawSchedule,
} from "./queries";
import { wibDateToUtcRange, attachTaskTitles } from "./logic";

export type { RawSchedule as TaskSchedule };

export async function createSchedule(
  taskId: string,
  startTime: string,
  endTime: string,
  durationMinutes: number,
  sessionCount: number
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("User not authenticated");

  const ownerId = await verifyPlanItemOwnership(supabase, taskId);
  if (!ownerId) throw new Error("Task not found");
  if (ownerId !== user.id) throw new Error("Unauthorized access to task");

  try {
    return await insertSchedule(supabase, {
      daily_plan_item_id: taskId,
      scheduled_start_time: startTime,
      scheduled_end_time: endTime,
      duration_minutes: durationMinutes,
      session_count: sessionCount,
    });
  } catch (error) {
    console.error("Error creating schedule:", error);
    throw new Error("Failed to create schedule");
  }
}

export async function updateSchedule(
  scheduleId: string,
  startTime: string,
  endTime: string,
  durationMinutes: number,
  sessionCount: number
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("User not authenticated");

  try {
    return await updateScheduleById(supabase, scheduleId, {
      scheduled_start_time: startTime,
      scheduled_end_time: endTime,
      duration_minutes: durationMinutes,
      session_count: sessionCount,
    });
  } catch (error) {
    console.error("Error updating schedule:", error);
    throw new Error("Failed to update schedule");
  }
}

export async function deleteSchedule(scheduleId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("User not authenticated");

  try {
    await deleteScheduleById(supabase, scheduleId);
  } catch (error) {
    console.error("Error deleting schedule:", error);
    throw new Error("Failed to delete schedule");
  }
}

export async function getTaskSchedules(taskId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("User not authenticated");

  try {
    return await querySchedulesByItemId(supabase, taskId);
  } catch (error) {
    console.error("Error fetching schedules:", error);
    throw new Error("Failed to fetch schedules");
  }
}

export async function getScheduledTasksByDate(date: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("User not authenticated");

  const { startUTC, endUTC } = wibDateToUtcRange(date);

  try {
    const schedules = await querySchedulesByDateRange(supabase, startUTC, endUTC);
    const itemIds = schedules
      .map(s => s.daily_plan_item?.item_id)
      .filter(Boolean) as string[];
    const taskTitles = await queryTaskTitlesByIds(supabase, itemIds);
    return attachTaskTitles(schedules, taskTitles);
  } catch (error) {
    console.error("Error fetching scheduled tasks:", error);
    throw new Error("Failed to fetch scheduled tasks");
  }
}
```

### Verify
```bash
npm run type-check && npm run test:run
```
Expected: 0 errors, all tests pass (15 existing + ~10 new).

---

## Task 4: Buat `actions/index.ts` + update imports + delete old files

### Files
- Create: `src/app/(admin)/execution/daily-sync/DailyQuest/actions/index.ts`
- Delete: `src/app/(admin)/execution/daily-sync/DailyQuest/actions/dailyPlanActions.ts`
- Delete: `src/app/(admin)/execution/daily-sync/DailyQuest/actions/scheduleActions.ts`

### `index.ts`

```typescript
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
```

### Steps
1. Grep untuk semua file yang import dari `dailyPlanActions` atau `scheduleActions`
2. Update import path ke yang baru (melalui barrel atau langsung)
3. Buat `index.ts`
4. Delete kedua file lama
5. `npm run type-check && npm run test:run && npm run build`

### Final Verify
```bash
npm run type-check && npm run test:run
```
Expected: 0 errors, semua tests passing.

---

## Struktur Akhir

```
DailyQuest/actions/
├── index.ts                    ← backward compat re-exports
├── daily-plan/
│   ├── queries.ts              ← 12 DB functions
│   ├── logic.ts                ← 6 pure functions
│   ├── actions.ts              ← thin orchestrator
│   └── __tests__/
│       └── logic.test.ts       ← 12 unit tests
├── schedule/
│   ├── queries.ts              ← 7 DB functions
│   ├── logic.ts                ← 2 pure functions (timezone + title join)
│   ├── actions.ts              ← thin orchestrator
│   └── __tests__/
│       └── logic.test.ts       ← 6 unit tests
├── dailyQuestActions.ts        ← belum direfactor (198 lines)
├── sessionActions.ts           ← belum direfactor (35 lines)
├── sideQuestActions.ts         ← belum direfactor (59 lines)
└── weeklyTasksActions.ts       ← belum direfactor (211 lines)
```

## Ringkasan Perubahan

| Metric | Before | After |
|--------|--------|-------|
| `dailyPlanActions.ts` | 313 lines | ✅ Dihapus |
| `scheduleActions.ts` | 238 lines | ✅ Dihapus |
| Unit tests baru | 0 | ~18 tests |
| N+1 bug `updateDailyPlanItemsDisplayOrder` | ❌ Ada | ✅ Fixed (Promise.all) |
| Timezone logic testable | ❌ Inline | ✅ Pure function |
| Backward compat | - | ✅ Zero breaking changes |
