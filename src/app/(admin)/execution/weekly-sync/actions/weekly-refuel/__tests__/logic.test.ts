// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { normalizeText, summarizeFocus, weekDateStrings, formatDuration } from '../logic';

describe('normalizeText', () => {
  it('kosong/spasi -> null, selain itu di-trim', () => {
    expect(normalizeText('   ')).toBeNull();
    expect(normalizeText(undefined)).toBeNull();
    expect(normalizeText('  baca buku ')).toBe('baca buku');
  });
});

describe('weekDateStrings & formatDuration', () => {
  it('Senin 28 Sep 2026 -> 7 tanggal sampai 4 Okt', () => {
    const d = weekDateStrings(new Date(2026, 8, 28));
    expect(d[0]).toBe('2026-09-28');
    expect(d[6]).toBe('2026-10-04');
  });
  it('format', () => {
    expect(formatDuration(2136)).toBe('35j 36m');
    expect(formatDuration(120)).toBe('2j');
    expect(formatDuration(0)).toBe('0m');
    expect(formatDuration(45)).toBe('45m');
  });
});

describe('summarizeFocus', () => {
  const week = weekDateStrings(new Date(2026, 8, 28));
  const tasks = [
    { id: 'p1', title: 'Proyek A', type: 'WORK_QUEST', milestone_id: null, parent_task_id: null },
    { id: 's1', title: 'sub 1', type: 'WORK_QUEST', milestone_id: null, parent_task_id: 'p1' },
    { id: 's2', title: 'sub 2', type: 'WORK_QUEST', milestone_id: null, parent_task_id: 'p1' },
    { id: 'h1', title: 'Tugas HFG', type: 'MAIN_QUEST', milestone_id: 'm-hfg', parent_task_id: null },
    { id: 'hs', title: 'sub hfg', type: 'MAIN_QUEST', milestone_id: null, parent_task_id: 'h1' },
    { id: 'd1', title: 'Olahraga', type: 'DAILY_QUEST', milestone_id: null, parent_task_id: null },
    { id: 'x1', title: 'Side', type: 'SIDE_QUEST', milestone_id: 'm-other', parent_task_id: null },
  ];
  const logs = [
    { task_id: 's1', local_date: '2026-09-28', duration_minutes: 25 },
    { task_id: 's2', local_date: '2026-09-30', duration_minutes: 50 },
    { task_id: 'd1', local_date: '2026-09-30', duration_minutes: 10 },
    { task_id: 'x1', local_date: '2026-10-04', duration_minutes: 30 },
    { task_id: 'zz', local_date: '2026-10-04', duration_minutes: 5 }, // tugas tak dikenal -> Lainnya
    { task_id: 'p1', local_date: '2026-10-05', duration_minutes: 99 }, // di luar minggu
  ];

  it('agregasi total, hari, jenis, top tugas (subtask digabung ke parent)', () => {
    const s = summarizeFocus(logs, tasks, week, new Set(['m-hfg']));
    expect(s.totalMinutes).toBe(120);
    expect(s.sessions).toBe(5);
    expect(s.distinctTasks).toBe(4); // p1, d1, x1, zz
    expect(s.days.map((d) => d.minutes)).toEqual([25, 0, 60, 0, 0, 0, 35]);
    expect(s.best).toEqual({ name: 'Rabu', minutes: 60 });
    const cat = Object.fromEntries(s.categories.map((c) => [c.key, c.minutes]));
    expect(cat).toEqual({ HFG: 0, WORK: 75, SIDE: 30, DAILY: 10, OTHER: 5 });
    expect(s.tasks[0]).toMatchObject({ title: 'Proyek A', category: 'WORK', minutes: 75, sessions: 2 });
    expect(s.tasks).toHaveLength(4); // tanpa batas 5
    expect(s.tasks.map((t) => t.minutes)).toEqual([75, 30, 10, 5]);
  });

  it('tugas berjudul sama (daily quest dibuat ulang tiap hari) digabung satu baris', () => {
    const daily = [
      { id: 'r1', title: 'Review inbox', type: 'DAILY_QUEST', milestone_id: null, parent_task_id: null },
      { id: 'r2', title: 'Review inbox ', type: 'DAILY_QUEST', milestone_id: null, parent_task_id: null },
    ];
    const s = summarizeFocus(
      [
        { task_id: 'r1', local_date: '2026-09-28', duration_minutes: 25 },
        { task_id: 'r2', local_date: '2026-09-29', duration_minutes: 25 },
      ],
      daily, week, new Set(),
    );
    expect(s.tasks).toHaveLength(1);
    expect(s.tasks[0]).toMatchObject({ title: 'Review inbox', minutes: 50, sessions: 2 });
    expect(s.distinctTasks).toBe(1);
  });

  it('subtask dari parent HFG dihitung HFG; HFG tetap tampil walau 0', () => {
    const s = summarizeFocus([{ task_id: 'hs', local_date: '2026-09-29', duration_minutes: 40 }], tasks, week, new Set(['m-hfg']));
    expect(s.categories).toEqual([{ key: 'HFG', label: 'HFG', minutes: 40 }]);
    const empty = summarizeFocus([], tasks, week, new Set());
    expect(empty.categories).toEqual([{ key: 'HFG', label: 'HFG', minutes: 0 }]);
    expect(empty.best).toBeNull();
  });
});
