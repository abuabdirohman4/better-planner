# 🗺️ Roadmap: Better Planner

> **File ini = peta arah project.** Sumber tunggal visi + status + next up.
> Visi & scope detail di [`BRD.md`](./BRD.md). Skema data sebenarnya: database Supabase + `supabase/migrations/` (ERD awal Juni 2025 di [`../archive/products/ERD.sql`](../archive/products/ERD.sql), sudah basi). Task detail di beads hub `applications` (`bd list --label=beplan`, prefix `app-`; issue lama `bp-`). Plan issue open di [`../plans/`](../archive/plans/), yang sudah closed di [`../archive/plans/`](../archive/plans/).
> Diperbarui: 2026-09-29 · Status: **Semua 8 fitur BRD live. Proyek email+AI digugurkan 16 Sep 2026 (diganti Telegram dari VPS); Web Push sudah live.** Beads pindah ke hub `applications/` (prefix `app-`, label `beplan`) **0 open** — dikosongkan 17 Sep (pagi + sore), lalu 24 Sep (`app-5skl` + tiga temuan pemakaian harian), lalu 28 Sep (`app-0ank`, `app-uq5a`, `app-7z06` — quest antar quarter).

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
| 1 | **Aktivasi email+AI** (bukan kode — konfigurasi) | Kode epic `bp-2we` selesai; perlu key | ⏳ digugurkan 16 Sep (diganti Telegram), lihat Catatan |

### Post-MVP — NANTI (parkiran ide, bukan blocker)

| Item | Isi | Catatan |
|---|---|---|
| Web Push notification | Notifikasi browser (timer selesai, reminder) | **Sudah live** (`useLiveTimerNotification.ts`, cron `push-due`). Plan: [web-push](../archive/plans/2026-03-31-web-push-notifications-design.md) |
| Per-user jam kirim email | Sekarang fixed 06:00 WIB via `daily-pipeline` | Butuh Vercel Pro (multi cron) atau queue per jam |
| Email tracking (open/click) | Kolom `opened_at/clicked_at` sudah ada di `notification_history` | Butuh Resend webhook |
| Real-time sync antar tab/device | pilihan teknik: Ajax polling, Long Polling, Server-Sent Events, atau WebSocket | Ide, belum ada kebutuhan |

---

## 🗂️ Manajemen Sesi (Claude)

