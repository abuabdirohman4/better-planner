// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { buildMilestoneMap, buildTaskMap, buildSubtaskMap, assembleHierarchy } from '../logic';

const milestones = [
  { id: 'm1', title: 'M1', quest_id: 'q1' },
  { id: 'm2', title: 'M2', quest_id: 'q1' },
  { id: 'm3', title: 'M3', quest_id: 'q2' },
];

const tasks = [
  { id: 't1', title: 'T1', status: 'TODO', milestone_id: 'm1' },
  { id: 't2', title: 'T2', status: 'DONE', milestone_id: 'm1' },
  { id: 't3', title: 'T3', status: 'TODO', milestone_id: 'm2' },
];

const subtasks = [
  { id: 's1', title: 'S1', status: 'TODO', parent_task_id: 't1' },
  { id: 's2', title: 'S2', status: 'TODO', parent_task_id: 't1' },
];

describe('buildMilestoneMap', () => {
  it('groups milestones by quest_id', () => {
    const map = buildMilestoneMap(milestones);
    expect(map.get('q1')).toHaveLength(2);
    expect(map.get('q2')).toHaveLength(1);
  });

  it('returns empty map for empty input', () => {
    const map = buildMilestoneMap([]);
    expect(map.size).toBe(0);
  });
});

describe('buildTaskMap', () => {
  it('groups tasks by milestone_id', () => {
    const map = buildTaskMap(tasks);
    expect(map.get('m1')).toHaveLength(2);
    expect(map.get('m2')).toHaveLength(1);
    expect(map.get('m3')).toBeUndefined();
  });

  it('returns empty map for empty input', () => {
    const map = buildTaskMap([]);
    expect(map.size).toBe(0);
  });
});

describe('buildSubtaskMap', () => {
  it('groups subtasks by parent_task_id', () => {
    const map = buildSubtaskMap(subtasks);
    expect(map.get('t1')).toHaveLength(2);
  });

  it('returns empty map for empty input', () => {
    const map = buildSubtaskMap([]);
    expect(map.size).toBe(0);
  });
});

describe('assembleHierarchy', () => {
  it('correctly nests milestones → tasks → subtasks under each quest', () => {
    const milestoneMap = buildMilestoneMap(milestones);
    const taskMap = buildTaskMap(tasks);
    const subtaskMap = buildSubtaskMap(subtasks);

    const quests = [
      { id: 'q1', title: 'Quest 1' },
      { id: 'q2', title: 'Quest 2' },
    ];

    const result = assembleHierarchy(quests, milestoneMap, taskMap, subtaskMap);

    expect(result).toHaveLength(2);
    expect(result[0].milestones).toHaveLength(2);
    expect(result[0].milestones[0].tasks).toHaveLength(2);
    expect(result[0].milestones[0].tasks[0].subtasks).toHaveLength(2);
    expect(result[0].milestones[0].tasks[1].subtasks).toHaveLength(0);
    expect(result[1].milestones).toHaveLength(1);
    expect(result[1].milestones[0].tasks).toHaveLength(0);
  });

  it('returns quests with empty milestones when map has no matching entry', () => {
    const result = assembleHierarchy(
      [{ id: 'q-unknown', title: 'Unknown' }],
      new Map(),
      new Map(),
      new Map()
    );
    expect(result[0].milestones).toEqual([]);
  });

  it('preserves quest fields', () => {
    const result = assembleHierarchy([{ id: 'q1', title: 'Quest 1' }], new Map(), new Map(), new Map());
    expect(result[0].id).toBe('q1');
    expect(result[0].title).toBe('Quest 1');
  });
});
