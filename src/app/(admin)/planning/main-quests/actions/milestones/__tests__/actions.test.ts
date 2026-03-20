// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';
import { makeQueryBuilder, makeSupabase } from '@/test-utils/supabase-mock';

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }));

import { createClient } from '@/lib/supabase/server';
import {
  getMilestonesForQuest,
  deleteMilestone,
  updateMilestone,
  updateMilestoneStatus,
  updateMilestoneDisplayOrder,
} from '../actions';

describe('getMilestonesForQuest', () => {
  it('returns empty array when quest not found', async () => {
    const builder = makeQueryBuilder({ data: null, error: { message: 'not found' } });
    (createClient as any).mockResolvedValue(makeSupabase({ fromBuilder: builder }));
    const result = await getMilestonesForQuest('q-invalid');
    expect(result).toEqual([]);
  });

  it('returns milestones when quest exists', async () => {
    const questRow = { id: 'q1', title: 'Quest' };
    const milestonesRows = [{ id: 'm1', title: 'M1', display_order: 1, status: 'TODO' }];
    // Need separate builders for quest vs milestones queries
    const questBuilder = makeQueryBuilder({ data: questRow, error: null });
    const milestoneBuilder = makeQueryBuilder({ data: milestonesRows, error: null });
    let callCount = 0;
    const supabase = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
      from: vi.fn().mockImplementation(() => {
        return callCount++ === 0 ? questBuilder : milestoneBuilder;
      }),
    } as any;
    (createClient as any).mockResolvedValue(supabase);
    const result = await getMilestonesForQuest('q1');
    expect(result).toEqual(milestonesRows);
  });
});

describe('deleteMilestone', () => {
  it('returns success message on delete', async () => {
    const builder = makeQueryBuilder({ data: null, error: null });
    (createClient as any).mockResolvedValue(makeSupabase({ fromBuilder: builder }));
    const result = await deleteMilestone('m1');
    expect(result.message).toContain('berhasil');
  });

  it('throws on db error', async () => {
    const builder = makeQueryBuilder({ data: null, error: { message: 'delete fail' } });
    (createClient as any).mockResolvedValue(makeSupabase({ fromBuilder: builder }));
    await expect(deleteMilestone('m1')).rejects.toThrow('Gagal hapus milestone');
  });
});

describe('updateMilestone', () => {
  it('returns success message on update', async () => {
    const builder = makeQueryBuilder({ data: null, error: null });
    (createClient as any).mockResolvedValue(makeSupabase({ fromBuilder: builder }));
    const result = await updateMilestone('m1', 'New Title');
    expect(result.message).toContain('berhasil');
  });
});

describe('updateMilestoneStatus', () => {
  it('returns success message', async () => {
    const builder = makeQueryBuilder({ data: null, error: null });
    (createClient as any).mockResolvedValue(makeSupabase({ fromBuilder: builder }));
    const result = await updateMilestoneStatus('m1', 'DONE');
    expect(result.message).toContain('berhasil');
  });
});

describe('updateMilestoneDisplayOrder', () => {
  it('returns success message', async () => {
    const builder = makeQueryBuilder({ data: null, error: null });
    (createClient as any).mockResolvedValue(makeSupabase({ fromBuilder: builder }));
    const result = await updateMilestoneDisplayOrder('m1', 2);
    expect(result.message).toContain('berhasil');
  });
});