| Tipe sesi | Untuk | Naming | Batch |
|---|---|---|---|
| **plan** | Diskusi ide + bikin beads + plan + prompt | `app-<id> plan-<slug>` | ✅ banyak plan/sesi |
| **review** | Review hasil executor → fix → close → commit | `app-<id> review-<slug>` | ✅ 2-4 issue kecil |
| **bugfix** | Debug error/regresi runtime | `app-<id> bugfix-<slug>` | ❌ fokus 1 |
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
| 2026-09-16 | Polish F-02 | `app-t43e65f` Main Quest: toggle 3 HFG berjajar (desktop) seperti buku Sync Planner; SubTask panel samping → modal; detail hanya kebuka lewat tombol panah. |
| 2026-09-28 | Revalidasi SWR hidup lagi | Jam habit tak lagi perlu disimpan 2x. `notifyHabitsChanged`/`notifyActivityLogsChanged` ternyata no-op sejak Jul 2025 — ikut membetulkan sinkron habit Daily Sync ↔ Habit dan counter fokus. |
| 2026-09-28 siang | Carry-over v2 | `app-7z06` sumber = semua quarter sebelumnya (dikelompokkan per quarter, judul kembar diambil yang terbaru); Work Quest bisa pilih task per project dan menambah ke project yang sudah ada di quarter tujuan. |
| 2026-09-28 | Quest antar quarter | `app-0ank` side quest bisa ditambah dari halaman Side Quests. `app-uq5a` tombol "Ambil dari quarter lalu" di Daily/Work/Side Quest — quest terpilih disalin (status TODO) ke quarter yang dilihat, baris lama utuh. |
| 2026-09-30 | Tampilan mingguan jadwal nyata | `app-0j2t` Best Week punya toggle "Template ideal \| Minggu ini": `task_schedules` Senin–Minggu (WIB) di atas `WeeklyGrid`, warna per HFG #1–3, selain HFG abu-abu. Template kini tampil di jam sebenarnya (04:45 tidak lagi dibulatkan ke 04:30). HFG yang skornya sama diurutkan per judul supaya #n konsisten di semua halaman. |
| 2026-09-29 malam | Jatah jam HFG + energi | `app-dwhq` tiap HFG punya jatah jam/minggu (diisi di Main Quests), dashboard menampilkan jam FOCUS vs jatah + ON TRACK / AT RISK (hari kerja Senin–Jumat, minggu 13 = istirahat). Hitungan di fungsi SQL `hfg_weekly_status`, dipakai juga bot VPS (`sb-rme`). `app-01z6` tanda energi +/=/− di One Minute Journal (`activity_logs.energy`) + kartu "Energi minggu ini" di dashboard. |
| 2026-09-29 | Batas kuartal + gangguan kecil | `app-yv8t` browser baru buka kuartal berjalan (bukan Q1), simpanan Q1 lama direset sekali. `app-taj8` quest yang dibuat Minggu terakhir kuartal (dan minggu ke-53) tak lagi hilang — query pakai batas eksklusif `endExclusive`. `app-ddl0` pop-up install PWA diam 30 hari setelah ditolak, banner versi baru jadi toast, Weekly Sync kosong punya ajakan mengisi. |
| 2026-09-24 | Temuan pemakaian harian | Urutan quest Weekly Sync + Select Main Quest ikut milestone → langkah → sub task (RPC `get_weekly_sync` dulu cuma urut `tasks.display_order`). Koreksi jam habit simpan eksplisit (akar sebenarnya baru ketemu 28 Sep — lihat Changelog). Card refleksi 12 Week Sync klik → tampil penuh. `app-5skl` minggu 13 tak dihitung di dashboard. |
| 2026-09-17 sore | Habit jadi bisa dipercaya | `app-cr6i` habit bertanda bisa dicentang dari Daily Sync (kolom `show_in_daily_sync`), sisanya diwakili baris pengingat. `app-r02c` batas tepat waktu (`deadline_time`) + koreksi jam (`done_at`) — `habit_completions` ternyata tak punya policy UPDATE sejak Maret. `app-je2x` modal edit habit menampilkan data habit sebelumnya. |
| 2026-09-17 sore | Temuan dari pemakaian | `app-ejf5` To Don't List ternyata cuma dikomentari sejak refactor `896dc16`. `app-ni49` tombol tes notifikasi. `app-pizc` habit mingguan hanya di hari targetnya (kolom `target_days`) + `app-w3t3` streak tak lagi putus tiap tanggal 1 — keduanya bug yang menghalangi habit tracker dipercaya. |
| 2026-09-17 | Backlog nol | `app-j41i` halaman `/settings/profile` dibuat, `bp-3lo` alert cron gagal (tabel `cron_runs`, email saat run tidak sukses), epic `app-xb7q` ditutup. `app-v8x` + `app-tb99243` terbukti sudah ada di kode. 18 → 0 open. |
| 2026-09-17 | Gelombang 2 | `app-tcf9b7f` mobile: bottom nav + 8 halaman sudah responsif, difix HP tak bisa sign out. `app-rkv`: Select All di Weekly Sync push id MILESTONE → FK tolak → isi slot hilang (bug data, difix). Lahir 2 kartu: `app-05h` link `/profile` 404, `app-klny` simpan slot tidak atomik. |
| 2026-09-17 | Sapu bersih 3×3 | 4 agent paralel (Fable 5.1): `app-ta1b0f2` skeleton, `app-4ky` auth, `app-ico` PWA ikon, `app-2gf` durasi timer (fix 1 baris). `app-taa0c2f` + `bp-l4h` terbukti sudah beres sejak `18a9961` (27 Jul) lewat query DB. 12 → 6 open. |
| 2026-09-16 | Audit kartu `migrated` | 6 kartu yang ke-reopen saat pindah ke hub diperiksa ke kode: 5 ternyata sudah jadi (`bp-uv4`, `bp-0df`, `bp-8m5`, `bp-ztv`, `bp-7xt`), `bp-vjx` tidak reproduce. 18 → 12 open. |

## 🎯 Visi

