-- Habit Tracker: habits + habit_completions tables

CREATE TYPE habit_frequency AS ENUM ('daily', 'weekly', 'flexible');
CREATE TYPE habit_category AS ENUM ('spiritual', 'kesehatan', 'karir', 'keuangan', 'relasi', 'petualangan', 'kontribusi', 'other');
CREATE TYPE habit_tracking_type AS ENUM ('positive', 'negative');

CREATE TABLE IF NOT EXISTS habits (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name           VARCHAR(255) NOT NULL,
  description    TEXT,
  category       habit_category NOT NULL DEFAULT 'other',
  frequency      habit_frequency NOT NULL DEFAULT 'flexible',
  monthly_goal   INTEGER NOT NULL DEFAULT 20,
  tracking_type  habit_tracking_type NOT NULL DEFAULT 'positive',
  target_time    TIME,
  is_archived    BOOLEAN NOT NULL DEFAULT false,
  sort_order     INTEGER NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS habit_completions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id   UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date       DATE NOT NULL,
  note       TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(habit_id, date)
);

CREATE INDEX IF NOT EXISTS idx_habits_user_id ON habits(user_id);
CREATE INDEX IF NOT EXISTS idx_habits_user_archived ON habits(user_id, is_archived);
CREATE INDEX IF NOT EXISTS idx_habit_completions_habit_id ON habit_completions(habit_id);
CREATE INDEX IF NOT EXISTS idx_habit_completions_user_date ON habit_completions(user_id, date);

ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "habits_select_own" ON habits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "habits_insert_own" ON habits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "habits_update_own" ON habits FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "habits_delete_own" ON habits FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE habit_completions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hc_select_own" ON habit_completions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "hc_insert_own" ON habit_completions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "hc_delete_own" ON habit_completions FOR DELETE USING (auth.uid() = user_id);
