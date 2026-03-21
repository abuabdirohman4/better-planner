// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { wibDateToUtcRange, attachTaskTitles } from '../logic';
import { RawScheduleWithItem } from '../queries';

describe('wibDateToUtcRange', () => {
  it('converts WIB midnight to UTC (UTC-7h = previous day 17:00)', () => {
    const { startUTC } = wibDateToUtcRange('2026-02-13');
    expect(startUTC).toBe('2026-02-12T17:00:00.000Z');
  });

  it('converts WIB end-of-day to UTC (23:59:59 WIB = 16:59:59 UTC)', () => {
    const { endUTC } = wibDateToUtcRange('2026-02-13');
    expect(endUTC).toBe('2026-02-13T16:59:59.999Z');
  });

  it('startUTC is before endUTC', () => {
    const { startUTC, endUTC } = wibDateToUtcRange('2026-02-13');
    expect(new Date(startUTC) < new Date(endUTC)).toBe(true);
  });
});

const makeSchedule = (itemId: string): RawScheduleWithItem => ({
  id: 's-1',
  daily_plan_item_id: 'dpi-1',
  scheduled_start_time: '2026-02-13T10:00:00Z',
  scheduled_end_time: '2026-02-13T10:25:00Z',
  duration_minutes: 25,
  session_count: 1,
  created_at: '2026-02-13T10:00:00Z',
  updated_at: '2026-02-13T10:00:00Z',
  daily_plan_item: {
    id: 'dpi-1',
    item_id: itemId,
    status: 'TODO',
    item_type: 'DAILY',
    focus_duration: 25,
    daily_session_target: 1,
  },
});

describe('attachTaskTitles', () => {
  it('attaches title from task map', () => {
    const schedules = [makeSchedule('task-1')];
    const titles = [{ id: 'task-1', title: 'My Task' }];
    const result = attachTaskTitles(schedules, titles);
    // @ts-ignore
    expect(result[0].daily_plan_item?.title).toBe('My Task');
  });

  it('uses Untitled Task when task not found', () => {
    const schedules = [makeSchedule('task-unknown')];
    const result = attachTaskTitles(schedules, []);
    // @ts-ignore
    expect(result[0].daily_plan_item?.title).toBe('Untitled Task');
  });

  it('handles null daily_plan_item gracefully', () => {
    const schedule = { ...makeSchedule('task-1'), daily_plan_item: null };
    const result = attachTaskTitles([schedule], [{ id: 'task-1', title: 'T' }]);
    expect(result[0].daily_plan_item).toBeNull();
  });
});
