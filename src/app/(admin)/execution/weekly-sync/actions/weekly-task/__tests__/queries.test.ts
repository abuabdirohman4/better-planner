// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';
import { makeQueryBuilder, makeSupabase } from '@/test-utils/supabase-mock';
import { queryTaskTitlesByIds, rpcUpdateTaskStatus, updateWeeklyGoalItemsStatus } from '../queries';

describe('queryTaskTitlesByIds', () => {
  it('returns empty array for empty taskIds', async () => {
    const supabase = makeSupabase();
    const result = await queryTaskTitlesByIds(supabase, []);
    expect(result).toEqual([]);
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('returns tasks on success', async () => {
    const tasks = [
      { id: 'task-1', title: 'Task One' },
      { id: 'task-2', title: 'Task Two' },
    ];
    const b = makeQueryBuilder({ data: tasks, error: null });
    const supabase = makeSupabase({ fromBuilder: b });
    const result = await queryTaskTitlesByIds(supabase, ['task-1', 'task-2']);
    expect(result).toEqual(tasks);
    expect(supabase.from).toHaveBeenCalledWith('tasks');
  });

  it('throws on DB error', async () => {
    const b = makeQueryBuilder({ data: null, error: { message: 'query fail' } });
    const supabase = makeSupabase({ fromBuilder: b });
    await expect(queryTaskTitlesByIds(supabase, ['task-1'])).rejects.toMatchObject({
      message: 'query fail',
    });
  });
});

describe('rpcUpdateTaskStatus', () => {
  it('calls rpc with correct params and returns data', async () => {
    const supabase = makeSupabase();
    (supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({ data: 'ok', error: null });
    const result = await rpcUpdateTaskStatus(supabase, 'task-1', 'DONE', 'user-1', 2, '2026-03-20');
    expect(supabase.rpc).toHaveBeenCalledWith('update_task_and_daily_plan_status', {
      p_task_id: 'task-1',
      p_status: 'DONE',
      p_user_id: 'user-1',
      p_goal_slot: 2,
      p_date: '2026-03-20',
      p_daily_plan_item_id: null,
    });
    expect(result).toBe('ok');
  });

  it('throws on RPC error', async () => {
    const supabase = makeSupabase();
    (supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: null,
      error: { message: 'rpc fail' },
    });
    await expect(
      rpcUpdateTaskStatus(supabase, 'task-1', 'DONE', 'user-1', 2, '2026-03-20')
    ).rejects.toMatchObject({ message: 'rpc fail' });
  });
});

describe('updateWeeklyGoalItemsStatus', () => {
  it('calls update on weekly_goal_items', async () => {
    const b = makeQueryBuilder({ data: null, error: null });
    const supabase = makeSupabase({ fromBuilder: b });
    await updateWeeklyGoalItemsStatus(supabase, 'task-1', 'DONE');
    expect(supabase.from).toHaveBeenCalledWith('weekly_goal_items');
    expect(b.update).toHaveBeenCalledWith({ status: 'DONE' });
  });

  it('does not throw on error (only warns)', async () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const b = makeQueryBuilder({ data: null, error: { message: 'warn error' } });
    const supabase = makeSupabase({ fromBuilder: b });
    await expect(updateWeeklyGoalItemsStatus(supabase, 'task-1', 'DONE')).resolves.toBeUndefined();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
