// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';
import { makeQueryBuilder, makeSupabase } from '@/test-utils/supabase-mock';

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }));

import { createClient } from '@/lib/supabase/server';
import { getSubtasksForTask } from '../actions';

describe('getSubtasksForTask', () => {
  it('returns subtasks for a given parent_task_id', async () => {
    const rows = [{ id: 's1', title: 'Subtask', status: 'TODO', display_order: 1, parent_task_id: 'p1', milestone_id: null, created_at: '2026-01-01' }];
    const builder = makeQueryBuilder({ data: rows, error: null });
    (createClient as any).mockResolvedValue(makeSupabase({ fromBuilder: builder }));
    const result = await getSubtasksForTask('p1');
    expect(result).toEqual(rows);
  });

  it('returns empty array on db error', async () => {
    const builder = makeQueryBuilder({ data: null, error: { message: 'err' } });
    (createClient as any).mockResolvedValue(makeSupabase({ fromBuilder: builder }));
    const result = await getSubtasksForTask('p1');
    expect(result).toEqual([]);
  });
});
