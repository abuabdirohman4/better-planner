# app-dwhq — Jatah jam per HFG per minggu + status ON TRACK / AT RISK (implementation plan)

Design & alasan tiap keputusan: `docs/plans/2026-09-29-app-dwhq-jatah-jam-hfg-design.md`. **Baca dulu.**

Ringkas: kolom `quests.weekly_target_hours` + fungsi SQL `hfg_weekly_status` (satu-satunya tempat
hitung, dipakai app & bot Telegram) + kartu 3 HFG di dashboard + input jatah di Main Quests.

## Latar teknis yang wajib dipahami

- HFG = `quests.is_committed = true` untuk kuartal berjalan. Jam aktual = `activity_logs`
  `type = 'FOCUS'` → `tasks` → (parent task kalau sub task) → `milestones.quest_id`.
- **Jangan menghitung tanggal/minggu/status di TS.** Semua di SQL (server action jalan di UTC).
  TS hanya memformat angka yang sudah jadi.
- Proyek tidak punya tipe DB hasil generate — tidak ada file tipe yang perlu diregenerasi.
- `makeSupabase()` di `src/test-utils/supabase-mock.ts` sudah punya `rpc: vi.fn()`.
- Cache SWR persisten di localStorage. Kartu dashboard memakai **key baru**
  `['hfg-weekly-status']`, jadi aman. Main Quests hanya *menambah* field, key lama tetap aman.

---

## Task 0 — Migrasi SQL (executor MENULIS file, **Abu yang menerapkan**)

**File baru:** `supabase/migrations/20260929000002_hfg_weekly_target.sql`

```sql
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
                      qs.priority_score DESC NULLS LAST
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
```

**Executor:** JANGAN menerapkan migrasi. Tulis file saja, lalu berhenti dan beri tahu:
> "Task 0 selesai: file migrasi siap. Abu, terapkan `supabase/migrations/20260929000002_hfg_weekly_target.sql`
> ke project Supabase (SQL Editor atau MCP `better-planner` → `apply_migration`), lalu jalankan query verifikasi."

**Verifikasi (Abu / Claude reviewer, read-only setelah migrasi):**

```sql
-- 1) Rumus status (tanpa data). Target 10 jam; argumen: menit, target, hari sejak Senin, minggu ke-
SELECT hfg_pace_status(0, 10, 0, 1)     AS senin_kosong,    -- ON_TRACK  (harapan 0)
       hfg_pace_status(280, 10, 3, 1)   AS kamis_280m,      -- AT_RISK   (harapan 360, batas 288)
       hfg_pace_status(290, 10, 3, 1)   AS kamis_290m,      -- ON_TRACK
       hfg_pace_status(380, 10, 4, 1)   AS jumat_380m,      -- AT_RISK   (Jumat: harapan 480, batas 384)
       hfg_pace_status(470, 10, 5, 1)   AS sabtu_470m,      -- AT_RISK   (harapan penuh 600, batas 480)
       hfg_pace_status(480, 10, 6, 1)   AS minggu_480m,     -- ON_TRACK
       hfg_pace_status(0, 10, 3, 13)    AS minggu13,        -- REST_WEEK
       hfg_pace_status(30, NULL, 3, 1)  AS tanpa_target;    -- NO_TARGET

SELECT hfg_expected_minutes(10, 0, 1)  AS senin,   -- 0
       hfg_expected_minutes(10, 3, 1)  AS kamis,   -- 360
       hfg_expected_minutes(10, 5, 1)  AS sabtu,   -- 600
       hfg_expected_minutes(10, 6, 1)  AS minggu,  -- 600
       hfg_expected_minutes(10, 3, 13) AS m13;     -- 0

-- 2) Minggu & kuartal: 29 Sep 2026 = W1 Q4 2026, minggu 28 Sep - 4 Okt
SELECT title, year, quarter, week_in_quarter, week_start, week_end, actual_minutes, status
FROM hfg_weekly_status('59076bab-b21c-49ce-a7d1-7b9d69a6001c', '2026-09-29');

-- 3) Cek atribusi: total FOCUS minggu ini vs yang masuk HFG (selisih = side/work/daily quest)
SELECT sum(duration_minutes) AS total_focus
FROM activity_logs
WHERE user_id = '59076bab-b21c-49ce-a7d1-7b9d69a6001c' AND type::text = 'FOCUS'
  AND local_date::date BETWEEN date_trunc('week', (now() AT TIME ZONE 'Asia/Jakarta')::date)::date
                           AND date_trunc('week', (now() AT TIME ZONE 'Asia/Jakarta')::date)::date + 6;
```

