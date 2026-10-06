"use client";

import React from 'react';
import { Target } from 'lucide-react';
import type { DailyPlanItem } from '@/types/daily-plan';
import {
  DndContext, closestCenter, MouseSensor, TouchSensor, KeyboardSensor, useSensor, useSensors, type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CORE_SLOTS, reorderIds } from '../utils/dailyFocus';
import DailyCardShell from './DailyCardShell';
import type { AddKind } from './AddItemMenu';

interface DailyFocusCardProps {
  core: DailyPlanItem[];
  bonus: DailyPlanItem[];
  missingHfg: boolean;
  /** Harus merender kartu yang sortable (SortableTaskItemCard). */
  renderItem: (item: DailyPlanItem) => React.ReactNode;
  onReorder: (order: { id: string; display_order: number }[]) => void;
  onAdd: (kind: AddKind) => void;
}


export default function DailyFocusCard({ core, bonus, missingHfg, renderItem, onReorder, onAdd }: DailyFocusCardProps) {
  // Mouse: geser 5px; sentuh: tekan 150 ms dulu supaya gulir halaman tidak dianggap drag (app-mgsb).
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(KeyboardSensor),
  );
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
      <div>
        {core.map((item) => (
          <div key={item.id} data-testid="focus-core-item">{renderItem(item)}</div>
        ))}

        {Array.from({ length: emptySlots }).map((_, i) => (
          <div
            key={`slot-${i}`}
            data-testid="focus-empty-slot"
            className="mb-2 flex items-center gap-3 rounded-lg border border-dashed border-gray-200 px-3 py-2.5 dark:border-gray-700"
          >
            <span className="h-6 w-6 flex-shrink-0 rounded-md border-2 border-gray-200 dark:border-gray-700" aria-hidden />
            <span className="flex-1 border-b border-dotted border-gray-300 dark:border-gray-600" aria-hidden />
          </div>
        ))}
      </div>

      {bonus.length > 0 ? (
        <div data-testid="focus-bonus">
          <p className="mb-3 mt-2 border-t border-gray-200 pt-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:border-gray-800">
            Tambahan — setelah 3 inti beres
          </p>
          {bonus.map((item) => (
            <div key={item.id}>{renderItem(item)}</div>
          ))}
        </div>
      ) : null}
      </SortableContext>
      </DndContext>

      <button
        type="button"
        data-testid="focus-add"
        onClick={() => onAdd('MAIN_QUEST')}
        className="mt-2 w-full rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-600"
      >
        Pilih Fokus
      </button>
    </DailyCardShell>
  );
}
