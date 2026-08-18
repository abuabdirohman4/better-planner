-- bp-0df: multi-completion per day. daily_target=1 keeps binary behaviour.
ALTER TABLE habits
  ADD COLUMN IF NOT EXISTS daily_target INTEGER NOT NULL DEFAULT 1
  CHECK (daily_target BETWEEN 1 AND 99);

-- Allow N completion rows per habit per day
ALTER TABLE habit_completions
  DROP CONSTRAINT IF EXISTS habit_completions_habit_id_date_key;

CREATE INDEX IF NOT EXISTS idx_habit_completions_habit_date
  ON habit_completions (habit_id, date);
