# Best Week Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Bangun fitur Best Week — interactive 7-day time-blocking grid dengan multiple templates dan daily reference widget di Daily Sync.

**Architecture:** Multi-template per user (best_week_templates + best_week_blocks), Server Actions dengan 3-layer pattern (queries/logic/actions), SWR untuk client-side fetching. Grid interaktif dengan klik+drag (Google Calendar style) untuk add blocks, BlockModal untuk edit/delete.

**Tech Stack:** Next.js 15 App Router, Supabase (MCP), TypeScript, Tailwind CSS v4, SWR, Zustand (uiPreferencesStore), Sonner (toast), shadcn/ui existing components.

---

## Phase 1: Database & Types

### Task 1: Buat migration database

**Files:**
- Run via: MCP Supabase `apply_migration`

**Step 1: Jalankan migration via MCP**

```sql
-- Drop tabel lama (0 rows, aman)
DROP TABLE IF EXISTS public.ideal_time_blocks;

-- Template container
CREATE TABLE public.best_week_templates (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        VARCHAR NOT NULL,
  is_active   BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- Hanya 1 template aktif per user
CREATE UNIQUE INDEX best_week_templates_active_idx
  ON public.best_week_templates (user_id)
  WHERE is_active = true;

-- Time blocks per template
CREATE TABLE public.best_week_blocks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.best_week_templates(id) ON DELETE CASCADE,
  days        VARCHAR[] NOT NULL,
  start_time  TIME NOT NULL,
  end_time    TIME NOT NULL,
  category    VARCHAR NOT NULL CHECK (category IN (
                'high_lifetime_value', 'high_rupiah_value',
                'low_rupiah_value', 'zero_rupiah_value', 'transition'
              )),
  title       VARCHAR NOT NULL,
  description TEXT,
  color       VARCHAR,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT end_after_start CHECK (end_time > start_time)
);

-- RLS
ALTER TABLE public.best_week_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.best_week_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own templates"
  ON public.best_week_templates FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own blocks"
  ON public.best_week_blocks FOR ALL
  USING (
    template_id IN (
      SELECT id FROM public.best_week_templates WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    template_id IN (
      SELECT id FROM public.best_week_templates WHERE user_id = auth.uid()
    )
  );
```

**Step 2: Verify tables exist**

Via MCP `list_tables` — pastikan `best_week_templates` dan `best_week_blocks` muncul.

**Step 3: Commit**

```bash
git add -A
git commit -m "feat(best-week): add database migration for templates and blocks (bp-xxx)"
```

---

### Task 2: Buat TypeScript types & constants

**Files:**
- Create: `src/lib/best-week/types.ts`
- Create: `src/lib/best-week/constants.ts`

**Step 1: Buat `src/lib/best-week/types.ts`**

```typescript
export type DayCode = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export type ActivityCategory =
  | 'high_lifetime_value'
  | 'high_rupiah_value'
  | 'low_rupiah_value'
  | 'zero_rupiah_value'
  | 'transition';

export interface BestWeekTemplate {
  id: string;
  user_id: string;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BestWeekBlock {
  id: string;
  template_id: string;
  days: DayCode[];
  start_time: string;  // "HH:MM:SS" dari Supabase TIME
  end_time: string;    // "HH:MM:SS"
  category: ActivityCategory;
  title: string;
  description: string | null;
  color: string | null;
  created_at: string;
  updated_at: string;
}

// Form data untuk BlockModal
export interface BlockFormData {
  title: string;
  category: ActivityCategory;
  days: DayCode[];
  start_time: string;  // "HH:MM" format untuk UI
  end_time: string;    // "HH:MM" format untuk UI
  description?: string;
}
```

**Step 2: Buat `src/lib/best-week/constants.ts`**

```typescript
import type { ActivityCategory, DayCode } from './types';

export const CATEGORY_CONFIG: Record<ActivityCategory, {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string;
}> = {
  high_lifetime_value: {
    label: 'High Lifetime Value',
    color: '#047857',
    bgColor: '#D1FAE5',
    borderColor: '#10B981',
    icon: '🌟',
  },
  high_rupiah_value: {
    label: 'High Rupiah Value',
    color: '#1E40AF',
    bgColor: '#DBEAFE',
    borderColor: '#3B82F6',
    icon: '💰',
  },
  low_rupiah_value: {
    label: 'Low Rupiah Value',
    color: '#D97706',
    bgColor: '#FEF3C7',
    borderColor: '#F59E0B',
    icon: '📋',
  },
  zero_rupiah_value: {
    label: 'Zero Rupiah Value',
    color: '#B91C1C',
    bgColor: '#FEE2E2',
    borderColor: '#EF4444',
    icon: '⛔',
  },
  transition: {
    label: 'Transition',
    color: '#6D28D9',
    bgColor: '#EDE9FE',
    borderColor: '#8B5CF6',
    icon: '⏸️',
  },
};

export const DAY_CODES: DayCode[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

export const DAY_LABELS: Record<DayCode, string> = {
  mon: 'Senin',
  tue: 'Selasa',
  wed: 'Rabu',
  thu: 'Kamis',
  fri: 'Jumat',
  sat: 'Sabtu',
  sun: 'Minggu',
};

export const DAY_SHORT_LABELS: Record<DayCode, string> = {
  mon: 'Sen',
  tue: 'Sel',
  wed: 'Rab',
  thu: 'Kam',
  fri: 'Jum',
  sat: 'Sab',
  sun: 'Min',
};

// Grid: 30-menit slots dari 00:00 sampai 23:30
export const TIME_SLOTS: string[] = Array.from({ length: 48 }, (_, i) => {
  const hour = Math.floor(i / 2).toString().padStart(2, '0');
  const min = i % 2 === 0 ? '00' : '30';
  return `${hour}:${min}`;
});
```

**Step 3: Commit**

```bash
git add src/lib/best-week/
git commit -m "feat(best-week): add TypeScript types and constants"
```

---

## Phase 2: Server Actions (3-Layer Pattern)

### Task 3: Template queries & logic

