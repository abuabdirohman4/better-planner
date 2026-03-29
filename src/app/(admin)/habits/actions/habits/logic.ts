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
    tracking_type: row.tracking_type as HabitTrackingType,
    target_time: row.target_time,
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

  return result;
}
