// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';
import { makeQueryBuilder, makeSupabase } from '@/test-utils/supabase-mock';

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }));
vi.mock('@/lib/errorUtils', () => ({ handleApiError: vi.fn().mockReturnValue({ message: 'Error handled' }) }));

import { createClient } from '@/lib/supabase/server';
import { saveQuests, finalizeQuests, getAllQuestsForQuarter, getPairwiseResults } from '../actions';

describe('saveQuests', () => {
  it('returns failure when user not authenticated', async () => {
    (createClient as any).mockResolvedValue(makeSupabase({ user: null }));
    const result = await saveQuests([], 2026, 1);
    expect(result.success).toBe(false);
  });

  it('returns success with no quests to process', async () => {
    (createClient as any).mockResolvedValue(makeSupabase({ fromBuilder: makeQueryBuilder({ data: [], error: null }) }));
    const result = await saveQuests([], 2026, 1);
    expect(result.success).toBe(true);
    expect(result.insertedQuests).toEqual([]);
  });
});

describe('finalizeQuests', () => {
  it('returns failure when user not authenticated', async () => {
    (createClient as any).mockResolvedValue(makeSupabase({ user: null }));
    const result = await finalizeQuests({}, [], 2026, 1);
    expect(result.success).toBe(false);
  });

  it('processes quests and returns success', async () => {
    const builder = makeQueryBuilder({ data: null, error: null });
    (createClient as any).mockResolvedValue(makeSupabase({ fromBuilder: builder }));
    const result = await finalizeQuests(
      { 'q1-q2': 'q1' },
      [{ id: 'q1', title: 'Quest A', priority_score: 9 }, { id: 'q2', title: 'Quest B', priority_score: 5 }],
      2026, 1
    );
    expect(result.success).toBe(true);
    expect(result.message).toContain('Quest A');
  });
});

describe('getAllQuestsForQuarter', () => {
  it('returns empty array when user not authenticated', async () => {
    (createClient as any).mockResolvedValue(makeSupabase({ user: null }));
    const result = await getAllQuestsForQuarter(2026, 1);
    expect(result).toEqual([]);
  });

  it('returns quests when authenticated', async () => {
    const rows = [{ id: 'q1', title: 'Quest', label: 'A' }];
    const builder = makeQueryBuilder({ data: rows, error: null });
    (createClient as any).mockResolvedValue(makeSupabase({ fromBuilder: builder }));
    const result = await getAllQuestsForQuarter(2026, 1);
    expect(result).toEqual(rows);
  });
});

describe('getPairwiseResults', () => {
  it('returns empty object when user not authenticated', async () => {
    (createClient as any).mockResolvedValue(makeSupabase({ user: null }));
    const result = await getPairwiseResults(2026, 1);
    expect(result).toEqual({});
  });

  it('returns results when found', async () => {
    const builder = makeQueryBuilder({ data: { results_json: { 'a-b': 'a' } }, error: null });
    (createClient as any).mockResolvedValue(makeSupabase({ fromBuilder: builder }));
    const result = await getPairwiseResults(2026, 1);
    expect(result).toEqual({ 'a-b': 'a' });
  });
});