Hasil (2) harus berisi HFG aktif Q4 (per 29 Sep: YouTube Finance, Sistem Sabilillah, YouTube Music AI;
Web Portfolio sudah DONE jadi tidak muncul).

```sql
-- 4) Cocokkan dengan hfg_jam() bot Telegram (beplan-lapor.py) — query ASLI bot, bagian akt.
--    Kolom hfg_jam dan fungsi harus SAMA per HFG. Contoh terverifikasi 29 Sep 2026 untuk
--    minggu 14-20 Sep (Q3): OIMS 675/675, Sistem Kerja 300/300, YouTube Finance 75/75.
WITH h AS (SELECT id, title FROM quests WHERE user_id = '59076bab-b21c-49ce-a7d1-7b9d69a6001c'
             AND is_committed AND status <> 'DONE'
             AND (year, quarter) = (SELECT year, quarter FROM quests
                  WHERE user_id = '59076bab-b21c-49ce-a7d1-7b9d69a6001c' AND is_committed
                  ORDER BY year DESC, quarter DESC LIMIT 1)),
akt AS (SELECT m.quest_id, sum(al.duration_minutes) mnt
        FROM activity_logs al JOIN tasks t ON t.id = al.task_id
        JOIN milestones m ON m.id = t.milestone_id
        WHERE al.user_id = '59076bab-b21c-49ce-a7d1-7b9d69a6001c'
          AND al.local_date BETWEEN date_trunc('week', (now() AT TIME ZONE 'Asia/Jakarta')::date)::date
                                AND (now() AT TIME ZONE 'Asia/Jakarta')::date
        GROUP BY 1)
SELECT h.title, coalesce(akt.mnt, 0) AS hfg_jam, s.actual_minutes AS fungsi
FROM h LEFT JOIN akt ON akt.quest_id = h.id
LEFT JOIN hfg_weekly_status('59076bab-b21c-49ce-a7d1-7b9d69a6001c') s ON s.quest_id = h.id
ORDER BY h.title;
```

Kalau berbeda: satu-satunya sebab yang sah adalah log pada **sub task tanpa milestone_id** (fungsi
menghitungnya lewat parent, bot belum). Per 29 Sep 2026 menit semacam itu = 0 di Q3/Q4.

---

## Task 1 — Logic murni format kartu (TDD)

