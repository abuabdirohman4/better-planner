// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';
import { makeQueryBuilder } from '@/test-utils/supabase-mock';
import {
  updateExistingQuest,
  insertNewQuests,
  deleteEmptyQuests,
  updateQuestWithScore,
  upsertPairwiseResults,
  queryQuestsForQuarter,
  queryPairwiseResults,
} from '../queries';

const makeFrom = (builder: any) => ({ from: vi.fn().mockReturnValue(builder) } as any);

describe('updateExistingQuest', () => {
  it('updates quest with correct eq filters', async () => {
    const builder = makeQueryBuilder({ data: null, error: null });
    const supabase = makeFrom(builder);
    await updateExistingQuest(supabase, 'q1', 'u1', { title: 'T', updated_at: '2026-01-01' });
    expect(builder.update).toHaveBeenCalledWith(expect.objectContaining({ title: 'T' }));
    expect(builder.eq).toHaveBeenCalledWith('id', 'q1');
    expect(builder.eq).toHaveBeenCalledWith('user_id', 'u1');
  });

  it('throws on error', async () => {
    const builder = makeQueryBuilder({ data: null, error: { message: 'update fail' } });
    const supabase = makeFrom(builder);
    await expect(updateExistingQuest(supabase, 'q1', 'u1', { title: 'T', updated_at: '2026-01-01' })).rejects.toMatchObject({ message: 'update fail' });
  });
});

describe('insertNewQuests', () => {
  it('inserts and returns data', async () => {
    const rows = [{ id: 'q1', title: 'Quest', label: 'A' }];
    const builder = makeQueryBuilder({ data: rows, error: null });
    const supabase = makeFrom(builder);
    const result = await insertNewQuests(supabase, [{ title: 'Quest', label: 'A', type: 'PERSONAL', year: 2026, quarter: 1, user_id: 'u1', created_at: '', updated_at: '' }]);
    expect(result).toEqual(rows);
  });

  it('throws on error', async () => {
    const builder = makeQueryBuilder({ data: null, error: { message: 'insert fail' } });
    const supabase = makeFrom(builder);
    await expect(insertNewQuests(supabase, [])).rejects.toMatchObject({ message: 'insert fail' });
  });
});

describe('deleteEmptyQuests', () => {
  it('deletes quests by ids and user_id', async () => {
    const builder = makeQueryBuilder({ data: null, error: null });
    const supabase = makeFrom(builder);
    await deleteEmptyQuests(supabase, ['q1', 'q2'], 'u1');
    expect(builder.delete).toHaveBeenCalled();
    expect(builder.in).toHaveBeenCalledWith('id', ['q1', 'q2']);
    expect(builder.eq).toHaveBeenCalledWith('user_id', 'u1');
  });

  it('throws on error', async () => {
    const builder = makeQueryBuilder({ data: null, error: { message: 'delete fail' } });
    const supabase = makeFrom(builder);
    await expect(deleteEmptyQuests(supabase, ['q1'], 'u1')).rejects.toMatchObject({ message: 'delete fail' });
  });
});

describe('updateQuestWithScore', () => {
  it('updates priority_score and is_committed', async () => {
    const builder = makeQueryBuilder({ data: null, error: null });
    const supabase = makeFrom(builder);
    await updateQuestWithScore(supabase, 'q1', 'u1', 7, true);
    expect(builder.update).toHaveBeenCalledWith(expect.objectContaining({ priority_score: 7, is_committed: true }));
  });

  it('throws on error', async () => {
    const builder = makeQueryBuilder({ data: null, error: { message: 'score fail' } });
    const supabase = makeFrom(builder);
    await expect(updateQuestWithScore(supabase, 'q1', 'u1', 7, true)).rejects.toMatchObject({ message: 'score fail' });
  });
});

describe('upsertPairwiseResults', () => {
  it('upserts with correct payload', async () => {
    const builder = makeQueryBuilder({ data: null, error: null });
    const supabase = makeFrom(builder);
    await upsertPairwiseResults(supabase, 'u1', 2026, 1, { 'a-b': 'a' });
    expect(builder.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: 'u1', year: 2026, quarter: 1 }),
      expect.any(Object)
    );
  });

  it('throws on error', async () => {
    const builder = makeQueryBuilder({ data: null, error: { message: 'upsert fail' } });
    const supabase = makeFrom(builder);
    await expect(upsertPairwiseResults(supabase, 'u1', 2026, 1, {})).rejects.toMatchObject({ message: 'upsert fail' });
  });
});

describe('queryQuestsForQuarter', () => {
  it('returns quests for user and quarter', async () => {
    const rows = [{ id: 'q1', title: 'Quest', label: 'A' }];
    const builder = makeQueryBuilder({ data: rows, error: null });
    const supabase = makeFrom(builder);
    const result = await queryQuestsForQuarter(supabase, 'u1', 2026, 1);
    expect(result).toEqual(rows);
    expect(builder.eq).toHaveBeenCalledWith('user_id', 'u1');
  });

  it('throws on error', async () => {
    const builder = makeQueryBuilder({ data: null, error: { message: 'query fail' } });
    const supabase = makeFrom(builder);
    await expect(queryQuestsForQuarter(supabase, 'u1', 2026, 1)).rejects.toMatchObject({ message: 'query fail' });
  });
});

describe('queryPairwiseResults', () => {
  it('returns results_json on success', async () => {
    const builder = makeQueryBuilder({ data: { results_json: { 'a-b': 'a' } }, error: null });
    const supabase = makeFrom(builder);
    const result = await queryPairwiseResults(supabase, 'u1', 2026, 1);
    expect(result).toEqual({ 'a-b': 'a' });
  });

  it('returns empty object when PGRST116 (no rows)', async () => {
    const builder = makeQueryBuilder({ data: null, error: { code: 'PGRST116', message: 'no rows' } });
    const supabase = makeFrom(builder);
    const result = await queryPairwiseResults(supabase, 'u1', 2026, 1);
    expect(result).toEqual({});
  });

  it('throws on non-PGRST116 error', async () => {
    const builder = makeQueryBuilder({ data: null, error: { code: 'OTHER', message: 'db error' } });
    const supabase = makeFrom(builder);
    await expect(queryPairwiseResults(supabase, 'u1', 2026, 1)).rejects.toMatchObject({ message: 'db error' });
  });
});
