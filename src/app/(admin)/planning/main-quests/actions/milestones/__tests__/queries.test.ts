// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';
import { makeQueryBuilder } from '@/test-utils/supabase-mock';
import {
  queryQuestById,
  queryMilestonesByQuestId,
  queryLastMilestoneOrder,
  insertMilestone,
  updateMilestoneTitle,
  updateMilestoneStatusField,
  deleteMilestoneById,
  updateMilestoneOrder,
} from '../queries';

const makeFrom = (builder: any) => ({ from: vi.fn().mockReturnValue(builder) } as any);

describe('queryQuestById', () => {
  it('returns data on success', async () => {
    const row = { id: 'q1', title: 'Quest' };
    const builder = makeQueryBuilder({ data: row, error: null });
    const supabase = makeFrom(builder);
    const result = await queryQuestById(supabase, 'q1');
    expect(result).toEqual(row);
    expect(builder.single).toHaveBeenCalled();
  });

  it('returns null on error', async () => {
    const builder = makeQueryBuilder({ data: null, error: { message: 'not found' } });
    const supabase = makeFrom(builder);
    const result = await queryQuestById(supabase, 'q1');
    expect(result).toBeNull();
  });
});

describe('queryMilestonesByQuestId', () => {
  it('returns milestones ordered by display_order', async () => {
    const rows = [{ id: 'm1', title: 'Milestone 1', display_order: 1, status: 'TODO' }];
    const builder = makeQueryBuilder({ data: rows, error: null });
    const supabase = makeFrom(builder);
    const result = await queryMilestonesByQuestId(supabase, 'q1');
    expect(result).toEqual(rows);
    expect(builder.eq).toHaveBeenCalledWith('quest_id', 'q1');
  });

  it('returns empty array on error', async () => {
    const builder = makeQueryBuilder({ data: null, error: { message: 'err' } });
    const supabase = makeFrom(builder);
    const result = await queryMilestonesByQuestId(supabase, 'q1');
    expect(result).toEqual([]);
  });
});

describe('queryLastMilestoneOrder', () => {
  it('returns display_order from last milestone', async () => {
    const builder = makeQueryBuilder({ data: { display_order: 3 }, error: null });
    const supabase = makeFrom(builder);
    const result = await queryLastMilestoneOrder(supabase, 'q1');
    expect(result).toBe(3);
  });

  it('returns undefined on error', async () => {
    const builder = makeQueryBuilder({ data: null, error: { message: 'no rows' } });
    const supabase = makeFrom(builder);
    const result = await queryLastMilestoneOrder(supabase, 'q1');
    expect(result).toBeUndefined();
  });
});

describe('insertMilestone', () => {
  it('inserts and returns milestone data', async () => {
    const row = { id: 'm1', title: 'Milestone', display_order: 1, status: 'TODO' };
    const builder = makeQueryBuilder({ data: row, error: null });
    const supabase = makeFrom(builder);
    const result = await insertMilestone(supabase, { quest_id: 'q1', title: 'Milestone', display_order: 1, status: 'TODO' });
    expect(result).toEqual(row);
    expect(builder.insert).toHaveBeenCalled();
  });

  it('throws on error', async () => {
    const builder = makeQueryBuilder({ data: null, error: { message: 'fail' } });
    const supabase = makeFrom(builder);
    await expect(insertMilestone(supabase, { quest_id: 'q1', title: 'M', display_order: 1, status: 'TODO' })).rejects.toThrow('Gagal menambah milestone');
  });
});

describe('updateMilestoneTitle', () => {
  it('updates title field', async () => {
    const builder = makeQueryBuilder({ data: null, error: null });
    const supabase = makeFrom(builder);
    await updateMilestoneTitle(supabase, 'm1', 'New Title');
    expect(builder.update).toHaveBeenCalledWith({ title: 'New Title' });
    expect(builder.eq).toHaveBeenCalledWith('id', 'm1');
  });

  it('throws on error', async () => {
    const builder = makeQueryBuilder({ data: null, error: { message: 'update fail' } });
    const supabase = makeFrom(builder);
    await expect(updateMilestoneTitle(supabase, 'm1', 'T')).rejects.toThrow('Gagal update milestone');
  });
});

describe('updateMilestoneStatusField', () => {
  it('updates status field', async () => {
    const builder = makeQueryBuilder({ data: null, error: null });
    const supabase = makeFrom(builder);
    await updateMilestoneStatusField(supabase, 'm1', 'DONE');
    expect(builder.update).toHaveBeenCalledWith({ status: 'DONE' });
  });
});

describe('deleteMilestoneById', () => {
  it('deletes milestone by id', async () => {
    const builder = makeQueryBuilder({ data: null, error: null });
    const supabase = makeFrom(builder);
    await deleteMilestoneById(supabase, 'm1');
    expect(builder.delete).toHaveBeenCalled();
    expect(builder.eq).toHaveBeenCalledWith('id', 'm1');
  });

  it('throws on error', async () => {
    const builder = makeQueryBuilder({ data: null, error: { message: 'delete fail' } });
    const supabase = makeFrom(builder);
    await expect(deleteMilestoneById(supabase, 'm1')).rejects.toThrow('Gagal hapus milestone');
  });
});

describe('updateMilestoneOrder', () => {
  it('updates display_order field', async () => {
    const builder = makeQueryBuilder({ data: null, error: null });
    const supabase = makeFrom(builder);
    await updateMilestoneOrder(supabase, 'm1', 5);
    expect(builder.update).toHaveBeenCalledWith({ display_order: 5 });
    expect(builder.eq).toHaveBeenCalledWith('id', 'm1');
  });
});