**Files:**
- Create: `src/app/(admin)/planning/best-week/actions/templates/queries.ts`
- Create: `src/app/(admin)/planning/best-week/actions/templates/logic.ts`

**Step 1: Buat `queries.ts`**

```typescript
import type { SupabaseClient } from '@supabase/supabase-js';
import type { BestWeekTemplate } from '@/lib/best-week/types';

export async function queryActiveTemplate(
  supabase: SupabaseClient,
  userId: string
): Promise<BestWeekTemplate | null> {
  const { data, error } = await supabase
    .from('best_week_templates')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .single();
  if (error) return null;
  return data;
}

export async function queryAllTemplates(
  supabase: SupabaseClient,
  userId: string
): Promise<BestWeekTemplate[]> {
  const { data, error } = await supabase
    .from('best_week_templates')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) return [];
  return data ?? [];
}

export async function insertTemplate(
  supabase: SupabaseClient,
  data: { user_id: string; name: string; is_active: boolean }
): Promise<BestWeekTemplate> {
  const { data: result, error } = await supabase
    .from('best_week_templates')
    .insert(data)
    .select('*')
    .single();
  if (error) throw new Error('Gagal membuat template');
  return result;
}

export async function updateTemplateActiveStatus(
  supabase: SupabaseClient,
  userId: string,
  templateId: string
): Promise<void> {
  // Deactivate all
  await supabase
    .from('best_week_templates')
    .update({ is_active: false })
    .eq('user_id', userId);
  // Activate target
  const { error } = await supabase
    .from('best_week_templates')
    .update({ is_active: true })
    .eq('id', templateId)
    .eq('user_id', userId);
  if (error) throw new Error('Gagal mengaktifkan template');
}

export async function updateTemplateName(
  supabase: SupabaseClient,
  templateId: string,
  name: string
): Promise<void> {
  const { error } = await supabase
    .from('best_week_templates')
    .update({ name, updated_at: new Date().toISOString() })
    .eq('id', templateId);
  if (error) throw new Error('Gagal mengupdate nama template');
}

export async function deleteTemplateById(
  supabase: SupabaseClient,
  templateId: string
): Promise<void> {
  const { error } = await supabase
    .from('best_week_templates')
    .delete()
    .eq('id', templateId);
  if (error) throw new Error('Gagal menghapus template');
}
```

**Step 2: Buat `logic.ts`**

```typescript
export function validateTemplateName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) throw new Error('Nama template tidak boleh kosong');
  if (trimmed.length > 100) throw new Error('Nama template terlalu panjang (max 100 karakter)');
  return trimmed;
}
```

**Step 3: Commit**

```bash
git add src/app/(admin)/planning/best-week/
git commit -m "feat(best-week): add template queries and logic"
```

---

### Task 4: Template server actions

**Files:**
- Create: `src/app/(admin)/planning/best-week/actions/templates/actions.ts`

**Step 1: Buat `actions.ts`**

```typescript
"use server";

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  queryActiveTemplate,
  queryAllTemplates,
  insertTemplate,
  updateTemplateActiveStatus,
  updateTemplateName,
  deleteTemplateById,
} from './queries';
import { validateTemplateName } from './logic';

export async function getActiveTemplate() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  return queryActiveTemplate(supabase, user.id);
}

export async function getAllTemplates() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  return queryAllTemplates(supabase, user.id);
}

export async function createTemplate(name: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  const validName = validateTemplateName(name);
  // Cek apakah sudah ada template aktif
  const existing = await queryActiveTemplate(supabase, user.id);
  const template = await insertTemplate(supabase, {
    user_id: user.id,
    name: validName,
    is_active: !existing, // aktif jika belum ada template aktif
  });
  revalidatePath('/planning/best-week');
  return template;
}

export async function setActiveTemplate(templateId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  await updateTemplateActiveStatus(supabase, user.id, templateId);
  revalidatePath('/planning/best-week');
  return { message: 'Template berhasil diaktifkan' };
}

export async function renameTemplate(templateId: string, name: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  const validName = validateTemplateName(name);
  await updateTemplateName(supabase, templateId, validName);
  revalidatePath('/planning/best-week');
  return { message: 'Nama template berhasil diupdate' };
}

export async function deleteTemplate(templateId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  // Blocks otomatis terhapus via CASCADE
  await deleteTemplateById(supabase, templateId);
  revalidatePath('/planning/best-week');
  return { message: 'Template berhasil dihapus' };
}
```

**Step 2: Commit**

```bash
git add src/app/(admin)/planning/best-week/actions/templates/
git commit -m "feat(best-week): add template server actions"
```

---

### Task 5: Block queries & logic

**Files:**
- Create: `src/app/(admin)/planning/best-week/actions/blocks/queries.ts`
- Create: `src/app/(admin)/planning/best-week/actions/blocks/logic.ts`

**Step 1: Buat `queries.ts`**

```typescript
import type { SupabaseClient } from '@supabase/supabase-js';
import type { BestWeekBlock } from '@/lib/best-week/types';

export async function queryBlocksByTemplateId(
  supabase: SupabaseClient,
  templateId: string
): Promise<BestWeekBlock[]> {
  const { data, error } = await supabase
    .from('best_week_blocks')
    .select('*')
    .eq('template_id', templateId)
    .order('start_time', { ascending: true });
  if (error) return [];
  return data ?? [];
}

export async function insertBlock(
  supabase: SupabaseClient,
  data: Omit<BestWeekBlock, 'id' | 'created_at' | 'updated_at'>
): Promise<BestWeekBlock> {
  const { data: result, error } = await supabase
    .from('best_week_blocks')
    .insert(data)
    .select('*')
    .single();
  if (error) throw new Error('Gagal menambah block');
  return result;
}

export async function updateBlockById(
  supabase: SupabaseClient,
  blockId: string,
  data: Partial<Omit<BestWeekBlock, 'id' | 'template_id' | 'created_at' | 'updated_at'>>
): Promise<void> {
  const { error } = await supabase
    .from('best_week_blocks')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', blockId);
  if (error) throw new Error('Gagal mengupdate block');
}

export async function deleteBlockById(
  supabase: SupabaseClient,
  blockId: string
): Promise<void> {
  const { error } = await supabase
    .from('best_week_blocks')
    .delete()
    .eq('id', blockId);
  if (error) throw new Error('Gagal menghapus block');
}
```

