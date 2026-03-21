// @vitest-environment node
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/lib/errorUtils', () => ({ handleApiError: vi.fn() }));
vi.mock('../queries', () => ({
  queryBrainDumpByDate: vi.fn(),
  upsertBrainDumpRecord: vi.fn(),
  queryBrainDumpByDateRange: vi.fn(),
}));
vi.mock('../logic', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../logic')>();
  return {
    ...actual,
    validateBrainDumpDate: vi.fn(actual.validateBrainDumpDate),
    sanitizeContent: vi.fn(actual.sanitizeContent),
  };
});

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { handleApiError } from '@/lib/errorUtils';
import {
  queryBrainDumpByDate,
  upsertBrainDumpRecord,
  queryBrainDumpByDateRange,
} from '../queries';
import { getBrainDumpByDate, upsertBrainDump, getBrainDumpByDateRange } from '../actions';
import { makeSupabase } from '@/test-utils/supabase-mock';

function mockCreateClient(user: { id: string } | null = { id: 'user-1' }) {
  const supabase = makeSupabase({ user });
  vi.mocked(createClient).mockResolvedValue(supabase as any);
  return supabase;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getBrainDumpByDate', () => {
  it('returns null when user not authenticated', async () => {
    mockCreateClient(null);
    const result = await getBrainDumpByDate('2026-01-01');
    expect(result).toBeNull();
  });

  it('returns brain dump data when found', async () => {
    mockCreateClient();
    const row = { id: 'bd-1', content: 'notes', date: '2026-01-01' };
    vi.mocked(queryBrainDumpByDate).mockResolvedValue(row as any);
    const result = await getBrainDumpByDate('2026-01-01');
    expect(result).toEqual(row);
  });

  it('returns null when PGRST116 error (not found)', async () => {
    mockCreateClient();
    vi.mocked(queryBrainDumpByDate).mockRejectedValue({ code: 'PGRST116', message: 'not found' });
    const result = await getBrainDumpByDate('2026-01-01');
    expect(result).toBeNull();
  });
});

describe('upsertBrainDump', () => {
  it('throws when user not authenticated', async () => {
    mockCreateClient(null);
    await expect(upsertBrainDump({ content: 'test', date: '2026-01-01' })).rejects.toThrow();
  });

  it('calls upsertBrainDumpRecord and revalidatePath', async () => {
    mockCreateClient();
    const row = { id: 'bd-1', content: 'test', date: '2026-01-01' };
    vi.mocked(upsertBrainDumpRecord).mockResolvedValue(row as any);
    const result = await upsertBrainDump({ content: '  test  ', date: '2026-01-01' });
    expect(upsertBrainDumpRecord).toHaveBeenCalledWith(expect.anything(), 'user-1', 'test', '2026-01-01');
    expect(revalidatePath).toHaveBeenCalledWith('/execution/daily-sync');
    expect(result).toEqual(row);
  });

  it('throws and calls handleApiError on DB error', async () => {
    mockCreateClient();
    vi.mocked(upsertBrainDumpRecord).mockRejectedValue(new Error('DB fail'));
    await expect(upsertBrainDump({ content: 'x', date: '2026-01-01' })).rejects.toThrow('DB fail');
    expect(handleApiError).toHaveBeenCalled();
  });
});

describe('getBrainDumpByDateRange', () => {
  it('returns empty array when user not authenticated', async () => {
    mockCreateClient(null);
    const result = await getBrainDumpByDateRange('2026-01-01', '2026-01-07');
    expect(result).toEqual([]);
  });

  it('returns data from query', async () => {
    mockCreateClient();
    const rows = [{ id: 'bd-1', date: '2026-01-01' }];
    vi.mocked(queryBrainDumpByDateRange).mockResolvedValue(rows as any);
    const result = await getBrainDumpByDateRange('2026-01-01', '2026-01-07');
    expect(result).toEqual(rows);
    expect(queryBrainDumpByDateRange).toHaveBeenCalledWith(expect.anything(), 'user-1', '2026-01-01', '2026-01-07');
  });

  it('returns empty array and calls handleApiError on error', async () => {
    mockCreateClient();
    vi.mocked(queryBrainDumpByDateRange).mockRejectedValue(new Error('DB fail'));
    const result = await getBrainDumpByDateRange('s', 'e');
    expect(result).toEqual([]);
    expect(handleApiError).toHaveBeenCalled();
  });
});
