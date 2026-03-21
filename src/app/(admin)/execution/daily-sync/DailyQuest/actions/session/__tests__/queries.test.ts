// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';
import { makeQueryBuilder } from '@/test-utils/supabase-mock';
import { queryDailyPlanItem, countFocusSessions } from '../queries';

const makeSupabaseFrom = (builder: any) => ({ from: vi.fn().mockReturnValue(builder) } as any);

describe('queryDailyPlanItem', () => {
  it('returns item data on success', async () => {
    const item = { item_id: 'task-1' };
    const builder = makeQueryBuilder({ data: item, error: null });
    const supabase = makeSupabaseFrom(builder);

    const result = await queryDailyPlanItem(supabase, 'dpi-1');

    expect(supabase.from).toHaveBeenCalledWith('daily_plan_items');
    expect(builder.select).toHaveBeenCalledWith('item_id');
    expect(builder.eq).toHaveBeenCalledWith('id', 'dpi-1');
    expect(result).toEqual(item);
  });

  it('throws on error', async () => {
    const builder = makeQueryBuilder({ data: null, error: { message: 'not found' } });
    const supabase = makeSupabaseFrom(builder);

    await expect(queryDailyPlanItem(supabase, 'dpi-x')).rejects.toMatchObject({
      message: 'not found',
    });
  });
});

describe('countFocusSessions', () => {
  it('returns count when sessions exist', async () => {
    const builder = makeQueryBuilder({ count: 3, error: null } as any);
    const supabase = makeSupabaseFrom(builder);

    const result = await countFocusSessions(supabase, 'user-1', 'task-1', '2026-03-20');

    expect(supabase.from).toHaveBeenCalledWith('activity_logs');
    expect(builder.eq).toHaveBeenCalledWith('user_id', 'user-1');
    expect(builder.eq).toHaveBeenCalledWith('task_id', 'task-1');
    expect(builder.eq).toHaveBeenCalledWith('type', 'FOCUS');
    expect(builder.eq).toHaveBeenCalledWith('local_date', '2026-03-20');
    expect(result).toBe(3);
  });

  it('returns 0 when count is null', async () => {
    const builder = makeQueryBuilder({ count: null, error: null } as any);
    const supabase = makeSupabaseFrom(builder);

    const result = await countFocusSessions(supabase, 'user-1', 'task-1', '2026-03-20');

    expect(result).toBe(0);
  });

  it('throws on error', async () => {
    const builder = makeQueryBuilder({ count: null, error: { message: 'count fail' } } as any);
    const supabase = makeSupabaseFrom(builder);

    await expect(
      countFocusSessions(supabase, 'user-1', 'task-1', '2026-03-20')
    ).rejects.toMatchObject({ message: 'count fail' });
  });
});
