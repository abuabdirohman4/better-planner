import { describe, it, expect } from 'vitest';
import { classifyCycle, buildWorkCycles, type FocusLog } from '../workCycles';

const log = (id: string, minutes: number, over: Partial<FocusLog> = {}): FocusLog => ({
  id,
  type: 'FOCUS',
  task_title: `Task ${id}`,
  task_type: 'WORK_QUEST',
  start_time: `2026-10-05T0${id}:00:00Z`,
  end_time: `2026-10-05T0${id}:30:00Z`,
  duration_minutes: minutes,
  ...over,
});

describe('classifyCycle', () => {
  it('ambang >=80 = 90, >=50 = 60, sisanya 25', () => {
    expect(classifyCycle(90)).toBe(90);
    expect(classifyCycle(80)).toBe(90);
    expect(classifyCycle(79)).toBe(60);
    expect(classifyCycle(50)).toBe(60);
    expect(classifyCycle(49)).toBe(25);
    expect(classifyCycle(25)).toBe(25);
  });
});

describe('buildWorkCycles', () => {
  it('90 HFG mengisi kotak HFG; 90 non-HFG & 60 ke routine; 25 jadi titik', () => {
    const c = buildWorkCycles([
      log('1', 90, { task_type: 'MAIN_QUEST', task_title: 'HFG A' }),
      log('2', 85, { task_type: 'WORK_QUEST', task_title: 'Work 90' }),
      log('3', 60, { task_title: 'FM-2' }),
      log('4', 25, { task_title: 'PR #715' }),
      log('5', 25, { task_title: 'PR #715' }),
      log('6', 20, { task_title: 'GM' }),
      log('7', 5, { type: 'SHORT_BREAK' }),
    ]);
    expect(c.hfg?.title).toBe('HFG A');
    expect(c.routine.map((r) => r.title)).toEqual(['Work 90', 'FM-2']);
    expect(c.routine.map((r) => r.cls)).toEqual([90, 60]);
    expect(c.mainDone).toBe(3);
    expect(c.short).toEqual({ count: 3, minutes: 70, tasks: [{ title: 'PR #715', count: 2, minutes: 50 }, { title: 'GM', count: 1, minutes: 20 }] });
  });

  it('task 25/5 diurut sesi terbanyak, lalu menit', () => {
    const c = buildWorkCycles([
      log('1', 20, { task_title: 'A' }),
      log('2', 25, { task_title: 'B' }),
      log('3', 25, { task_title: 'C' }),
      log('4', 25, { task_title: 'C' }),
    ]);
    expect(c.short.tasks.map((t) => t.title)).toEqual(['C', 'B', 'A']);
  });

  it('HFG 90 kedua masuk routine; mainDone maksimal 4', () => {
    const c = buildWorkCycles([
      log('1', 90, { task_type: 'MAIN_QUEST' }),
      log('2', 90, { task_type: 'MAIN_QUEST' }),
      log('3', 60),
      log('4', 60),
      log('5', 60),
    ]);
    expect(c.routine).toHaveLength(4);
    expect(c.mainDone).toBe(4);
  });

  it('60 menit task HFG tidak mengisi kotak HFG', () => {
    const c = buildWorkCycles([log('1', 60, { task_type: 'MAIN_QUEST' })]);
    expect(c.hfg).toBeNull();
    expect(c.routine).toHaveLength(1);
  });
});
