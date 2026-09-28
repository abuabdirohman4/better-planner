// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';
import { makeQueryBuilder, makeSupabase } from '@/test-utils/supabase-mock';

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }));
vi.mock('@/lib/quarterUtils', () => ({
  getQuarterDates: vi.fn().mockReturnValue({
    startDate: new Date('2026-01-01'),
    endDate: new Date('2026-03-31'),
  }),
  createdAtForQuarter: vi.fn().mockReturnValue('2026-01-05T00:00:00.000Z'),
}));

import { createClient } from '@/lib/supabase/server';
import { getSideQuests, updateSideQuestStatus, updateSideQuest, deleteSideQuest, createSideQuest } from '../actions';

describe('getSideQuests', () => {
  it('returns empty array when user not authenticated', async () => {
    (createClient as any).mockResolvedValue(makeSupabase({ user: null }));
    const result = await getSideQuests(2026, 1);
    expect(result).toEqual([]);
  });

  it('returns side quests when authenticated', async () => {
    const rows = [{ id: 't1', title: 'Side Quest', type: 'SIDE_QUEST' }];
    const builder = makeQueryBuilder({ data: rows, error: null });
    (createClient as any).mockResolvedValue(makeSupabase({ fromBuilder: builder }));
    const result = await getSideQuests(2026, 1);
    expect(result).toEqual(rows);
  });
});

describe('updateSideQuestStatus', () => {
  it('throws when user not authenticated', async () => {
    (createClient as any).mockResolvedValue(makeSupabase({ user: null }));
    await expect(updateSideQuestStatus('t1', 'DONE')).rejects.toThrow('User not authenticated');
  });

  it('succeeds when authenticated', async () => {
    const builder = makeQueryBuilder({ data: null, error: null });
    (createClient as any).mockResolvedValue(makeSupabase({ fromBuilder: builder }));
    await expect(updateSideQuestStatus('t1', 'IN_PROGRESS')).resolves.toBeUndefined();
  });
});

describe('updateSideQuest', () => {
  it('throws when user not authenticated', async () => {
    (createClient as any).mockResolvedValue(makeSupabase({ user: null }));
    await expect(updateSideQuest('t1', { title: 'New' })).rejects.toThrow('User not authenticated');
  });

  it('succeeds when authenticated', async () => {
    const builder = makeQueryBuilder({ data: null, error: null });
    (createClient as any).mockResolvedValue(makeSupabase({ fromBuilder: builder }));
    await expect(updateSideQuest('t1', { title: 'New', description: 'Desc' })).resolves.toBeUndefined();
  });
});

describe('deleteSideQuest', () => {
  it('throws when user not authenticated', async () => {
    (createClient as any).mockResolvedValue(makeSupabase({ user: null }));
    await expect(deleteSideQuest('t1')).rejects.toThrow('User not authenticated');
  });

  it('executes cascade delete steps', async () => {
    // sessions query returns empty so timer events delete is skipped
    const builder = makeQueryBuilder({ data: [], error: null });
    (createClient as any).mockResolvedValue(makeSupabase({ fromBuilder: builder }));
    await expect(deleteSideQuest('t1')).resolves.toBeUndefined();
  });
});

describe('createSideQuest', () => {
  it('throws when title is empty', async () => {
    await expect(createSideQuest('', 2026, 1)).rejects.toThrow('Title is required');
    await expect(createSideQuest('   ', 2026, 1)).rejects.toThrow('Title is required');
  });

  it('throws when user not authenticated', async () => {
    (createClient as any).mockResolvedValue(makeSupabase({ user: null }));
    await expect(createSideQuest('Test Quest', 2026, 1)).rejects.toThrow('User not authenticated');
  });

  it('inserts side quest with correct fields and returns it', async () => {
    const createdTask = {
      id: 'task-new',
      user_id: 'user-1',
      title: 'New Side Quest',
      type: 'SIDE_QUEST',
      status: 'TODO',
      milestone_id: null,
      created_at: '2026-01-05T00:00:00.000Z',
    };
    const builder = makeQueryBuilder({ data: createdTask, error: null });
    (createClient as any).mockResolvedValue(makeSupabase({ user: { id: 'user-1' }, fromBuilder: builder }));

    const result = await createSideQuest('  New Side Quest  ', 2026, 1);
    expect(result).toEqual(createdTask);
    expect(builder.insert).toHaveBeenCalledWith({
      user_id: 'user-1',
      title: 'New Side Quest',
      type: 'SIDE_QUEST',
      status: 'TODO',
      milestone_id: null,
      created_at: '2026-01-05T00:00:00.000Z',
    });
  });
});
