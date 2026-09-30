# Better Planner — Dokumentasi

Pintu masuk dokumen repo ini. Kalau baru buka repo (manusia atau sesi Claude baru), baca halaman ini dulu, lalu `products/roadmap.md`.

## Apa aplikasinya

Better Planner (BePlan) adalah aplikasi perencanaan pribadi Abu, versi digital dari metode **Sync Planner 4.0**: visi → 3 High Focus Goal (HFG) per kuartal → weekly goal → daily plan → timer → activity log. Dipakai tiap hari dan jadi jantung sistem kerja Abu, berdampingan dengan beads dan dashboard second-brain.

- Produksi: https://planner.abuabdirohman.com (Vercel)
- Database: Supabase project `gwetkpmbkzddevhjcfbx` (MCP `better-planner`). Cek ref ini sebelum menulis — DB lama punya ID row kembar.
- Versi: lihat `package.json` (2.3.0 per Sep 2026) dan `marketing/changelog.md`.

Kenapa aplikasi ini ada, hubungannya dengan Sync Planner, dan keputusan pemakaiannya **tidak** ditulis di repo — itu di second-brain: `~/Documents/second-brain/1.Projects/system/productivity/better-planner/better_planner.md`.

### Istilah yang wajib dikenal

| Istilah | Arti |
|---|---|
| Kuartal | 13 minggu: 12 minggu eksekusi + minggu ke-13 istirahat |
| 12 Week Quest | kandidat goal kuartal; diperingkat pairwise |
| Main Quest / HFG | 3 goal terpilih (`quests.is_committed = true`), masing-masing 3 milestone × 3 langkah |
| Work / Side / Daily Quest | kerja kantor / kerjaan lepas di luar HFG / rutinitas |
| Weekly Sync | pilih 3 weekly goal dari HFG + To Don't List |
| Daily Sync | kokpit harian: rencana, timer pomodoro, activity log, One Minute Journal, brain dump |
| Best Week | template minggu ideal (blok waktu) + tampilan jadwal nyata minggu ini |
| 12 Week Sync | review akhir kuartal |

## Halaman

| Rute | Isi |
|---|---|
| `/dashboard` | ringkasan, progres W1–W12, status jam per HFG (ON TRACK / AT RISK) |
| `/planning/vision`, `/planning/12-week-quests`, `/planning/main-quests` | visi, kandidat goal, HFG → milestone → task → subtask |
| `/planning/best-week`, `/planning/12-week-sync` | minggu ideal, review kuartal |
| `/quests/work-quests`, `/quests/side-quests`, `/quests/daily-quests` | tiga jenis quest lain + carry-over antar kuartal |
| `/execution/weekly-sync`, `/execution/daily-sync`, `/execution/brain-dump` | eksekusi mingguan & harian |
| `/habits/today`, `/habits/monthly` | habit tracker |
| `/settings/*` | notifikasi, profil |

Peta fitur lengkap dengan status (dipetakan dari kode 29 Sep 2026) ada di second-brain: `1.Projects/system/productivity/superfocus/better_planner_peta_fitur.md`.

## Arsitektur singkat

- **Next.js 15 App Router + React 19 + TypeScript**, Tailwind v4, PWA (Web Push + timer latar).
- **Server action 3 lapis** per fitur: `actions/<domain>/queries.ts` (akses DB saja) → `logic.ts` (fungsi murni, dites Vitest) → `actions.ts` (`"use server"`).
- **Data di klien**: SWR dengan cache provider sendiri (localStorage). Setelah mengubah `activity_logs`/habit, panggil `notifyActivityLogsChanged()` / `notifyHabitsChanged()` dari `src/lib/swr.ts` — jangan `mutate` global dari `'swr'` (no-op). Ubah bentuk data SWR = ganti key.
- **State global**: Zustand (`src/stores/`: timer, kuartal, sidebar, preferensi UI).
- **Tipe**: satu file per domain di `src/types/`.
- **Waktu**: DB simpan UTC, tampil WIB. Hitungan kuartal/minggu/status HFG dikerjakan di SQL, bukan di TS.
- **Cron**: `src/app/api/cron/*` — `auto-complete-timers` dan `push-due` aktif (`pg_cron → pg_net → Vercel`). Rute `*-emails` dan `daily-pipeline` sisa proyek email yang digugurkan 16 Sep 2026 (belum dibersihkan).

