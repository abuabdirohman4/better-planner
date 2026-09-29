# app-0j2t — Tampilan mingguan rencana nyata (task_schedules) · Design

## Masalah

Best Week (`/planning/best-week`) hanya menampilkan **minggu ideal** (template). Jadwal nyata
(`task_schedules`, dibuat lewat Activity Plan di Daily Sync) cuma bisa dilihat per hari. Tidak ada
satu layar yang menunjukkan "minggu ini jam saya dipakai untuk HFG mana". Superfocus punya kalender
mingguan dengan blok berwarna per goal (lihat
`~/Documents/second-brain/0.Inbox/superfocus/reverse_engineering_superfocus.md` bagian "Kalender
mingguan" dan rekomendasi #3).

**Acceptance:** tampilan Senin–Minggu berisi jadwal nyata minggu berjalan, warna per HFG.

## Keputusan

### 1. Letak: toggle di halaman Best Week, komponen berdiri sendiri

- Header Best Week mendapat segmented control **`Template ideal | Minggu ini`** (default
  `Template ideal`). State lokal `useState`, tidak disimpan.
- Isi tab "Minggu ini" = komponen **`RealWeekView`** yang mengambil datanya sendiri (hook SWR sendiri,
  tanpa prop). Jadi saat app-5r0j memindahkan Best Week ke grup sidebar **Mingguan** (tab
  Weekly Sync · Best Week), `RealWeekView` ikut pindah tanpa perubahan, atau bisa di-mount di tab
  Weekly Sync cukup dengan `<RealWeekView />`.
- **Asumsi:** app-5r0j memindahkan halaman Best Week utuh (termasuk `BestWeekClient`). Kalau ternyata
  5r0j memecah jadi tab ketiga "Minggu ini", cukup pindahkan `<RealWeekView />` ke sana dan hapus
  toggle — tidak ada logika yang terkunci di `BestWeekClient`.

**Kenapa toggle, bukan side-by-side / overlay:**

| Opsi | Masalah |
|---|---|
| Side-by-side | `WeeklyGrid` minimal 64px + 7×80px ≈ 624px. Dua grid = ~1250px, patah di laptop 13" dan mustahil di HP. |
| Overlay (template transparan di belakang blok nyata) | Blok template dan blok nyata sama-sama `absolute left-0.5 right-0.5`; bertumpuk jadi tidak terbaca, dan klik blok template (edit) bentrok dengan blok nyata (read-only). |
| **Toggle** | Satu grid, satu gaya, bolak-balik 1 klik. Perbandingan "ideal vs nyata" tetap mudah karena posisi jam identik. |

### 2. Pakai ulang `WeeklyGrid`, bukan grid baru

`WeeklyGrid` dibuat generik dan read-only kalau tanpa handler:
- Tipe blok dilonggarkan ke `GridBlock` (`id, days, start_time, end_time, title` + `category?` +
  `colors?`). `BestWeekBlock` tetap memenuhi tipe ini, jadi Best Week tidak berubah.
- `colors` ada → dipakai; tidak ada → `CATEGORY_CONFIG[category]` seperti sekarang.
- `onAddBlock` / `onEditBlock` jadi opsional. Tanpa `onAddBlock`: drag & klik slot mati,
  `cursor-crosshair` hilang. Tanpa `onEditBlock`: blok tidak bisa diklik.
- **Posisi pecahan:** `timeToSlot` sekarang `Math.floor(m / 30)`. Sesi Pomodoro 10:00–10:25 akan
  jadi tinggi 0. Diubah ke `h * 2 + m / 30` (tanpa floor). Template selalu :00/:30 jadi hasilnya
  identik untuk Best Week. `timeToSlot` hanya dipakai di `renderBlocksForDay`
  (`WeeklyGrid.tsx:101-102`); drag memakai `slotToTime`, tidak tersentuh.
- Tambah atribut `title` (tooltip native) `HH:MM–HH:MM · judul` karena blok 25 menit cuma ~17px.

### 3. Pemetaan jadwal → HFG (diverifikasi dari kode)

```
task_schedules.daily_plan_item_id → daily_plan_items.item_id → tasks.id
tasks.milestone_id → milestones.quest_id → quests.id            (task langsung)
tasks.parent_task_id → tasks.milestone_id → milestones.quest_id  (sub task; sub task tidak punya milestone_id)
```

Sumber: `combineItemsWithDetails` + `sortByPlanOrder` di
`src/app/(admin)/execution/daily-sync/DailyQuest/actions/weekly-tasks/logic.ts:20-90` memakai rantai
yang sama (sub task mewarisi milestone parent). Asumsi satu tingkat sub task, sama seperti
`sortByPlanOrder`.

**Siapa HFG:** quest `is_committed = true` di quarter minggu itu, urut `priority_score desc`, limit 3 —
persis `getQuests()` → `queryCommittedQuests`
(`src/app/(admin)/planning/main-quests/actions/quests/queries.ts:101-120`) yang dipakai tab
"HIGH FOCUS GOAL #1..#3" di Main Quests. Rank = posisi di daftar itu (1..3). Quarter dihitung dari
Senin minggu itu via `quarterOfDate` (`src/lib/quarterUtils.ts:159`), **bukan** dari
`useQuarterStore` — minggu berjalan selalu milik quarter berjalan, walau Abu sedang melihat quarter lain.

Selain itu (Daily Quest, Side Quest, Work, task tanpa milestone, task quest non-HFG) → rank 0,
abu-abu "Lainnya".

**Warna:** identitas warna HFG yang sudah ada di app = palet slot Weekly Sync
(`questColors` biru / hijau / oranye di
`src/app/(admin)/execution/weekly-sync/WeeklySyncTable/components/HorizontalGoalDisplay.tsx:8-12`).
`WeeklyGrid` memakai style inline hex, jadi palet yang sama ditulis ulang sebagai hex Tailwind
(`blue-100/700/300`, `green-100/700/300`, `orange-100/700/300`, abu `gray-100/700/300`) di konstanta
`HFG_COLORS`. Tidak bergantung ke app-dwhq (target jam HFG); dwhq nanti bisa menambah jam di legenda.

### 4. Rentang minggu & timezone

- **Minggu berjalan saja**, tanpa prev/next (acceptance cuma minta minggu ini). Tambah navigasi
  kalau terbukti perlu — `getRealWeekSchedules(weekStart)` sudah menerima parameter, jadi cukup UI.
- Senin minggu berjalan dihitung dalam **WIB**: `getLocalDateString(now)` (`src/lib/dateUtils.ts:29`)
  lalu mundur ke Senin dengan aritmetika UTC murni (pola `getPreviousDaysInWeek`,
  `weekly-tasks/logic.ts:119`). Jangan `new Date().getDay()` — di server/luar WIB salah hari.
- Rentang query UTC: `wibDateToUtcRange(senin).startUTC` s.d. `wibDateToUtcRange(minggu).endUTC`
  (`schedule/logic.ts:7`, dipakai ulang). Filter pakai **`scheduled_start_time`** saja (gte + lte),
  supaya sesi Minggu 23:30–00:30 tetap ikut.
- Tampilan: jam & hari dari `getLocalDateString` / `getLocalTimeString` (Asia/Jakarta eksplisit).
  Sesi yang melewati tengah malam dipotong di `24:00` hari mulainya.

### 5. Keamanan data

Query `querySchedulesByDateRange` yang lama tidak memfilter user (mengandalkan RLS). Query baru
memfilter eksplisit lewat join `daily_plan_items!inner(item_id, daily_plans!inner(user_id))` +
`.eq('daily_plan_items.daily_plans.user_id', userId)` — pola yang sama dengan
`src/app/api/cron/push-due/route.ts:60`. DB berisi 7 user; jangan andalkan RLS saja.

## Yang sengaja tidak dibuat

- Navigasi minggu, garis merah "sekarang", ringkasan jam per HFG (→ app-dwhq), tanggal di header hari.
- Penanganan blok bertumpuk (dua jadwal di jam sama tampil bertumpuk, sama seperti Best Week hari ini).
- Dark-mode khusus blok (Best Week juga light-only untuk blok).
- Tab "Minggu ini" saat user belum punya template sama sekali (early return empty state tetap).

## File

| File | Aksi | ± baris |
|---|---|---|
| `src/lib/best-week/types.ts` | tambah `BlockColors`, `GridBlock` | +10 |
| `src/app/(admin)/planning/best-week/components/WeeklyGrid.tsx` | generik, read-only, posisi pecahan, tooltip | ~25 diubah |
| `src/app/(admin)/planning/best-week/actions/real-week/logic.ts` | baru: pure functions + `HFG_COLORS` | +80 |
| `src/app/(admin)/planning/best-week/actions/real-week/queries.ts` | baru: `queryWeekSchedules` | +30 |
| `src/app/(admin)/planning/best-week/actions/real-week/actions.ts` | baru: `getRealWeekSchedules` | +50 |
| `.../real-week/__tests__/logic.test.ts` | baru | +120 |
| `.../real-week/__tests__/queries.test.ts` | baru | +35 |
| `src/app/(admin)/planning/best-week/hooks/useRealWeekSchedules.ts` | baru | +20 |
| `src/app/(admin)/planning/best-week/components/RealWeekView.tsx` | baru | +55 |
| `src/app/(admin)/planning/best-week/BestWeekClient.tsx` | toggle | ~30 diubah |

Total ±450 baris, 10 file (≥4 file → Antigravity).

## Verifikasi skema DB (29 Sep 2026, via MCP)
- `activity_logs.local_date` = `date`, terisi di semua 281 log 30 hari terakhir.
- Enum `activity_log_type` = `FOCUS,BREAK`; `quest_status` = `TODO,IN_PROGRESS,DONE`.
- `activity_logs.energy` dan `quests.weekly_target_hours` belum ada; migrasi baru aman.
- `daily_plan_items`: `item_id,item_type,daily_plan_id`; 4 quest committed memuat "Urut antrean".
