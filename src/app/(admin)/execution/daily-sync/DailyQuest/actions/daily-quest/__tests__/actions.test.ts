// @vitest-environment node
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/lib/quarterUtils', () => ({ getQuarterDates: vi.fn() }));
vi.mock('../queries', () => ({
  insertDailyQuestTask: vi.fn(),
  updateDailyQuestArchive: vi.fn(),
  queryTimerSessions: vi.fn(),
  deleteTimerEvents: vi.fn(),
  deleteTimerSessions: vi.fn(),
  deleteActivityLogs: vi.fn(),
  deleteDailyPlanItems: vi.fn(),
  deleteTask: vi.fn(),
  queryDailyQuests: vi.fn(),
  updateTask: vi.fn(),
}));
vi.mock('../logic', () => ({
  parseDailyQuestFormData: vi.fn(),
  extractSessionIds: vi.fn(),
}));

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { getQuarterDates } from '@/lib/quarterUtils';
import {
  insertDailyQuestTask,
  updateDailyQuestArchive,
  queryTimerSessions,
  deleteTimerEvents,
  deleteTimerSessions,
  deleteActivityLogs,
  deleteDailyPlanItems,
  deleteTask,
  queryDailyQuests,
  updateTask,
} from '../queries';
import { parseDailyQuestFormData, extractSessionIds } from '../logic';
import {
  addDailyQuest,
  archiveDailyQuest,
  deleteDailyQuest,
  getDailyQuests,
  updateDailyQuest,
} from '../actions';
import { makeSupabase } from '@/test-utils/supabase-mock';

function mockCreateClient(user: { id: string } | null = { id: 'user-1' }) {
  vi.mocked(createClient).mockResolvedValue(makeSupabase({ user }) as any);
}

beforeEach(() => vi.clearAllMocks());

// ─── addDailyQuest ────────────────────────────────────────────────────────────

describe('addDailyQuest', () => {
  it('throws when user not authenticated', async () => {
    mockCreateClient(null);
    await expect(addDailyQuest(new FormData())).rejects.toThrow('not authenticated');
  });

  it('parses form data, inserts task, and revalidates path', async () => {
    mockCreateClient();
    const formData = new FormData();
    const task = { id: 'task-1', title: 'New Quest' };

    vi.mocked(parseDailyQuestFormData).mockReturnValue({ title: 'New Quest', focusDuration: 25 });
    vi.mocked(insertDailyQuestTask).mockResolvedValue(task as any);

    const result = await addDailyQuest(formData);

    expect(parseDailyQuestFormData).toHaveBeenCalledWith(formData);
    expect(insertDailyQuestTask).toHaveBeenCalledWith(expect.anything(), 'user-1', 'New Quest', 25);
    expect(revalidatePath).toHaveBeenCalledWith('/quests/daily-quests');
    expect(result).toEqual(task);
  });
});

// ─── archiveDailyQuest ────────────────────────────────────────────────────────

describe('archiveDailyQuest', () => {
  it('throws when user not authenticated', async () => {
    mockCreateClient(null);
    await expect(archiveDailyQuest('task-1')).rejects.toThrow('not authenticated');
  });

  it('archives task and revalidates path', async () => {
    mockCreateClient();
    vi.mocked(updateDailyQuestArchive).mockResolvedValue(undefined);

    const result = await archiveDailyQuest('task-1');

    expect(updateDailyQuestArchive).toHaveBeenCalledWith(expect.anything(), 'task-1');
    expect(revalidatePath).toHaveBeenCalledWith('/quests/daily-quests');
    expect(result).toEqual({ success: true });
  });
});

// ─── deleteDailyQuest ─────────────────────────────────────────────────────────

