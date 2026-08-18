# 🗺️ Roadmap: Better Planner

> **File ini = peta arah project.** Sumber tunggal visi + status + next up.
> Visi & scope detail di [`BRD.md`](./BRD.md). Skema data di [`ERD.sql`](./ERD.sql). Task detail di beads (`bd list`, prefix `bp-`). Plan per-fitur di [`../plans/`](../plans/).
> Diperbarui: 2026-08-18 · Status: **Semua 8 fitur BRD live, 0 beads open. Email+AI kode lengkap — tinggal isi API key di Vercel untuk aktif.**

---

## 🎯 MVP & Post-MVP

> **Definisi MVP:** 8 fitur F-01…F-08 BRD bisa dipakai harian tanpa balik ke Google Sheets.
> Aturan pilah: *"Kalau fitur ini belum ada, apakah saya masih perlu buka Sheets?"* → ya = MVP, tidak = Post-MVP.

### MVP — SEKARANG (jalur ke: lepas Google Sheets)

| # | Item | Kenapa MVP | Status |
|---|---|---|---|
| ✅ | ~~F-01 Dashboard~~ | Ringkasan harian/mingguan — **DONE** | ✅ |
| ✅ | ~~F-02 Quest (Visi → 12-Week → Main → Daily/Work/Side)~~ | Inti sistem 13-week — **DONE** | ✅ |
| ✅ | ~~F-03 Weekly Sync + To-Don't~~ | Bank tugas + jadwal mingguan — **DONE** | ✅ |
| ✅ | ~~F-04 Daily Sync (Pomodoro, Brain Dump, log otomatis)~~ | Kokpit eksekusi harian — **DONE** | ✅ |
| ✅ | ~~F-06 Review kuartalan (12 Week Sync)~~ | Refleksi akhir kuartal — **DONE** (`bp-a63`) | ✅ |
| ✅ | ~~F-07 Settings (profil, notifikasi)~~ | **DONE** | ✅ |
| ✅ | ~~F-08 Best Week~~ | Template minggu ideal — **DONE** | ✅ |
| ✅ | ~~F-05 Habit — polish (day nav + multi-completion)~~ | Mobile lihat hari lalu + habit N×/hari — **DONE** (`bp-uv4`, `bp-0df`) | ✅ |
| ✅ | ~~Kualitas: metadata standar, E2E 9 area~~ | **DONE** (`bp-8m5`, `bp-ztv`) | ✅ |
| 1 | **Aktivasi email+AI** (bukan kode — konfigurasi) | Kode epic `bp-2we` selesai; perlu key | ⏳ manual, lihat Catatan |

### Post-MVP — NANTI (parkiran ide, bukan blocker)

| Item | Isi | Catatan |
|---|---|---|
| Web Push notification | Notifikasi browser (timer selesai, reminder) | Plan: [web-push](../plans/2026-03-31-web-push-notifications-design.md). Nunggu kebutuhan nyata |
| Per-user jam kirim email | Sekarang fixed 06:00 WIB via `daily-pipeline` | Butuh Vercel Pro (multi cron) atau queue per jam |
| Email tracking (open/click) | Kolom `opened_at/clicked_at` sudah ada di `notification_history` | Butuh Resend webhook |
| Real-time sync antar tab/device | SSE / WebSocket (lihat [notes](./notes.md)) | Ide, belum ada kebutuhan |

---

## 🗂️ Manajemen Sesi (Claude)

| Tipe sesi | Untuk | Naming | Batch |
|---|---|---|---|
| **plan** | Diskusi ide + bikin beads + plan + prompt | `bp-<id> plan-<slug>` | ✅ banyak plan/sesi |
| **review** | Review hasil executor → fix → close → commit | `bp-<id> review-<slug>` | ✅ 2-4 issue kecil |
| **bugfix** | Debug error/regresi runtime | `bp-<id> bugfix-<slug>` | ❌ fokus 1 |
| **discuss** | Diskusi global / arah projek (tanpa issue) | `bp discuss-<topik>` | — |

**Naming = title deskriptif**, bukan cuma kode. Batch sejenis+kecil; sesi baru saat fase ganti / issue besar / context ~70%.

## 📅 Timeline

