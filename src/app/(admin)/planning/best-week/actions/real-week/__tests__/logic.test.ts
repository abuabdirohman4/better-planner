// @vitest-environment node
import { describe, it, expect } from 'vitest';
import {
  getWeekStartWib,
  addDays,
  resolveQuestId,
  schedulesToBlocks,
  HFG_COLORS,
} from '../logic';
import type { RawWeekSchedule } from '../queries';
import type { RawTask, RawMilestone } from '@/app/(admin)/execution/daily-sync/DailyQuest/actions/weekly-tasks/queries';

const task = (id: string, milestone_id: string | null, parent_task_id: string | null = null): RawTask => ({
  id,
  title: `Title ${id}`,
  status: 'TODO',
  milestone_id,
  type: 'MAIN_QUEST',
  parent_task_id,
});

const taskMap = new Map<string, RawTask>([
  ['t1', task('t1', 'm1')],           // quest q1
  ['t2', task('t2', null, 't3')],     // sub task → parent t3 → quest q2
  ['t3', task('t3', 'm2')],           // quest q2
  ['t4', task('t4', null)],           // daily/side quest, tanpa milestone
]);

const milestoneMap = new Map<string, RawMilestone>([
  ['m1', { id: 'm1', title: 'M1', quest_id: 'q1' }],
  ['m2', { id: 'm2', title: 'M2', quest_id: 'q2' }],
]);

// HFG #1 = q2, #2 = q1, #3 = q3
const hfgQuestIds = ['q2', 'q1', 'q3'];
const WEEK = '2026-09-28'; // Senin

const sched = (id: string, start: string, end: string, itemId: string | null): RawWeekSchedule => ({
  id,
  scheduled_start_time: start,
  scheduled_end_time: end,
  daily_plan_items: itemId ? { item_id: itemId } : null,
});

describe('getWeekStartWib', () => {
  it('Selasa → Senin minggu yang sama', () => {
    expect(getWeekStartWib(new Date('2026-09-29T05:00:00Z'))).toBe('2026-09-28');
  });

  it('Minggu sore WIB → Senin sebelumnya', () => {
    expect(getWeekStartWib(new Date('2026-10-04T10:00:00Z'))).toBe('2026-09-28');
  });

  it('Minggu 17:30 UTC sudah Senin 00:30 WIB → minggu baru', () => {
    expect(getWeekStartWib(new Date('2026-10-04T17:30:00Z'))).toBe('2026-10-05');
  });
});

describe('addDays', () => {
  it('melewati akhir bulan', () => {
    expect(addDays('2026-09-28', 6)).toBe('2026-10-04');
  });
});

describe('resolveQuestId', () => {
  it('task langsung → quest via milestone', () => {
    expect(resolveQuestId('t1', taskMap, milestoneMap)).toBe('q1');
  });

  it('sub task → quest via milestone parent', () => {
    expect(resolveQuestId('t2', taskMap, milestoneMap)).toBe('q2');
  });

  it('task tanpa milestone → null', () => {
    expect(resolveQuestId('t4', taskMap, milestoneMap)).toBeNull();
  });

  it('task tidak dikenal → null', () => {
    expect(resolveQuestId('tx', taskMap, milestoneMap)).toBeNull();
  });
});

describe('schedulesToBlocks', () => {
  const run = (schedules: RawWeekSchedule[]) =>
    schedulesToBlocks(schedules, WEEK, taskMap, milestoneMap, hfgQuestIds);

  it('konversi UTC → hari & jam WIB, sesi 25 menit dipertahankan', () => {
    const [b] = run([sched('s1', '2026-09-29T02:00:00Z', '2026-09-29T02:25:00Z', 't1')]);
    expect(b).toEqual({
      id: 's1',
      days: ['tue'],
      start_time: '09:00',
      end_time: '09:25',
      title: 'Title t1',
      hfgRank: 2,
      colors: HFG_COLORS[2],
    });
  });

  it('sub task mewarisi HFG parent', () => {
    const [b] = run([sched('s2', '2026-09-30T03:00:00Z', '2026-09-30T04:00:00Z', 't2')]);
    expect(b.hfgRank).toBe(1);
    expect(b.colors).toEqual(HFG_COLORS[1]);
  });

  it('bukan HFG → rank 0 abu-abu', () => {
    const [b] = run([sched('s3', '2026-09-30T03:00:00Z', '2026-09-30T04:00:00Z', 't4')]);
    expect(b.hfgRank).toBe(0);
    expect(b.colors).toEqual(HFG_COLORS[0]);
  });

  it('Senin 00:00 WIB (Minggu 17:00 UTC) masuk hari Senin', () => {
    const [b] = run([sched('s4', '2026-09-27T17:00:00Z', '2026-09-27T17:30:00Z', 't1')]);
    expect(b.days).toEqual(['mon']);
    expect(b.start_time).toBe('00:00');
  });

  it('di luar minggu dibuang', () => {
    expect(run([sched('s5', '2026-10-04T17:00:00Z', '2026-10-04T17:30:00Z', 't1')])).toEqual([]);
  });

  it('lewat tengah malam dipotong di 24:00', () => {
    const [b] = run([sched('s6', '2026-10-04T16:00:00Z', '2026-10-04T17:30:00Z', 't1')]);
    expect(b.days).toEqual(['sun']);
    expect(b.start_time).toBe('23:00');
    expect(b.end_time).toBe('24:00');
  });

  it('daily_plan_items null → Untitled Task, rank 0', () => {
    const [b] = run([sched('s7', '2026-09-29T02:00:00Z', '2026-09-29T02:25:00Z', null)]);
    expect(b.title).toBe('Untitled Task');
    expect(b.hfgRank).toBe(0);
  });
});
