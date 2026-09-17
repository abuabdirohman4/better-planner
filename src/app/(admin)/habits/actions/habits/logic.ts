// NO "use server"
import type { Habit, HabitFormInput, HabitFrequency, HabitCategory, HabitTrackingType } from '@/types/habit';
import type { RawHabitRow } from './queries';

export function toHabit(row: RawHabitRow): Habit {
  return {
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    description: row.description,
    category: row.category as HabitCategory,
    frequency: row.frequency as HabitFrequency,
    monthly_goal: row.monthly_goal,
    daily_target: row.daily_target ?? 1,
    target_days: row.target_days ?? null,
    show_in_daily_sync: row.show_in_daily_sync ?? false,
    tracking_type: row.tracking_type as HabitTrackingType,
    target_time: row.target_time,
    deadline_time: row.deadline_time ? row.deadline_time.slice(0, 5) : null,
    is_archived: row.is_archived,
    sort_order: row.sort_order,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

const VALID_CATEGORIES: HabitCategory[] = [
  'spiritual',
  'kesehatan',
  'karir',
  'keuangan',
  'relasi',
  'petualangan',
  'kontribusi',
  'other',
];

const VALID_FREQUENCIES: HabitFrequency[] = ['daily', 'weekly', 'flexible'];
const VALID_TRACKING_TYPES: HabitTrackingType[] = ['positive', 'negative'];

export function parseHabitFormInput(raw: unknown): HabitFormInput {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Invalid habit form input: expected an object');
  }

  const data = raw as Record<string, unknown>;

  if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') {
    throw new Error('Invalid habit form input: name is required');
  }

  if (!data.category || !VALID_CATEGORIES.includes(data.category as HabitCategory)) {
    throw new Error(`Invalid habit form input: category must be one of ${VALID_CATEGORIES.join(', ')}`);
  }

  if (!data.frequency || !VALID_FREQUENCIES.includes(data.frequency as HabitFrequency)) {
    throw new Error(`Invalid habit form input: frequency must be one of ${VALID_FREQUENCIES.join(', ')}`);
  }

  if (!data.tracking_type || !VALID_TRACKING_TYPES.includes(data.tracking_type as HabitTrackingType)) {
    throw new Error(`Invalid habit form input: tracking_type must be one of ${VALID_TRACKING_TYPES.join(', ')}`);
  }

  const monthly_goal =
    typeof data.monthly_goal === 'number'
      ? data.monthly_goal
      : parseInt(String(data.monthly_goal ?? '20'), 10);

  if (isNaN(monthly_goal) || monthly_goal < 1) {
    throw new Error('Invalid habit form input: monthly_goal must be a positive integer');
  }

  const result: HabitFormInput = {
    name: data.name.trim(),
    category: data.category as HabitCategory,
    frequency: data.frequency as HabitFrequency,
    monthly_goal,
    tracking_type: data.tracking_type as HabitTrackingType,
  };

  if (data.description !== undefined && data.description !== null) {
    result.description = String(data.description).trim() || undefined;
  }

  if (data.target_time !== undefined && data.target_time !== null && data.target_time !== '') {
    result.target_time = String(data.target_time);
  }

  // Dibiarkan undefined kalau tidak dikirim, supaya update parsial tidak mereset batasnya.
  if (data.deadline_time !== undefined) {
    const raw = data.deadline_time === null ? '' : String(data.deadline_time);
    if (raw !== '' && !/^([01]\d|2[0-3]):([0-5]\d)$/.test(raw)) {
      throw new Error('Invalid habit form input: deadline_time must be HH:MM');
    }
    result.deadline_time = raw === '' ? null : raw;
  }

  if (data.target_days !== undefined) {
    result.target_days = parseTargetDays(data.target_days);
  }

  if (data.show_in_daily_sync !== undefined) {
    result.show_in_daily_sync = Boolean(data.show_in_daily_sync);
  }

  if (result.frequency === 'weekly' && (result.target_days ?? []).length === 0) {
    throw new Error('Invalid habit form input: weekly habits need at least one target day');
  }

  return result;
}

/** Normalise target_days input to sorted unique 0..6, or null for "every day". */
function parseTargetDays(raw: unknown): number[] | null {
  if (raw === null) return null;
  if (!Array.isArray(raw)) {
    throw new Error('Invalid habit form input: target_days must be an array of 0-6');
  }
  const days = [...new Set(raw.map(Number))].sort((a, b) => a - b);
  if (days.some(d => !Number.isInteger(d) || d < 0 || d > 6)) {
    throw new Error('Invalid habit form input: target_days must contain integers 0-6');
  }
  return days.length === 0 ? null : days;
}

/**
 * Is this habit scheduled on `date` ("YYYY-MM-DD")?
 * No target_days (null/empty) = every day, so legacy habits keep their daily behaviour.
 */
export function isScheduledOn(habit: Pick<Habit, 'target_days'>, date: string): boolean {
  const days = habit.target_days;
  if (!days || days.length === 0) return true;
  return days.includes(new Date(date + 'T00:00:00Z').getUTCDay());
}