Mengubah sistem perencanaan personal (asalnya Google Sheets) jadi aplikasi web yang **intuitif, terautomasi, mobile-first**. Inti: sistem **13-week Quarter Planning** yang menurunkan Visi → 12 Week Quest → tugas mingguan → eksekusi harian, plus pelacakan kebiasaan, timer Pomodoro, dan laporan AI.

Target pengguna: individu proaktif berorientasi tujuan yang butuh alat terstruktur untuk produktivitas pribadi + profesional.

---

## 📊 Status

Legenda: ✅ jadi · 🔄 sebagian / ada perbaikan terbuka · ⏳ belum jalan

| Item | Status | Route | Catatan / Issue |
|---|---|---|---|
| **F-01** Dashboard Utama | ✅ | `/dashboard` | Weekly Progress hanya W1–W12 — minggu 13 (istirahat + susun kuartal) tetap boleh diisi di Weekly Sync tapi tak dihitung (`app-5skl`) |
| **F-02** Manajemen Quest | ✅ | `/planning/vision`, `/planning/12-week-quests`, `/planning/main-quests`, `/quests/*` | [main-quests-types](../archive/plans/2026-03-21-main-quests-types-design.md), [work-quests-3layer](../archive/plans/2026-03-17-work-quests-3layer-refactor.md). Main Quest punya toggle 3-kolom (`app-t43e65f`, lihat Catatan) |
| **F-03** Weekly Sync + To-Don't | ✅ | `/execution/weekly-sync` (+ `ToDontList/`) | [12-week-sync-mvp](../archive/plans/2026-03-29-12-week-sync-mvp.md) |
| **F-04** Daily Sync (Pomodoro, Brain Dump, log) | ✅ | `/execution/daily-sync`, `/execution/brain-dump` | [daily-plan-3layer](../archive/plans/2026-03-19-daily-plan-schedule-3layer-refactor.md), [brain-dump](../archive/plans/2026-04-27-brain-dump-page-implementation-plan.md), [bp-byp](../archive/plans/2026-07-27-bp-byp-pomodoro-timer-bugs.md) | Habit bertanda ikut tampil & bisa dicentang di sini (`app-cr6i`).
| **F-05** Habit Tracker | ✅ | `/habits/today`, `/habits/monthly` | Day nav + `daily_target` multi-completion — [plan](../archive/plans/2026-04-13-habit-nav-multicompletion-design.md). 17 Sep: `target_days` (mingguan hanya di hari targetnya), streak lintas bulan, `deadline_time` batas tepat waktu, `show_in_daily_sync` |
| **F-06** Review & Laporan | 🔄 | `/planning/12-week-sync` (+ `history/`), `/settings/notifications`, `/api/cron/daily-pipeline` | Review kuartalan ✅ (`bp-a63`); email+AI kode ✅ (`bp-2we`) tapi **belum aktif** — perlu key (lihat Catatan) |
| **F-07** Pengaturan | 🔄 | `/settings/notifications` (`/settings/profile` **belum ada halaman** — hanya actions sound settings) | [dynamic-user-profile](../archive/plans/2026-03-21-dynamic-user-profile-design.md). Halaman profile = kartu baru 17 Sep |
| **F-08** Strategis (To-Don't, Best Week) | ✅ | `/execution/weekly-sync/ToDontList`, `/planning/best-week` | [best-week](../archive/plans/2026-03-27-best-week-design.md) |

**Ringkasan:** 7 dari 8 ✅, F-06 🔄 hanya karena aktivasi email belum dilakukan (kode selesai). Beads sekarang di hub `applications/` (`bd list --label=beplan`) **0 open** per 24 Sep 2026.

---

## 🚧 Next Up

Sisa kode ada di beads hub (`bd list --label=beplan`). Yang di bawah = tindakan manual (bukan kode):

### ⚡ P2 — Aktivasi email+AI (manual, ±15 menit)
- [ ] Vercel env: `RESEND_API_KEY`, `EMAIL_FROM` (domain terverifikasi di Resend), `GEMINI_API_KEY`, `CRON_SECRET` (random ≥32 char), `NEXT_PUBLIC_SITE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Buka `/settings/notifications` → aktifkan + pilih frekuensi (user lama shape settings sudah dimigrasi)
- [ ] Smoke test: `curl -X POST -H "Authorization: Bearer $CRON_SECRET_TOKEN" https://<app>/api/cron/daily-pipeline` → cek `notification_history` terisi
- [ ] Set `NEXT_PUBLIC_ENABLE_TIMER_DEV=true` di `.env.local` kalau mau E2E timer flow jalan lokal

---

## 📌 Catatan

- **2026-08-18:** `bp-7xt` closed (duplikat `bp-a63`, GH-#4 sudah live). `bp-vjx` (stop 2× klik) closed — tidak reproduce setelah `bp-byp`; reopen kalau muncul lagi.
- **Email epic (2026-08-18):** kode 7 sub-task ternyata sudah ada di master sebelum di-close; yang diperbaiki = insert `notification_history` (kolom salah → gagal diam-diam), unsubscribe URL (pakai `NEXT_PUBLIC_SITE_URL`), settings actions (`.eq('id')` → `user_id` + upsert), DB default `notification_settings` (shape lama → baru + backfill), Gemini diaktifkan bila key ada (`GEMINI_MODEL` default `gemini-2.5-flash`), `api/test/**` 404 di production, cronAuth UA-bypass hanya kalau tak ada secret. `vercel.json` cuma jadwalkan `daily-pipeline` (Hobby plan) — 6 route `/api/cron/*` lain = manual trigger.
- **Main Quest 3-kolom (2026-09-16, `app-t43e65f`):** toggle di header (ikon layout, desktop saja) — state `mainQuestGridView` persist di `uiPreferencesStore`. Mode grid lepas cap `max-w-7xl` supaya isi ruang layar lebar; mode tab tetap `max-w-2xl`. SubTask tak lagi panel samping tapi `Modal` dengan prop baru `bare` (buang shell putih, pakai `ComponentCard` di dalamnya). Detail subtask **hanya** kebuka lewat tombol panah di `TaskItem` — klik baris/fokus input sekarang cuma edit teks (dulu auto-buka panel, ini yang bikin panel muncul tak sengaja).
- **Kartu berlabel `migrated` tidak menandakan pekerjaan tersisa (2026-09-16):** saat beads pindah ke hub `applications/`, 6 kartu yang sudah closed ikut terbuka lagi. Diaudit ke kode: `bp-uv4` (day nav, `habits/today/page.tsx:20-118`), `bp-0df` (migration `20260818000001_habit_daily_target.sql`), `bp-8m5` (aturan metadata terdokumentasi, 14 halaman ber-metadata), `bp-ztv` (9 spec E2E, 6/6 area), `bp-7xt` (route `12-week-sync` + `history/`) semuanya **sudah terimplementasi**; `bp-vjx` ditutup sebagai tidak reproduce. Pelajaran: verifikasi ke kode dulu sebelum mengeksekusi kartu ber-label `migrated`.
- **Habit multi-completion:** 1 baris `habit_completions` = 1 completion; hari "selesai" bila count ≥ `habits.daily_target` (streak & monthly goal ikut aturan ini). Toggle di monthly grid = isi penuh / kosongkan hari.
- **E2E:** helper `tests/e2e/helpers/db.ts`; coverage map di `docs/claude/e2e-testing-patterns.md`.
- **Cache SWR daily-sync:** `dedupingInterval` 5 menit sengaja (hemat edge request, plan [reduce-edge-requests](../archive/plans/2026-04-21-reduce-edge-requests-swr-optimization.md)). Konsekuensi: tiap path yang ubah `activity_logs` **wajib** panggil `notifyActivityLogsChanged()` (`src/lib/swr.ts`) — satu sinyal untuk list, counter card, Total focus bar, dan teks progress timer. Jangan tambah `mutate` manual per handler lagi (itu akar bug berulang bp-6ka → bp-byp → bp-nuk).
- **Realtime Supabase belum aktif** untuk `activity_logs`/`timer_sessions` (`pg_publication_tables` kosong) → channel di `useRealtimeSync` diam. Kalau mau counter ikut update dari cron `auto-complete-timers` / device lain tanpa reload: `alter publication supabase_realtime add table activity_logs;` (uji dulu, handler completeTimerFromDatabase ikut hidup).
- **Prinsip dokumen:** BRD = beku (visi/scope). Roadmap = hidup (status/progress). Plan files = detail eksekusi per-fitur. Beads = task aktif. Update roadmap tiap `bd close` / arah berubah.

---

## 📜 Changelog

- **2026-09-28 siang** — `app-7z06` carry-over v2. Review menemukan: (1) modal crash `reading 'alreadyExists'` — SWR cache disimpan di localStorage, key sama dengan versi lama, bentuk data lama terbaca → key diganti `carry-over-groups`; **ubah bentuk data SWR = ganti key**. (2) `queryTopTasksBefore` `.limit(1000)` urut naik → kalau terpotong yang hilang quest terbaru; dibalik. (3) `daily-quests/page.tsx` masih `mutate` global dari 'swr' (no-op, lihat `1ab8e62`) → `swrMutate`. Diverifikasi browser + DB dengan project `[TEST]`, lalu dihapus.
- **2026-09-28 (2)** — Akar jam habit 2x input: `SWRProvider` memakai cache provider sendiri (localStorage), sedangkan `notifyHabitsChanged()` + `notifyActivityLogsChanged()` memanggil `mutate` global dari `'swr'` yang hanya menyentuh cache default → no-op sejak `05a33c2` (Jul 2025). Baris optimistic (`id: 'optimistic'`) tak pernah diganti baris asli, edit jam pertama mengirim id palsu → gagal → rollback. Dibuktikan dengan menyadap fetch di browser. Fix: `ScopedMutateBridge` mendaftarkan `useSWRConfig().mutate`, notify* pakai `swrMutate`. Semua 23 pemanggil ikut benar (sinkron habit `app-cr6i`, counter fokus `bp-nuk` — dulu cuma jalan di komponen yang memegang bound mutate). Sisa: `quests/daily-quests/page.tsx` masih impor `mutate` global. Unit test yang me-mock `mutate` dari 'swr' tetap hijau walau fungsinya no-op — hanya browser yang membongkar.
- **2026-09-28** — Quest diikat ke quarter lewat `tasks.created_at`, jadi hilang saat Q4 mulai (28 Sep = hari pertama Q4 2026). `app-0ank` form Add Task di Side Quests + helper `createdAtForQuarter` (insert saat melihat quarter lain diberi tanggal awal quarter itu). `app-uq5a` carry-over: salin, bukan pindah (keputusan Abu) — daily yang tidak diarsip, side/work yang belum DONE; work membawa anak yang belum selesai; judul yang sudah ada ditandai "sudah ada". Review memperbaiki modal: klik judul tidak mencentang (label onClick + klik ganda). Diverifikasi di browser + DB, data uji dihapus. Catatan: halaman quest ikut quarter terakhir di QuarterSelector dashboard (localStorage), bukan otomatis quarter hari ini.
- **2026-09-24** — Tiga temuan pemakaian (`8c59b43`): (1) urutan quest — RPC `get_weekly_sync` di-`ORDER BY` milestone → langkah parent → sub task (migration `20260924000001_weekly_sync_item_order`, sudah di-apply); Select Main Quest daily sync pakai `sortByPlanOrder` karena dulu tak diurutkan sama sekali (5 item `created_at` identik → acak). 435 dari 463 sub task tanpa `milestone_id`, jadi milestone diambil dari parent. (2) Koreksi jam habit: simpan lewat tombol/Enter, bukan onBlur. Dugaan "Safari blur antar segmen" ternyata **salah** — masih perlu 2x; akar sebenarnya diperbaiki 28 Sep. (3) Card refleksi 12 Week Sync: klik → tinggi ikut isi. Lalu `app-5skl` (`206cad9`): arah diubah Abu — bukan memblok minggu 13 di Weekly Sync, cukup dashboard tak menghitungnya.
- **2026-09-17 sore (2)** — Backlog kosong lagi: `app-cr6i` (`9c63054`), `app-je2x` (`df089e7`), `app-r02c` (`80af4bf`). Empat migration di-apply hari ini: `cron_runs`, `habit_target_days`, `habit_show_in_daily_sync`, `habit_deadline_time`. Batas tepat waktu 7 shalat sudah diisi (Tahajud 04:30 … Isya 20:30); `target_time` dibiarkan karena maknanya beda (kapan diingatkan). Dobel catat 39 hari hilang setelah Abu menandai habit Update Finance & Daily Sync lalu berhenti memilih kembarannya sebagai daily quest — kode tidak bisa menebak pasangannya (tak ada FK, judul tak identik).
- **2026-09-17 sore** — Empat kartu dari pemakaian harian ditutup (`5633bfa`, `06e062c`, `0904d5a`). Migration `habit_target_days` sudah di-apply; 21 habit Abu semuanya `target_days` NULL = tetap harian. Riset `app-cr6i` menemukan 39 hari tercatat ganda (Update Finance, Daily Sync) dan 4 kebiasaan konsisten tanpa streak (Cleaning House 62 hari) — Abu memilih Pilihan B: habit bertanda bisa dicentang dari Daily Sync, sisanya diwakili baris pengingat. Kartu baru menunggu: `app-r02c` (batas 'tepat waktu' shalat, nilai awal sudah disepakati), `app-je2x` (modal edit habit menampilkan data habit sebelumnya).
- **2026-09-17** — **Backlog BePlan nol.** Branch `fix/beplan-05h-klny` (6 commit) menunggu merge. Tindakan manual yang tersisa: apply migration `20260917000001_cron_runs.sql`, set `CRON_ALERT_EMAIL` di Vercel, lalu uji cron sukses & gagal (langkah di `bd show bp-3lo`). Dari 18 kartu pagi ini, 9 ternyata menggambarkan fitur yang sudah lama jalan — semuanya impor `todo.md` 13 Sep.
- **2026-09-17** — Branch `fix/beplan-05h-klny`: link dropdown → `/settings/notifications` (`app-05h`), simpan slot Weekly Sync upsert-dulu (`app-klny`). Koreksi: `/settings/profile` ternyata tidak punya `page.tsx` — F-07 diturunkan ke 🔄, kartu halaman profile dibuat.
- **2026-09-17** — Gelombang 2 (`7b632ab`, `6bbc9c8`): 3×3 tuntas 8 dari 9 — sisa `bp-3lo` (M2.1 monitoring, butuh keputusan cakupan). Di luar rencana: `app-v8x`, `app-tb99243` (fitur baru), `app-05h`, `app-klny` (temuan sampingan). Epic `app-xb7q` tinggal `bp-3lo`.
- **2026-09-17** — Sapu bersih 6 kartu 3×3 (commit `466e524`, `5b9c318`, `f59bfce`, `4db191c`). Yang perlu dicek Abu di browser/device: pesan error signin, spinner sign out, ikon PWA (uninstall→install ulang), posisi prompt install mobile, logo sidebar saat toggle. Keputusan produk yang sengaja tidak diubah: `/` tetap landing publik; cap 25 menit sesi timer dipertahankan (tanpa cap, sesi yang app-nya ditutup tercatat ratusan menit).
- **2026-09-16** — Audit 6 kartu `migrated`: 5 sudah jadi, `bp-vjx` tidak reproduce → 18 open jadi 12. Label `beplan` ditambahkan ke 5 kartu gabungan yang cuma punya `[beplan]` di judul (bikin `bd list --label` kurang hitung).
- **2026-09-16** — Main Quest: toggle 3 HFG berjajar (desktop) + SubTask jadi modal + detail cuma lewat tombol panah (`app-t43e65f`, commit `fa2066e`). Header/ringkasan disetel ulang setelah beads pindah ke hub.
- **2026-08-18** — Sapu bersih: 12→0 open. F-05 ✅, F-06 kode ✅ (aktivasi manual di Next Up), Post-MVP diganti ide lanjutan (per-user jam kirim, email tracking). Timeline +1 baris.
- **2026-08-18** — Migrasi ke template standar: +MVP/Post-MVP, Manajemen Sesi, Timeline, Catatan, Changelog. Epic email dipindah ke Post-MVP. Sync beads 15→12 open (close bp-7xt duplikat, bp-vjx tak reproduce, bp-nuk & bp-l4h selesai).
- **2026-06-21** — Roadmap pertama: tabel status F-01…F-08 + next up.
