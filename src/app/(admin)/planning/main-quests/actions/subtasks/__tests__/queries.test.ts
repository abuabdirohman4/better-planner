// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';
import { makeQueryBuilder } from '@/test-utils/supabase-mock';
import { querySubtasksByParentId } from '../queries';

const makeFrom = (builder: any) => ({ from: vi.fn().mockReturnValue(builder) } as any);

describe('querySubtasksByParentId', () => {
  it('queries tasks with parent_task_id filter', async () => {
    const rows = [{ id: 's1', title: 'Sub', status: 'TODO', display_order: 1, parent_task_id: 'p1', milestone_id: null, created_at: '2026-01-01' }];
    const builder = makeQueryBuilder({ data: rows, error: null });
    const supabase = makeFrom(builder);
    const result = await querySubtasksByParentId(supabase, 'p1');
    expect(result).toEqual(rows);
    expect(builder.eq).toHaveBeenCalledWith('parent_task_id', 'p1');
  });

  it('returns empty array on error', async () => {
    const builder = makeQueryBuilder({ data: null, error: { message: 'db err' } });
    const supabase = makeFrom(builder);
    const result = await querySubtasksByParentId(supabase, 'p1');
    expect(result).toEqual([]);
  });
});