**Step 2: Buat `logic.ts`**

```typescript
import type { BestWeekBlock, BlockFormData, DayCode } from '@/lib/best-week/types';

// Konversi "HH:MM" (UI) → "HH:MM:00" (Supabase TIME)
export function toDbTime(time: string): string {
  return time.length === 5 ? `${time}:00` : time;
}

// Konversi "HH:MM:SS" (Supabase) → "HH:MM" (UI)
export function toUiTime(time: string): string {
  return time.substring(0, 5);
}

export function validateBlockForm(data: BlockFormData): void {
  if (!data.title.trim()) throw new Error('Judul block tidak boleh kosong');
  if (data.days.length === 0) throw new Error('Pilih minimal 1 hari');
  if (!data.start_time || !data.end_time) throw new Error('Waktu tidak boleh kosong');
  if (data.start_time >= data.end_time) throw new Error('Waktu selesai harus setelah waktu mulai');
}

// Cek apakah dua block overlap pada hari tertentu
export function blocksOverlapOnDay(a: BestWeekBlock, b: BestWeekBlock, day: DayCode): boolean {
  if (!a.days.includes(day) || !b.days.includes(day)) return false;
  return a.start_time < b.end_time && a.end_time > b.start_time;
}

// Hitung total jam untuk satu kategori (mempertimbangkan jumlah hari)
export function calcTotalHours(blocks: BestWeekBlock[], category: string): number {
  return blocks
    .filter(b => b.category === category)
    .reduce((sum, b) => {
      const [sh, sm] = b.start_time.split(':').map(Number);
      const [eh, em] = b.end_time.split(':').map(Number);
      const durationHours = (eh * 60 + em - (sh * 60 + sm)) / 60;
      return sum + durationHours * b.days.length;
    }, 0);
}
```

**Step 3: Commit**

```bash
git add src/app/(admin)/planning/best-week/actions/blocks/
git commit -m "feat(best-week): add block queries and logic"
```

---

### Task 6: Block server actions + index

**Files:**
- Create: `src/app/(admin)/planning/best-week/actions/blocks/actions.ts`
- Create: `src/app/(admin)/planning/best-week/actions/index.ts`

**Step 1: Buat `blocks/actions.ts`**

```typescript
"use server";

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  queryBlocksByTemplateId,
  insertBlock,
  updateBlockById,
  deleteBlockById,
} from './queries';
import { validateBlockForm, toDbTime } from './logic';
import type { BlockFormData } from '@/lib/best-week/types';

export async function getBlocksForTemplate(templateId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  return queryBlocksByTemplateId(supabase, templateId);
}

export async function addBlock(templateId: string, formData: BlockFormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  validateBlockForm(formData);
  const block = await insertBlock(supabase, {
    template_id: templateId,
    days: formData.days,
    start_time: toDbTime(formData.start_time),
    end_time: toDbTime(formData.end_time),
    category: formData.category,
    title: formData.title.trim(),
    description: formData.description?.trim() || null,
    color: null,
  });
  revalidatePath('/planning/best-week');
  return block;
}

export async function updateBlock(blockId: string, formData: BlockFormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  validateBlockForm(formData);
  await updateBlockById(supabase, blockId, {
    days: formData.days,
    start_time: toDbTime(formData.start_time),
    end_time: toDbTime(formData.end_time),
    category: formData.category,
    title: formData.title.trim(),
    description: formData.description?.trim() || null,
  });
  revalidatePath('/planning/best-week');
  return { message: 'Block berhasil diupdate' };
}

export async function deleteBlock(blockId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  await deleteBlockById(supabase, blockId);
  revalidatePath('/planning/best-week');
  return { message: 'Block berhasil dihapus' };
}
```

**Step 2: Buat `actions/index.ts`**

```typescript
export * from './templates/actions';
export * from './blocks/actions';
```

**Step 3: Commit**

```bash
git add src/app/(admin)/planning/best-week/actions/
git commit -m "feat(best-week): add block server actions and index"
```

---

## Phase 3: SWR Hooks

### Task 7: SWR hooks untuk template & blocks

**Files:**
- Create: `src/app/(admin)/planning/best-week/hooks/useBestWeekTemplates.ts`
- Create: `src/app/(admin)/planning/best-week/hooks/useBestWeekBlocks.ts`

**Step 1: Buat `useBestWeekTemplates.ts`**

```typescript
import useSWR from 'swr';
import { getAllTemplates, getActiveTemplate } from '../actions';

export function useBestWeekTemplates() {
  const { data: templates, mutate, isLoading, error } = useSWR(
    'best-week-templates',
    () => getAllTemplates()
  );

  const activeTemplate = templates?.find(t => t.is_active) ?? null;

  return {
    templates: templates ?? [],
    activeTemplate,
    mutate,
    isLoading,
    error,
  };
}
```

**Step 2: Buat `useBestWeekBlocks.ts`**

```typescript
import useSWR from 'swr';
import { getBlocksForTemplate } from '../actions';

export function useBestWeekBlocks(templateId: string | null) {
  const { data: blocks, mutate, isLoading, error } = useSWR(
    templateId ? `best-week-blocks-${templateId}` : null,
    () => getBlocksForTemplate(templateId!)
  );

  return {
    blocks: blocks ?? [],
    mutate,
    isLoading,
    error,
  };
}
```

**Step 3: Commit**

```bash
git add src/app/(admin)/planning/best-week/hooks/
git commit -m "feat(best-week): add SWR hooks for templates and blocks"
```

---

## Phase 4: UI Components

### Task 8: CategoryBadge component

**Files:**
- Create: `src/app/(admin)/planning/best-week/components/CategoryBadge.tsx`

**Step 1: Buat component**

