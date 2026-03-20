// @vitest-environment node
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('../queries', () => ({
  queryActivityLogById: vi.fn(),
  updateActivityLogJournal: vi.fn(),
  checkDuplicateLog: vi.fn(),
  insertActivityLogWithJournal: vi.fn(),
}));
vi.mock('../logic', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../logic')>();
  return {
    ...actual,
    parseJournalFormData: vi.fn(actual.parseJournalFormData),
    calculateDurationMinutes: vi.fn(actual.calculateDurationMinutes),
    sanitizeJournalField: vi.fn(actual.sanitizeJournalField),
  };
});

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import {
  queryActivityLogById,
  updateActivityLogJournal,
  checkDuplicateLog,
  insertActivityLogWithJournal,
} from '../queries';
import { getActivityLogById, updateActivityJournal, logActivityWithJournal } from '../actions';
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

const validFormFields = {
  taskId: 'task-1',
  sessionType: 'FOCUS',
  date: '2026-01-01',
  startTime: '2026-01-01T09:00:00Z',
  endTime: '2026-01-01T09:25:00Z',
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getActivityLogById', () => {
  it('throws when user not authenticated', async () => {
    mockCreateClient(null);
    await expect(getActivityLogById('log-1')).rejects.toThrow('not authenticated');
  });

  it('calls queryActivityLogById with correct args', async () => {
    mockCreateClient();
    const row = { id: 'log-1', what_done: 'done', what_think: null, created_at: '...' };
    vi.mocked(queryActivityLogById).mockResolvedValue(row as any);
    const result = await getActivityLogById('log-1');
    expect(queryActivityLogById).toHaveBeenCalledWith(expect.anything(), 'user-1', 'log-1');
    expect(result).toEqual(row);
  });
});

describe('updateActivityJournal', () => {
  it('throws when user not authenticated', async () => {
    mockCreateClient(null);
    await expect(updateActivityJournal('log-1', 'done', 'think')).rejects.toThrow('not authenticated');
  });

  it('calls updateActivityLogJournal and revalidatePath', async () => {
    mockCreateClient();
    const row = { id: 'log-1' };
    vi.mocked(updateActivityLogJournal).mockResolvedValue(row as any);
    const result = await updateActivityJournal('log-1', '  done  ', '');
    expect(updateActivityLogJournal).toHaveBeenCalledWith(
      expect.anything(), 'user-1', 'log-1', 'done', null,
    );
    expect(revalidatePath).toHaveBeenCalledWith('/execution/daily-sync');
    expect(result).toEqual(row);
  });
});

describe('logActivityWithJournal', () => {
  it('throws when user not authenticated', async () => {
    mockCreateClient(null);
    await expect(logActivityWithJournal(makeFormData(validFormFields))).rejects.toThrow('not authenticated');
  });

  it('returns existing session when duplicate found', async () => {
    mockCreateClient();
    vi.mocked(checkDuplicateLog).mockResolvedValue({ id: 'existing' } as any);
    const result = await logActivityWithJournal(makeFormData(validFormFields));
    expect(result).toEqual({ id: 'existing' });
    expect(insertActivityLogWithJournal).not.toHaveBeenCalled();
  });

  it('inserts new log and revalidates when no duplicate', async () => {
    mockCreateClient();
    vi.mocked(checkDuplicateLog).mockResolvedValue(null);
    vi.mocked(insertActivityLogWithJournal).mockResolvedValue({ id: 'new-log' } as any);
    const result = await logActivityWithJournal(makeFormData(validFormFields));
    expect(insertActivityLogWithJournal).toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith('/execution/daily-sync');
    expect(result).toEqual({ id: 'new-log' });
  });
});
