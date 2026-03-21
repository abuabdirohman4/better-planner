// @vitest-environment node
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }));
vi.mock('../queries', () => ({
  queryWeeklyGoals: vi.fn(),
  queryWeeklyGoalItems: vi.fn(),
  queryTasksByIds: vi.fn(),
  queryMilestonesByIds: vi.fn(),
  queryQuestsByIds: vi.fn(),
  queryCompletedPreviousDayItems: vi.fn(),
  queryTodayPlanItems: vi.fn(),
}));
vi.mock('../logic', () => ({
  combineItemsWithDetails: vi.fn(),
  deduplicateItems: vi.fn(),
  filterTodoItems: vi.fn(),
  getPreviousDaysInWeek: vi.fn(),
  filterOutCompletedPreviousDays: vi.fn(),
}));

import { createClient } from '@/lib/supabase/server';
import {
  queryWeeklyGoals,
  queryWeeklyGoalItems,
  queryTasksByIds,
  queryMilestonesByIds,
  queryQuestsByIds,
  queryCompletedPreviousDayItems,
  queryTodayPlanItems,
} from '../queries';
import {
  combineItemsWithDetails,
  deduplicateItems,
  filterTodoItems,
  getPreviousDaysInWeek,
  filterOutCompletedPreviousDays,
} from '../logic';
import { getTasksForWeek } from '../actions';
import { makeSupabase } from '@/test-utils/supabase-mock';

function mockCreateClient(user: { id: string } | null = { id: 'user-1' }) {
  vi.mocked(createClient).mockResolvedValue(makeSupabase({ user }) as any);
}

function setupDefaultMocks() {
  const weeklyGoals = [{ id: 'wg-1', goal_slot: 1 }];
  const goalItems = [{ id: 'wgi-1', weekly_goal_id: 'wg-1', item_id: 'task-1' }];
  const tasks = [{ id: 'task-1', title: 'Task One', status: 'TODO', milestone_id: null, type: 'WORK', parent_task_id: null }];
  const combined = [{ id: 'task-1', type: 'WORK', title: 'Task One', status: 'TODO', quest_title: '', goal_slot: 1, parent_task_id: null }];
  const deduped = [...combined];
  const filtered = [...combined];

  vi.mocked(queryWeeklyGoals).mockResolvedValue(weeklyGoals);
  vi.mocked(queryWeeklyGoalItems).mockResolvedValue(goalItems);
  vi.mocked(queryTasksByIds).mockResolvedValue(tasks as any);
  vi.mocked(queryMilestonesByIds).mockResolvedValue([]);
  vi.mocked(queryQuestsByIds).mockResolvedValue([]);
  vi.mocked(combineItemsWithDetails).mockReturnValue(combined as any);
  vi.mocked(deduplicateItems).mockReturnValue(deduped as any);
  vi.mocked(filterTodoItems).mockReturnValue(filtered as any);

  return { weeklyGoals, goalItems, tasks, combined, filtered };
}

beforeEach(() => vi.clearAllMocks());

