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
  tracking_type: HabitTrackingType;
  target_time: string | null; // "HH:MM" or null
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
}

export interface HabitFormInput {
  name: string;
  description?: string;
  category: HabitCategory;
  frequency: HabitFrequency;
  monthly_goal: number;
  tracking_type: HabitTrackingType;
  target_time?: string; // "HH:MM" or undefined
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