```tsx
import React from 'react';
import { CATEGORY_CONFIG } from '@/lib/best-week/constants';
import type { ActivityCategory } from '@/lib/best-week/types';

interface CategoryBadgeProps {
  category: ActivityCategory;
  showIcon?: boolean;
  size?: 'sm' | 'md';
}

export default function CategoryBadge({ category, showIcon = true, size = 'sm' }: CategoryBadgeProps) {
  const config = CATEGORY_CONFIG[category];
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${sizeClass}`}
      style={{ backgroundColor: config.bgColor, color: config.color, border: `1px solid ${config.borderColor}` }}
    >
      {showIcon && <span>{config.icon}</span>}
      {config.label}
    </span>
  );
}
```

**Step 2: Commit**

```bash
git add src/app/(admin)/planning/best-week/components/CategoryBadge.tsx
git commit -m "feat(best-week): add CategoryBadge component"
```

---

### Task 9: TemplateSelector component

**Files:**
- Create: `src/app/(admin)/planning/best-week/components/TemplateSelector.tsx`

**Step 1: Buat component**

```tsx
"use client";

import React, { useState } from 'react';
import { toast } from 'sonner';
import type { BestWeekTemplate } from '@/lib/best-week/types';
import { createTemplate, setActiveTemplate, renameTemplate, deleteTemplate } from '../actions';

interface TemplateSelectorProps {
  templates: BestWeekTemplate[];
  activeTemplate: BestWeekTemplate | null;
  onMutate: () => void;
}

