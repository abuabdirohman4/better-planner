# Best Week — Design Document

**Date:** 2026-03-27
**Status:** Approved
**Scope:** MVP — Template Builder + Daily Reference (no adherence tracking)

---

## Overview

Best Week adalah fitur visual time-blocking yang membantu user merancang jadwal ideal mereka dalam format grid 7 hari × slot 30 menit. User bisa punya multiple templates (satu per quarter/mode), dan satu template aktif ditampilkan sebagai referensi di Daily Sync.

> *"Tujuan dibuat jadwal itu bukan untuk dijalani secara strict 100%, tapi untuk merancang aktivitas yang terarah dimana penerapannya bisa terus kita EVALUASI secara berkala."*

---

## Decisions

| Keputusan | Pilihan | Alasan |
|-----------|---------|--------|
| Schema | Replace `ideal_time_blocks` sepenuhnya | Struktur lama tidak support category 4-level dan multi-day blocks |
| Template | Multi-template per user | User perlu template berbeda tiap quarter (Q1, Ramadan, dll) |
| Days granularity | Per-day (days[]) bukan weekday/weekend | Tiap hari bisa berbeda (Jumat ada Jum'at, Sabtu berbeda dari Minggu) |
| UI interaction | Klik + drag di grid (Google Calendar style) | Lebih natural untuk time-blocking |
| Adherence tracking | Skip untuk MVP | Terlalu complex, fokus ke builder dulu |

---

## Database Schema

### Drop tabel lama
```sql
DROP TABLE IF EXISTS public.ideal_time_blocks;
```

### Tabel baru

```sql
-- Template container
CREATE TABLE public.best_week_templates (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        VARCHAR NOT NULL,           -- "Q1 2026 Default", "Ramadan 2026"
  is_active   BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- Constraint: hanya 1 template aktif per user
CREATE UNIQUE INDEX best_week_templates_active_idx
  ON public.best_week_templates (user_id)
  WHERE is_active = true;

-- Time blocks per template
CREATE TABLE public.best_week_blocks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.best_week_templates(id) ON DELETE CASCADE,
  days        VARCHAR[] NOT NULL,  -- ["mon","tue","wed","thu","fri"] atau ["sat","sun"] dll
  start_time  TIME NOT NULL,       -- "04:00"
  end_time    TIME NOT NULL,       -- "04:30"
  category    VARCHAR NOT NULL CHECK (category IN (
                'high_lifetime_value',
                'high_rupiah_value',
                'low_rupiah_value',
                'zero_rupiah_value',
                'transition'
              )),
  title       VARCHAR NOT NULL,    -- "Shalat Tahajud", "Kerja", "Free"
  description TEXT,
  color       VARCHAR,             -- optional hex override, default dari category
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT end_after_start CHECK (end_time > start_time)
);

-- RLS
ALTER TABLE public.best_week_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.best_week_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own templates"
  ON public.best_week_templates FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own blocks"
  ON public.best_week_blocks FOR ALL
  USING (
    template_id IN (
      SELECT id FROM public.best_week_templates WHERE user_id = auth.uid()
    )
  );
```

### Category → Color Mapping

| Category | Label | Color | Icon |
|----------|-------|-------|------|
| `high_lifetime_value` | High Lifetime Value | `#10B981` (Green) | 🌟 |
| `high_rupiah_value` | High Rupiah Value | `#3B82F6` (Blue) | 💰 |
| `low_rupiah_value` | Low Rupiah Value | `#F59E0B` (Amber) | 📋 |
| `zero_rupiah_value` | Zero Rupiah Value | `#EF4444` (Red) | ⛔ |
| `transition` | Transition | `#8B5CF6` (Purple) | ⏸️ |

---

## Architecture

### File Structure

```
src/app/(admin)/planning/best-week/
  page.tsx                          # Route page
  BestWeekClient.tsx                # Client component utama
  actions/
    index.ts                        # Re-exports
    templates/
      queries.ts                    # Supabase queries untuk templates
      logic.ts                      # Business logic (validation)
      actions.ts                    # Server actions
    blocks/
      queries.ts                    # Supabase queries untuk blocks
      logic.ts                      # Overlap detection, hour calculation
      actions.ts                    # Server actions
  hooks/
    useBestWeekTemplate.ts          # SWR: active template
    useBestWeekBlocks.ts            # SWR: blocks per template
  components/
    TemplateSelector.tsx            # Dropdown: pilih/buat/rename template
    WeeklyGrid.tsx                  # Grid 7 hari × 30min, interactive
    BlockModal.tsx                  # Modal: add/edit block (muncul setelah drag)
    CategoryBadge.tsx               # Badge warna per kategori
    HourSummary.tsx                 # Total jam per kategori di footer

src/app/(admin)/execution/daily-sync/
  BestWeekReference/
    BestWeekReferenceSection.tsx    # CollapsibleCard wrapper
    components/
      TodaySchedule.tsx             # List blocks hari ini, sorted by time
      CurrentBlockHighlight.tsx     # Logic highlight block aktif

src/lib/best-week/
  constants.ts    # CATEGORY_COLORS, CATEGORY_LABELS, DAY_LABELS
  types.ts        # TypeScript interfaces
```

### Patterns yang Diikuti

- **Server Actions**: `"use server"` dengan split queries/logic/actions (seperti `planning/main-quests/actions/`)
- **SWR Hooks**: client-side fetching + optimistic updates (seperti `useDailyPlanManagement`)
- **CollapsibleCard**: untuk Daily Reference section (seperti BrainDump, ActivityLog)
- **RLS**: semua query difilter via `user_id` di policy

---

## UI Design

### Best Week Builder (`/planning/best-week`)

```
┌─────────────────────────────────────────────────────────────┐
│ Best Week                              [+ New Template]     │
│ Template: [Q1 2026 Default ▼]                               │
├──────────┬────────┬────────┬────────┬────────┬──────┬───────┤
│  WAKTU   │ SENIN  │ SELASA │  RABU  │ KAMIS  │ JUM  │ SAB │ MIN │
├──────────┼────────┴────────┴────────┴────────┴──────┴───────┤
│ 04:00    │ ████████████ Shalat Tahajud (HLVA) ████████████  │
│ 04:30    │ ████████████ Shalat Subuh (HLVA) ██████████████  │
│ ...      │                                                   │
│ 09:00    │ ████████████ Kerja (HRVA) ██████ │ ████ Free ███ │
│ ...      │                                                   │
├──────────┴────────────────────────────────────────────────┤
│ Total: 🌟 4h  💰 8h  📋 1h  ⛔ 0h  ⏸️ 1h                  │
└─────────────────────────────────────────────────────────────┘
```

**Interactions:**
- **Drag** di empty cell → select range → BlockModal muncul (pre-filled dengan time range)
- **Klik block** yang ada → BlockModal muncul untuk edit
- **BlockModal fields**: Title, Category, Days (checkboxes Mon-Sun), Start Time, End Time, Description (optional)
- **Delete** via tombol di BlockModal
- Blocks ditampilkan dengan background color sesuai category
- Overlap pada hari yang sama = visual warning (border merah)

### BlockModal

```
┌──────────────────────────────────┐
│ Add Time Block             [✕]   │
├──────────────────────────────────┤
│ Title: [Shalat Tahajud        ]  │
│                                  │
│ Category:                        │
│ ○ 🌟 High Lifetime Value        │
│ ● 💰 High Rupiah Value          │
│ ○ 📋 Low Rupiah Value           │
│ ○ ⛔ Zero Rupiah Value          │
│ ○ ⏸️  Transition                │
│                                  │
│ Days:                            │
│ [✓] Sen [✓] Sel [✓] Rab         │
│ [✓] Kam [✓] Jum [✓] Sab [✓] Min│
│                                  │
│ Time: [04:00] → [04:30]          │
│                                  │
│ Description: [optional...]       │
│                                  │
│ [Delete Block]    [Cancel] [Save]│
└──────────────────────────────────┘
```

### Daily Reference Section (di bawah BrainDump, Daily Sync)

```
┌──────────────────────────────────────────────────┐
│ 📅 Best Week Reference                      [▼] │
├──────────────────────────────────────────────────┤
│ Jadwal Ideal Hari Ini — Senin                    │
│                                                  │
│   04:00 - 04:30  Shalat Tahajud  🌟             │
│   04:30 - 05:00  Shalat Subuh    🌟             │
│ ► 09:00 - 12:00  Kerja           💰  ← aktif   │
│   12:00 - 13:00  Shalat Duhur    ⏸️             │
│   ...                                            │
│                                                  │
│ 🌟 4h  💰 8h  📋 1h                             │
└──────────────────────────────────────────────────┘
```

- Collapsed by default (ditambahkan ke `cardCollapsed` di `uiPreferencesStore`)
- Filter blocks by hari ini (`days` array contains today's day code)
- Highlight (`►`) block yang `start_time ≤ now < end_time`
- Jika tidak ada active template → tampil empty state dengan link ke builder

---

## Data Flow

### Builder Page Load
```
1. useBestWeekTemplate() → GET active template untuk user ini
2. useBestWeekBlocks(templateId) → GET all blocks untuk template aktif
3. Render WeeklyGrid dengan blocks
4. Jika tidak ada template → prompt buat template pertama
```

### Add Block (drag)
```
1. User drag di grid → onDragEnd(startSlot, endSlot, dayIndex)
2. BlockModal terbuka dengan start_time, end_time pre-filled
3. User isi form → submit
4. Server Action: validate (end > start, no overlap per day) → INSERT
5. mutate() SWR cache → grid re-render
```

### Switch Template
```
1. User pilih template lain di TemplateSelector
2. Server Action: SET is_active=false semua, SET is_active=true untuk yang dipilih
3. mutate() → blocks reload untuk template baru
```

### Daily Reference
```
1. Get today's day code (mon/tue/.../sun)
2. Fetch active template blocks WHERE days @> [today]
3. Sort by start_time
4. setInterval 60s → re-check current block highlight
```

---

## Business Logic

### Overlap Detection
Block dianggap overlap jika pada hari yang sama, time range berpotongan:
```typescript
function hasOverlap(existing: Block, newBlock: Block, day: string): boolean {
  if (!existing.days.includes(day) || !newBlock.days.includes(day)) return false;
  return existing.start_time < newBlock.end_time &&
         existing.end_time > newBlock.start_time;
}
```
MVP: tampilkan warning tapi tidak block save (user bisa intentionally overlap).

### Hour Calculation
```typescript
function calcHours(blocks: Block[], category: string): number {
  return blocks
    .filter(b => b.category === category)
    .reduce((sum, b) => {
      const uniqueDays = b.days.length;
      const durationHours = timeDiff(b.start_time, b.end_time) / 60;
      return sum + durationHours * uniqueDays;
    }, 0);
}
```

---

## Out of Scope (MVP)

- Adherence tracking (planned vs actual hours)
- Drag-to-resize blocks yang sudah ada
- Copy template ke quarter baru (manual re-create dulu)
- Notifikasi "kamu sedang di luar jadwal Best Week"
- Export/print grid (seperti gambar spreadsheet)

---

## Navigation

Tambahkan ke `AppSidebar.tsx` — uncomment item yang sudah ada:
```typescript
// Di planningNav array — uncomment:
{
  icon: <ShootingStarIcon />,
  name: "Best Week",
  path: "/planning/best-week",
}
```

---

## References

- Concept: `docs/best_week/BEST_WEEK_CONCEPT.md`
- Implementation spec: `docs/best_week/BEST_WEEK_IMPLEMENTATION.md`
- Pattern reference: `src/app/(admin)/planning/main-quests/` (3-layer actions)
- Pattern reference: `src/app/(admin)/execution/daily-sync/BrainDump/` (CollapsibleCard)
