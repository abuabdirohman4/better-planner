-- app-cr6i: habits that are really daily quests can be ticked from Daily Sync.
-- Opt-in per habit so the 7 shalat habits don't flood the daily quest card.
ALTER TABLE habits
  ADD COLUMN IF NOT EXISTS show_in_daily_sync BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN habits.show_in_daily_sync IS
  'Show this habit as a row in the Daily Sync daily quest list (tickable there). Others are only summarised by a reminder line.';
