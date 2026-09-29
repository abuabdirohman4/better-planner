-- app-01z6: tanda energi setelah sesi fokus. -1 terkuras, 0 biasa, 1 nambah energi. NULL = tidak dijawab.
ALTER TABLE activity_logs
  ADD COLUMN IF NOT EXISTS energy smallint
  CHECK (energy IN (-1, 0, 1));

COMMENT ON COLUMN activity_logs.energy IS
  'Tanda energi dari One Minute Journal: 1 nambah, 0 biasa, -1 terkuras. NULL = tidak dijawab (bukan sama dengan 0).';
