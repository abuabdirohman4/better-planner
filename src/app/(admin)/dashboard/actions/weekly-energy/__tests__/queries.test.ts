// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';
import { makeQueryBuilder } from '@/test-utils/supabase-mock';
import { queryEnergyRows } from '../queries';

const makeSupabaseFrom = (builder: any) => ({ from: vi.fn().mockReturnValue(builder) } as any);

describe('queryEnergyRows', () => {
  it('queries activity_logs with user_id, date range, and select energy', async () => {
    const rows = [{ energy: 1 }, { energy: 0 }];
    const builder = makeQueryBuilder({ data: rows, error: null });
    const supabase = makeSupabaseFrom(builder);

    const result = await queryEnergyRows(supabase, 'user-1', '2026-09-28', '2026-10-04');

    expect(supabase.from).toHaveBeenCalledWith('activity_logs');
    expect(builder.select).toHaveBeenCalledWith('energy');
    expect(builder.eq).toHaveBeenCalledWith('user_id', 'user-1');
    expect(builder.gte).toHaveBeenCalledWith('local_date', '2026-09-28');
    expect(builder.lte).toHaveBeenCalledWith('local_date', '2026-10-04');
    expect(result).toEqual(rows);
  });

  it('returns empty array when data is null', async () => {
    const builder = makeQueryBuilder({ data: null, error: null });
    const supabase = makeSupabaseFrom(builder);

    const result = await queryEnergyRows(supabase, 'user-1', '2026-09-28', '2026-10-04');
    expect(result).toEqual([]);
  });

  it('throws when supabase returns error', async () => {
    const builder = makeQueryBuilder({ data: null, error: { message: 'db error' } });
    const supabase = makeSupabaseFrom(builder);

    await expect(queryEnergyRows(supabase, 'user-1', '2026-09-28', '2026-10-04')).rejects.toMatchObject({ message: 'db error' });
  });
});
