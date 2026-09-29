# app-dwhq — Jatah jam per HFG per minggu + status ON TRACK / AT RISK (design)

## Masalah

Studi Superfocus (`~/Documents/second-brain/0.Inbox/superfocus/perbandingan_superfocus_vs_better_planner.md`)
menemukan pembeda terbesarnya: tiap goal punya **jatah jam per minggu**, jadi aplikasi bisa
membandingkan jam terpakai dengan jatah lalu menyimpulkan *On track* / *At risk*.
BePlan sudah punya jam aktual (timer → `activity_logs`), tapi tidak punya jatahnya. Untuk tahu
"HFG mana yang tertinggal minggu ini" Abu harus membuka Main Quests + Daily Sync lalu menghitung
di kepala.

Prinsip keputusan 29 Sep 2026 (`log_konsultasi.md`): *BePlan menghitung, Claude menimbang*.
Tidak ada AI di dalam app. Setelah issue ini jalan: bot Telegram VPS 21:00 (`sb-1fy`) memakai
angka yang sama, dan tab HFG di dashboard second-brain dipensiunkan.

## Apa itu "HFG" di skema

HFG (High Focus Goal) = baris `quests` dengan `is_committed = true` untuk `year`/`quarter`
berjalan. Tidak ada tabel khusus. Rantai data:

```
quests (is_committed)  ←  milestones.quest_id  ←  tasks.milestone_id  ←  activity_logs.task_id
                                                   ↑
                         sub task: milestone_id NULL, ambil dari parent (tasks.parent_task_id)
```

Catatan sub task diambil dari komentar migrasi `20260924000001_weekly_sync_item_order.sql`
("Sub task umumnya tanpa milestone_id, jadi milestone & urutannya diambil dari parent").

Q4 2026 memakai **HFG bergilir**: yang sudah `DONE` keluar, HFG berikutnya di-commit. Urutan
antrean ditulis di `quests.description` ("Urut antrean N"), cadangannya `priority_score`.
Aturan ini disalin dari `SQL_HFG` di `~/Documents/second-brain/tools/dashboard/generate.py:275`
supaya dashboard BePlan dan tab HFG lama menampilkan HFG yang sama.

## Keputusan (default — Abu boleh ubah)

| # | Keputusan | Alasan |
|---|---|---|
| 1 | Kolom baru `quests.weekly_target_hours NUMERIC(4,1)`, NULL = belum diatur | Jatah menempel pada goal, satu angka. Tidak perlu tabel per-minggu — jatah jarang berubah tiap minggu (YAGNI). |
| 2 | **Satu tempat hitung = fungsi SQL** `hfg_weekly_status(p_user_id, p_today)` | App (lewat `supabase.rpc`) dan bot Telegram (lewat SQL / PostgREST) membaca hasil yang sama persis. Fungsi TS murni tidak bisa dipakai bot Python tanpa menyalin rumus. |
| 3 | Rumus dipisah jadi dua fungsi SQL murni (IMMUTABLE): `hfg_expected_minutes(target_h, days_since_monday, week_in_quarter)` dan `hfg_pace_status(actual_min, target_h, days_since_monday, week_in_quarter)` | Bisa dites dengan `SELECT` literal tanpa data; satu baris diubah kalau ambang mau diganti. |
| 4 | Minggu = **Senin–Minggu, tanggal WIB** (`date_trunc('week', ...)`) | Sama dengan minggu perencanaan `quarterUtils` (Senin) dan Weekly Sync. |
| 5 | "Hari ini" dihitung **di SQL**: `(now() AT TIME ZONE 'Asia/Jakarta')::date` | Server action jalan di Vercel (UTC). Menghitung tanggal di TS sudah pernah salah (bug email rekap `toISOString`). |
| 6 | Tahun/kuartal diturunkan dari tanggal **di SQL** (port `getWeekAndYearFromDate` + `getQuarterFromWeek`) | Bot tidak perlu tahu kuartal. Dashboard selalu tentang **minggu ini**, tidak ikut pemilih kuartal di header. |
| 7 | Yang dihitung: `activity_logs.type = 'FOCUS'` saja, `local_date` (kolom `date`, WIB) dalam minggu itu | Dicek di DB 29 Sep: hanya log FOCUS yang punya `task_id`, jadi filter ini tidak mengubah angka dibanding `hfg_jam()` — dipasang agar tetap benar kalau suatu saat istirahat ikut membawa task. |
| 8 | Atribusi: `activity_logs → tasks → (parent task) → milestones → quests` | Rantai yang sudah dipakai `queryTasksByIds`/`queryMilestonesByIds` di Activity Log. Sesi tanpa milestone (side/daily/work quest) tidak masuk HFG mana pun. |
| 9 | Status mid-week: **pro-rata hari kerja Senin–Jumat yang sudah lewat, ambang 80%** (jawaban Abu 29 Sep) | Sabtu–Minggu waktu keluarga; jam akhir pekan = bonus. Lihat rumus di bawah. |
| 10 | Status `ON_TRACK` / `AT_RISK` / `NO_TARGET` / `REST_WEEK` | Target tercapai tetap `ON_TRACK`. **Minggu 13** (minggu istirahat kuartal, juga minggu ke-14 di tahun 53 minggu) = `REST_WEEK`: jam & jatah tetap tampil, tanpa ON TRACK/AT RISK dan tanpa "sisa" (jawaban Abu 29 Sep). |
| 11 | Target diedit di **Main Quests** (kartu Quest, di bawah motivasi); dashboard read-only | Main Quests tempat HFG dirumuskan (motivasi, milestone). Dashboard menampilkan tautan "Atur jatah" kalau NULL. |
| 12 | HFG yang ditampilkan: committed, `status <> 'DONE'`, kuartal berjalan, urut antrean | Cocok dengan HFG bergilir dan tab HFG lama. |

