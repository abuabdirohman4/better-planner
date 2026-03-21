// @vitest-environment node
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('../queries', () => ({
  checkDuplicateActivityLog: vi.fn(),
  insertActivityLog: vi.fn(),
  queryActivityLogs: vi.fn(),
  queryTasksByIds: vi.fn(),
  queryMilestonesByIds: vi.fn(),
  queryQuestsByIds: vi.fn(),
}));
vi.mock('../logic', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../logic')>();
  return {
    ...actual,
    parseActivityFormData: vi.fn(actual.parseActivityFormData),
    calculateDurationMinutes: vi.fn(actual.calculateDurationMinutes),
    enrichLogsWithHierarchy: vi.fn(actual.enrichLogsWithHierarchy),
  };
});

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import {
  checkDuplicateActivityLog,
  insertActivityLog,
  queryActivityLogs,
  queryTasksByIds,
  queryMilestonesByIds,
  queryQuestsByIds,
} from '../queries';
import { logActivity, getTodayActivityLogs } from '../actions';
import { makeSupabase } from '@/test-utils/supabase-mock';

function mockCreateClient(user: { id: string } | null = { id: 'user-1' }) {
  const supabase = makeSupabase({ user });
  vi.mocked(createClient).mockResolvedValue(supabase as any);
  return supabase;
}

function makeFormData(fields: Record<string, string>): FormData {
  const fd = new FormData();
  Object.entries(fields).forEach(([k, v]) => fd.append(k, v));
  return fd;
}

const validFormData = {
  taskId: 'task-1',
  sessionType: 'FOCUS',
  date: '2026-01-01',
  startTime: '2026-01-01T09:00:00Z',
  endTime: '2026-01-01T09:25:00Z',
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('logActivity', () => {
  it('throws when user not authenticated', async () => {
    mockCreateClient(null);
    await expect(logActivity(makeFormData(validFormData))).rejects.toThrow('not authenticated');
  });

  it('returns existing session when duplicate found', async () => {
    mockCreateClient();
    vi.mocked(checkDuplicateActivityLog).mockResolvedValue({ id: 'existing-log' } as any);
    const result = await logActivity(makeFormData(validFormData));
    expect(result).toEqual({ id: 'existing-log' });
    expect(insertActivityLog).not.toHaveBeenCalled();
  });

  it('inserts activity log and revalidates path when no duplicate', async () => {
    mockCreateClient();
    vi.mocked(checkDuplicateActivityLog).mockResolvedValue(null);
    vi.mocked(insertActivityLog).mockResolvedValue({ id: 'new-log' } as any);
    const result = await logActivity(makeFormData(validFormData));
    expect(insertActivityLog).toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith('/execution/daily-sync');
    expect(result).toEqual({ id: 'new-log' });
  });
});

describe('getTodayActivityLogs', () => {
  it('throws when user not authenticated', async () => {
    mockCreateClient(null);
    await expect(getTodayActivityLogs('2026-01-01')).rejects.toThrow('not authenticated');
  });

  it('returns empty array when no logs found', async () => {
    mockCreateClient();
    vi.mocked(queryActivityLogs).mockResolvedValue([]);
    const result = await getTodayActivityLogs('2026-01-01');
    expect(result).toEqual([]);
    expect(queryTasksByIds).not.toHaveBeenCalled();
  });

  it('returns logs with null hierarchy when no task_ids', async () => {
    mockCreateClient();
    vi.mocked(queryActivityLogs).mockResolvedValue([{ task_id: null, id: 'log-1' }] as any);
    const result = await getTodayActivityLogs('2026-01-01');
    expect(queryTasksByIds).not.toHaveBeenCalled();
    expect(result[0]).toMatchObject({ task_title: null, quest_title: null });
  });

  it('calls queryTasksByIds, queryMilestonesByIds, queryQuestsByIds with correct data', async () => {
    mockCreateClient();
    vi.mocked(queryActivityLogs).mockResolvedValue([{ task_id: 'task-1', id: 'log-1' }] as any);
    vi.mocked(queryTasksByIds).mockResolvedValue([{ id: 'task-1', title: 'T', type: 'WORK_QUEST', milestone_id: 'mile-1' }] as any);
    vi.mocked(queryMilestonesByIds).mockResolvedValue([{ id: 'mile-1', title: 'M', quest_id: 'quest-1' }] as any);
    vi.mocked(queryQuestsByIds).mockResolvedValue([{ id: 'quest-1', title: 'Q' }] as any);

    const result = await getTodayActivityLogs('2026-01-01');

    expect(queryTasksByIds).toHaveBeenCalledWith(expect.anything(), ['task-1']);
    expect(queryMilestonesByIds).toHaveBeenCalledWith(expect.anything(), ['mile-1']);
    expect(queryQuestsByIds).toHaveBeenCalledWith(expect.anything(), ['quest-1']);
    expect(result[0].task_title).toBe('T');
    expect(result[0].quest_title).toBe('Q');
  });
});
