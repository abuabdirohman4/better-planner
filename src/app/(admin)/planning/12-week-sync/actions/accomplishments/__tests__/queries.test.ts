// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';
import { makeQueryBuilder } from '@/test-utils/supabase-mock';
import { queryInsertAccomplishment, queryDeleteAccomplishment } from '../queries';

const makeFrom = (builder: any) => ({ from: vi.fn().mockReturnValue(builder) } as any);

describe('queryInsertAccomplishment', () => {
  it('inserts and returns data', async () => {
    const row = { id: 'a1', description: 'Did great', sort_order: 0 };
    const builder = makeQueryBuilder({ data: row, error: null });
    const supabase = makeFrom(builder);
    const result = await queryInsertAccomplishment(supabase, 'r1', 'Did great', 0);
    expect(result).toEqual(row);
    expect(builder.insert).toHaveBeenCalledWith(expect.objectContaining({
      quarterly_review_id: 'r1',
      description: 'Did great',
    }));
  });

  it('throws on error', async () => {
    const builder = makeQueryBuilder({ data: null, error: { message: 'insert fail' } });
    const supabase = makeFrom(builder);
    await expect(queryInsertAccomplishment(supabase, 'r1', 'x', 0)).rejects.toMatchObject({ message: 'insert fail' });
  });
});

describe('queryDeleteAccomplishment', () => {
  it('deletes with correct id', async () => {
    const builder = makeQueryBuilder({ data: null, error: null });
    const supabase = makeFrom(builder);
    await queryDeleteAccomplishment(supabase, 'a1', 'r1');
    expect(builder.delete).toHaveBeenCalled();
    expect(builder.eq).toHaveBeenCalledWith('id', 'a1');
    expect(builder.eq).toHaveBeenCalledWith('quarterly_review_id', 'r1');
  });

  it('throws on error', async () => {
    const builder = makeQueryBuilder({ data: null, error: { message: 'delete fail' } });
    const supabase = makeFrom(builder);
    await expect(queryDeleteAccomplishment(supabase, 'a1', 'r1')).rejects.toMatchObject({ message: 'delete fail' });
  });
});
