import { describe, it, expect } from 'vitest';
import { groupCycles } from '../groupCycles';

const log = (id: string, task: string, start: string, type = 'FOCUS') =>
  ({ id, type, task_id: task, task_title: task, task_type: 'WORK_QUEST', start_time: start, end_time: start, duration_minutes: 60 } as any);

describe('groupCycles', () => {
  it('urut jam, gabung siklus berturut-turut task sama, buang break', () => {
    const g = groupCycles([
      log('3', 'B', '2026-10-08T06:00:00Z'),
      log('1', 'A', '2026-10-08T02:00:00Z'),
      log('x', 'A', '2026-10-08T02:30:00Z', 'BREAK'),
      log('2', 'A', '2026-10-08T03:00:00Z'),
      log('4', 'A', '2026-10-08T07:00:00Z'),
    ]);
    expect(g.map((x) => [x.title, x.logs.map((l) => l.id)])).toEqual([
      ['A', ['1', '2']],
      ['B', ['3']],
      ['A', ['4']],
    ]);
  });
});
