-- app-dwhq: jatah jam per HFG per minggu + status ON_TRACK / AT_RISK.
-- Satu-satunya tempat hitung: dipakai dashboard BePlan (supabase.rpc) dan bot Telegram (SQL langsung).

ALTER TABLE quests
  ADD COLUMN IF NOT EXISTS weekly_target_hours NUMERIC(4,1)
  CHECK (weekly_target_hours IS NULL OR (weekly_target_hours > 0 AND weekly_target_hours <= 168));

COMMENT ON COLUMN quests.weekly_target_hours IS
  'Jatah jam FOCUS per minggu (Senin-Minggu WIB) untuk HFG ini. NULL = belum diatur.';

-- Harapan pro-rata hari kerja Senin-Jumat yang SUDAH lewat (hari ini tidak dihitung).
-- Sabtu & Minggu = target penuh (jam akhir pekan = bonus). Minggu 13 kuartal = istirahat, tanpa status.
CREATE OR REPLACE FUNCTION public.hfg_expected_minutes(
  p_target_hours numeric,
  p_days_since_monday integer,
  p_week_in_quarter integer
)
RETURNS integer
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN p_target_hours IS NULL OR p_target_hours <= 0 OR p_week_in_quarter >= 13 THEN 0
    ELSE round(p_target_hours * 60 * LEAST(p_days_since_monday, 5) / 5.0)::int
  END
$$;

-- Rumus status murni, ambang 80% dari harapan.
CREATE OR REPLACE FUNCTION public.hfg_pace_status(
  p_actual_minutes numeric,
  p_target_hours numeric,
  p_days_since_monday integer,
  p_week_in_quarter integer
)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN p_week_in_quarter >= 13 THEN 'REST_WEEK'
    WHEN p_target_hours IS NULL OR p_target_hours <= 0 THEN 'NO_TARGET'
    WHEN p_actual_minutes >= 0.8 * p_target_hours * 60 * LEAST(p_days_since_monday, 5) / 5.0 THEN 'ON_TRACK'
    ELSE 'AT_RISK'
  END
$$;

-- Status mingguan tiap HFG aktif. Tahun/kuartal perencanaan diturunkan dari tanggal,
-- sama dengan quarterUtils.getWeekAndYearFromDate + getQuarterFromWeek.
CREATE OR REPLACE FUNCTION public.hfg_weekly_status(
  p_user_id uuid,
  p_today date DEFAULT (now() AT TIME ZONE 'Asia/Jakarta')::date
)
RETURNS TABLE (
  quest_id uuid,
  title text,
  urut integer,
  weekly_target_hours numeric,
  actual_minutes integer,
  expected_minutes integer,
  status text,
  week_start date,
  week_end date,
  year integer,
  quarter integer,
  week_in_quarter integer
)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  WITH d AS (
    SELECT p_today AS today,
           date_trunc('week', p_today)::date AS wk_start,
           CASE
             WHEN p_today >= date_trunc('week', make_date(extract(year FROM p_today)::int + 1, 1, 1))::date
               THEN extract(year FROM p_today)::int + 1
             ELSE extract(year FROM p_today)::int
           END AS pyear
  ),
  w AS (
    SELECT d.*,
           ((d.today - date_trunc('week', make_date(d.pyear, 1, 1))::date) / 7) + 1 AS week_of_year
    FROM d
  ),
  cur AS (
    SELECT w.today, w.wk_start, w.pyear,
           w.today - w.wk_start AS dsm,  -- Senin=0 ... Minggu=6
           LEAST(4, (w.week_of_year - 1) / 13 + 1) AS q,
           w.week_of_year - (LEAST(4, (w.week_of_year - 1) / 13 + 1) - 1) * 13 AS wiq
    FROM w
  ),
  hfg AS (
    SELECT qs.id, qs.title, qs.weekly_target_hours,
           row_number() OVER (
             ORDER BY coalesce(substring(qs.description FROM 'Urut antrean ([0-9]+)')::int, 99),
                      qs.priority_score DESC NULLS LAST,
                      qs.title
           )::int AS rn
    FROM quests qs
    CROSS JOIN cur
    WHERE qs.user_id = p_user_id
      AND qs.year = cur.pyear
      AND qs.quarter = cur.q
      AND qs.is_committed
      AND qs.status::text <> 'DONE'
  ),
  -- Sama dengan hfg_jam() di second-brain/2.Areas/system-config/scripts/vps/beplan-lapor.py,
  -- ditambah: sub task diatribusikan lewat parent task, filter FOCUS eksplisit.
  focus AS (
    SELECT m.quest_id AS qid, sum(al.duration_minutes)::int AS minutes
    FROM activity_logs al
    CROSS JOIN cur
    JOIN tasks t ON t.id = al.task_id
    LEFT JOIN tasks p ON p.id = t.parent_task_id
    JOIN milestones m ON m.id = coalesce(t.milestone_id, p.milestone_id)
    WHERE al.user_id = p_user_id
      AND al.type::text = 'FOCUS'
      AND al.local_date BETWEEN cur.wk_start AND cur.wk_start + 6
    GROUP BY m.quest_id
  )
  SELECT h.id,
         h.title,
         h.rn,
         h.weekly_target_hours,
         coalesce(f.minutes, 0),
         public.hfg_expected_minutes(h.weekly_target_hours, cur.dsm, cur.wiq),
         public.hfg_pace_status(coalesce(f.minutes, 0), h.weekly_target_hours, cur.dsm, cur.wiq),
         cur.wk_start,
         cur.wk_start + 6,
         cur.pyear,
         cur.q,
         cur.wiq
  FROM hfg h
  CROSS JOIN cur
  LEFT JOIN focus f ON f.qid = h.id
  ORDER BY h.rn
$$;

COMMENT ON FUNCTION public.hfg_weekly_status(uuid, date) IS
  'app-dwhq: jam FOCUS minggu ini vs jatah per HFG + status. Konsumen: dashboard BePlan, bot Telegram (sb-1fy).';
