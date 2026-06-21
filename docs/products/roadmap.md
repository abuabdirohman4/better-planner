# 🗺️ Roadmap: Better Planner

> **File ini = peta arah produk.** Sumber tunggal visi + status fitur + next up.
> Visi & scope detail di [`BRD.md`](./BRD.md). Skema data di [`ERD.sql`](./ERD.sql). Task detail di beads (`bd list`, prefix `bp-`). Plan per-fitur di [`../plans/`](../plans/).
> Diperbarui: 2026-06-21

---

## 🎯 Visi

Mengubah sistem perencanaan personal (asalnya Google Sheets) jadi aplikasi web yang **intuitif, terautomasi, mobile-first**. Inti: sistem **13-week Quarter Planning** yang menurunkan Visi → 12 Week Quest → tugas mingguan → eksekusi harian, plus pelacakan kebiasaan, timer Pomodoro, dan laporan AI.

Target pengguna: individu proaktif berorientasi tujuan yang butuh alat terstruktur untuk produktivitas pribadi + profesional.

---

## 📊 Status Fitur (F-01 … F-08 dari BRD)

Legenda: ✅ jadi · 🔄 sebagian / ada perbaikan terbuka · ⏳ belum jalan

| # | Fitur | Status | Route / Lokasi | Plan / Issue |
|---|---|---|---|---|
| **F-01** | Dashboard Utama | ✅ | `/dashboard` | — |
| **F-02** | Manajemen Quest (Visi, 12-Week, Main, Daily/Work/Side) | ✅ | `/planning/vision`, `/planning/12-week-quests`, `/planning/main-quests`, `/quests/*` | [main-quests-types](../plans/2026-03-21-main-quests-types-design.md), [work-quests-3layer](../plans/2026-03-17-work-quests-3layer-refactor.md) |
| **F-03** | Weekly Sync (bank tugas + jadwal mingguan + To-Don't List) | ✅ | `/execution/weekly-sync` (+ `ToDontList/`) | [12-week-sync-mvp](../plans/2026-03-29-12-week-sync-mvp.md) |
| **F-04** | Daily Sync (tugas harian, Pomodoro, Brain Dump, log otomatis) | ✅ | `/execution/daily-sync`, `/execution/brain-dump` | [daily-plan-3layer](../plans/2026-03-19-daily-plan-schedule-3layer-refactor.md), [brain-dump](../plans/2026-04-27-brain-dump-page-implementation-plan.md) |
| **F-05** | Habit Tracker | 🔄 | `/habits/today`, `/habits/monthly` | `bp-0df` (multi-completion), `bp-uv4` (day nav) — [plan](../plans/2026-04-13-habit-nav-multicompletion-design.md) |
| **F-06** | Review & Laporan AI (mingguan/kuartalan) | 🔄 | `/planning/12-week-sync` (+ `history/`) | `bp-7xt` (12-week sync review MVP); AI email = epic `bp-2we` ⏳ |
| **F-07** | Pengaturan (data master, profil, notifikasi) | ✅ | `/settings/profile`, `/settings/notifications` | [dynamic-user-profile](../plans/2026-03-21-dynamic-user-profile-design.md) |
| **F-08** | Strategis (To-Don't List, Best Week) | ✅ | `/execution/weekly-sync/ToDontList`, `/planning/best-week` | [best-week](../plans/2026-03-27-best-week-design.md) |

**Ringkasan:** 6 dari 8 fitur inti jalan (✅). 2 sisanya (F-05 Habit, F-06 AI Report) sebagian — punya pekerjaan terbuka di bawah.

---

## 🚧 Next Up (issue terbuka, `bd ready`)

Urutan saran: quick win dulu, epik AI terakhir (paling berat + blocked).

### 🔄 Habit Tracker (F-05) — penyempurnaan
- [ ] `bp-uv4` P2 — Habit day navigation (prev/next day di today view)
- [ ] `bp-0df` P2 — Habit multi-completion daily target (1 habit bisa target N×/hari)

### 🔄 Review & AI (F-06)
- [ ] `bp-7xt` P3 — 12 Week Sync quarterly review (Phase 1 MVP)

### ⏳ Email Notification + AI — epik `bp-2we` (P1, blocked, 7 sub-task)
Sistem notifikasi email harian/mingguan/kuartalan dengan AI (Gemini, 4 persona). Infrastruktur cron sudah ada (`/api/cron/*`), tinggal rangkai:
- [ ] `bp-b5b` — Gemini AI integration (4 persona)
- [ ] `bp-vl4` — 6 Vercel Cron API routes (aggregate / queue / process)
- [ ] `bp-34i` — Email queue + sending via Resend
- [ ] `bp-ep1` — Template email (React Email)
- [ ] `bp-0z1` — Notification settings UI (MVP)
- [ ] `bp-ob7` — Env vars + deploy config
- [ ] `bp-3lo` — E2E testing + monitoring
- 📄 Plan: [email-notification](../plans/2026-03-21-email-notification-design.md), [web-push](../plans/2026-03-31-web-push-notifications-design.md)

### 🧹 Lintas-fitur (kualitas)
- [ ] `bp-8m5` P2 — Standardize metadata placement antar-halaman — [plan](../plans/2026-04-13-standardize-metadata-design.md)
- [ ] `bp-ztv` P2 — E2E: perluas coverage ke semua area — [plan](../plans/2026-03-21-playwright-e2e-setup-design.md)

---

## 📈 Progres Keseluruhan

Beads: **48 closed / 61 total**, 13 open, 0 blocked-tanpa-jalur. Mayoritas fitur inti BRD sudah terimplementasi; sisa pekerjaan = penyempurnaan (habit), fitur AI/notifikasi (epik), dan kualitas (E2E, metadata).

---

## 📌 Cara Pakai File Ini

- **Lihat arah & status:** baca file ini.
- **Lihat task siap kerja:** `bd ready` (no blocker) / `bd list --status=open`.
- **Detail satu task:** `bd show <id>`. Plan lengkap: lihat kolom Plan di tabel.
- **Visi & scope formal:** [`BRD.md`](./BRD.md) (beku — jarang berubah).
- **Update roadmap:** tiap issue closed / fitur selesai / arah berubah → update checkbox + status + tanggal di header.

> **Prinsip:** BRD = beku (visi/scope, versioned). Roadmap = hidup (status/progress). Plan files = detail eksekusi per-fitur. Beads = task aktif. File ini cuma **lem** yang nyatuin semua.
