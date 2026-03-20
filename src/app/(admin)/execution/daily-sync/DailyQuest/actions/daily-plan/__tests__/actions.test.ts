// @vitest-environment node
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('../queries', () => ({
  upsertDailyPlan: vi.fn(),
  queryExistingPlanItems: vi.fn(),
  querySchedulesByPlanItemIds: vi.fn(),
  deletePlanItemsByTypes: vi.fn(),
  insertPlanItems: vi.fn(),
  insertTaskSchedules: vi.fn(),
  updatePlanItemField: vi.fn(),
  updatePlanItemStatusRpc: vi.fn(),
  updateWeeklyGoalItemsStatus: vi.fn(),
  deletePlanItem: vi.fn(),
  updatePlanItemsDisplayOrderBatch: vi.fn(),
}));
vi.mock('../logic', () => ({
  buildExistingItemsMap: vi.fn(),
  getItemTypes: vi.fn(),
  getItemIdsToDelete: vi.fn(),
  extractScheduleBackups: vi.fn(),
  buildItemsToInsert: vi.fn(),
  remapSchedules: vi.fn(),
}));

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
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
} from '../queries';
import {
  buildExistingItemsMap,
  getItemTypes,
  getItemIdsToDelete,
  extractScheduleBackups,
  buildItemsToInsert,
  remapSchedules,
} from '../logic';
import {
  setDailyPlan,
  updateDailyPlanItemFocusDuration,
  updateDailyPlanItemAndTaskStatus,
  removeDailyPlanItem,
  convertToChecklist,
  convertToQuest,
  updateDailyPlanItemsDisplayOrder,
} from '../actions';
import { makeSupabase } from '@/test-utils/supabase-mock';

function mockCreateClient(user: { id: string } | null = { id: 'user-1' }) {
  vi.mocked(createClient).mockResolvedValue(makeSupabase({ user }));
}

beforeEach(() => vi.clearAllMocks());

describe('setDailyPlan', () => {
  it('throws when user not authenticated', async () => {
    mockCreateClient(null);
    await expect(setDailyPlan('2026-03-20', [])).rejects.toThrow('not authenticated');
  });

  it('calls full backup/restore flow', async () => {
    mockCreateClient();
    const plan = { id: 'plan-1', user_id: 'user-1', plan_date: '2026-03-20' };
    const existingItems = [{ id: 'dpi-1', item_id: 'task-1' }];
    const existingMap = new Map([['task-1', existingItems[0]]]);
    const backups = [{ item_id: 'task-1', scheduled_start_time: 'T1', scheduled_end_time: 'T2', duration_minutes: 25, session_count: 1 }];
    const newItems = [{ id: 'new-dpi-1', item_id: 'task-1' }];
    const schedulesToRestore = [{ daily_plan_item_id: 'new-dpi-1', scheduled_start_time: 'T1', scheduled_end_time: 'T2', duration_minutes: 25, session_count: 1 }];

    vi.mocked(upsertDailyPlan).mockResolvedValue(plan as any);
    vi.mocked(queryExistingPlanItems).mockResolvedValue(existingItems as any);
    vi.mocked(buildExistingItemsMap).mockReturnValue(existingMap as any);
    vi.mocked(getItemTypes).mockReturnValue(['DAILY']);
    vi.mocked(getItemIdsToDelete).mockReturnValue(['dpi-1']);
    vi.mocked(querySchedulesByPlanItemIds).mockResolvedValue([] as any);
    vi.mocked(extractScheduleBackups).mockReturnValue(backups as any);
    vi.mocked(deletePlanItemsByTypes).mockResolvedValue(undefined);
    vi.mocked(buildItemsToInsert).mockReturnValue([{}]);
    vi.mocked(insertPlanItems).mockResolvedValue(newItems as any);
    vi.mocked(remapSchedules).mockReturnValue(schedulesToRestore as any);
    vi.mocked(insertTaskSchedules).mockResolvedValue(undefined);

    const result = await setDailyPlan('2026-03-20', [{ item_id: 'task-1', item_type: 'DAILY' }]);

    expect(upsertDailyPlan).toHaveBeenCalledWith(expect.anything(), 'user-1', '2026-03-20');
    expect(deletePlanItemsByTypes).toHaveBeenCalled();
    expect(insertPlanItems).toHaveBeenCalled();
    expect(insertTaskSchedules).toHaveBeenCalledWith(expect.anything(), schedulesToRestore);
    expect(revalidatePath).toHaveBeenCalled();
    expect(result).toEqual({ success: true });
  });
});

