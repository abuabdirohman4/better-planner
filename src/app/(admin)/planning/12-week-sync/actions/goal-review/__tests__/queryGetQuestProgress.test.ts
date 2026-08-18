// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';
import { makeQueryBuilder } from '@/test-utils/supabase-mock';
import { queryGetQuestProgress } from '../queryGetQuestProgress';

const makeFrom = (builder: any) => ({ from: vi.fn().mockReturnValue(builder) } as any);

describe('queryGetQuestProgress', () => {
  it('returns 0 when questId is null', async () => {
    const supabase = makeFrom(makeQueryBuilder({ data: [], error: null }));
    const result = await queryGetQuestProgress(supabase, null);
    expect(result.overallProgress).toBe(0);
  });

  it('calculates average progress from milestones, tasks, and subtasks', async () => {
    // Query 1: milestones (1/2 DONE = 50%). Query 2: flat tasks; parent_task_id null = task (1/2 = 50%),
    // non-null = subtask (1/3 = 33%). Average = 44.
    const milestones = [{ id: 'm1', status: 'DONE' }, { id: 'm2', status: 'TODO' }];
    const tasks = [
      { id: 't1', status: 'DONE', parent_task_id: null },
      { id: 't2', status: 'TODO', parent_task_id: null },
      { id: 's1', status: 'DONE', parent_task_id: 't1' },
      { id: 's2', status: 'TODO', parent_task_id: 't1' },
      { id: 's3', status: 'TODO', parent_task_id: 't2' },
    ];
    const mBuilder = makeQueryBuilder({ data: milestones, error: null });
    const tBuilder = makeQueryBuilder({ data: tasks, error: null });
    const supabase = { from: vi.fn().mockReturnValueOnce(mBuilder).mockReturnValueOnce(tBuilder) } as any;

    const result = await queryGetQuestProgress(supabase, 'q1');
    expect(result.overallProgress).toBe(44);
    expect(mBuilder.eq).toHaveBeenCalledWith('quest_id', 'q1');
    expect(tBuilder.in).toHaveBeenCalledWith('milestone_id', ['m1', 'm2']);
  });

  it('handles empty milestones', async () => {
    const builder = makeQueryBuilder({ data: [], error: null });
    const supabase = makeFrom(builder);

    const result = await queryGetQuestProgress(supabase, 'q2');
    expect(result.overallProgress).toBe(0);
  });

  it('throws on error', async () => {
    const builder = makeQueryBuilder({ data: null, error: { message: 'fetch error' } });
    const supabase = makeFrom(builder);

    await expect(queryGetQuestProgress(supabase, 'q3')).rejects.toMatchObject({ message: 'fetch error' });
  });
});
