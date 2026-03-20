// @vitest-environment node
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }));
vi.mock('../queries', () => ({
  verifyPlanItemOwnership: vi.fn(),
  insertSchedule: vi.fn(),
  updateScheduleById: vi.fn(),
  deleteScheduleById: vi.fn(),
  querySchedulesByItemId: vi.fn(),
  querySchedulesByDateRange: vi.fn(),
  queryTaskTitlesByIds: vi.fn(),
}));
vi.mock('../logic', () => ({
  wibDateToUtcRange: vi.fn(),
  attachTaskTitles: vi.fn(),
}));

import { createClient } from '@/lib/supabase/server';
import {
  verifyPlanItemOwnership,
  insertSchedule,
  updateScheduleById,
  deleteScheduleById,
  querySchedulesByItemId,
  querySchedulesByDateRange,
  queryTaskTitlesByIds,
} from '../queries';
import { wibDateToUtcRange, attachTaskTitles } from '../logic';
import {
  createSchedule,
  updateSchedule,
  deleteSchedule,
  getTaskSchedules,
  getScheduledTasksByDate,
} from '../actions';
import { makeSupabase } from '@/test-utils/supabase-mock';

function mockCreateClient(user: { id: string } | null = { id: 'user-1' }) {
  vi.mocked(createClient).mockResolvedValue(makeSupabase({ user }));
}

beforeEach(() => vi.clearAllMocks());

describe('createSchedule', () => {
  it('throws when user not authenticated', async () => {
    mockCreateClient(null);
    await expect(createSchedule('dpi-1', 'T1', 'T2', 25, 1)).rejects.toThrow('not authenticated');
  });

  it('throws when ownership not verified (task not found)', async () => {
    mockCreateClient();
    vi.mocked(verifyPlanItemOwnership).mockResolvedValue(null);
    await expect(createSchedule('dpi-1', 'T1', 'T2', 25, 1)).rejects.toThrow('not found');
  });

  it('throws when ownership belongs to different user', async () => {
    mockCreateClient();
    vi.mocked(verifyPlanItemOwnership).mockResolvedValue('other-user');
    await expect(createSchedule('dpi-1', 'T1', 'T2', 25, 1)).rejects.toThrow('Unauthorized');
  });

  it('calls insertSchedule with correct payload on success', async () => {
    mockCreateClient();
    vi.mocked(verifyPlanItemOwnership).mockResolvedValue('user-1');
    const schedule = { id: 'sched-1' } as any;
    vi.mocked(insertSchedule).mockResolvedValue(schedule);

    const result = await createSchedule('dpi-1', 'T1', 'T2', 25, 1);

    expect(insertSchedule).toHaveBeenCalledWith(expect.anything(), {
      daily_plan_item_id: 'dpi-1',
      scheduled_start_time: 'T1',
      scheduled_end_time: 'T2',
      duration_minutes: 25,
      session_count: 1,
    });
    expect(result).toEqual(schedule);
  });
});

describe('updateSchedule', () => {
  it('throws when user not authenticated', async () => {
    mockCreateClient(null);
    await expect(updateSchedule('sched-1', 'T1', 'T2', 25, 1)).rejects.toThrow('not authenticated');
  });

  it('calls updateScheduleById with correct payload', async () => {
    mockCreateClient();
    const updated = { id: 'sched-1' } as any;
    vi.mocked(updateScheduleById).mockResolvedValue(updated);

    const result = await updateSchedule('sched-1', 'T1', 'T2', 25, 1);

    expect(updateScheduleById).toHaveBeenCalledWith(expect.anything(), 'sched-1', {
      scheduled_start_time: 'T1',
      scheduled_end_time: 'T2',
      duration_minutes: 25,
      session_count: 1,
    });
    expect(result).toEqual(updated);
  });
});

describe('deleteSchedule', () => {
  it('throws when user not authenticated', async () => {
    mockCreateClient(null);
    await expect(deleteSchedule('sched-1')).rejects.toThrow('not authenticated');
  });

  it('calls deleteScheduleById', async () => {
    mockCreateClient();
    vi.mocked(deleteScheduleById).mockResolvedValue(undefined);
    await deleteSchedule('sched-1');
    expect(deleteScheduleById).toHaveBeenCalledWith(expect.anything(), 'sched-1');
  });
});

describe('getTaskSchedules', () => {
  it('throws when user not authenticated', async () => {
    mockCreateClient(null);
    await expect(getTaskSchedules('dpi-1')).rejects.toThrow('not authenticated');
  });

  it('calls querySchedulesByItemId and returns result', async () => {
    mockCreateClient();
    const schedules = [{ id: 'sched-1' }] as any;
    vi.mocked(querySchedulesByItemId).mockResolvedValue(schedules);

    const result = await getTaskSchedules('dpi-1');

    expect(querySchedulesByItemId).toHaveBeenCalledWith(expect.anything(), 'dpi-1');
    expect(result).toEqual(schedules);
  });
});

describe('getScheduledTasksByDate', () => {
  it('throws when user not authenticated', async () => {
    mockCreateClient(null);
    await expect(getScheduledTasksByDate('2026-03-20')).rejects.toThrow('not authenticated');
  });

  it('converts WIB date to UTC range and attaches titles', async () => {
    mockCreateClient();
    vi.mocked(wibDateToUtcRange).mockReturnValue({
      startUTC: '2026-03-19T17:00:00Z',
      endUTC: '2026-03-20T16:59:59Z',
    });
    const schedules = [{ id: 'sched-1', daily_plan_item: { item_id: 'task-1' } }] as any;
    const withTitles = [{ id: 'sched-1', daily_plan_item: { item_id: 'task-1', title: 'T' } }] as any;
    vi.mocked(querySchedulesByDateRange).mockResolvedValue(schedules);
    vi.mocked(queryTaskTitlesByIds).mockResolvedValue([{ id: 'task-1', title: 'T' }]);
    vi.mocked(attachTaskTitles).mockReturnValue(withTitles);

    const result = await getScheduledTasksByDate('2026-03-20');

    expect(wibDateToUtcRange).toHaveBeenCalledWith('2026-03-20');
    expect(querySchedulesByDateRange).toHaveBeenCalledWith(
      expect.anything(), '2026-03-19T17:00:00Z', '2026-03-20T16:59:59Z'
    );
    expect(queryTaskTitlesByIds).toHaveBeenCalledWith(expect.anything(), ['task-1']);
    expect(attachTaskTitles).toHaveBeenCalled();
    expect(result).toEqual(withTitles);
  });
});
