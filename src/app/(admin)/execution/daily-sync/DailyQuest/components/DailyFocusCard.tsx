"use client";

import React from 'react';
import { Target } from 'lucide-react';
import type { DailyPlanItem } from '@/types/daily-plan';
import {
  DndContext, closestCenter, PointerSensor, TouchSensor, KeyboardSensor, useSensor, useSensors, type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CORE_SLOTS, reorderIds } from '../utils/dailyFocus';
import DailyCardShell from './DailyCardShell';
import AddItemMenu, { type AddKind } from './AddItemMenu';

interface DailyFocusCardProps {
  core: DailyPlanItem[];
  bonus: DailyPlanItem[];
  missingHfg: boolean;
  /** Harus merender kartu yang sortable (SortableTaskItemCard). */
  renderItem: (item: DailyPlanItem) => React.ReactNode;
  onReorder: (order: { id: string; display_order: number }[]) => void;
  onAdd: (kind: AddKind) => void;
}

const KINDS: AddKind[] = ['MAIN_QUEST', 'WORK_QUEST'];

export default function DailyFocusCard({ core, bonus, missingHfg, renderItem, onReorder, onAdd }: DailyFocusCardProps) {
  const sensors = useSensors(useSensor(PointerSensor), useSensor(TouchSensor), useSensor(KeyboardSensor));
  const ids = [...core, ...bonus].map((i) => i.id);
  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over) return;
    const order = reorderIds(ids, String(active.id), String(over.id));
    if (order) onReorder(order);
  };
  const emptySlots = Math.max(0, CORE_SLOTS - core.length);

  return (
    <DailyCardShell
      testId="daily-sync-focus-section"
      icon={<Target className="h-5 w-5" />}
      title="Daily Focus"
      hint="HFG + Work. 3 teratas = inti, minimal 1 HFG"
      action={<AddItemMenu kinds={KINDS} onPick={onAdd} testId="focus-add" />}
    >
      {missingHfg ? (
        <p
          data-testid="focus-missing-hfg"
          className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
        >
          Belum ada HFG di fokus hari ini
        </p>
      ) : null}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
      <div className="space-y-1">
        {core.map((item, idx) => (
          <div key={item.id} data-testid="focus-core-item" className="flex items-center gap-2">
            <span className="mb-3 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-bold text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
              {idx + 1}
            </span>
            <div className="min-w-0 flex-1">{renderItem(item)}</div>
          </div>
        ))}

        {Array.from({ length: emptySlots }).map((_, i) => (
          <div key={`slot-${i}`} className="flex items-center gap-2">
            <span className="mb-3 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-bold text-gray-400 dark:bg-white/10">
              {core.length + i + 1}
            </span>
            <button
              type="button"
              data-testid="focus-empty-slot"
              onClick={() => onAdd('MAIN_QUEST')}
              className="mb-3 flex-1 rounded-lg border border-dashed border-gray-300 px-4 py-3 text-left text-sm text-gray-500 transition-colors hover:border-brand-300 hover:text-brand-600 dark:border-gray-600"
            >
              + Tambah fokus
            </button>
          </div>
        ))}
      </div>

      {bonus.length > 0 ? (
        <div data-testid="focus-bonus">
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
    </DailyCardShell>
  );
}