**File test baru:** `src/app/(admin)/dashboard/actions/hfg-weekly/__tests__/logic.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import { formatHours, toHfgCard, buildHfgSummary, type HfgWeeklyRow } from '../logic';

const row = (over: Partial<HfgWeeklyRow> = {}): HfgWeeklyRow => ({
  quest_id: 'q1',
  title: 'GM',
  urut: 1,
  weekly_target_hours: 10,
  actual_minutes: 390,
  expected_minutes: 257,
  status: 'ON_TRACK',
  week_start: '2026-09-28',
  week_end: '2026-10-04',
  year: 2026,
  quarter: 4,
  week_in_quarter: 1,
  ...over,
});

describe('formatHours', () => {
  it('membulatkan ke 0.1 jam dan membuang .0', () => {
    expect(formatHours(390)).toBe('6.5h');
    expect(formatHours(600)).toBe('10h');
    expect(formatHours(0)).toBe('0h');
    expect(formatHours(25)).toBe('0.4h');
  });
});

describe('toHfgCard', () => {
  it('menghitung label, persen, dan sisa', () => {
    expect(toHfgCard(row())).toEqual({
      questId: 'q1',
      title: 'GM',
      status: 'ON_TRACK',
      actualLabel: '6.5h',
      targetLabel: '10h',
      percent: 65,
      remainingLabel: 'sisa 3.5h',
    });
  });

  it('menerima numeric sebagai string dari PostgREST', () => {
    expect(toHfgCard(row({ weekly_target_hours: '10.0' as unknown as number })).targetLabel).toBe('10h');
  });

  it('persen mentok 100 dan sisa jadi "tercapai" kalau target lewat', () => {
    const card = toHfgCard(row({ actual_minutes: 700 }));
    expect(card.percent).toBe(100);
    expect(card.remainingLabel).toBe('tercapai');
  });

  it('minggu 13: jam & target tetap tampil, tanpa sisa (tidak dinilai)', () => {
    const card = toHfgCard(row({ status: 'REST_WEEK', week_in_quarter: 13 }));
    expect(card.status).toBe('REST_WEEK');
    expect(card.actualLabel).toBe('6.5h');
    expect(card.targetLabel).toBe('10h');
    expect(card.remainingLabel).toBeNull();
  });

  it('tanpa target: targetLabel & remainingLabel null, persen 0', () => {
    const card = toHfgCard(row({ weekly_target_hours: null, status: 'NO_TARGET' }));
    expect(card.targetLabel).toBeNull();
    expect(card.remainingLabel).toBeNull();
    expect(card.percent).toBe(0);
  });
});

describe('buildHfgSummary', () => {
  it('kosong → weekLabel null, cards []', () => {
    expect(buildHfgSummary([])).toEqual({ weekLabel: null, cards: [] });
  });

  it('memberi label minggu dari baris pertama dan menjaga urutan', () => {
    const s = buildHfgSummary([row(), row({ quest_id: 'q2', title: 'Sabilillah', urut: 2 })]);
    expect(s.weekLabel).toBe('W1 Q4 2026');
    expect(s.cards.map((c) => c.questId)).toEqual(['q1', 'q2']);
  });
});
```

Jalankan `npx vitest run "src/app/(admin)/dashboard/actions/hfg-weekly"` → **FAIL** (modul belum ada).

**File baru:** `src/app/(admin)/dashboard/actions/hfg-weekly/logic.ts`

```ts
export type HfgStatus = 'ON_TRACK' | 'AT_RISK' | 'NO_TARGET' | 'REST_WEEK';

// Satu baris hasil fungsi SQL hfg_weekly_status — semua hitungan sudah jadi di SQL.
export interface HfgWeeklyRow {
  quest_id: string;
  title: string;
  urut: number;
  weekly_target_hours: number | null;
  actual_minutes: number;
  expected_minutes: number;
  status: HfgStatus;
  week_start: string;
  week_end: string;
  year: number;
  quarter: number;
  week_in_quarter: number;
}

export interface HfgCard {
  questId: string;
  title: string;
  status: HfgStatus;
  actualLabel: string;
  targetLabel: string | null;
  percent: number;
  remainingLabel: string | null;
}

export interface HfgWeeklySummary {
  weekLabel: string | null;
  cards: HfgCard[];
}

export function formatHours(minutes: number): string {
  return `${Math.round(minutes / 6) / 10}h`;
}

export function toHfgCard(row: HfgWeeklyRow): HfgCard {
  const target = row.weekly_target_hours == null ? null : Number(row.weekly_target_hours);
  const targetMin = target ? target * 60 : 0;
  const remaining = targetMin && row.status !== 'REST_WEEK' ? Math.max(0, targetMin - row.actual_minutes) : null;
  return {
    questId: row.quest_id,
    title: row.title,
    status: row.status,
    actualLabel: formatHours(row.actual_minutes),
    targetLabel: target ? formatHours(targetMin) : null,
    percent: targetMin ? Math.min(100, Math.round((row.actual_minutes / targetMin) * 100)) : 0,
    remainingLabel: remaining === null ? null : remaining === 0 ? 'tercapai' : `sisa ${formatHours(remaining)}`,
  };
}

export function buildHfgSummary(rows: HfgWeeklyRow[]): HfgWeeklySummary {
  if (rows.length === 0) return { weekLabel: null, cards: [] };
  const first = rows[0];
  return {
    weekLabel: `W${first.week_in_quarter} Q${first.quarter} ${first.year}`,
    cards: rows.map(toHfgCard),
  };
}
```

