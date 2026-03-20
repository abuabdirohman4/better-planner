// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';
import { makeQueryBuilder } from '@/test-utils/supabase-mock';
import {
  insertMultipleQuests,
  updateQuestTitleLabel,
  upsertPairwiseResults,
  updateQuestPriorityScore,
  commitTopQuests,
  queryAllQuestsForQuarter,
  queryPairwiseResults,
  queryCommittedQuests,
  queryUncommittedQuests,
  updateMotivation,
} from '../queries';

const makeFrom = (builder: any) => ({ from: vi.fn().mockReturnValue(builder) } as any);

describe('insertMultipleQuests', () => {
  it('inserts and returns data', async () => {
    const rows = [{ id: 'q1', title: 'Quest 1', label: 'A' }];
    const builder = makeQueryBuilder({ data: rows, error: null });
    const supabase = makeFrom(builder);
    const result = await insertMultipleQuests(supabase, [{ user_id: 'u1', title: 'Quest 1', label: 'A', year: 2026, quarter: 1, is_committed: false, type: 'PERSONAL' }]);
    expect(result).toEqual(rows);
    expect(builder.insert).toHaveBeenCalled();
  });

  it('throws on error', async () => {
    const builder = makeQueryBuilder({ data: null, error: { message: 'insert fail' } });
    const supabase = makeFrom(builder);
    await expect(insertMultipleQuests(supabase, [])).rejects.toMatchObject({ message: 'insert fail' });
  });
});

describe('updateQuestTitleLabel', () => {
  it('calls update with correct fields', async () => {
    const builder = makeQueryBuilder({ data: null, error: null });
    const supabase = makeFrom(builder);
    await updateQuestTitleLabel(supabase, 'q1', 'New Title', 'B');
    expect(builder.update).toHaveBeenCalledWith({ title: 'New Title', label: 'B' });
    expect(builder.eq).toHaveBeenCalledWith('id', 'q1');
  });

  it('throws on error', async () => {
    const builder = makeQueryBuilder({ data: null, error: { message: 'update fail' } });
    const supabase = makeFrom(builder);
    await expect(updateQuestTitleLabel(supabase, 'q1', 'T', 'L')).rejects.toMatchObject({ message: 'update fail' });
  });
});

describe('upsertPairwiseResults', () => {
  it('calls upsert with correct payload', async () => {
    const builder = makeQueryBuilder({ data: null, error: null });
    const supabase = makeFrom(builder);
    await upsertPairwiseResults(supabase, 'u1', 2026, 1, { 'q1-q2': 'q1' });
    expect(builder.upsert).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ user_id: 'u1', year: 2026, quarter: 1 })]),
      expect.any(Object)
    );
  });

  it('throws on error', async () => {
    const builder = makeQueryBuilder({ data: null, error: { message: 'upsert fail' } });
    const supabase = makeFrom(builder);
    await expect(upsertPairwiseResults(supabase, 'u1', 2026, 1, {})).rejects.toMatchObject({ message: 'upsert fail' });
  });
});

describe('updateQuestPriorityScore', () => {
  it('updates priority_score field', async () => {
    const builder = makeQueryBuilder({ data: null, error: null });
    const supabase = makeFrom(builder);
    await updateQuestPriorityScore(supabase, 'q1', 5);
    expect(builder.update).toHaveBeenCalledWith({ priority_score: 5 });
    expect(builder.eq).toHaveBeenCalledWith('id', 'q1');
  });

  it('throws on error', async () => {
    const builder = makeQueryBuilder({ data: null, error: { message: 'score fail' } });
    const supabase = makeFrom(builder);
    await expect(updateQuestPriorityScore(supabase, 'q1', 5)).rejects.toMatchObject({ message: 'score fail' });
  });
});