describe('getTasksForWeek', () => {
  it('throws when user not authenticated', async () => {
    mockCreateClient(null);
    await expect(getTasksForWeek(2026, 12)).rejects.toThrow('not authenticated');
  });

  it('returns empty array when no weekly goals found', async () => {
    mockCreateClient();
    vi.mocked(queryWeeklyGoals).mockResolvedValue([]);

    const result = await getTasksForWeek(2026, 12);

    expect(result).toEqual([]);
    expect(queryWeeklyGoalItems).not.toHaveBeenCalled();
  });

  it('returns empty array when no weekly goal items found', async () => {
    mockCreateClient();
    vi.mocked(queryWeeklyGoals).mockResolvedValue([{ id: 'wg-1', goal_slot: 1 }]);
    vi.mocked(queryWeeklyGoalItems).mockResolvedValue([]);

    const result = await getTasksForWeek(2026, 12);

    expect(result).toEqual([]);
    expect(queryTasksByIds).not.toHaveBeenCalled();
  });

  it('calls all query and logic functions in correct order', async () => {
    mockCreateClient();
    const { filtered } = setupDefaultMocks();

    const result = await getTasksForWeek(2026, 12);

    expect(queryWeeklyGoals).toHaveBeenCalledWith(expect.anything(), 'user-1', 2026, 12);
    expect(queryWeeklyGoalItems).toHaveBeenCalledWith(expect.anything(), ['wg-1']);
    expect(queryTasksByIds).toHaveBeenCalledWith(expect.anything(), ['task-1']);
    expect(queryMilestonesByIds).toHaveBeenCalled();
    expect(queryQuestsByIds).toHaveBeenCalled();
    expect(combineItemsWithDetails).toHaveBeenCalled();
    expect(deduplicateItems).toHaveBeenCalled();
    expect(filterTodoItems).toHaveBeenCalled();
    expect(result).toEqual(filtered);
  });

  it('does NOT call previous-day queries when selectedDate is not provided', async () => {
    mockCreateClient();
    setupDefaultMocks();

    await getTasksForWeek(2026, 12);

    expect(queryCompletedPreviousDayItems).not.toHaveBeenCalled();
    expect(queryTodayPlanItems).not.toHaveBeenCalled();
    expect(getPreviousDaysInWeek).not.toHaveBeenCalled();
  });

  it('calls previous-day filtering when selectedDate is provided', async () => {
    mockCreateClient();
    const { filtered } = setupDefaultMocks();
    const previousDays = ['2026-03-16', '2026-03-17', '2026-03-18', '2026-03-19'];
    const completedRows = [{ item_id: 'task-1' }];
    const todayRows: { item_id: string }[] = [];

    vi.mocked(getPreviousDaysInWeek).mockReturnValue(previousDays);
    vi.mocked(queryCompletedPreviousDayItems).mockResolvedValue(completedRows);
    vi.mocked(queryTodayPlanItems).mockResolvedValue(todayRows);
    vi.mocked(filterOutCompletedPreviousDays).mockReturnValue(filtered as any);

    await getTasksForWeek(2026, 12, '2026-03-20');

    expect(getPreviousDaysInWeek).toHaveBeenCalledWith('2026-03-20');
    expect(queryCompletedPreviousDayItems).toHaveBeenCalledWith(expect.anything(), 'user-1', previousDays);
    expect(queryTodayPlanItems).toHaveBeenCalledWith(expect.anything(), 'user-1', '2026-03-20');
    expect(filterOutCompletedPreviousDays).toHaveBeenCalled();
  });

  it('skips filterOutCompletedPreviousDays when no completed rows are found', async () => {
    mockCreateClient();
    setupDefaultMocks();

    vi.mocked(getPreviousDaysInWeek).mockReturnValue(['2026-03-16']);
    vi.mocked(queryCompletedPreviousDayItems).mockResolvedValue([]);
    vi.mocked(queryTodayPlanItems).mockResolvedValue([]);

    await getTasksForWeek(2026, 12, '2026-03-17');

    expect(filterOutCompletedPreviousDays).not.toHaveBeenCalled();
  });

  it('passes correct user_id to queryWeeklyGoals', async () => {
    mockCreateClient({ id: 'custom-user-id' });
    vi.mocked(queryWeeklyGoals).mockResolvedValue([]);

    await getTasksForWeek(2026, 1);

    expect(queryWeeklyGoals).toHaveBeenCalledWith(expect.anything(), 'custom-user-id', 2026, 1);
  });

  it('returns filtered result directly from filterTodoItems when no selectedDate', async () => {
    mockCreateClient();
    const expected = [
      { id: 'task-A', type: 'SIDE_QUEST', title: 'Alpha', status: 'TODO', quest_title: 'Q', goal_slot: 2, parent_task_id: null },
    ];
    setupDefaultMocks();
    vi.mocked(filterTodoItems).mockReturnValue(expected as any);

    const result = await getTasksForWeek(2026, 5);

    expect(result).toEqual(expected);
  });
});