Jalankan ulang → **PASS**.

## Task 2 — Query RPC + server action (TDD)

**File test baru:** `src/app/(admin)/dashboard/actions/hfg-weekly/__tests__/actions.test.ts`

```ts
// @vitest-environment node
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { makeSupabase } from '@/test-utils/supabase-mock';

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }));

import { createClient } from '@/lib/supabase/server';
import { getHfgWeeklyStatus } from '../actions';

beforeEach(() => vi.clearAllMocks());

describe('getHfgWeeklyStatus', () => {
  it('user belum login → ringkasan kosong, rpc tidak dipanggil', async () => {
    const supabase = makeSupabase({ user: null });
    vi.mocked(createClient).mockResolvedValue(supabase);
    expect(await getHfgWeeklyStatus()).toEqual({ weekLabel: null, cards: [] });
    expect(supabase.rpc).not.toHaveBeenCalled();
  });

  it('memanggil rpc hfg_weekly_status dengan p_user_id saja (tanggal dihitung SQL)', async () => {
    const supabase = makeSupabase({ user: { id: 'u1' } });
    supabase.rpc.mockResolvedValue({
      data: [{
        quest_id: 'q1', title: 'GM', urut: 1, weekly_target_hours: 10, actual_minutes: 390,
        expected_minutes: 257, status: 'ON_TRACK', week_start: '2026-09-28', week_end: '2026-10-04',
        year: 2026, quarter: 4, week_in_quarter: 1,
      }],
      error: null,
    });
    vi.mocked(createClient).mockResolvedValue(supabase);

    const result = await getHfgWeeklyStatus();

    expect(supabase.rpc).toHaveBeenCalledWith('hfg_weekly_status', { p_user_id: 'u1' });
    expect(result.weekLabel).toBe('W1 Q4 2026');
    expect(result.cards[0]).toMatchObject({ actualLabel: '6.5h', targetLabel: '10h', status: 'ON_TRACK' });
  });

  it('melempar error rpc supaya SWR menandai error', async () => {
    const supabase = makeSupabase({ user: { id: 'u1' } });
    supabase.rpc.mockResolvedValue({ data: null, error: { message: 'function does not exist' } });
    vi.mocked(createClient).mockResolvedValue(supabase);
    await expect(getHfgWeeklyStatus()).rejects.toMatchObject({ message: 'function does not exist' });
  });
});
```

Jalankan `npx vitest run "src/app/(admin)/dashboard/actions/hfg-weekly"` → **FAIL**.

**File baru:** `src/app/(admin)/dashboard/actions/hfg-weekly/queries.ts`

```ts
import type { SupabaseClient } from '@supabase/supabase-js';
import type { HfgWeeklyRow } from './logic';

export async function rpcHfgWeeklyStatus(supabase: SupabaseClient, userId: string): Promise<HfgWeeklyRow[]> {
  const { data, error } = await supabase.rpc('hfg_weekly_status', { p_user_id: userId });
  if (error) throw error;
  return (data ?? []) as HfgWeeklyRow[];
}
```

**File baru:** `src/app/(admin)/dashboard/actions/hfg-weekly/actions.ts`

