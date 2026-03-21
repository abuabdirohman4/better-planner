// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';
import { makeQueryBuilder } from '@/test-utils/supabase-mock';
import { queryBrainDumpByDate, upsertBrainDumpRecord, queryBrainDumpByDateRange } from '../queries';

const makeSupabaseFrom = (builder: any) => ({ from: vi.fn().mockReturnValue(builder) } as any);

describe('queryBrainDumpByDate', () => {
  it('queries brain_dumps with correct user_id and date filters', async () => {
    const row = { id: 'bd-1', content: 'test', date: '2026-01-01' };
    const builder = makeQueryBuilder({ data: row, error: null });
    const supabase = makeSupabaseFrom(builder);
    const result = await queryBrainDumpByDate(supabase, 'user-1', '2026-01-01');
    expect(supabase.from).toHaveBeenCalledWith('brain_dumps');
    expect(builder.eq).toHaveBeenCalledWith('user_id', 'user-1');
    expect(builder.eq).toHaveBeenCalledWith('date', '2026-01-01');
    expect(builder.single).toHaveBeenCalled();
    expect(result).toEqual(row);
  });

  it('throws on DB error', async () => {
    const builder = makeQueryBuilder({ data: null, error: { message: 'not found' } });
    const supabase = makeSupabaseFrom(builder);
    await expect(queryBrainDumpByDate(supabase, 'user-1', 'd')).rejects.toMatchObject({ message: 'not found' });
  });
});

describe('upsertBrainDumpRecord', () => {
  it('calls upsert with correct payload', async () => {
    const row = { id: 'bd-1', content: 'hello', date: '2026-01-01' };
    const builder = makeQueryBuilder({ data: row, error: null });
    const supabase = makeSupabaseFrom(builder);
    const result = await upsertBrainDumpRecord(supabase, 'user-1', 'hello', '2026-01-01');
    expect(builder.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ content: 'hello', date: '2026-01-01', user_id: 'user-1' }),
      { onConflict: 'user_id,date' },
    );
    expect(result).toEqual(row);
  });

  it('throws on error', async () => {
    const builder = makeQueryBuilder({ data: null, error: { message: 'upsert fail' } });
    const supabase = makeSupabaseFrom(builder);
    await expect(upsertBrainDumpRecord(supabase, 'u', 'c', 'd')).rejects.toMatchObject({ message: 'upsert fail' });
  });
});

describe('queryBrainDumpByDateRange', () => {
  it('queries with correct gte/lte date filters and ordering', async () => {
    const builder = makeQueryBuilder({ data: [], error: null });
    const supabase = makeSupabaseFrom(builder);
    await queryBrainDumpByDateRange(supabase, 'user-1', '2026-01-01', '2026-01-07');
    expect(supabase.from).toHaveBeenCalledWith('brain_dumps');
    expect(builder.eq).toHaveBeenCalledWith('user_id', 'user-1');
    expect(builder.gte).toHaveBeenCalledWith('date', '2026-01-01');
    expect(builder.lte).toHaveBeenCalledWith('date', '2026-01-07');
  });

  it('returns empty array when data is null', async () => {
    const builder = makeQueryBuilder({ data: null, error: null });
    const supabase = makeSupabaseFrom(builder);
    const result = await queryBrainDumpByDateRange(supabase, 'user-1', 's', 'e');
    expect(result).toEqual([]);
  });

  it('throws on error', async () => {
    const builder = makeQueryBuilder({ data: null, error: { message: 'range fail' } });
    const supabase = makeSupabaseFrom(builder);
    await expect(queryBrainDumpByDateRange(supabase, 'u', 's', 'e')).rejects.toMatchObject({ message: 'range fail' });
  });
});