| Tanggal | Fase | Catatan |
|---|---|---|
| 2025-06 | BRD | Visi + scope F-01…F-08 dibekukan |
| 2026-03 | Build MVP | Quest/Weekly/Daily 3-layer refactor, Best Week, 12 Week Sync, Habit Tracker MVP, E2E setup |
| 2026-04 | Polish | Brain Dump page, delete activity log, habit/metadata plan, perf edge-request (SWR) |
| 2026-06 | Bugfix | `bp-kup` weekly_goals cross-quarter overwrite; roadmap pertama |
| 2026-07 | Bugfix | `bp-byp` pomodoro: double log, durasi cap, counter quest |
| 2026-08-18 | Bugfix + docs | `bp-nuk` bar Total focus time tidak refresh; `bp-l4h` dead code; roadmap ke template standar |
| 2026-08-18 | Root-cause counter | `bp-nuk` reopen: satu sinyal `notifyActivityLogsChanged()` di semua jalur + timer progress dari data live |
| 2026-08-18 | Sapu bersih beads | Habit day-nav + multi-completion (`bp-uv4`,`bp-0df`), metadata standar (`bp-8m5`), E2E 9 spec (`bp-ztv`), epic email diverifikasi + bugfix (`bp-2we`). 0 open. |

## 🎯 Visi

Mengubah sistem perencanaan personal (asalnya Google Sheets) jadi aplikasi web yang **intuitif, terautomasi, mobile-first**. Inti: sistem **13-week Quarter Planning** yang menurunkan Visi → 12 Week Quest → tugas mingguan → eksekusi harian, plus pelacakan kebiasaan, timer Pomodoro, dan laporan AI.

Target pengguna: individu proaktif berorientasi tujuan yang butuh alat terstruktur untuk produktivitas pribadi + profesional.

---

## 📊 Status

Legenda: ✅ jadi · 🔄 sebagian / ada perbaikan terbuka · ⏳ belum jalan

