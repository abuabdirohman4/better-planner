import { describe, it, expect } from 'vitest';
import { greetingFor, weekInfo, pickVisionLine, buildHfgStepCards, buildHabitDays, lastNDates } from '../logic';
import { isScheduledOn } from '@/app/(admin)/habits/actions/habits/logic';

describe('greetingFor', () => {
  it('membagi jam WIB', () => {
    expect(greetingFor(6)).toBe('Selamat pagi');
    expect(greetingFor(12)).toBe('Selamat siang');
    expect(greetingFor(16)).toBe('Selamat sore');
    expect(greetingFor(19)).toBe('Selamat malam');
    expect(greetingFor(2)).toBe('Selamat malam');
  });
});

describe('weekInfo', () => {
  it('1 Okt 2026 = minggu 1 Q4', () => {
    expect(weekInfo('2026-10-01')).toMatchObject({ year: 2026, quarter: 4, weekInQuarter: 1, label: 'Minggu 1 dari 12 · Q4 2026' });
  });
  it('minggu 13 = istirahat', () => {
    // Q3 2026 minggu 13 = 21–27 Sep 2026
    expect(weekInfo('2026-09-23').label).toBe('Minggu istirahat · Q3 2026');
  });
});

describe('pickVisionLine', () => {
  it('lewati visi kosong, null kalau tidak ada', () => {
    expect(pickVisionLine([{ life_area: 'A', vision_3_5_year: ' ' }], '2026-10-01')).toBeNull();
    expect(pickVisionLine([{ life_area: 'A', vision_3_5_year: null }, { life_area: 'B', vision_3_5_year: 'x' }], '2026-10-01'))
      .toEqual({ area: 'B', text: 'x' });
  });
});

describe('buildHfgStepCards', () => {
  const quests = [{ id: 'q1', title: 'Q1' }];
  const milestones = [
    { id: 'm2', quest_id: 'q1', title: 'M2', display_order: 2 },
    { id: 'm1', quest_id: 'q1', title: 'M1', display_order: 1 },
  ];
  const tasks = [
    { id: 't3', milestone_id: 'm2', title: '2.1', status: 'TODO', display_order: 1 },
    { id: 't2', milestone_id: 'm1', title: '1.2', status: 'TODO', display_order: 2 },
    { id: 't1', milestone_id: 'm1', title: '1.1', status: 'DONE', display_order: 1 },
  ];

  it('hitung langkah DONE dan cari langkah berikutnya urut milestone lalu task', () => {
    const [c] = buildHfgStepCards(quests, milestones, tasks, new Set(['t2']));
    expect(c).toMatchObject({ done: 1, total: 3, percent: 33 });
    expect(c.next).toEqual({ taskId: 't2', title: '1.2', milestoneTitle: 'M1', planned: true });
  });

  it('semua selesai → next null', () => {
    const allDone = tasks.map((t) => ({ ...t, status: 'DONE' }));
    expect(buildHfgStepCards(quests, milestones, allDone, new Set())[0]).toMatchObject({ done: 3, percent: 100, next: null });
  });
});

describe('buildHabitDays', () => {
  const habits = [
    { id: 'h1', tracking_type: 'positive', daily_target: 1, target_days: null, created_at: '2026-09-01T00:00:00Z' },
    { id: 'h2', tracking_type: 'positive', daily_target: 2, target_days: null, created_at: '2026-09-30T00:00:00Z' },
    { id: 'h3', tracking_type: 'negative', daily_target: 1, target_days: null, created_at: '2026-09-01T00:00:00Z' },
    { id: 'h4', tracking_type: 'positive', daily_target: 1, target_days: [1], created_at: '2026-09-01T00:00:00Z' }, // Senin saja
  ];
  const completions = [
    { habit_id: 'h1', date: '2026-09-29' },
    { habit_id: 'h2', date: '2026-10-01' }, // baru 1 dari target 2
    { habit_id: 'h1', date: '2026-10-01' },
  ];

  it('hitung terjadwal + selesai per hari', () => {
    const days = buildHabitDays(habits, completions, ['2026-09-28', '2026-09-29', '2026-10-01'], isScheduledOn);
    expect(days[0]).toMatchObject({ scheduled: 2, done: 0 }); // Senin: h1 + h4, h2 belum dibuat
    expect(days[1]).toMatchObject({ scheduled: 1, done: 1, percent: 100 });
    expect(days[2]).toMatchObject({ scheduled: 2, done: 1, percent: 50 });
  });
});

describe('lastNDates', () => {
  it('urut lama ke baru, melewati batas bulan', () => {
    expect(lastNDates('2026-10-02', 3)).toEqual(['2026-09-30', '2026-10-01', '2026-10-02']);
  });
});