## Rumus status

```
dsm            = p_today - week_start                     -- Senin=0, Selasa=1, ..., Minggu=6
workdays       = LEAST(dsm, 5)                           -- hari kerja Sen–Jum yang SUDAH lewat
expected_min   = target_hours × 60 × workdays / 5        -- 0 kalau minggu 13 / tanpa target
status = REST_WEEK  kalau week_in_quarter >= 13
         NO_TARGET  kalau target NULL / <= 0
         ON_TRACK   kalau actual_min >= 0.8 × expected_min
         AT_RISK    selain itu
```

| Hari | workdays | Harapan (target 10 j) | Batas ON TRACK (80%) |
|---|---|---|---|
| Senin | 0 | 0 | 0 — selalu ON TRACK |
| Selasa | 1 | 2 j | 1,6 j |
| Rabu | 2 | 4 j | 3,2 j |
| Kamis | 3 | 6 j | 4,8 j |
| Jumat | 4 | 8 j | 6,4 j |
| Sabtu, Minggu | 5 | 10 j (penuh) | 8 j |

- **Hari ini tidak pernah dihitung**, termasuk Jumat. Fungsi hanya tahu tanggal, bukan jam, jadi
  aturannya sama tiap hari: jatah Jumat baru ditagih mulai Sabtu. Artinya laporan Telegram Jumat 21:00
  masih memakai harapan 4/5; vonis "target penuh" muncul Sabtu pagi. Kalau Abu ingin Jumat malam sudah
  dinilai penuh, cukup ubah `LEAST(dsm, 5)` jadi `LEAST(dsm + 1, 5)` di kedua fungsi — tapi Senin pagi
  pun ikut ditagih 1/5.
- **Akhir pekan = bonus**: jam Sabtu/Minggu tetap menambah `actual_minutes` (bisa menutup
  kekurangan), tapi harapan tidak bertambah lagi.
- Ambang 80% berarti Sabtu cukup 8 dari 10 jam untuk ON TRACK (dikonfirmasi Abu).

## Keluaran fungsi (satu baris per HFG)

| kolom | arti |
|---|---|
| `quest_id`, `title`, `urut` | identitas & urutan HFG |
| `weekly_target_hours` | jatah (NULL kalau belum diatur) |
| `actual_minutes` | menit FOCUS minggu ini untuk HFG ini |
| `expected_minutes` | harapan pro-rata hari kerja sampai kemarin (0 di minggu 13) |
| `status` | `ON_TRACK` / `AT_RISK` / `NO_TARGET` / `REST_WEEK` |
| `week_start`, `week_end` | Senin & Minggu minggu itu |
| `year`, `quarter`, `week_in_quarter` | label "W1 Q4 2026" |

## Alur data di app

```
dashboard/page.tsx
  └─ HfgWeeklyStatus (client)
       └─ useHfgWeekly()  SWR key ['hfg-weekly-status']
            └─ getHfgWeeklyStatus()  server action
                 └─ rpcHfgWeeklyStatus()  supabase.rpc('hfg_weekly_status', { p_user_id })
                 └─ toHfgCard(row)        logic murni: format "6.5h / 10h", persen, sisa jam
```

Main Quests: `Quest.tsx` input angka → `updateQuestWeeklyTarget(questId, hours|null)` →
`updateWeeklyTargetHours` query → `onQuestUpdate()` (mutate SWR main quests).