Detail: `claude/architecture-patterns.md`, `claude/business-rules.md`, `claude/database-operations.md`, `claude/timezone-handling.md`.

### Skema data

Sumber kebenaran skema adalah **database Supabase**, bukan dokumen:
- lihat tabel: MCP `better-planner` → `list_tables` / `generate_typescript_types`
- migrasi yang tercatat: `supabase/migrations/` (mulai Mar 2026; skema lebih tua dibuat langsung di dashboard)
- tabel yang dipakai kode (Sep 2026): `visions`, `pairwise_results`, `quests`, `milestones`, `tasks` (semua jenis quest, dibedakan `type`), `weekly_goals` + `weekly_goal_items`, `weekly_rules` (To Don't List), `daily_plans` + `daily_plan_items`, `task_schedules`, `timer_sessions` + `timer_events`, `activity_logs`, `brain_dumps`, `habits` + `habit_completions`, `best_week_templates` + `best_week_blocks`, `quarterly_reviews` + `goal_reviews` + `accomplishments` + `sync_actions` (12 Week Sync), `user_profiles`, `push_subscriptions` + `push_log`, `notification_queue` + `notification_history` + `cron_runs`

Kolom `tasks.beads_ref` **bukan milik aplikasi** — dipakai dashboard dan skill di second-brain untuk menyambung langkah HFG ke issue beads. Jangan dihapus walau tidak ada kode app yang membacanya.

`archive/products/ERD.sql` itu desain awal Juni 2025, sudah jauh berbeda.

## Di mana dokumen apa

| Folder | Isi | Aturan |
|---|---|---|
| `products/roadmap.md` | status fitur, next up, catatan keputusan teknis | **hidup** — baca di awal sesi, perbarui tiap `bd close` |
| `products/BRD.md` | visi & scope awal (Juni 2025) | beku |
| `claude/` | aturan kerja untuk Claude: arsitektur, business rules, DB, tes, timezone, tipe, antigravity, beads, rilis, notifikasi timer | dirujuk dari `CLAUDE.md`; topik baru = file baru di sini + satu baris penunjuk di `CLAUDE.md` |
| `plans/` | plan untuk issue yang **masih open** (`YYYY-MM-DD-app-xxxx-<topik>-design.md` + `-implementation-plan.md`) | dibuat saat plan, dipindah ke `archive/plans/` saat issue ditutup |
| `prompts/` | prompt siap-tempel untuk executor (Antigravity) per issue open | sama: diarsip saat issue ditutup |
| `marketing/` | changelog + draf pengumuman rilis | diperbarui skill `/release` |
| `archive/` | plan, prompt, panduan lama, ERD awal | hanya dibaca untuk menelusuri keputusan lama |

## Kerja dengan beads

- Repo ini **tidak punya `.beads/` sendiri**. Issue BePlan tinggal di hub `~/Documents/applications/.beads`, prefix `app-`, **label `beplan` wajib** (di judul `[beplan] ...` dan di field label).
- Jalankan `bd` dari hub:
  ```bash
  cd ~/Documents/applications
  bd list --label=beplan --status=open
  bd show app-xxxx
  bd create --title="[beplan] ..." --type=task --priority=2 --label=beplan
  ```
- Issue lama berprefix `bp-` (sebelum Sep 2026) sebagian ikut pindah ke hub dengan ID yang sama, sebagian hilang bersama beads per-repo lama.
- Alur satu fitur: plan di `plans/` + prompt di `prompts/` → executor mengerjakan (**executor dilarang `bd close`**) → Claude review + uji manual → Abu setuju → `bd close` → perbarui `roadmap.md` → pindah plan & prompt issue itu ke `archive/`.
- Status kerjaan dilihat di beads atau dashboard second-brain (`~/Documents/second-brain/tools/dashboard/`), **bukan** di dokumen repo. Jangan buat `docs/dashboard.md`.

## Menjalankan

```bash
npm install
npm run dev          # http://localhost:5100
npm run test:run     # Vitest (unit), sekali jalan
npm run test:e2e     # Playwright, butuh .env.test (lihat tests/e2e/QUICK_START.md)
```