describe('deleteDailyQuest', () => {
  it('throws when user not authenticated', async () => {
    mockCreateClient(null);
    await expect(deleteDailyQuest('task-1')).rejects.toThrow('not authenticated');
  });

  it('deletes all related data and the task, revalidates path', async () => {
    mockCreateClient();
    const sessions = [{ id: 'session-1' }, { id: 'session-2' }];

    vi.mocked(queryTimerSessions).mockResolvedValue(sessions as any);
    vi.mocked(extractSessionIds).mockReturnValue(['session-1', 'session-2']);
    vi.mocked(deleteTimerEvents).mockResolvedValue(undefined);
    vi.mocked(deleteTimerSessions).mockResolvedValue(undefined);
    vi.mocked(deleteActivityLogs).mockResolvedValue(undefined);
    vi.mocked(deleteDailyPlanItems).mockResolvedValue(undefined);
    vi.mocked(deleteTask).mockResolvedValue(undefined);

    const result = await deleteDailyQuest('task-1');

    expect(queryTimerSessions).toHaveBeenCalledWith(expect.anything(), 'task-1', 'user-1');
    expect(extractSessionIds).toHaveBeenCalledWith(sessions);
    expect(deleteTimerEvents).toHaveBeenCalledWith(expect.anything(), ['session-1', 'session-2']);
    expect(deleteTimerSessions).toHaveBeenCalledWith(expect.anything(), 'task-1', 'user-1');
    expect(deleteActivityLogs).toHaveBeenCalledWith(expect.anything(), 'task-1', 'user-1');
    expect(deleteDailyPlanItems).toHaveBeenCalledWith(expect.anything(), 'task-1');
    expect(deleteTask).toHaveBeenCalledWith(expect.anything(), 'task-1', 'user-1');
    expect(revalidatePath).toHaveBeenCalledWith('/quests/daily-quests');
    expect(result).toEqual({ success: true });
  });

  it('skips deleteTimerEvents when no sessions exist', async () => {
    mockCreateClient();

    vi.mocked(queryTimerSessions).mockResolvedValue([]);
    vi.mocked(deleteTimerSessions).mockResolvedValue(undefined);
    vi.mocked(deleteActivityLogs).mockResolvedValue(undefined);
    vi.mocked(deleteDailyPlanItems).mockResolvedValue(undefined);
    vi.mocked(deleteTask).mockResolvedValue(undefined);

    await deleteDailyQuest('task-1');

    expect(deleteTimerEvents).not.toHaveBeenCalled();
    expect(extractSessionIds).not.toHaveBeenCalled();
  });
});

// ─── getDailyQuests ───────────────────────────────────────────────────────────

describe('getDailyQuests', () => {
  it('throws when user not authenticated', async () => {
    mockCreateClient(null);
    await expect(getDailyQuests(2026, 1)).rejects.toThrow('not authenticated');
  });

  it('queries daily quests for the given quarter date range', async () => {
    mockCreateClient();
    const startDate = new Date('2026-01-01T00:00:00Z');
    const endDate = new Date('2026-03-31T23:59:59Z');
    const tasks = [{ id: 'task-1' }, { id: 'task-2' }];

    vi.mocked(getQuarterDates).mockReturnValue({ startDate, endDate } as any);
    vi.mocked(queryDailyQuests).mockResolvedValue(tasks as any);

    const result = await getDailyQuests(2026, 1);

    expect(getQuarterDates).toHaveBeenCalledWith(2026, 1);
    expect(queryDailyQuests).toHaveBeenCalledWith(
      expect.anything(),
      'user-1',
      startDate.toISOString(),
      endDate.toISOString()
    );
    expect(result).toEqual(tasks);
  });
});

// ─── updateDailyQuest ─────────────────────────────────────────────────────────

describe('updateDailyQuest', () => {
  it('throws when user not authenticated', async () => {
    mockCreateClient(null);
    await expect(updateDailyQuest('task-1', {})).rejects.toThrow('not authenticated');
  });

  it('updates task and revalidates path', async () => {
    mockCreateClient();
    const updated = { id: 'task-1', title: 'Updated Quest' };

    vi.mocked(updateTask).mockResolvedValue(updated as any);

    const result = await updateDailyQuest('task-1', { title: 'Updated Quest' });

    expect(updateTask).toHaveBeenCalledWith(expect.anything(), 'task-1', { title: 'Updated Quest' });
    expect(revalidatePath).toHaveBeenCalledWith('/quests/daily-quests');
    expect(result).toEqual(updated);
  });
});