## Konsumen luar (bot Telegram, pengganti tab HFG second-brain)

Dua cara, pilih salah satu — keduanya membaca fungsi yang sama:

1. **Supabase Management API** (cara `generate.py` sekarang, kredensial `~/.config/beplan/supabase.json`):
   ```sql
   SELECT * FROM hfg_weekly_status('59076bab-b21c-49ce-a7d1-7b9d69a6001c');
   ```
2. **PostgREST** dengan service role key:
   `POST {SUPABASE_URL}/rest/v1/rpc/hfg_weekly_status` body `{"p_user_id":"59076bab-..."}`.

Fungsi `SECURITY INVOKER` (bawaan): lewat app, RLS membatasi ke user yang login; service role
dan Management API melewati RLS sehingga `p_user_id` wajib diisi. Bot cukup memformat baris,
tidak menghitung apa pun.

## Beda dengan `hfg_jam()` bot Telegram

Acuan: `hfg_jam()` di `~/Documents/second-brain/2.Areas/system-config/scripts/vps/beplan-lapor.py:146`.
Diverifikasi ke DB 29 Sep 2026 (read-only): untuk minggu 14–20 Sep kedua cara menghasilkan
OIMS 675 / Sistem Kerja 300 / YouTube Finance 75 menit — **identik**. Yang sama persis: batas minggu
Senin WIB (`local_date`), `duration_minutes`, HFG = committed & `status <> 'DONE'`, atribusi
task → milestone → quest. Bedanya (skrip VPS TIDAK diubah di issue ini):

| # | `hfg_jam()` | `hfg_weekly_status` | Dampak | Usulan untuk skrip |
|---|---|---|---|---|
| 1 | `JOIN milestones m ON m.id = t.milestone_id` — sub task tanpa `milestone_id` hilang | `coalesce(t.milestone_id, parent.milestone_id)` | Bug laten. Sekarang 0 menit (sub task yang pernah di-timer punya milestone sendiri), tapi jam sub task langkah HFG akan hilang dari laporan begitu terjadi | Ganti bot membaca `hfg_weekly_status` |
| 2 | Tanpa filter `type` | `type = 'FOCUS'` | Nol — di DB hanya log FOCUS yang punya `task_id` | — |
| 3 | Kuartal = `(year, quarter)` committed terbaru | Kuartal dari tanggal (port `quarterUtils`) | Beda hanya kalau HFG kuartal berikutnya sudah di-commit sebelum kuartal berjalan habis (mis. menyusun Q1 di minggu 13): bot pindah ke HFG baru (0 jam), app tetap HFG kuartal berjalan | Ikut fungsi |
| 4 | `jam(m)` = `f'{m/60:.1f}'` — Python membulatkan *half-to-even*: 75 mnt → "1,2" | `formatHours`: 75 mnt → "1.3h" | Tampilan beda 0,1 di menit x,x5 (15, 45, 75, …). Angka menit sama | Bulatkan dari menit: `f'{round(m/6)/10}'` tidak cukup (juga half-even); pakai `int(m/6 + 0.5)/10` |
| 5 | Status ✅/⚠️ = aktual vs **rencana** `task_schedules` (ambang 70%) | Status = aktual vs **jatah** mingguan (ambang 80%, hari kerja) | Dua pertanyaan berbeda; label bisa bertentangan | Setelah ini jalan, ganti baris HFG bot ke `status` dari fungsi (boleh tetap tampilkan rencana sebagai info) |
| 6 | Urut `h.title` | Urut antrean (`description` "Urut antrean N"), lalu `priority_score` | Urutan tampil saja | Ikut fungsi |

## Di luar scope

- Jatah per minggu yang berbeda-beda (tabel `weekly_targets`) — tambah kalau Abu memang sering
  mengubah jatah per minggu.
- Status di header Daily Sync (usulan Gemini) dan tombol *Schedule it*.
- Pensiun tab HFG second-brain dan bot `sb-1fy` — kerjaan repo second-brain, setelah ini jalan.
- Atribusi sesi Side/Work Quest ke HFG.

## Verifikasi skema DB (29 Sep 2026, via MCP)
- `activity_logs.local_date` = `date`, terisi di semua 281 log 30 hari terakhir.
- Enum `activity_log_type` = `FOCUS,BREAK`; `quest_status` = `TODO,IN_PROGRESS,DONE`.
- `activity_logs.energy` dan `quests.weekly_target_hours` belum ada; migrasi baru aman.
- `daily_plan_items`: `item_id,item_type,daily_plan_id`; 4 quest committed memuat "Urut antrean".