describe('commitTopQuests', () => {
  it('updates is_committed to true for quest ids', async () => {
    const builder = makeQueryBuilder({ data: null, error: null });
    const supabase = makeFrom(builder);
    await commitTopQuests(supabase, ['q1', 'q2']);
    expect(builder.update).toHaveBeenCalledWith({ is_committed: true });
    expect(builder.in).toHaveBeenCalledWith('id', ['q1', 'q2']);
  });

  it('throws on error', async () => {
    const builder = makeQueryBuilder({ data: null, error: { message: 'commit fail' } });
    const supabase = makeFrom(builder);
    await expect(commitTopQuests(supabase, ['q1'])).rejects.toMatchObject({ message: 'commit fail' });
  });
});

describe('queryAllQuestsForQuarter', () => {
  it('returns data for user+year+quarter', async () => {
    const rows = [{ id: 'q1', title: 'Q1' }];
    const builder = makeQueryBuilder({ data: rows, error: null });
    const supabase = makeFrom(builder);
    const result = await queryAllQuestsForQuarter(supabase, 'u1', 2026, 1);
    expect(result).toEqual(rows);
    expect(builder.eq).toHaveBeenCalledWith('user_id', 'u1');
  });

  it('returns empty array on error', async () => {
    const builder = makeQueryBuilder({ data: null, error: { message: 'db err' } });
    const supabase = makeFrom(builder);
    const result = await queryAllQuestsForQuarter(supabase, 'u1', 2026, 1);
    expect(result).toEqual([]);
  });
});

describe('queryPairwiseResults', () => {
  it('returns results_json on success', async () => {
    const builder = makeQueryBuilder({ data: { results_json: { 'a-b': 'a' } }, error: null });
    const supabase = makeFrom(builder);
    const result = await queryPairwiseResults(supabase, 'u1', 2026, 1);
    expect(result).toEqual({ 'a-b': 'a' });
  });

  it('returns null on error', async () => {
    const builder = makeQueryBuilder({ data: null, error: { message: 'not found' } });
    const supabase = makeFrom(builder);
    const result = await queryPairwiseResults(supabase, 'u1', 2026, 1);
    expect(result).toBeNull();
  });
});

describe('queryCommittedQuests', () => {
  it('queries with correct committed filter', async () => {
    const builder = makeQueryBuilder({ data: [], error: null });
    const supabase = makeFrom(builder);
    await queryCommittedQuests(supabase, 'u1', 2026, 1, true, 3);
    expect(builder.eq).toHaveBeenCalledWith('is_committed', true);
    expect(builder.limit).toHaveBeenCalledWith(3);
  });

  it('returns empty array on error', async () => {
    const builder = makeQueryBuilder({ data: null, error: { message: 'err' } });
    const supabase = makeFrom(builder);
    const result = await queryCommittedQuests(supabase, 'u1', 2026, 1, true, 3);
    expect(result).toEqual([]);
  });
});

describe('queryUncommittedQuests', () => {
  it('queries with is_committed false', async () => {
    const builder = makeQueryBuilder({ data: [], error: null });
    const supabase = makeFrom(builder);
    await queryUncommittedQuests(supabase, 'u1', 2026, 1);
    expect(builder.eq).toHaveBeenCalledWith('is_committed', false);
  });
});

describe('updateMotivation', () => {
  it('updates motivation field', async () => {
    const builder = makeQueryBuilder({ data: null, error: null });
    const supabase = makeFrom(builder);
    await updateMotivation(supabase, 'q1', 'my motivation');
    expect(builder.update).toHaveBeenCalledWith({ motivation: 'my motivation' });
    expect(builder.eq).toHaveBeenCalledWith('id', 'q1');
  });

  it('throws on error', async () => {
    const builder = makeQueryBuilder({ data: null, error: { message: 'motive fail' } });
    const supabase = makeFrom(builder);
    await expect(updateMotivation(supabase, 'q1', 'x')).rejects.toMatchObject({ message: 'motive fail' });
  });
});