| Item | Status | Route | Catatan / Issue |
|---|---|---|---|
| **F-01** Dashboard Utama | ✅ | `/dashboard` | — |
| **F-02** Manajemen Quest | ✅ | `/planning/vision`, `/planning/12-week-quests`, `/planning/main-quests`, `/quests/*` | [main-quests-types](../plans/2026-03-21-main-quests-types-design.md), [work-quests-3layer](../plans/2026-03-17-work-quests-3layer-refactor.md) |
| **F-03** Weekly Sync + To-Don't | ✅ | `/execution/weekly-sync` (+ `ToDontList/`) | [12-week-sync-mvp](../plans/2026-03-29-12-week-sync-mvp.md) |
| **F-04** Daily Sync (Pomodoro, Brain Dump, log) | ✅ | `/execution/daily-sync`, `/execution/brain-dump` | [daily-plan-3layer](../plans/2026-03-19-daily-plan-schedule-3layer-refactor.md), [brain-dump](../plans/2026-04-27-brain-dump-page-implementation-plan.md), [bp-byp](../plans/2026-07-27-bp-byp-pomodoro-timer-bugs.md) |
| **F-05** Habit Tracker | ✅ | `/habits/today`, `/habits/monthly` | Day nav + `daily_target` multi-completion — [plan](../plans/2026-04-13-habit-nav-multicompletion-design.md) |
| **F-06** Review & Laporan | 🔄 | `/planning/12-week-sync` (+ `history/`), `/settings/notifications`, `/api/cron/daily-pipeline` | Review kuartalan ✅ (`bp-a63`); email+AI kode ✅ (`bp-2we`) tapi **belum aktif** — perlu key (lihat Catatan) |
| **F-07** Pengaturan | ✅ | `/settings/profile`, `/settings/notifications` | [dynamic-user-profile](../plans/2026-03-21-dynamic-user-profile-design.md) |
| **F-08** Strategis (To-Don't, Best Week) | ✅ | `/execution/weekly-sync/ToDontList`, `/planning/best-week` | [best-week](../plans/2026-03-27-best-week-design.md) |

**Ringkasan:** 7 dari 8 ✅, F-06 🔄 hanya karena aktivasi email belum dilakukan (kode selesai). Beads: **65 closed / 66 total**, 0 open.

---

## 🚧 Next Up

Beads kosong. Yang tersisa = tindakan manual (bukan kode):

### ⚡ P2 — Aktivasi email+AI (manual, ±15 menit)
- [ ] Vercel env: `RESEND_API_KEY`, `EMAIL_FROM` (domain terverifikasi di Resend), `GEMINI_API_KEY`, `CRON_SECRET` (random ≥32 char), `NEXT_PUBLIC_SITE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Buka `/settings/notifications` → aktifkan + pilih frekuensi (user lama shape settings sudah dimigrasi)
- [ ] Smoke test: `curl -X POST -H "Authorization: Bearer $CRON_SECRET_TOKEN" https://<app>/api/cron/daily-pipeline` → cek `notification_history` terisi
- [ ] Set `NEXT_PUBLIC_ENABLE_TIMER_DEV=true` di `.env.local` kalau mau E2E timer flow jalan lokal

---

## 📌 Catatan

- **2026-08-18:** `bp-7xt` closed (duplikat `bp-a63`, GH-#4 sudah live). `bp-vjx` (stop 2× klik) closed — tidak reproduce setelah `bp-byp`; reopen kalau muncul lagi.
- **Email epic (2026-08-18):** kode 7 sub-task ternyata sudah ada di master sebelum di-close; yang diperbaiki = insert `notification_history` (kolom salah → gagal diam-diam), unsubscribe URL (pakai `NEXT_PUBLIC_SITE_URL`), settings actions (`.eq('id')` → `user_id` + upsert), DB default `notification_settings` (shape lama → baru + backfill), Gemini diaktifkan bila key ada (`GEMINI_MODEL` default `gemini-2.5-flash`), `api/test/**` 404 di production, cronAuth UA-bypass hanya kalau tak ada secret. `vercel.json` cuma jadwalkan `daily-pipeline` (Hobby plan) — 6 route `/api/cron/*` lain = manual trigger.
- **Habit multi-completion:** 1 baris `habit_completions` = 1 completion; hari "selesai" bila count ≥ `habits.daily_target` (streak & monthly goal ikut aturan ini). Toggle di monthly grid = isi penuh / kosongkan hari.
- **E2E:** helper `tests/e2e/helpers/db.ts`; coverage map di `docs/claude/e2e-testing-patterns.md`.
- **Cache SWR daily-sync:** `dedupingInterval` 5 menit sengaja (hemat edge request, plan [reduce-edge-requests](../plans/2026-04-21-reduce-edge-requests-swr-optimization.md)). Konsekuensi: tiap path yang ubah `activity_logs` **wajib** panggil `notifyActivityLogsChanged()` (`src/lib/swr.ts`) — satu sinyal untuk list, counter card, Total focus bar, dan teks progress timer. Jangan tambah `mutate` manual per handler lagi (itu akar bug berulang bp-6ka → bp-byp → bp-nuk).
- **Realtime Supabase belum aktif** untuk `activity_logs`/`timer_sessions` (`pg_publication_tables` kosong) → channel di `useRealtimeSync` diam. Kalau mau counter ikut update dari cron `auto-complete-timers` / device lain tanpa reload: `alter publication supabase_realtime add table activity_logs;` (uji dulu, handler completeTimerFromDatabase ikut hidup).
- **Prinsip dokumen:** BRD = beku (visi/scope). Roadmap = hidup (status/progress). Plan files = detail eksekusi per-fitur. Beads = task aktif. Update roadmap tiap `bd close` / arah berubah.

---

## 📜 Changelog

- **2026-08-18** — Sapu bersih: 12→0 open. F-05 ✅, F-06 kode ✅ (aktivasi manual di Next Up), Post-MVP diganti ide lanjutan (per-user jam kirim, email tracking). Timeline +1 baris.
- **2026-08-18** — Migrasi ke template standar: +MVP/Post-MVP, Manajemen Sesi, Timeline, Catatan, Changelog. Epic email dipindah ke Post-MVP. Sync beads 15→12 open (close bp-7xt duplikat, bp-vjx tak reproduce, bp-nuk & bp-l4h selesai).
- **2026-06-21** — Roadmap pertama: tabel status F-01…F-08 + next up.
