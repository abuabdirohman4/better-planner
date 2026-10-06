"use client";

import React, { useState } from 'react';
import { ListTodo } from 'lucide-react';
import type { DailyPlanItem } from '@/types/daily-plan';
import {
  DndContext, closestCenter, PointerSensor, TouchSensor, KeyboardSensor, useSensor, useSensors, type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CORE_SLOTS, reorderIds } from '../utils/dailyFocus';
import DailyCardShell from './DailyCardShell';
import AddItemMenu, { type AddKind } from './AddItemMenu';

interface OtherTasksCardProps {
  /** Side + rutin Daily, sudah urut display_order. */
  items: DailyPlanItem[];
  /** Harus merender kartu yang sortable (SortableTaskItemCard). */
  renderItem: (item: DailyPlanItem) => React.ReactNode;
  onReorder: (order: { id: string; display_order: number }[]) => void;
  onAdd: (kind: AddKind) => void;
  onQuickAddSide: (title: string) => Promise<void> | void;
}

const KINDS: AddKind[] = ['SIDE_QUEST', 'DAILY_QUEST'];

export default function OtherTasksCard({ items, renderItem, onReorder, onAdd, onQuickAddSide }: OtherTasksCardProps) {
  const sensors = useSensors(useSensor(PointerSensor), useSensor(TouchSensor), useSensor(KeyboardSensor));
  const ids = items.map((i) => i.id);
  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over) return;
    const order = reorderIds(ids, String(active.id), String(over.id));
    if (order) onReorder(order);
  };
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = title.trim();
    if (!t || saving) return;
    setSaving(true);
    try {
      await onQuickAddSide(t);
      setTitle('');
    } finally {
      setSaving(false);
    }
  };

  const core = items.slice(0, CORE_SLOTS);
  const bonus = items.slice(CORE_SLOTS);

  return (
    <DailyCardShell
      testId="daily-sync-other-section"
      icon={<ListTodo className="h-5 w-5" />}
      title="Tugas Lain"
      hint="Tugas kecil ≤30 menit + rutin hari ini"
      action={<AddItemMenu kinds={KINDS} onPick={onAdd} testId="other-add" />}
    >
      {items.length === 0 ? (
        <p className="py-4 text-center text-sm text-gray-500">Tidak ada tugas lain hari ini</p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          {core.map((item, idx) => (
            <div key={item.id} data-testid="other-core-item" className="flex items-center gap-2">
              <span className="mb-3 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-bold text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">{idx + 1}</span>
              <div className="min-w-0 flex-1">{renderItem(item)}</div>
            </div>
          ))}
          {bonus.length > 0 ? (
            <div data-testid="other-bonus">
              <p className="mb-3 mt-2 border-t border-gray-200 pt-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:border-gray-800">
                Tambahan — setelah 3 inti beres
              </p>
              {bonus.map((item) => (
                <div key={item.id} className="flex items-center gap-2">
                  <span className="mb-3 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-amber-50 text-sm font-bold text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">+</span>
                  <div className="min-w-0 flex-1">{renderItem(item)}</div>
                </div>
              ))}
            </div>
          ) : null}
        </SortableContext>
        </DndContext>
      )}

      <form onSubmit={submit} className="mt-1 flex gap-2">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Tulis tugas kecil baru"
          aria-label="Tugas kecil baru"
          className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
        />
        <button
          type="submit"
          disabled={!title.trim() || saving}
          className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-600 disabled:opacity-50"
        >
          Tambah
        </button>
      </form>
    </DailyCardShell>
  );
}
