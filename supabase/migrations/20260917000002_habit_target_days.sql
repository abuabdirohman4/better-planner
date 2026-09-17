-- app-pizc: weekly habits only show on the days they target.
-- NULL / empty = every day (existing habits keep showing daily).
ALTER TABLE habits
  ADD COLUMN IF NOT EXISTS target_days SMALLINT[]
  CHECK (target_days IS NULL OR (
    array_length(target_days, 1) BETWEEN 1 AND 7
    AND target_days <@ ARRAY[0,1,2,3,4,5,6]::SMALLINT[]
  ));

COMMENT ON COLUMN habits.target_days IS
  'Scheduled weekdays, 0=Sunday..6=Saturday. NULL or empty means every day.';
