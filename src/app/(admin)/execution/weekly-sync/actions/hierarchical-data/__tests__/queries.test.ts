// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';
import { makeQueryBuilder, makeSupabase } from '@/test-utils/supabase-mock';
import {
  queryCommittedQuests,
  querySelectedTaskIds,
  queryMilestonesByQuestIds,
  queryParentTasksByMilestoneIds,
  querySubtasksByParentIds,
} from '../queries';

describe('queryCommittedQuests', () => {
  it('returns quests on success', async () => {
    const quests = [{ id: 'q1', title: 'Quest 1' }];
    const b = makeQueryBuilder({ data: quests, error: null });
    const supabase = makeSupabase({ fromBuilder: b });
    const result = await queryCommittedQuests(supabase, 'user-1', 2026, 1);
    expect(result).toEqual(quests);
    expect(supabase.from).toHaveBeenCalledWith('quests');
  });

  it('throws on DB error', async () => {
    const b = makeQueryBuilder({ data: null, error: { message: 'DB error' } });
    const supabase = makeSupabase({ fromBuilder: b });
    await expect(queryCommittedQuests(supabase, 'user-1', 2026, 1)).rejects.toMatchObject({
      message: 'DB error',
    });
  });

  it('returns empty array when data is null', async () => {
    const b = makeQueryBuilder({ data: null, error: null });
    const supabase = makeSupabase({ fromBuilder: b });
    const result = await queryCommittedQuests(supabase, 'user-1', 2026, 1);
    expect(result).toEqual([]);
  });
});

describe('querySelectedTaskIds', () => {
  it('returns task IDs from weekly_goal_items', async () => {
    const raw = [{ item_id: 'task-1' }, { item_id: 'task-2' }];
    const b = makeQueryBuilder({ data: raw, error: null });
    const supabase = makeSupabase({ fromBuilder: b });
    const result = await querySelectedTaskIds(supabase, 2026, 1);
    expect(result).toEqual(['task-1', 'task-2']);
  });

  it('throws on DB error', async () => {
    const b = makeQueryBuilder({ data: null, error: { message: 'fail' } });
    const supabase = makeSupabase({ fromBuilder: b });
    await expect(querySelectedTaskIds(supabase, 2026, 1)).rejects.toMatchObject({ message: 'fail' });
  });
});

describe('queryMilestonesByQuestIds', () => {
  it('returns empty array for empty questIds', async () => {
    const supabase = makeSupabase();
    const result = await queryMilestonesByQuestIds(supabase, []);
    expect(result).toEqual([]);
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('returns milestones on success', async () => {
    const milestones = [{ id: 'm1', title: 'Milestone 1', quest_id: 'q1' }];
    const b = makeQueryBuilder({ data: milestones, error: null });
    const supabase = makeSupabase({ fromBuilder: b });
    const result = await queryMilestonesByQuestIds(supabase, ['q1']);
    expect(result).toEqual(milestones);
  });

  it('throws on DB error', async () => {
    const b = makeQueryBuilder({ data: null, error: { message: 'db fail' } });
    const supabase = makeSupabase({ fromBuilder: b });
    await expect(queryMilestonesByQuestIds(supabase, ['q1'])).rejects.toMatchObject({
      message: 'db fail',
    });
  });
});

describe('queryParentTasksByMilestoneIds', () => {
  it('returns empty array for empty milestoneIds', async () => {
    const supabase = makeSupabase();
    const result = await queryParentTasksByMilestoneIds(supabase, []);
    expect(result).toEqual([]);
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('returns tasks on success', async () => {
    const tasks = [{ id: 't1', title: 'Task 1', status: 'TODO', milestone_id: 'm1' }];
    const b = makeQueryBuilder({ data: tasks, error: null });
    const supabase = makeSupabase({ fromBuilder: b });
    const result = await queryParentTasksByMilestoneIds(supabase, ['m1']);
    expect(result).toEqual(tasks);
  });
});

describe('querySubtasksByParentIds', () => {
  it('returns empty array for empty parentTaskIds', async () => {
    const supabase = makeSupabase();
    const result = await querySubtasksByParentIds(supabase, []);
    expect(result).toEqual([]);
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('returns subtasks on success', async () => {
    const subtasks = [{ id: 's1', title: 'Sub 1', status: 'TODO', parent_task_id: 't1' }];
    const b = makeQueryBuilder({ data: subtasks, error: null });
    const supabase = makeSupabase({ fromBuilder: b });
    const result = await querySubtasksByParentIds(supabase, ['t1']);
    expect(result).toEqual(subtasks);
  });

  it('throws on DB error', async () => {
    const b = makeQueryBuilder({ data: null, error: { message: 'subtask fail' } });
    const supabase = makeSupabase({ fromBuilder: b });
    await expect(querySubtasksByParentIds(supabase, ['t1'])).rejects.toMatchObject({
      message: 'subtask fail',
    });
  });
});
