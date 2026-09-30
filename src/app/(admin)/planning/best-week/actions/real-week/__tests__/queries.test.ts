// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';
import { makeQueryBuilder } from '@/test-utils/supabase-mock';
import { queryWeekSchedules } from '../queries';

const makeSupabaseFrom = (builder: any) => ({ from: vi.fn().mockReturnValue(builder) } as any);

describe('queryWeekSchedules', () => {
  it('filter user lewat daily_plans dan rentang start_time', async () => {
    const rows = [{ id: 's1', scheduled_start_time: 'a', scheduled_end_time: 'b', daily_plan_items: { item_id: 't1' } }];
    const builder = makeQueryBuilder({ data: rows, error: null });
    const supabase = makeSupabaseFrom(builder);

    const result = await queryWeekSchedules(supabase, 'user-1', 'S', 'E');

    expect(supabase.from).toHaveBeenCalledWith('task_schedules');
    expect(builder.eq).toHaveBeenCalledWith('daily_plan_items.daily_plans.user_id', 'user-1');
    expect(builder.gte).toHaveBeenCalledWith('scheduled_start_time', 'S');
    expect(builder.lte).toHaveBeenCalledWith('scheduled_start_time', 'E');
    expect(result).toEqual(rows);
  });

  it('lempar error dari Supabase', async () => {
    const builder = makeQueryBuilder({ data: null, error: { message: 'boom' } });
    await expect(queryWeekSchedules(makeSupabaseFrom(builder), 'u', 'S', 'E')).rejects.toEqual({ message: 'boom' });
  });
});