describe('updateDailyPlanItemFocusDuration', () => {
  it('throws when user not authenticated', async () => {
    mockCreateClient(null);
    await expect(updateDailyPlanItemFocusDuration('dpi-1', 30)).rejects.toThrow('not authenticated');
  });

  it('calls updatePlanItemField with focus_duration', async () => {
    mockCreateClient();
    vi.mocked(updatePlanItemField).mockResolvedValue(undefined);

    await updateDailyPlanItemFocusDuration('dpi-1', 30);

    expect(updatePlanItemField).toHaveBeenCalledWith(expect.anything(), 'dpi-1', { focus_duration: 30 });
    expect(revalidatePath).toHaveBeenCalled();
  });
});

describe('updateDailyPlanItemAndTaskStatus', () => {
  it('throws when user not authenticated', async () => {
    mockCreateClient(null);
    await expect(updateDailyPlanItemAndTaskStatus('dpi-1', 'task-1', 'DONE')).rejects.toThrow('not authenticated');
  });

  it('passes null as item_id for virtual items', async () => {
    mockCreateClient();
    vi.mocked(updatePlanItemStatusRpc).mockResolvedValue(null);
    vi.mocked(updateWeeklyGoalItemsStatus).mockResolvedValue(undefined);

    await updateDailyPlanItemAndTaskStatus('virtual-abc', 'task-1', 'DONE', undefined, '2026-03-20');

    expect(updatePlanItemStatusRpc).toHaveBeenCalledWith(
      expect.anything(), 'task-1', 'DONE', 'user-1', '2026-03-20', null
    );
  });

  it('passes real item_id for non-virtual items', async () => {
    mockCreateClient();
    vi.mocked(updatePlanItemStatusRpc).mockResolvedValue(null);
    vi.mocked(updateWeeklyGoalItemsStatus).mockResolvedValue(undefined);

    await updateDailyPlanItemAndTaskStatus('dpi-1', 'task-1', 'DONE', undefined, '2026-03-20');

    expect(updatePlanItemStatusRpc).toHaveBeenCalledWith(
      expect.anything(), 'task-1', 'DONE', 'user-1', '2026-03-20', 'dpi-1'
    );
  });
});

describe('removeDailyPlanItem', () => {
  it('throws when user not authenticated', async () => {
    mockCreateClient(null);
    await expect(removeDailyPlanItem('dpi-1')).rejects.toThrow('not authenticated');
  });

  it('calls deletePlanItem and revalidatePath', async () => {
    mockCreateClient();
    vi.mocked(deletePlanItem).mockResolvedValue(undefined);

    await removeDailyPlanItem('dpi-1');

    expect(deletePlanItem).toHaveBeenCalledWith(expect.anything(), 'dpi-1');
    expect(revalidatePath).toHaveBeenCalled();
  });
});

describe('convertToChecklist', () => {
  it('sets focus_duration=0 and daily_session_target=0', async () => {
    mockCreateClient();
    vi.mocked(updatePlanItemField).mockResolvedValue(undefined);

    await convertToChecklist('dpi-1');

    expect(updatePlanItemField).toHaveBeenCalledWith(expect.anything(), 'dpi-1', {
      focus_duration: 0,
      daily_session_target: 0,
    });
  });
});

describe('convertToQuest', () => {
  it('restores focus_duration=25 and daily_session_target=1 by default', async () => {
    mockCreateClient();
    vi.mocked(updatePlanItemField).mockResolvedValue(undefined);

    await convertToQuest('dpi-1');

    expect(updatePlanItemField).toHaveBeenCalledWith(expect.anything(), 'dpi-1', {
      focus_duration: 25,
      daily_session_target: 1,
    });
  });
});

describe('updateDailyPlanItemsDisplayOrder', () => {
  it('throws when user not authenticated', async () => {
    mockCreateClient(null);
    await expect(updateDailyPlanItemsDisplayOrder([])).rejects.toThrow('not authenticated');
  });

  it('calls updatePlanItemsDisplayOrderBatch and revalidatePath', async () => {
    mockCreateClient();
    vi.mocked(updatePlanItemsDisplayOrderBatch).mockResolvedValue(undefined);
    const items = [{ id: 'dpi-1', display_order: 0 }];

    await updateDailyPlanItemsDisplayOrder(items);

    expect(updatePlanItemsDisplayOrderBatch).toHaveBeenCalledWith(expect.anything(), items);
    expect(revalidatePath).toHaveBeenCalled();
  });
});
