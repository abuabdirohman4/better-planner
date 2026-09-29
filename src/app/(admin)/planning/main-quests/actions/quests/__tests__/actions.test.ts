// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { makeQueryBuilder, makeSupabase } from '@/test-utils/supabase-mock';

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }));

import { createClient } from '@/lib/supabase/server';
import {
  addMultipleQuests,
  getAllQuestsForQuarter,
  getQuests,
  getUncommittedQuests,
  updateQuestMotivation,
  updateQuestWeeklyTarget,
} from '../actions';

describe('addMultipleQuests', () => {
  it('throws when user not found', async () => {
    (createClient as any).mockResolvedValue(makeSupabase({ user: null }));
    await expect(addMultipleQuests([{ title: 'T', label: 'A' }], 2026, 1)).rejects.toThrow('User not found');
  });

  it('returns quests and message on success', async () => {
    const rows = [{ id: 'q1', title: 'T', label: 'A' }];
    const builder = makeQueryBuilder({ data: rows, error: null });
    (createClient as any).mockResolvedValue(makeSupabase({ fromBuilder: builder }));
    const result = await addMultipleQuests([{ title: 'T', label: 'A' }], 2026, 1);
    expect(result.quests).toEqual(rows);
    expect(result.message).toContain('berhasil');
  });
});

describe('getAllQuestsForQuarter', () => {
  it('returns empty array when no user', async () => {
    (createClient as any).mockResolvedValue(makeSupabase({ user: null }));
    const result = await getAllQuestsForQuarter(2026, 1);
    expect(result).toEqual([]);
  });

  it('returns quests when user authenticated', async () => {
    const rows = [{ id: 'q1', title: 'Quest', label: 'A' }];
    const builder = makeQueryBuilder({ data: rows, error: null });
    (createClient as any).mockResolvedValue(makeSupabase({ fromBuilder: builder }));
    const result = await getAllQuestsForQuarter(2026, 1);
    expect(result).toEqual(rows);
  });
});

describe('getQuests', () => {
  it('returns empty array when no user', async () => {
    (createClient as any).mockResolvedValue(makeSupabase({ user: null }));
    const result = await getQuests(2026, 1);
    expect(result).toEqual([]);
  });
});

describe('getUncommittedQuests', () => {
  it('returns empty array when no user', async () => {
    (createClient as any).mockResolvedValue(makeSupabase({ user: null }));
    const result = await getUncommittedQuests(2026, 1);
    expect(result).toEqual([]);
  });
});

describe('updateQuestMotivation', () => {
  it('throws on db error', async () => {
    const builder = makeQueryBuilder({ data: null, error: { message: 'motive fail' } });
    (createClient as any).mockResolvedValue(makeSupabase({ fromBuilder: builder }));
    await expect(updateQuestMotivation('q1', 'text')).rejects.toMatchObject({ message: 'motive fail' });
  });

  it('returns success message', async () => {
    const builder = makeQueryBuilder({ data: null, error: null });
    (createClient as any).mockResolvedValue(makeSupabase({ fromBuilder: builder }));
    const result = await updateQuestMotivation('q1', 'my motivation');
    expect(result.message).toContain('berhasil');
  });
});

describe('updateQuestWeeklyTarget', () => {
  it('menolak angka di luar 0 < jam <= 168', async () => {
    await expect(updateQuestWeeklyTarget('q1', 0)).rejects.toThrow('Jatah jam harus antara 0 dan 168');
    await expect(updateQuestWeeklyTarget('q1', 200)).rejects.toThrow('Jatah jam harus antara 0 dan 168');
  });

  it('menyimpan angka valid', async () => {
    const builder = makeQueryBuilder({ data: null, error: null });
    (createClient as any).mockResolvedValue(makeSupabase({ fromBuilder: builder }));
    await updateQuestWeeklyTarget('q1', 10);
    expect(builder.update).toHaveBeenCalledWith({ weekly_target_hours: 10 });
    expect(builder.eq).toHaveBeenCalledWith('id', 'q1');
  });

  it('null mengosongkan jatah', async () => {
    const builder = makeQueryBuilder({ data: null, error: null });
    (createClient as any).mockResolvedValue(makeSupabase({ fromBuilder: builder }));
    await updateQuestWeeklyTarget('q1', null);
    expect(builder.update).toHaveBeenCalledWith({ weekly_target_hours: null });
  });
});