export default function TemplateSelector({ templates, activeTemplate, onMutate }: TemplateSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      await createTemplate(newName.trim());
      onMutate();
      setNewName('');
      setIsCreating(false);
      toast.success('Template berhasil dibuat');
    } catch (e) {
      toast.error('Gagal membuat template');
    }
  };

  const handleSetActive = async (templateId: string) => {
    try {
      await setActiveTemplate(templateId);
      onMutate();
      setIsOpen(false);
    } catch (e) {
      toast.error('Gagal mengaktifkan template');
    }
  };

  const handleDelete = async (e: React.MouseEvent, templateId: string) => {
    e.stopPropagation();
    if (!confirm('Hapus template ini? Semua blocks akan ikut terhapus.')) return;
    try {
      await deleteTemplate(templateId);
      onMutate();
      toast.success('Template berhasil dihapus');
    } catch (e) {
      toast.error('Gagal menghapus template');
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700"
      >
        <span>{activeTemplate?.name ?? 'Pilih Template'}</span>
        <span className="text-gray-400">▼</span>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
          {templates.map(t => (
            <div
              key={t.id}
              onClick={() => handleSetActive(t.id)}
              className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
            >
              <span className={`text-sm ${t.is_active ? 'font-semibold text-blue-600' : ''}`}>
                {t.is_active ? '✓ ' : ''}{t.name}
              </span>
              {templates.length > 1 && (
                <button
                  onClick={(e) => handleDelete(e, t.id)}
                  className="text-gray-400 hover:text-red-500 text-xs px-1"
                >
                  ✕
                </button>
              )}
            </div>
          ))}

          <div className="border-t border-gray-200 dark:border-gray-700 p-2">
            {isCreating ? (
              <div className="flex gap-2">
                <input
                  autoFocus
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCreate()}
                  placeholder="Nama template..."
                  className="flex-1 text-sm px-2 py-1 border rounded dark:bg-gray-700 dark:border-gray-600"
                />
                <button onClick={handleCreate} className="text-sm text-blue-600 font-medium">OK</button>
                <button onClick={() => setIsCreating(false)} className="text-sm text-gray-400">✕</button>
              </div>
            ) : (
              <button
                onClick={() => setIsCreating(true)}
                className="w-full text-left text-sm text-blue-600 hover:text-blue-700 px-1"
              >
                + Template Baru
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/app/(admin)/planning/best-week/components/TemplateSelector.tsx
git commit -m "feat(best-week): add TemplateSelector component"
```

---

### Task 10: BlockModal component

**Files:**
- Create: `src/app/(admin)/planning/best-week/components/BlockModal.tsx`

**Step 1: Buat component**

```tsx
"use client";

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { CATEGORY_CONFIG, DAY_CODES, DAY_SHORT_LABELS } from '@/lib/best-week/constants';
import type { ActivityCategory, BlockFormData, DayCode, BestWeekBlock } from '@/lib/best-week/types';
import { addBlock, updateBlock, deleteBlock } from '../actions';

interface BlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  templateId: string;
  // Pre-filled saat drag (add mode)
  prefill?: { start_time: string; end_time: string; day: DayCode };
  // Block yang di-edit (edit mode)
  block?: BestWeekBlock;
}

const DEFAULT_FORM: BlockFormData = {
  title: '',
  category: 'high_lifetime_value',
  days: [],
  start_time: '09:00',
  end_time: '10:00',
  description: '',
};

export default function BlockModal({
  isOpen, onClose, onSave, templateId, prefill, block
}: BlockModalProps) {
  const [form, setForm] = useState<BlockFormData>(DEFAULT_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const isEdit = !!block;

  useEffect(() => {
    if (!isOpen) return;
    if (block) {
      // Edit mode: isi dari block yang ada
      setForm({
        title: block.title,
        category: block.category,
        days: block.days,
        start_time: block.start_time.substring(0, 5),
        end_time: block.end_time.substring(0, 5),
        description: block.description ?? '',
      });
    } else if (prefill) {
      // Add mode dari drag
      setForm({ ...DEFAULT_FORM, start_time: prefill.start_time, end_time: prefill.end_time, days: [prefill.day] });
    } else {
      setForm(DEFAULT_FORM);
    }
  }, [isOpen, block, prefill]);

  const toggleDay = (day: DayCode) => {
    setForm(f => ({
      ...f,
      days: f.days.includes(day) ? f.days.filter(d => d !== day) : [...f.days, day],
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (isEdit && block) {
        await updateBlock(block.id, form);
        toast.success('Block berhasil diupdate');
      } else {
        await addBlock(templateId, form);
        toast.success('Block berhasil ditambahkan');
      }
      onSave();
      onClose();
    } catch (e: any) {
      toast.error(e.message ?? 'Gagal menyimpan block');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!block) return;
    if (!confirm('Hapus block ini?')) return;
    setIsSaving(true);
    try {
      await deleteBlock(block.id);
      toast.success('Block berhasil dihapus');
      onSave();
      onClose();
    } catch (e) {
      toast.error('Gagal menghapus block');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">
            {isEdit ? 'Edit Block' : 'Tambah Block'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Judul</label>
            <input
              autoFocus
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Shalat Tahajud, Kerja, Free..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-gray-100"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Kategori</label>
            <div className="space-y-1">
              {(Object.keys(CATEGORY_CONFIG) as ActivityCategory[]).map(cat => (
                <label key={cat} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={form.category === cat}
                    onChange={() => setForm(f => ({ ...f, category: cat }))}
                  />
                  <span className="text-sm">
                    {CATEGORY_CONFIG[cat].icon} {CATEGORY_CONFIG[cat].label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Days */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Hari</label>
            <div className="flex gap-2 flex-wrap">
              {DAY_CODES.map(day => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`px-2 py-1 rounded text-xs font-medium border transition-colors ${
                    form.days.includes(day)
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600'
                  }`}
                >
                  {DAY_SHORT_LABELS[day]}
                </button>
              ))}
            </div>
          </div>

          {/* Time */}
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mulai</label>
              <input
                type="time"
                value={form.start_time}
                onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-gray-100"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Selesai</label>
              <input
                type="time"
                value={form.end_time}
                onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-gray-100"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Deskripsi <span className="text-gray-400">(opsional)</span>
            </label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={2}
              placeholder="Keterangan tambahan..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-gray-100 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-6">
          <div>
            {isEdit && (
              <button
                onClick={handleDelete}
                disabled={isSaving}
                className="text-sm text-red-500 hover:text-red-700"
              >
                Hapus Block
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              Batal
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              {isSaving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/app/(admin)/planning/best-week/components/BlockModal.tsx
git commit -m "feat(best-week): add BlockModal component"
```

---

### Task 11: WeeklyGrid component (interactive)

**Files:**
- Create: `src/app/(admin)/planning/best-week/components/WeeklyGrid.tsx`

**Step 1: Buat component**

Ini adalah komponen terbesar — grid 7 hari × 48 slots (30 menit each), dengan drag untuk select range.

```tsx
"use client";

import React, { useState, useRef, useCallback } from 'react';
import { CATEGORY_CONFIG, DAY_CODES, DAY_LABELS, TIME_SLOTS } from '@/lib/best-week/constants';
import type { BestWeekBlock, DayCode } from '@/lib/best-week/types';

interface DragState {
  dayIndex: number;
  startSlot: number;
  endSlot: number;
  isDragging: boolean;
}

interface WeeklyGridProps {
  blocks: BestWeekBlock[];
  onAddBlock: (prefill: { start_time: string; end_time: string; day: DayCode }) => void;
  onEditBlock: (block: BestWeekBlock) => void;
}

// Konversi "HH:MM:SS" ke slot index (0-47)
function timeToSlot(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 2 + Math.floor(m / 30);
}

// Konversi slot index ke "HH:MM"
function slotToTime(slot: number): string {
  const h = Math.floor(slot / 2).toString().padStart(2, '0');
  const m = slot % 2 === 0 ? '00' : '30';
  return `${h}:${m}`;
}

export default function WeeklyGrid({ blocks, onAddBlock, onEditBlock }: WeeklyGridProps) {
  const [drag, setDrag] = useState<DragState | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // Buat map: dayIndex → list of block renderings
  const blocksByDay = DAY_CODES.map((day, dayIndex) =>
    blocks.filter(b => b.days.includes(day))
  );

  const handleMouseDown = (dayIndex: number, slotIndex: number, e: React.MouseEvent) => {
    // Jangan start drag jika klik pada block
    if ((e.target as HTMLElement).closest('[data-block]')) return;
    e.preventDefault();
    setDrag({ dayIndex, startSlot: slotIndex, endSlot: slotIndex, isDragging: true });
  };

  const handleMouseEnter = (dayIndex: number, slotIndex: number) => {
    if (!drag?.isDragging || drag.dayIndex !== dayIndex) return;
    setDrag(d => d ? { ...d, endSlot: slotIndex } : null);
  };

  const handleMouseUp = useCallback(() => {
    if (!drag?.isDragging) return;
    const startSlot = Math.min(drag.startSlot, drag.endSlot);
    const endSlot = Math.max(drag.startSlot, drag.endSlot) + 1; // +1 = end of last slot
    setDrag(null);
    onAddBlock({
      start_time: slotToTime(startSlot),
      end_time: slotToTime(endSlot),
      day: DAY_CODES[drag.dayIndex],
    });
  }, [drag, onAddBlock]);

  const isDragSelected = (dayIndex: number, slotIndex: number) => {
    if (!drag || drag.dayIndex !== dayIndex) return false;
    const min = Math.min(drag.startSlot, drag.endSlot);
    const max = Math.max(drag.startSlot, drag.endSlot);
    return slotIndex >= min && slotIndex <= max;
  };

  // Render blocks sebagai absolute positioned elements di dalam day column
  const renderBlocksForDay = (day: DayCode, dayBlocks: BestWeekBlock[]) => {
    return dayBlocks.map(block => {
      const startSlot = timeToSlot(block.start_time);
      const endSlot = timeToSlot(block.end_time);
      const config = CATEGORY_CONFIG[block.category];
      const heightSlots = endSlot - startSlot;

      return (
        <div
          key={block.id}
          data-block="true"
          onClick={() => onEditBlock(block)}
          className="absolute left-0.5 right-0.5 rounded text-xs cursor-pointer hover:opacity-90 overflow-hidden z-10 flex items-center justify-center text-center px-1"
          style={{
            top: `${startSlot * 20}px`,    // 20px per slot
            height: `${heightSlots * 20}px`,
            backgroundColor: config.bgColor,
            color: config.color,
            border: `1px solid ${config.borderColor}`,
          }}
        >
          <span className="leading-tight font-medium truncate">{block.title}</span>
        </div>
      );
    });
  };

  return (
    <div
      ref={gridRef}
      className="overflow-auto border border-gray-200 dark:border-gray-700 rounded-lg select-none"
      onMouseUp={handleMouseUp}
      onMouseLeave={() => drag?.isDragging && setDrag(null)}
    >
      {/* Header row */}
      <div className="flex sticky top-0 z-20 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="w-16 shrink-0 text-xs text-center text-gray-500 py-2 border-r border-gray-200 dark:border-gray-700">
          WAKTU
        </div>
        {DAY_CODES.map(day => (
          <div
            key={day}
            className="flex-1 text-xs font-semibold text-center text-gray-700 dark:text-gray-300 py-2 border-r last:border-r-0 border-gray-200 dark:border-gray-700"
          >
            {DAY_LABELS[day]}
          </div>
        ))}
      </div>

      {/* Grid body */}
      <div className="flex">
        {/* Time column */}
        <div className="w-16 shrink-0 border-r border-gray-200 dark:border-gray-700">
          {TIME_SLOTS.map((time, i) => (
            <div
              key={time}
              className={`h-5 flex items-center justify-end pr-2 text-xs text-gray-400 ${
                i % 2 === 0 ? 'border-t border-gray-200 dark:border-gray-700' : ''
              }`}
            >
              {i % 2 === 0 ? time : ''}
            </div>
          ))}
        </div>

        {/* Day columns */}
        {DAY_CODES.map((day, dayIndex) => (
          <div
            key={day}
            className="flex-1 relative border-r last:border-r-0 border-gray-200 dark:border-gray-700"
            style={{ minWidth: '80px' }}
          >
            {/* Slot cells */}
            {TIME_SLOTS.map((_, slotIndex) => (
              <div
                key={slotIndex}
                className={`h-5 ${slotIndex % 2 === 0 ? 'border-t border-gray-200 dark:border-gray-700' : ''} ${
                  isDragSelected(dayIndex, slotIndex)
                    ? 'bg-blue-100 dark:bg-blue-900/30'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'
                } cursor-crosshair`}
                onMouseDown={(e) => handleMouseDown(dayIndex, slotIndex, e)}
                onMouseEnter={() => handleMouseEnter(dayIndex, slotIndex)}
              />
            ))}

            {/* Blocks overlay */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="relative h-full pointer-events-auto">
                {renderBlocksForDay(day, blocksByDay[dayIndex])}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/app/(admin)/planning/best-week/components/WeeklyGrid.tsx
git commit -m "feat(best-week): add interactive WeeklyGrid component"
```

---

### Task 12: HourSummary component

**Files:**
- Create: `src/app/(admin)/planning/best-week/components/HourSummary.tsx`

**Step 1: Buat component**

```tsx
import React from 'react';
import { CATEGORY_CONFIG } from '@/lib/best-week/constants';
import { calcTotalHours } from '../actions/blocks/logic';
import type { BestWeekBlock, ActivityCategory } from '@/lib/best-week/types';

interface HourSummaryProps {
  blocks: BestWeekBlock[];
}

export default function HourSummary({ blocks }: HourSummaryProps) {
  const categories: ActivityCategory[] = [
    'high_lifetime_value', 'high_rupiah_value', 'low_rupiah_value', 'zero_rupiah_value', 'transition'
  ];

  return (
    <div className="flex flex-wrap gap-3 px-4 py-3 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
      {categories.map(cat => {
        const hours = calcTotalHours(blocks, cat);
        if (hours === 0) return null;
        const config = CATEGORY_CONFIG[cat];
        return (
          <span key={cat} className="text-sm" style={{ color: config.color }}>
            {config.icon} {hours.toFixed(1)}j/minggu
          </span>
        );
      })}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/app/(admin)/planning/best-week/components/HourSummary.tsx
git commit -m "feat(best-week): add HourSummary component"
```

---

### Task 13: BestWeekClient & page

**Files:**
- Create: `src/app/(admin)/planning/best-week/BestWeekClient.tsx`
- Create: `src/app/(admin)/planning/best-week/page.tsx`

**Step 1: Buat `BestWeekClient.tsx`**

```tsx
"use client";

import React, { useState, useCallback } from 'react';
import { useBestWeekTemplates } from './hooks/useBestWeekTemplates';
import { useBestWeekBlocks } from './hooks/useBestWeekBlocks';
import TemplateSelector from './components/TemplateSelector';
import WeeklyGrid from './components/WeeklyGrid';
import BlockModal from './components/BlockModal';
import HourSummary from './components/HourSummary';
import type { BestWeekBlock, DayCode } from '@/lib/best-week/types';

export default function BestWeekClient() {
  const { templates, activeTemplate, mutate: mutateTemplates, isLoading: loadingTemplates } = useBestWeekTemplates();
  const { blocks, mutate: mutateBlocks, isLoading: loadingBlocks } = useBestWeekBlocks(activeTemplate?.id ?? null);

  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    prefill?: { start_time: string; end_time: string; day: DayCode };
    block?: BestWeekBlock;
  }>({ isOpen: false });

  const handleAddBlock = useCallback((prefill: { start_time: string; end_time: string; day: DayCode }) => {
    setModalState({ isOpen: true, prefill });
  }, []);

  const handleEditBlock = useCallback((block: BestWeekBlock) => {
    setModalState({ isOpen: true, block });
  }, []);

  const handleModalSave = useCallback(() => {
    mutateBlocks();
  }, [mutateBlocks]);

  if (loadingTemplates) {
    return <div className="animate-pulse h-96 bg-gray-100 dark:bg-gray-800 rounded-lg" />;
  }

  if (templates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="text-4xl mb-4">📅</div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Belum Ada Template Best Week</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm">
          Rancang jadwal ideal mingguanmu untuk menjalani minggu terbaik secara konsisten.
        </p>
        <button
          onClick={async () => {
            const { createTemplate } = await import('./actions');
            await createTemplate('Template Q1');
            mutateTemplates();
          }}
          className="px-6 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600"
        >
          Buat Template Pertama
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <TemplateSelector
          templates={templates}
          activeTemplate={activeTemplate}
          onMutate={mutateTemplates}
        />
      </div>

      {/* Grid */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loadingBlocks ? (
          <div className="animate-pulse h-96 bg-gray-100 dark:bg-gray-800" />
        ) : (
          <>
            <WeeklyGrid
              blocks={blocks}
              onAddBlock={handleAddBlock}
              onEditBlock={handleEditBlock}
            />
            <HourSummary blocks={blocks} />
          </>
        )}
      </div>

      {/* Modal */}
      {activeTemplate && (
        <BlockModal
          isOpen={modalState.isOpen}
          onClose={() => setModalState({ isOpen: false })}
          onSave={handleModalSave}
          templateId={activeTemplate.id}
          prefill={modalState.prefill}
          block={modalState.block}
        />
      )}
    </div>
  );
}
```

**Step 2: Buat `page.tsx`**

```tsx
import React from 'react';
import BestWeekClient from './BestWeekClient';

export default function BestWeekPage() {
  return (
    <div className="mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Best Week</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 italic">
          "Tujuan dibuat jadwal itu bukan untuk dijalani secara strict 100%, tapi untuk merancang aktivitas yang terarah dimana penerapannya bisa terus kita EVALUASI secara berkala."
        </p>
      </div>
      <BestWeekClient />
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add src/app/(admin)/planning/best-week/
git commit -m "feat(best-week): add BestWeekClient and page route"
```

---

## Phase 5: Sidebar Navigation

### Task 14: Uncomment Best Week di sidebar

**Files:**
- Modify: `src/components/layouts/AppSidebar.tsx:50-76`

**Step 1: Uncomment nav item**

Di `AppSidebar.tsx`, dalam array `planningNav`, uncomment blok yang sudah ada:

```typescript
// BEFORE (lines ~71-75):
// {
//   icon: <ShootingStarIcon />,
//   name: "Best Week",
//   path: "/planning/best-week",
// },

// AFTER:
{
  icon: <ShootingStarIcon />,
  name: "Best Week",
  path: "/planning/best-week",
},
```

Juga uncomment import `ShootingStarIcon` jika belum diimport. Cek di baris import:
```typescript
import {
  // ...existing imports...
  ShootingStarIcon,
} from "@/lib/icons";
```

**Step 2: Verify icon tersedia**

```bash
grep -r "ShootingStarIcon" src/lib/icons/
```

Jika tidak ada, gunakan icon yang sudah ada sebagai fallback (misalnya `CalenderIcon`).

**Step 3: Commit**

```bash
git add src/components/layouts/AppSidebar.tsx
git commit -m "feat(best-week): enable Best Week navigation in sidebar"
```

---

## Phase 6: Daily Reference Widget

### Task 15: Best Week Reference Section di Daily Sync

**Files:**
- Create: `src/app/(admin)/execution/daily-sync/BestWeekReference/BestWeekReferenceSection.tsx`
- Create: `src/app/(admin)/execution/daily-sync/BestWeekReference/hooks/useTodayBlocks.ts`
- Modify: `src/app/(admin)/execution/daily-sync/page.tsx`
- Modify: `src/stores/uiPreferencesStore.ts`

**Step 1: Tambahkan `bestWeekRef` ke `uiPreferencesStore.ts`**

Di `src/stores/uiPreferencesStore.ts`, tambahkan `bestWeekRef` ke `cardCollapsed`:

```typescript
// Dalam interface UIPreferencesState
cardCollapsed: {
  pomodoroTimer: boolean;
  mainQuest: boolean;
  sideQuest: boolean;
  workQuest: boolean;
  dailyQuest: boolean;
  activityLog: boolean;
  brainDump: boolean;
  bestWeekRef: boolean;  // TAMBAHKAN INI
};

// Dalam initial state:
cardCollapsed: {
  // ...existing keys...
  bestWeekRef: true,  // collapsed by default
},
```

**Step 2: Buat `useTodayBlocks.ts`**

```typescript
import useSWR from 'swr';
import { getActiveTemplate, getBlocksForTemplate } from '@/app/(admin)/planning/best-week/actions';
import type { BestWeekBlock, DayCode } from '@/lib/best-week/types';
import { DAY_CODES } from '@/lib/best-week/constants';

function getTodayDayCode(): DayCode {
  const day = new Date().getDay(); // 0=Sun, 1=Mon, ...
  const map: DayCode[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  return map[day];
}

export function useTodayBlocks() {
  const { data: template } = useSWR('best-week-active-template', getActiveTemplate);

  const { data: blocks } = useSWR(
    template?.id ? `best-week-blocks-${template.id}` : null,
    () => getBlocksForTemplate(template!.id)
  );

  const todayCode = getTodayDayCode();
  const todayBlocks = (blocks ?? [])
    .filter(b => b.days.includes(todayCode))
    .sort((a, b) => a.start_time.localeCompare(b.start_time));

  const getCurrentBlock = (): BestWeekBlock | null => {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:00`;
    return todayBlocks.find(b => b.start_time <= currentTime && b.end_time > currentTime) ?? null;
  };

  return {
    todayBlocks,
    currentBlock: getCurrentBlock(),
    todayCode,
    hasTemplate: !!template,
    isLoading: !template && !blocks,
  };
}
```

**Step 3: Buat `BestWeekReferenceSection.tsx`**

```tsx
"use client";

import React from 'react';
import Link from 'next/link';
import CollapsibleCard from '@/components/common/CollapsibleCard';
import { useUIPreferencesStore } from '@/stores/uiPreferencesStore';
import { useTodayBlocks } from './hooks/useTodayBlocks';
import { CATEGORY_CONFIG, DAY_LABELS } from '@/lib/best-week/constants';
import { calcTotalHours } from '@/app/(admin)/planning/best-week/actions/blocks/logic';
import type { ActivityCategory } from '@/lib/best-week/types';

export default function BestWeekReferenceSection() {
  const { cardCollapsed, toggleCardCollapsed } = useUIPreferencesStore();
  const { todayBlocks, currentBlock, todayCode, hasTemplate, isLoading } = useTodayBlocks();

  return (
    <div className="mt-6">
      <CollapsibleCard
        isCollapsed={cardCollapsed.bestWeekRef}
        onToggle={() => toggleCardCollapsed('bestWeekRef')}
      >
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 pt-5 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-gray-100">
            📅 Best Week Reference
          </h3>

          {isLoading ? (
            <div className="animate-pulse space-y-2">
              {[1, 2, 3].map(i => <div key={i} className="h-8 bg-gray-100 dark:bg-gray-700 rounded" />)}
            </div>
          ) : !hasTemplate ? (
            <div className="text-center py-6">
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-3">
                Belum ada template Best Week.
              </p>
              <Link
                href="/planning/best-week"
                className="text-sm text-blue-500 hover:text-blue-600 font-medium"
              >
                Buat Template →
              </Link>
            </div>
          ) : todayBlocks.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Tidak ada jadwal untuk hari ini.
            </p>
          ) : (
            <>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                Jadwal Ideal — {DAY_LABELS[todayCode]}
              </p>
              <div className="space-y-1 mb-4">
                {todayBlocks.map(block => {
                  const config = CATEGORY_CONFIG[block.category];
                  const isActive = currentBlock?.id === block.id;
                  return (
                    <div
                      key={block.id}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
                        isActive
                          ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'
                      }`}
                    >
                      <span className="text-gray-400 dark:text-gray-500 text-xs w-20 shrink-0">
                        {block.start_time.substring(0, 5)} - {block.end_time.substring(0, 5)}
                      </span>
                      <span style={{ color: config.color }} className="shrink-0">{config.icon}</span>
                      <span className={`flex-1 ${isActive ? 'font-semibold text-gray-900 dark:text-gray-100' : 'text-gray-700 dark:text-gray-300'}`}>
                        {isActive ? '► ' : ''}{block.title}
                      </span>
                    </div>
                  );
                })}
              </div>
              {/* Hour summary */}
              <div className="flex flex-wrap gap-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                {(['high_lifetime_value', 'high_rupiah_value', 'low_rupiah_value'] as ActivityCategory[]).map(cat => {
                  const todayCatBlocks = todayBlocks.filter(b => b.category === cat);
                  if (todayCatBlocks.length === 0) return null;
                  const config = CATEGORY_CONFIG[cat];
                  const hours = todayCatBlocks.reduce((sum, b) => {
                    const [sh, sm] = b.start_time.split(':').map(Number);
                    const [eh, em] = b.end_time.split(':').map(Number);
                    return sum + (eh * 60 + em - (sh * 60 + sm)) / 60;
                  }, 0);
                  return (
                    <span key={cat} className="text-xs" style={{ color: config.color }}>
                      {config.icon} {hours.toFixed(1)}j
                    </span>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </CollapsibleCard>
    </div>
  );
}
```

**Step 4: Tambahkan ke `daily-sync/page.tsx`**

Di `src/app/(admin)/execution/daily-sync/page.tsx`, tambahkan import dan render setelah `<BrainDumpSection>`:

```tsx
// Tambahkan import:
import BestWeekReferenceSection from './BestWeekReference/BestWeekReferenceSection';

// Di dalam JSX, setelah <BrainDumpSection date={selectedDateStr} />:
<BestWeekReferenceSection />
```

**Step 5: Commit**

```bash
git add src/app/(admin)/execution/daily-sync/BestWeekReference/
git add src/stores/uiPreferencesStore.ts
git add src/app/(admin)/execution/daily-sync/page.tsx
git commit -m "feat(best-week): add Daily Reference widget to Daily Sync page"
```

---

## Phase 7: Verifikasi & Type Check

### Task 16: Type check & smoke test

**Step 1: Jalankan type check**

```bash
npm run type-check
```

Fix semua TypeScript errors sebelum lanjut.

**Step 2: Jalankan dev server**

```bash
npm run dev
```

**Step 3: Manual smoke test**

- [ ] Navigasi ke `/planning/best-week` — halaman load, muncul empty state
- [ ] Klik "Buat Template Pertama" — template dibuat, grid muncul
- [ ] Drag di grid → BlockModal muncul dengan waktu pre-filled
- [ ] Isi form & save → block muncul di grid dengan warna yang benar
- [ ] Klik block → BlockModal dengan data yang ada (edit mode)
- [ ] Edit & save → block terupdate
- [ ] Delete block → block hilang dari grid
- [ ] Buat template kedua via TemplateSelector → switch template
- [ ] Navigasi ke `/execution/daily-sync` → Best Week Reference Section muncul di bawah BrainDump
- [ ] Expand section → jadwal hari ini tampil dengan highlight block aktif

**Step 4: Commit final**

```bash
git add -A
git commit -m "feat(best-week): complete MVP implementation"
```

---

## Summary

| Phase | Tasks | Output |
|-------|-------|--------|
| Database | Task 1 | 2 tabel baru, drop ideal_time_blocks |
| Types | Task 2 | TypeScript types + constants |
| Actions (templates) | Task 3-4 | 3-layer CRUD untuk templates |
| Actions (blocks) | Task 5-6 | 3-layer CRUD untuk blocks |
| SWR Hooks | Task 7 | useBestWeekTemplates + useBestWeekBlocks |
| UI Components | Task 8-12 | CategoryBadge, TemplateSelector, BlockModal, WeeklyGrid, HourSummary |
| Page | Task 13 | BestWeekClient + /planning/best-week route |
| Navigation | Task 14 | Sidebar nav item |
| Daily Sync | Task 15 | BestWeekReferenceSection + uiPreferencesStore update |
| QA | Task 16 | Type check + smoke test |
