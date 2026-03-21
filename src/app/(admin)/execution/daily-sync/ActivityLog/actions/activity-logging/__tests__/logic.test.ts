// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { parseActivityFormData, calculateDurationMinutes, enrichLogsWithHierarchy } from '../logic';

function makeFormData(fields: Record<string, string>): FormData {
  const fd = new FormData();
  Object.entries(fields).forEach(([k, v]) => fd.append(k, v));
  return fd;
}

const validFields = {
  taskId: 'task-1',
  sessionType: 'FOCUS',
  date: '2026-01-01',
  startTime: '2026-01-01T09:00:00Z',
  endTime: '2026-01-01T09:25:00Z',
};

describe('parseActivityFormData', () => {
  it('parses all valid fields correctly', () => {
    const fd = makeFormData({ ...validFields, whatDone: 'Fixed bug', whatThink: 'Good session' });
    const result = parseActivityFormData(fd);
    expect(result.taskId).toBe('task-1');
    expect(result.sessionType).toBe('FOCUS');
    expect(result.date).toBe('2026-01-01');
    expect(result.whatDone).toBe('Fixed bug');
    expect(result.whatThink).toBe('Good session');
  });

  it('throws when taskId is missing', () => {
    const fd = makeFormData({ sessionType: 'FOCUS', date: '2026-01-01', startTime: 's', endTime: 'e' });
    expect(() => parseActivityFormData(fd)).toThrow('Missing required fields');
  });

  it('throws when sessionType is missing', () => {
    const fd = makeFormData({ taskId: 'task-1', date: '2026-01-01', startTime: 's', endTime: 'e' });
    expect(() => parseActivityFormData(fd)).toThrow('Missing required fields');
  });

  it('optional fields (whatDone, whatThink) can be undefined', () => {
    const fd = makeFormData(validFields);
    const result = parseActivityFormData(fd);
    expect(result.whatDone).toBeUndefined();
    expect(result.whatThink).toBeUndefined();
  });
});

describe('calculateDurationMinutes', () => {
  it('calculates 25 minutes correctly', () => {
    const start = '2026-01-01T09:00:00Z';
    const end = '2026-01-01T09:25:00Z';
    expect(calculateDurationMinutes(start, end)).toBe(25);
  });

  it('returns minimum 1 when duration is 0', () => {
    const time = '2026-01-01T09:00:00Z';
    expect(calculateDurationMinutes(time, time)).toBe(1);
  });

  it('rounds to nearest minute', () => {
    const start = '2026-01-01T09:00:00Z';
    const end = '2026-01-01T09:00:30Z'; // 30 seconds → rounds to 1 min (minimum)
    expect(calculateDurationMinutes(start, end)).toBe(1);
  });
});

describe('enrichLogsWithHierarchy', () => {
  it('returns logs with null fields when task_id is null', () => {
    const logs = [{ task_id: null }];
    const result = enrichLogsWithHierarchy(logs, [], [], []);
    expect(result[0].task_title).toBeNull();
    expect(result[0].quest_title).toBeNull();
  });

  it('enriches log with full hierarchy when all data present', () => {
    const logs = [{ task_id: 'task-1' }];
    const tasks = [{ id: 'task-1', title: 'My Task', type: 'WORK_QUEST', milestone_id: 'mile-1' }];
    const milestones = [{ id: 'mile-1', title: 'My Milestone', quest_id: 'quest-1' }];
    const quests = [{ id: 'quest-1', title: 'My Quest' }];
    const result = enrichLogsWithHierarchy(logs, tasks, milestones, quests);
    expect(result[0].task_title).toBe('My Task');
    expect(result[0].milestone_id).toBe('mile-1');
    expect(result[0].milestone_title).toBe('My Milestone');
    expect(result[0].quest_id).toBe('quest-1');
    expect(result[0].quest_title).toBe('My Quest');
  });

  it('leaves milestone and quest fields null when task has no milestone', () => {
    const logs = [{ task_id: 'task-1' }];
    const tasks = [{ id: 'task-1', title: 'Task', type: 'DAILY', milestone_id: null }];
    const result = enrichLogsWithHierarchy(logs, tasks, [], []);
    expect(result[0].task_title).toBe('Task');
    expect(result[0].milestone_id).toBeNull();
    expect(result[0].quest_title).toBeNull();
  });

  it('preserves original log fields', () => {
    const logs = [{ task_id: 'task-1', start_time: '09:00', duration_minutes: 25 }];
    const tasks = [{ id: 'task-1', title: 'T', type: 'FOCUS', milestone_id: null }];
    const result = enrichLogsWithHierarchy(logs, tasks, [], []);
    expect(result[0].start_time).toBe('09:00');
    expect(result[0].duration_minutes).toBe(25);
  });
});