```ts
"use server";

import { createClient } from '@/lib/supabase/server';
import { rpcHfgWeeklyStatus } from './queries';
import { buildHfgSummary, type HfgWeeklySummary } from './logic';

export type { HfgWeeklySummary };

export async function getHfgWeeklyStatus(): Promise<HfgWeeklySummary> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { weekLabel: null, cards: [] };
  return buildHfgSummary(await rpcHfgWeeklyStatus(supabase, user.id));
}
```

Jalankan ulang → **PASS**.

## Task 3 — Hook + kartu dashboard

**File baru:** `src/app/(admin)/dashboard/hooks/useHfgWeekly.ts`

```ts
"use client";

import useSWR from 'swr';
import { getHfgWeeklyStatus, type HfgWeeklySummary } from '../actions/hfg-weekly/actions';

export function useHfgWeekly() {
  return useSWR<HfgWeeklySummary>(['hfg-weekly-status'], () => getHfgWeeklyStatus(), {
    revalidateOnFocus: true, // jam bertambah dari timer di tab lain
    revalidateIfStale: true,
    dedupingInterval: 30 * 1000,
    errorRetryCount: 1,
    keepPreviousData: true,
  });
}
```

**File baru:** `src/app/(admin)/dashboard/components/HfgWeeklyStatus.tsx`

```tsx
"use client";

import Link from 'next/link';
import Skeleton from '@/components/ui/skeleton/Skeleton';
import { useHfgWeekly } from '../hooks/useHfgWeekly';
import type { HfgStatus } from '../actions/hfg-weekly/logic';

const STATUS: Record<HfgStatus, { label: string; text: string; bar: string }> = {
  ON_TRACK: { label: '● ON TRACK', text: 'text-green-600 dark:text-green-400', bar: 'bg-green-500' },
  AT_RISK: { label: '▲ AT RISK', text: 'text-red-600 dark:text-red-400', bar: 'bg-red-500' },
  NO_TARGET: { label: 'Belum ada jatah', text: 'text-gray-500 dark:text-gray-400', bar: 'bg-gray-300 dark:bg-gray-600' },
  REST_WEEK: { label: 'Minggu istirahat', text: 'text-gray-500 dark:text-gray-400', bar: 'bg-gray-300 dark:bg-gray-600' },
};

export default function HfgWeeklyStatus() {
  const { data, isLoading, error } = useHfgWeekly();

  if (isLoading && !data) return <Skeleton className="h-32 w-full rounded-xl" />;
  if (error || !data || data.cards.length === 0) return null;

  return (
    <section data-testid="dashboard-hfg-weekly" className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">Jam HFG minggu ini</h2>
        <span className="text-xs text-gray-500">{data.weekLabel}</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {data.cards.map((c) => {
          const s = STATUS[c.status];
          return (
            <div key={c.questId} data-testid="dashboard-hfg-card" className="rounded-lg border border-gray-100 dark:border-gray-800 p-4">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate" title={c.title}>{c.title}</p>
              <p className="mt-1 text-lg font-bold text-gray-900 dark:text-white">
                {c.actualLabel}
                {c.targetLabel && <span className="text-sm font-normal text-gray-500"> / {c.targetLabel}</span>}
              </p>
              <div className="mt-2 h-2 w-full rounded-full bg-gray-100 dark:bg-gray-800">
                <div className={`h-2 rounded-full ${s.bar}`} style={{ width: `${c.percent}%` }} />
              </div>
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className={`font-semibold ${s.text}`}>{s.label}</span>
                {c.remainingLabel ? (
                  <span className="text-gray-500">{c.remainingLabel}</span>
                ) : c.status === 'REST_WEEK' ? null : (
                  <Link href="/planning/main-quests" className="text-brand-500 hover:underline">Atur jatah</Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
```


**Edit:** `src/app/(admin)/dashboard/page.tsx`
- Tambah import di bawah baris 8: `import HfgWeeklyStatus from './components/HfgWeeklyStatus';`
- Di dalam grid (baris 28), sebelum blok `WeeklyProgressChartWrapper` (baris 29-31), sisipkan:

```tsx
        <div className="col-span-12">
          <HfgWeeklyStatus />
        </div>
```

(Tidak perlu test komponen — presentasional murni; logic sudah dites di Task 1-2.)

## Task 4 — Edit jatah di Main Quests (TDD untuk action)

**Test dulu** — tambah ke `src/app/(admin)/planning/main-quests/actions/quests/__tests__/actions.test.ts`
(tambahkan `updateQuestWeeklyTarget` ke import `'../actions'`):

```ts
describe('updateQuestWeeklyTarget', () => {
  it('menolak angka di luar 0 < jam <= 168', async () => {
    await expect(updateQuestWeeklyTarget('q1', 0)).rejects.toThrow('Jatah jam harus antara 0 dan 168');
    await expect(updateQuestWeeklyTarget('q1', 200)).rejects.toThrow('Jatah jam harus antara 0 dan 168');
  });

  it('menyimpan angka valid', async () => {
    const builder = makeQueryBuilder({ data: null, error: null });
    (createClient as any).mockResolvedValue(makeSupabase({ fromBuilder: builder }));
    await updateQuestWeeklyTarget('q1', 10);
    expect(builder.update).toHaveBeenCalledWith({ weekly_target_hours: 10 });
    expect(builder.eq).toHaveBeenCalledWith('id', 'q1');
  });

  it('null mengosongkan jatah', async () => {
    const builder = makeQueryBuilder({ data: null, error: null });
    (createClient as any).mockResolvedValue(makeSupabase({ fromBuilder: builder }));
    await updateQuestWeeklyTarget('q1', null);
    expect(builder.update).toHaveBeenCalledWith({ weekly_target_hours: null });
  });
});
```

Jalankan `npx vitest run "src/app/(admin)/planning/main-quests/actions/quests"` → **FAIL**.

**Edit:** `src/app/(admin)/planning/main-quests/actions/quests/queries.ts`
- Baris 111: select jadi `'id, title, motivation, priority_score, is_committed, weekly_target_hours'`.
- Tambah di akhir file (setelah `updateMotivation`, baris ~149):

```ts
export async function updateWeeklyTargetHours(
  supabase: SupabaseClient,
  questId: string,
  hours: number | null
) {
  const { error } = await supabase
    .from('quests')
    .update({ weekly_target_hours: hours })
    .eq('id', questId);
  if (error) throw error;
}
```

**Edit:** `src/app/(admin)/planning/main-quests/actions/quests/actions.ts`
- Tambah `updateWeeklyTargetHours,` ke import dari `'./queries'` (baris 5-16).
- Tambah di akhir file (setelah baris 99):

```ts
export async function updateQuestWeeklyTarget(questId: string, hours: number | null) {
  if (hours !== null && !(hours > 0 && hours <= 168)) {
    throw new Error('Jatah jam harus antara 0 dan 168');
  }
  const supabase = await createClient();
  await updateWeeklyTargetHours(supabase, questId, hours);
  revalidatePath('/planning/main-quests');
  revalidatePath('/dashboard');
}
```

(RLS `quests` membatasi update ke pemilik; pola sama dengan `updateQuestMotivation`.)

Jalankan ulang → **PASS**.

**Edit:** `src/app/(admin)/planning/main-quests/types.ts` — interface `Quest` tambah
`weekly_target_hours?: number | null`.

**Edit:** `src/app/(admin)/planning/main-quests/Quest.tsx`
- Import (baris 7): `import { updateQuestMotivation, updateQuestWeeklyTarget } from './actions/questActions';`
  (`questActions.ts` me-`export *` dari `./quests/actions`, jadi otomatis ikut.)
- `QuestProps` (baris 15-19) tambah `weekly_target_hours?: number | null;`
- State baru di bawah baris 25:

```tsx
  const [targetValue, setTargetValue] = useState(quest.weekly_target_hours?.toString() ?? '');

  const handleSaveTarget = async () => {
    const trimmed = targetValue.trim();
    const hours = trimmed === '' ? null : Number(trimmed);
    const current = quest.weekly_target_hours == null ? null : Number(quest.weekly_target_hours);
    if (hours === current) return;
    try {
      await updateQuestWeeklyTarget(quest.id, hours);
      onQuestUpdate?.();
    } catch {
      toast.error('Jatah jam harus antara 0 dan 168');
      setTargetValue(quest.weekly_target_hours?.toString() ?? '');
    }
  };
```

  Tambah `import { toast } from 'sonner';` di blok import.
- Sisipkan tepat setelah `</div>` penutup tombol Save motivasi (baris 113), sebelum `<Milestone`:

```tsx
          <div className="flex items-center gap-2 mb-3">
            <label htmlFor={`weekly-target-${quest.id}`} className="text-sm font-semibold">
              Jatah jam per minggu :
            </label>
            <input
              id={`weekly-target-${quest.id}`}
              data-testid="quest-weekly-target-input"
              type="number"
              inputMode="decimal"
              min={0.5}
              max={168}
              step={0.5}
              placeholder="mis. 10"
              className="border rounded px-2 py-1 text-sm w-20"
              value={targetValue}
              onChange={(e) => setTargetValue(e.target.value)}
              onBlur={handleSaveTarget}
              onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
            />
            <span className="text-sm text-gray-500">jam</span>
          </div>
```

## Task 5 — Verifikasi

1. `npm run test:run` → semua PASS (termasuk 3 file test baru/berubah).
2. `npm run type-check` → 0 error.
3. Manual (setelah Abu menerapkan migrasi Task 0; `npm run dev`, port 5100):
   - `/planning/main-quests` → isi "Jatah jam per minggu" tiap HFG (mis. 10, 8, 5) → Enter/klik luar.
     Reload: angka tetap ada. Isi `0` → toast error, angka kembali. Kosongkan → tersimpan NULL.
   - `/dashboard` → kartu "Jam HFG minggu ini" di paling atas, label `W1 Q4 2026`, 3 HFG urut antrean
     (YouTube Finance, Sistem Sabilillah, YouTube Music AI), angka `Xh / 10h`, status. HFG tanpa jatah → "Belum ada jatah" + tautan.
   - Bandingkan dengan pesan Telegram 21:00 malam itu: jam aktual per HFG harus sama (bot membulatkan ke bawah di angka x,x5 — lihat design, bagian "Beda dengan hfg_jam()").
   - Jalankan timer 1 sesi pada task milestone HFG → buka lagi dashboard → jam HFG itu bertambah.
   - Angka jam sama dengan query verifikasi (2) di Task 0.
4. Tampilan mobile (lebar 375): kartu tersusun 1 kolom, tidak ada scroll horizontal.

## Commit

```
feat(dashboard): jatah jam per HFG + status ON TRACK / AT RISK (app-dwhq)

fixes #25

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

## CLAUDE.md Check
- [ ] Business rule baru → `docs/claude/business-rules.md`: "HFG = quest committed kuartal berjalan; jam HFG = FOCUS minggu Senin–Minggu WIB lewat task → (parent) → milestone → quest; harapan = target × min(hari kerja Senin–Jumat yang sudah lewat, 5)/5, Sabtu–Minggu = target penuh, ambang 80%; minggu 13 = REST_WEEK tanpa status; sumber tunggal = fungsi SQL `hfg_weekly_status`".
- [ ] Fungsi SQL baru (`hfg_weekly_status`, `hfg_pace_status`, `hfg_expected_minutes`) + kolom `quests.weekly_target_hours` → `docs/claude/database-operations.md`, termasuk cara konsumen luar (Management API / PostgREST rpc).
- [ ] Tabel baru? Tidak (hanya kolom).
- [ ] Route baru? Tidak.
- [ ] Permission pattern baru? Tidak (fungsi SECURITY INVOKER, RLS tetap berlaku).
- [ ] `docs/products/roadmap.md` — update saat `bd close`.
