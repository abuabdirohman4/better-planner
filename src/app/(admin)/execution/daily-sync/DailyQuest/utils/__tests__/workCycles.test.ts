import { describe, it, expect } from 'vitest';
import { classifyCycle, buildWorkCycles, type FocusLog } from '../workCycles';

const log = (id: string, minutes: number, over: Partial<FocusLog> = {}): FocusLog => ({
  id,
  type: 'FOCUS',
  task_id: `task-${id}`,
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
  });
});

describe('buildWorkCycles (app-mgsb)', () => {
  it('tanpa rencana: bawaan 90 + 3x60; 90 jenis apa pun mengisi baris 90', () => {
    const c = buildWorkCycles([log('1', 90, { task_type: 'SIDE_QUEST' }), log('2', 60)]);
    expect(c.rows.map((r) => r.minutes)).toEqual([90, 60, 60, 60]);
    expect(c.rows[0].done?.id).toBe('1');
    expect(c.rows[1].done?.id).toBe('2');
    expect(c.done).toBe(2);
  });

  it('log mengisi baris yang merencanakan task itu, walau bukan baris kosong pertama', () => {
    const plan = [
      { minutes: 90, item_id: null },
      { minutes: 60, item_id: 'task-a' },
      { minutes: 60, item_id: 'task-b' },
    ];
    const c = buildWorkCycles([log('1', 60, { task_id: 'task-b' })], plan);
    expect(c.rows[2].done?.id).toBe('1');
    expect(c.rows[1].done).toBeNull();
  });

  it('60 diperpanjang jadi 90 tetap mengisi baris rencananya', () => {
    const c = buildWorkCycles([log('1', 90, { task_id: 'task-a' })], [{ minutes: 60, item_id: 'task-a' }]);
    expect(c.rows[0].done?.cls).toBe(90);
  });

  it('kelebihan 60/90 jadi extra; semua 25 menit ke Alternatif 25/5', () => {
    const c = buildWorkCycles(
      [log('1', 60), log('2', 60), log('3', 25, { task_title: 'PR' }), log('4', 20, { task_title: 'PR' })],
      [{ minutes: 60, item_id: null }],
    );
    expect(c.extra.map((e) => e.id)).toEqual(['2']);
    expect(c.short).toEqual({ count: 2, minutes: 45, tasks: [{ title: 'PR', count: 2, minutes: 45 }] });
  });

  it('25 menit tidak mencentang baris 90/60 walau task-nya sama; baris rencana 25/5 ikut tampil', () => {
    const plan = [{ minutes: 90, item_id: 'task-pr' }, { minutes: 25, item_id: null }, { minutes: 60, item_id: null }];
    const c = buildWorkCycles([log('1', 25, { task_id: 'task-pr' })], plan);
    expect(c.rows.map((r) => r.minutes)).toEqual([90, 25, 60]);
    expect(c.rows[0].done).toBeNull();
    expect(c.rows[1].done?.id).toBe('1');
    // Siklus 25/5 selalu masuk ringkasan Alternatif dan tidak dihitung di penghitung 90/60.
    expect(c.short.count).toBe(1);
    expect(c.done).toBe(0);
  });

  it('25 menit dengan atau tanpa baris 25/5 sama-sama masuk ringkasan Alternatif', () => {
    const plan = [{ minutes: 25, item_id: 'task-a' }];
    const c = buildWorkCycles([log('1', 25, { task_id: 'task-a' }), log('2', 25, { task_id: 'task-b' })], plan);
    expect(c.rows[0].done?.id).toBe('1');
    expect(c.short.count).toBe(2);
  });

  it('60 menit tidak mengisi baris 25/5 walau task-nya sama (tidak hilang dari daftar)', () => {
    const c = buildWorkCycles([log('1', 60, { task_id: 'task-a' })], [{ minutes: 25, item_id: 'task-a' }]);
    expect(c.rows[0].done).toBeNull();
    expect(c.extra.map((e) => e.id)).toEqual(['1']);
  });

  it('siklus task lain tidak menempati baris yang sudah direncanakan untuk task berbeda', () => {
    const c = buildWorkCycles([log('1', 60, { task_id: 'task-x' })], [{ minutes: 60, item_id: 'task-a' }]);
    expect(c.rows[0].done).toBeNull();
    expect(c.extra.map((e) => e.id)).toEqual(['1']);
  });
});
