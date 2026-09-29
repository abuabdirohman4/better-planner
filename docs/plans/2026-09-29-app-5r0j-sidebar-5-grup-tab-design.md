# app-5r0j — Sidebar 5 grup berlabel + halaman sejenis jadi tab (DESAIN)

Pasangan: `2026-09-29-app-5r0j-sidebar-5-grup-tab-implementation-plan.md`.
Latar: `~/Documents/second-brain/0.Inbox/superfocus/perbandingan_superfocus_vs_better_planner.md`
(bagian "Arah perbaikan", arah #2) dan `rekomendasi_desain_gemini_better_planner.md` (Arah 2).

## Masalah

- Sidebar default **tertutup** (`sidebarStore.isExpanded: false`, lebar 90px). Dalam mode itu judul
  bagian "Execution/Planning/Quests" terpotong jadi `EXEC/PLAN/QUES` dan item cuma ikon — Abu harus
  hafal ikon (lihat `better-planner/01_daily_sync.jpg`).
- 14 item menu untuk halaman yang sebenarnya berpasangan (Weekly Sync ↔ Best Week, Daily Sync ↔ Habit,
  tiga halaman quest yang bentuknya sama).
- Di mobile (<768px) sidebar tidak bisa dibuka sama sekali (tombol toggle `hidden md:flex`,
  `AppHeader.tsx:204`). Navigasi mobile = `BottomNavigation` 4 item; Quests/Vision/Main Quests/
  Best Week hanya terjangkau lewat ubin Dashboard.
- Judul header (`AppHeader.tsx:21-48`) switch manual yang sudah bolong: Best Week, Daily Quests,
  12 Week Sync, Brain Dump tampil "Better Planner".
- `AppSidebar.tsx` 713 baris, ±400 baris di antaranya mesin submenu yang **tidak dipakai** (tidak ada
  satu pun `subItems`), plus `trackingNav` berisi rute yang tidak ada (`/aw-quests`, `/reports`) yang
  tetap di-prefetch (baris 631).

## Keputusan

### K1. URL tidak dipindah — tab = link antar rute yang sudah ada

Tab bar dirender **satu kali** di `src/app/(admin)/layout.tsx` (sudah client, sudah baca `pathname`),
memilih tab dari satu config `src/lib/navigation.ts`. Tidak ada folder rute yang dipindah, tidak ada
layout per segmen baru.

Alasan:
- Memindah rute (mis. `/harian`, `/mingguan`) menyentuh ±40 `revalidatePath` di actions, URL notifikasi
  push (`pushDue.ts:100-144`, `daily-pipeline/route.ts:206`, `settings/notifications/actions.ts:101`),
  `QuarterSelector` (`HIDDEN_PATHS`/`URL_QUARTER_PATHS`), `TwelveWeekGoalsRedirector`, 11 E2E spec, dan
  bookmark/PWA shortcut. Risiko tinggi, nilai ke pengguna nol — URL tidak terlihat di PWA.
- Halaman yang digabung ada di segmen berbeda (`/execution/daily-sync` + `/habits/*`,
  `/execution/weekly-sync` + `/planning/best-week`), jadi layout Next.js bersama tidak mungkin tanpa
  memindah rute. Tab di layout `(admin)` menyelesaikannya tanpa itu.
- **Acceptance "rute lama redirect":** tidak ada rute lama yang mati — semua URL tetap sah dan
  langsung mendarat di tab yang benar. Redirect tidak dibutuhkan. Kalau Abu tetap mau URL pendek
  (`/harian` dst.), itu 5 baris `redirects()` di `next.config.ts` — lihat Pertanyaan Terbuka.

### K2. Satu sumber kebenaran: `NAV_GROUPS`

Data murni tanpa JSX/ikon (ikon di `src/lib/icons.ts` adalah impor `.svg` yang tidak bisa di-load
Vitest). Dipakai oleh: sidebar, bottom nav, tab bar, judul header, prefetch. Ikon dipetakan di
`src/components/layouts/navIcons.tsx`.

Satu tes Vitest memindai `src/app/(admin)/**/page.tsx` dan gagal kalau ada halaman yang tidak masuk
grup mana pun (kecuali `settings/*` dan `test-*`). Ini penjaga "tidak ada halaman yatim" — termasuk
untuk `app-0j2t` nanti.

### K3. Peta halaman → grup

| Rute | Grup | Tab | Catatan |
|---|---|---|---|
| `/dashboard` | **Dashboard** | — (1 tab, bar tidak tampil) | |
| `/execution/daily-sync` | **Harian** | Daily Sync | tab bawaan grup |
| `/habits/today` | Harian | Habit Tracker | `match: '/habits'` → `/habits/monthly` ikut aktif; sub-tab Today/Monthly tetap |
| `/habits/monthly` | Harian | Habit Tracker | |
| `/execution/weekly-sync` | **Mingguan** | Weekly Sync | tab bawaan grup |
| `/planning/best-week` | Mingguan | Best Week | |
| `/execution/brain-dump` | Mingguan | Brain Dump | halaman ini = "review brain dump per minggu" (metadata-nya). Brain dump harian tetap ditulis di Daily Sync |
| `/quests/side-quests` | **Quests** | Side Quests | tab bawaan grup (urutan Abu: Side · Work · Daily) |
| `/quests/work-quests` | Quests | Work Quests | |
| `/quests/daily-quests` | Quests | Daily Quests | |
| `/planning/vision` | **Kuartalan** | Vision | urutan tab = alur metode: Vision → 12 WQ → Main → Sync |
| `/planning/12-week-quests` | Kuartalan | 12 Week Quests | |
| `/planning/main-quests` | Kuartalan | Main Quests | **tab bawaan grup** (paling sering dibuka di tengah kuartal) |
| `/planning/12-week-sync` (+ `/history`) | Kuartalan | 12 Week Sync | `/history` aktif lewat prefix |
| `/settings/profile`, `/settings/notifications` | — | — | keluar dari sidebar; tetap di menu avatar (`UserDropdown.tsx:53,78`), ada di header desktop + header mobile Dashboard |
| `/test-notifications`, `/test-performance` | — | — | halaman dev, memang tidak pernah ada di menu |

### K4. "Habit hari ini ringkas di Daily Sync" — sudah ada, tidak dikerjakan di sini

`app-cr6i` sudah memasang habit `show_in_daily_sync` sebagai baris di kartu Daily Quest
(`DailyQuestListSection.tsx:230-238`, `HabitQuestRow`) plus pengingat "N kebiasaan lain belum selesai
hari ini" yang menaut ke `/habits/today` (baris 241-255; terlihat di `01_daily_sync.jpg`). Tautan itu
sekarang otomatis mendarat di tab Harian › Habit Tracker. Fase 3 dihapus. Kalau Abu mau lebih
(widget semua habit yang bisa dilipat), buka kartu terpisah.

### K5. Kalender Plan/Both/Actual tidak disentuh

Ada di `execution/daily-sync/ActivityLog/`; isi halaman Daily Sync tidak berubah sama sekali.

### K6. Hal yang ikut dirapikan karena config baru

- Judul header dari `findActiveTab(pathname)?.tab.label` — switch manual + `needsBackButton` dihapus.
  Tombol back mobile hanya ada untuk halaman yang dulu cuma terjangkau dari ubin Dashboard; sekarang
  semuanya ada di bottom nav, jadi tombolnya tidak perlu.
- `AppSidebar.tsx` ditulis ulang tanpa mesin submenu & `trackingNav` mati (±713 → ±110 baris).
- Sub-tab Habits (`HabitsTabLayout.tsx`) diubah dari garis bawah jadi pil kecil supaya tidak ada dua
  bar tab bergaris bawah bertumpuk.

## Fase (masing-masing bisa di-ship sendiri)

| Fase | Isi | Hasil kalau berhenti di sini |
|---|---|---|
| 1 | `navigation.ts` + tes, `navIcons.tsx`, sidebar 5 grup berlabel (juga saat tertutup), bottom nav 5 grup, judul header dari config | Menu ringkas & berlabel; klik grup → halaman bawaan grup. Halaman lain di grup masih lewat ubin Dashboard |
| 2 | `SectionTabs` di layout `(admin)`, sub-tab Habits jadi pil, E2E navigasi, update dokumen arsitektur | Acceptance penuh |

## Wireframe

### Desktop — sidebar tertutup (bawaan, 90px) + tab

```
┌──────┬────────────────────────────────────────────────────────────┐
│ [B]  │ ≡  Best Week                         ‹ Q4 2026 ›   🔔 (A) │
│      ├────────────────────────────────────────────────────────────┤
│ ▦    │  Weekly Sync   Best Week   Brain Dump                      │
│Dashbd│                ═════════                                   │
│      │ ───────────────────────────────────────────────────────────│
│ ☑    │                                                            │
│Harian│   (isi halaman Best Week, tidak berubah)                   │
│      │                                                            │
│ 📅   │                                                            │
│Mingg.│ ← aktif (bg brand-50)                                      │
│      │                                                            │
│ ☰    │                                                            │
│Quests│                                                            │
│      │                                                            │
│ ◔    │                                                            │
│Kuart.│                                                            │
└──────┴────────────────────────────────────────────────────────────┘
```

Label di bawah ikon `text-[10px]`; label penuh ("Kuartalan") muat di 50px area isi.

### Desktop — sidebar terbuka (290px)

```
┌──────────────────────┬──────────────────────────────────────────┐
│ [B] Better Planner   │ ≡  Main Quests        ‹ Q4 2026 ›   (A) │
│                      ├──────────────────────────────────────────┤
│ ▦  Dashboard         │ Vision  12 Week Quests  Main Quests  12 Week Sync
│ ☑  Harian            │                         ═══════════      │
│ 📅 Mingguan          │                                          │
│ ☰  Quests            │   (isi Main Quests)                      │
│ ◔  Kuartalan  ◀aktif │                                          │
└──────────────────────┴──────────────────────────────────────────┘
```

### Mobile (<768px)

```
┌─────────────────────────────┐
│      Habit Tracker    ‹Q4›  │  ← header (judul = label tab)
├─────────────────────────────┤
│ Daily Sync  Habit Tracker   │  ← tab bar, geser horizontal kalau
│             ═════════════   │    tidak muat (Kuartalan 4 tab)
│ ┌─────────────────────┐     │
│ │ Today's │ Monthly   │     │  ← sub-tab Habits (pil)
│ └─────────────────────┘     │
│   (isi halaman)             │
│                             │
├─────────────────────────────┤
│  ▦     ☑      📅    ☰    ◔  │  ← bottom nav 5 grup
│Dash Harian Mingg Quests Kuart│
└─────────────────────────────┘
```

## Urutan dengan kartu saudara

- **`app-0j2t`** (tampilan jadwal nyata mingguan) — kerjakan **setelah Fase 2**. Halaman barunya cukup
  menambah satu objek tab di grup Mingguan `NAV_GROUPS`; tes "tidak ada halaman yatim" akan gagal
  kalau lupa.
- **`app-ddl0`** (empty state di dalam Weekly Sync) — bebas urutan; menyentuh isi `WeeklySyncClient`,
  bukan layout/nav. Tidak ada konflik file.

## Di luar lingkup

- Ubin menu Dashboard (11 kartu, dijaga `dashboard.spec.ts`) — biarkan; nasibnya ditentukan kartu
  "Dashboard yang menjawab" (arah #1).
- Best Week sebagai template overlay di Weekly Sync (ide Gemini) — fitur baru, kartu terpisah.

## Pertanyaan terbuka (default dipakai kalau Abu diam)

1. URL pendek `/harian` `/mingguan` dst.? **Default: tidak.**
2. Brain Dump di Mingguan (bukan Harian/Kuartalan)? **Default: Mingguan.**
3. Tab bawaan Kuartalan = Main Quests? **Default: ya.**
4. Settings keluar dari sidebar (cukup menu avatar)? **Default: ya.**
5. Sub-tab Habits (Today/Monthly) tetap sebagai pil, bukan dilebur jadi 3 tab Harian? **Default: pil.**
