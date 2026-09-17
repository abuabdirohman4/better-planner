export type HabitFrequency = 'daily' | 'weekly' | 'flexible';
export type HabitCategory =
  | 'spiritual'
  | 'kesehatan'
  | 'karir'
  | 'keuangan'
  | 'relasi'
  | 'petualangan'
  | 'kontribusi'
  | 'other';
export type HabitTrackingType = 'positive' | 'negative';

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  category: HabitCategory;
  frequency: HabitFrequency;
  monthly_goal: number;
  daily_target: number; // 1 = binary, >1 = N completions/day
  target_days: number[] | null; // 0=Sun..6=Sat scheduled days; null/empty = every day
  show_in_daily_sync: boolean; // tickable row in Daily Sync's daily quest list (app-cr6i)
  tracking_type: HabitTrackingType;
  target_time: string | null; // "HH:MM" or null — kapan DIINGATKAN (cron push-due)
  deadline_time: string | null; // "HH:MM" or null — batas tepat waktu (app-r02c); null = tidak dinilai
  is_archived: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface HabitCompletion {
  id: string;
  habit_id: string;
  user_id: string;
  date: string; // "YYYY-MM-DD"
  note: string | null;
  created_at: string;
  done_at: string | null; // "HH:MM" WIB, dikoreksi manual; null = pakai created_at
}

/** Penilaian tepat waktu (app-r02c). null = habit tanpa deadline_time, jangan tampilkan apa pun. */
export type CompletionTimeliness = 'ontime' | 'late' | null;

export interface HabitFormInput {
  name: string;
  description?: string;
  category: HabitCategory;
  frequency: HabitFrequency;
  monthly_goal: number;
  daily_target?: number; // default 1
  target_days?: number[] | null;
  show_in_daily_sync?: boolean;
  tracking_type: HabitTrackingType;
  target_time?: string; // "HH:MM" or undefined
  deadline_time?: string | null; // "HH:MM"; null = hapus batas, undefined = jangan ubah
}

export interface HabitStats {
  habit_id: string;
  completed: number;
  goal: number;
  percentage: number;
  current_streak: number;
  best_streak: number;
}

export interface StreakResult {
  current_streak: number;
  best_streak: number;
}

export interface MonthlyStats {
  total_possible: number;
  total_completed: number;
  overall_percentage: number;
  best_streak: number;
  best_streak_habit_id: string;
  per_habit: HabitStats[];
  category_breakdown: Partial<
    Record<HabitCategory, { completed: number; total: number; percentage: number }>
  >;
}
