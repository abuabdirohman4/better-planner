# 🗺️ Roadmap: Better Planner

> **File ini = peta arah project.** Sumber tunggal visi + status + next up.
> Visi & scope detail di [`BRD.md`](./BRD.md). Skema data di [`ERD.sql`](./ERD.sql). Task detail di beads (`bd list`, prefix `bp-`). Plan per-fitur di [`../plans/`](../plans/).
> Diperbarui: 2026-08-18 · Status: **MVP (8 fitur BRD) sudah live & dipakai harian; sisa = polish Habit, kualitas (E2E, metadata), epic email+AI diparkir.**

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
| 1 | **F-05 Habit — polish** (day nav + multi-completion) | Habit MVP jalan, tapi mobile perlu lihat hari lalu + habit N×/hari | 🔄 `bp-uv4`, `bp-0df` |

### Post-MVP — NANTI (parkiran ide, bukan blocker)

| Item | Isi | Catatan |
|---|---|---|
| Email notification + AI report | Epic `bp-2we` (7 sub-task): Gemini 4 persona, Resend queue, React Email, 6 cron route, settings UI, env, E2E | Butuh API key Gemini + Resend + domain email. Infra cron/aggregation/tabel sudah ada (5/12 sub closed). Plan: [email-notification](../plans/2026-03-21-email-notification-design.md) |
| Web Push notification | Notifikasi browser (timer selesai, reminder) | Plan: [web-push](../plans/2026-03-31-web-push-notifications-design.md). Nunggu kebutuhan nyata |
| E2E full coverage | Playwright semua area (`bp-ztv`) | Bertahap per sesi; sekarang 4 spec (auth, daily-sync, quest, timer) |
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
| **F-05** Habit Tracker | 🔄 | `/habits/today`, `/habits/monthly` | MVP jalan; polish `bp-uv4` (day nav), `bp-0df` (multi-completion) — [plan](../plans/2026-04-13-habit-nav-multicompletion-design.md) |
| **F-06** Review & Laporan | 🔄 | `/planning/12-week-sync` (+ `history/`) | Review kuartalan manual ✅ (`bp-a63`); laporan AI/email ⏳ (epic `bp-2we`, Post-MVP) |
| **F-07** Pengaturan | ✅ | `/settings/profile`, `/settings/notifications` | [dynamic-user-profile](../plans/2026-03-21-dynamic-user-profile-design.md) |
| **F-08** Strategis (To-Don't, Best Week) | ✅ | `/execution/weekly-sync/ToDontList`, `/planning/best-week` | [best-week](../plans/2026-03-27-best-week-design.md) |

**Ringkasan:** 6 dari 8 ✅, 2 🔄. F-05 tinggal polish (plan siap). F-06 bagian AI sengaja diparkir (butuh layanan eksternal). Beads: **54 closed / 66 total**, 12 open (8 = epic email).

---

## 🚧 Next Up

Urutan saran: fitur yang plan-nya sudah siap dulu (habit), lalu kualitas (metadata, E2E). Epic email = Post-MVP, bukan di sini.

### ⚡ P2 — Penting
- [ ] `bp-uv4` — Habit today: navigasi prev/next day — [plan](../plans/2026-04-13-habit-nav-multicompletion-implementation-plan.md)
- [ ] `bp-0df` — Habit multi-completion daily target (butuh migration `daily_target`) — [plan](../plans/2026-04-13-habit-nav-multicompletion-implementation-plan.md)
- [ ] `bp-8m5` — Standardize metadata placement antar-halaman — [plan](../plans/2026-04-13-standardize-metadata-design.md)

### 🧹 P3 — Kualitas / Nice-to-have
- [ ] `bp-ztv` — E2E: perluas coverage (bertahap per area) — [plan](../plans/2026-03-21-playwright-e2e-setup-design.md)

---

## 📌 Catatan

- **2026-08-18:** `bp-7xt` closed (duplikat `bp-a63`, GH-#4 sudah live). `bp-vjx` (stop 2× klik) closed — tidak reproduce setelah `bp-byp`; reopen kalau muncul lagi.
- **Kandidat Antigravity:** `bp-uv4`+`bp-0df` (1 batch, plan file sudah ada) dan `bp-8m5` (mekanis, banyak file). Claude direct cukup untuk bugfix kecil.
- **Cache SWR daily-sync:** `dedupingInterval` 5 menit sengaja (hemat edge request, plan [reduce-edge-requests](../plans/2026-04-21-reduce-edge-requests-swr-optimization.md)). Konsekuensi: tiap path yang ubah `activity_logs` **wajib** `mutate(isFocusStatsKey)` (`src/lib/swr.ts`), bukan andalkan revalidate.
- **Prinsip dokumen:** BRD = beku (visi/scope). Roadmap = hidup (status/progress). Plan files = detail eksekusi per-fitur. Beads = task aktif. Update roadmap tiap `bd close` / arah berubah.

---

## 📜 Changelog

- **2026-08-18** — Migrasi ke template standar: +MVP/Post-MVP, Manajemen Sesi, Timeline, Catatan, Changelog. Epic email dipindah ke Post-MVP. Sync beads 15→12 open (close bp-7xt duplikat, bp-vjx tak reproduce, bp-nuk & bp-l4h selesai).
- **2026-06-21** — Roadmap pertama: tabel status F-01…F-08 + next up.
