// @vitest-environment node
import { describe, it, expect } from 'vitest';
import {
  combineItemsWithDetails,
  deduplicateItems,
  filterTodoItems,
  getPreviousDaysInWeek,
  filterOutCompletedPreviousDays,
  WeeklyTaskItem,
} from '../logic';
import { RawWeeklyGoal, RawWeeklyGoalItem, RawTask, RawMilestone, RawQuest } from '../queries';

// ---- Fixtures ----
const makeGoal = (overrides: Partial<RawWeeklyGoal> = {}): RawWeeklyGoal => ({
  id: 'wg-1',
  goal_slot: 1,
  ...overrides,
});

const makeGoalItem = (overrides: Partial<RawWeeklyGoalItem> = {}): RawWeeklyGoalItem => ({
  id: 'wgi-1',
  weekly_goal_id: 'wg-1',
  item_id: 'task-1',
  ...overrides,
});

const makeTask = (overrides: Partial<RawTask> = {}): RawTask => ({
  id: 'task-1',
  title: 'Task One',
  status: 'TODO',
  milestone_id: null,
  type: 'WORK',
  parent_task_id: null,
  ...overrides,
});

const makeMilestone = (overrides: Partial<RawMilestone> = {}): RawMilestone => ({
  id: 'ms-1',
  title: 'Milestone One',
  quest_id: 'quest-1',
  ...overrides,
});

const makeQuest = (overrides: Partial<RawQuest> = {}): RawQuest => ({
  id: 'quest-1',
  title: 'My Quest',
  ...overrides,
});

const makeWeeklyTaskItem = (overrides: Partial<WeeklyTaskItem> = {}): WeeklyTaskItem => ({
  id: 'task-1',
  type: 'WORK',
  title: 'Task One',
  status: 'TODO',
  quest_title: '',
  goal_slot: 1,
  parent_task_id: null,
  ...overrides,
});

// ---- combineItemsWithDetails ----
describe('combineItemsWithDetails', () => {
  it('maps item_id and uses task title, status, type', () => {
    const items = [makeGoalItem()];
    const goals = [makeGoal()];
    const task = makeTask();
    const taskMap = new Map([[task.id, task]]);
    const result = combineItemsWithDetails(items, goals, taskMap, new Map(), new Map());

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('task-1');
    expect(result[0].title).toBe('Task One');
    expect(result[0].type).toBe('WORK');
    expect(result[0].status).toBe('TODO');
  });

  it('resolves quest_title through milestone → quest chain', () => {
    const items = [makeGoalItem()];
    const goals = [makeGoal()];
    const task = makeTask({ milestone_id: 'ms-1' });
    const milestone = makeMilestone();
    const quest = makeQuest();
    const taskMap = new Map([[task.id, task]]);
    const milestoneMap = new Map([[milestone.id, milestone]]);
    const questMap = new Map([[quest.id, quest]]);

    const result = combineItemsWithDetails(items, goals, taskMap, milestoneMap, questMap);

    expect(result[0].quest_title).toBe('My Quest');
  });

  it('sets quest_title to empty string when milestone has no quest_id', () => {
    const items = [makeGoalItem()];
    const goals = [makeGoal()];
    const task = makeTask({ milestone_id: 'ms-1' });
    const milestone = makeMilestone({ quest_id: null });
    const taskMap = new Map([[task.id, task]]);
    const milestoneMap = new Map([[milestone.id, milestone]]);

    const result = combineItemsWithDetails(items, goals, taskMap, milestoneMap, new Map());

    expect(result[0].quest_title).toBe('');
  });

  it('falls back to MAIN_QUEST for unknown task type', () => {
    const items = [makeGoalItem()];
    const goals = [makeGoal()];
    const task = makeTask({ type: 'UNKNOWN_TYPE' });
    const taskMap = new Map([[task.id, task]]);

    const result = combineItemsWithDetails(items, goals, taskMap, new Map(), new Map());

    expect(result[0].type).toBe('MAIN_QUEST');
  });

  it('uses goal_slot from the matching weekly goal', () => {
    const items = [makeGoalItem({ weekly_goal_id: 'wg-2' })];
    const goals = [makeGoal({ id: 'wg-2', goal_slot: 5 })];
    const task = makeTask();
    const taskMap = new Map([[task.id, task]]);

    const result = combineItemsWithDetails(items, goals, taskMap, new Map(), new Map());

    expect(result[0].goal_slot).toBe(5);
  });

  it('returns default values when task not found in taskMap', () => {
    const items = [makeGoalItem({ item_id: 'missing-task' })];
    const goals = [makeGoal()];

    const result = combineItemsWithDetails(items, goals, new Map(), new Map(), new Map());

    expect(result[0].id).toBe('missing-task');
    expect(result[0].title).toBe('');
    expect(result[0].status).toBe('TODO');
    expect(result[0].type).toBe('MAIN_QUEST');
  });
});

