-- app-r02c: "batas tepat waktu" per habit (mis. Duhur batas 13:00).
-- Sengaja BUKAN habits.target_time — itu bermakna "kapan diingatkan" (dipakai cron push-due).
-- Abu bisa diingatkan 12:30 tapi batasnya 13:00.
ALTER TABLE habits
  ADD COLUMN IF NOT EXISTS deadline_time TIME;

COMMENT ON COLUMN habits.deadline_time IS
  'Batas "tepat waktu" (WIB). Dikerjakan sebelum jam ini = tepat waktu. NULL = tidak dinilai. Penanda visual saja: telat tetap dihitung selesai dan tidak memengaruhi streak.';

-- Jam DIKERJAKAN, bukan jam baris dibuat. Abu mungkin shalat Duhur 12:15 tapi baru
-- mencentang 21:00 — tanpa kolom ini aplikasi menghukum lupa mencentang, bukan telat shalat.
-- NULL = pakai created_at (dikonversi ke WIB) sebagai perkiraan.
ALTER TABLE habit_completions
  ADD COLUMN IF NOT EXISTS done_at TIME;

COMMENT ON COLUMN habit_completions.done_at IS
  'Jam (WIB) habit benar-benar dikerjakan, dikoreksi manual. NULL = pakai jam WIB dari created_at.';

-- habit_completions punya policy select/insert/delete tapi TIDAK update — koreksi jam butuh update.
CREATE POLICY "hc_update_own" ON habit_completions FOR UPDATE
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