// ---- deduplicateItems ----
describe('deduplicateItems', () => {
  it('removes duplicate items keeping first occurrence', () => {
    const items = [
      makeWeeklyTaskItem({ id: 'task-1', title: 'First' }),
      makeWeeklyTaskItem({ id: 'task-2', title: 'Second' }),
      makeWeeklyTaskItem({ id: 'task-1', title: 'Duplicate' }),
    ];
    const result = deduplicateItems(items);
    expect(result).toHaveLength(2);
    expect(result[0].title).toBe('First');
    expect(result[1].id).toBe('task-2');
  });

  it('returns empty array for empty input', () => {
    expect(deduplicateItems([])).toEqual([]);
  });

  it('returns all items when there are no duplicates', () => {
    const items = [
      makeWeeklyTaskItem({ id: 'task-1' }),
      makeWeeklyTaskItem({ id: 'task-2' }),
    ];
    expect(deduplicateItems(items)).toHaveLength(2);
  });
});

// ---- filterTodoItems ----
describe('filterTodoItems', () => {
  it('keeps only TODO items', () => {
    const items = [
      makeWeeklyTaskItem({ id: 'task-1', status: 'TODO' }),
      makeWeeklyTaskItem({ id: 'task-2', status: 'DONE' }),
      makeWeeklyTaskItem({ id: 'task-3', status: 'IN_PROGRESS' }),
    ];
    const result = filterTodoItems(items);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('task-1');
  });

  it('returns empty array when no TODO items', () => {
    const items = [makeWeeklyTaskItem({ status: 'DONE' })];
    expect(filterTodoItems(items)).toEqual([]);
  });

  it('returns all items when all are TODO', () => {
    const items = [
      makeWeeklyTaskItem({ id: 'task-1', status: 'TODO' }),
      makeWeeklyTaskItem({ id: 'task-2', status: 'TODO' }),
    ];
    expect(filterTodoItems(items)).toHaveLength(2);
  });
});

// ---- getPreviousDaysInWeek ----
describe('getPreviousDaysInWeek', () => {
  it('returns empty array when selectedDate is Monday', () => {
    // 2026-03-16 is a Monday
    const result = getPreviousDaysInWeek('2026-03-16');
    expect(result).toEqual([]);
  });

  it('returns [Monday] when selectedDate is Tuesday', () => {
    // 2026-03-17 is a Tuesday
    const result = getPreviousDaysInWeek('2026-03-17');
    expect(result).toEqual(['2026-03-16']);
  });

  it('returns Mon–Fri when selectedDate is Saturday', () => {
    // 2026-03-21 is a Saturday
    const result = getPreviousDaysInWeek('2026-03-21');
    expect(result).toEqual([
      '2026-03-16',
      '2026-03-17',
      '2026-03-18',
      '2026-03-19',
      '2026-03-20',
    ]);
  });

  it('returns Mon–Sat when selectedDate is Sunday', () => {
    // 2026-03-22 is a Sunday
    const result = getPreviousDaysInWeek('2026-03-22');
    expect(result).toEqual([
      '2026-03-16',
      '2026-03-17',
      '2026-03-18',
      '2026-03-19',
      '2026-03-20',
      '2026-03-21',
    ]);
  });

  it('does NOT include selectedDate itself', () => {
    const selectedDate = '2026-03-20'; // Friday
    const result = getPreviousDaysInWeek(selectedDate);
    expect(result).not.toContain(selectedDate);
  });
});

// ---- filterOutCompletedPreviousDays ----
describe('filterOutCompletedPreviousDays', () => {
  it('removes items that are in completedIds and NOT in todayIds', () => {
    const items = [
      makeWeeklyTaskItem({ id: 'task-1' }),
      makeWeeklyTaskItem({ id: 'task-2' }),
    ];
    const completedIds = new Set(['task-1']);
    const todayIds = new Set<string>();

    const result = filterOutCompletedPreviousDays(items, completedIds, todayIds);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('task-2');
  });

  it('keeps items that are in both completedIds and todayIds (already planned for today)', () => {
    const items = [
      makeWeeklyTaskItem({ id: 'task-1' }),
      makeWeeklyTaskItem({ id: 'task-2' }),
    ];
    const completedIds = new Set(['task-1']);
    const todayIds = new Set(['task-1']);

    const result = filterOutCompletedPreviousDays(items, completedIds, todayIds);
    expect(result).toHaveLength(2);
  });

  it('keeps all items when completedIds is empty', () => {
    const items = [
      makeWeeklyTaskItem({ id: 'task-1' }),
      makeWeeklyTaskItem({ id: 'task-2' }),
    ];
    const result = filterOutCompletedPreviousDays(items, new Set(), new Set());
    expect(result).toHaveLength(2);
  });

  it('returns empty array for empty items input', () => {
    const result = filterOutCompletedPreviousDays([], new Set(['task-1']), new Set());
    expect(result).toEqual([]);
  });
});
