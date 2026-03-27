"use client";

import React, { useState, useRef, useEffect } from 'react';
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

function timeToSlot(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 2 + Math.floor(m / 30);
}

function slotToTime(slot: number): string {
  const h = Math.floor(slot / 2).toString().padStart(2, '0');
  const m = slot % 2 === 0 ? '00' : '30';
  return `${h}:${m}`;
}

export default function WeeklyGrid({ blocks, onAddBlock, onEditBlock }: WeeklyGridProps) {
  const [drag, setDrag] = useState<DragState | null>(null);
  // useRef to always have latest drag state in the global mouseup handler
  const dragRef = useRef<DragState | null>(null);
  const onAddBlockRef = useRef(onAddBlock);
  onAddBlockRef.current = onAddBlock;

  const blocksByDay = DAY_CODES.map((day) =>
    blocks.filter(b => b.days.includes(day))
  );

  // Attach mouseup to window so it fires even if mouse is released outside grid
  useEffect(() => {
    const handleMouseUp = () => {
      const d = dragRef.current;
      if (!d?.isDragging) return;
      const startSlot = Math.min(d.startSlot, d.endSlot);
      const endSlot = Math.max(d.startSlot, d.endSlot) + 1;
      dragRef.current = null;
      setDrag(null);
      onAddBlockRef.current({
        start_time: slotToTime(startSlot),
        end_time: slotToTime(endSlot),
        day: DAY_CODES[d.dayIndex],
      });
    };
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, []);

  const handleMouseDown = (dayIndex: number, slotIndex: number, e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-block]')) return;
    e.preventDefault();
    e.stopPropagation();
    const newDrag = { dayIndex, startSlot: slotIndex, endSlot: slotIndex, isDragging: true };
    dragRef.current = newDrag;
    setDrag(newDrag);
  };

  // Single click on empty slot (no drag) also opens modal for that 30-min slot
  const handleSlotClick = (dayIndex: number, slotIndex: number, e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-block]')) return;
    // Only fire if there was no drag (dragRef already null after mouseup)
    if (dragRef.current) return;
    onAddBlock({
      start_time: slotToTime(slotIndex),
      end_time: slotToTime(slotIndex + 1),
      day: DAY_CODES[dayIndex],
    });
  };

  const handleMouseEnter = (dayIndex: number, slotIndex: number) => {
    if (!dragRef.current?.isDragging || dragRef.current.dayIndex !== dayIndex) return;
    setDrag(d => {
      if (!d) return null;
      const updated = { ...d, endSlot: slotIndex };
      dragRef.current = updated;
      return updated;
    });
  };

  const isDragSelected = (dayIndex: number, slotIndex: number) => {
    if (!drag || drag.dayIndex !== dayIndex) return false;
    const min = Math.min(drag.startSlot, drag.endSlot);
    const max = Math.max(drag.startSlot, drag.endSlot);
    return slotIndex >= min && slotIndex <= max;
  };

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
            top: `${startSlot * 20}px`,
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
      className="overflow-auto border border-gray-200 dark:border-gray-700 rounded-lg select-none"
    >
      {/* Header */}
      <div className="flex sticky top-0 z-20 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="w-16 shrink-0 text-xs text-center text-gray-500 py-2 border-r border-gray-200 dark:border-gray-700">
          WAKTU
        </div>
        {DAY_CODES.map(day => (
          <div
            key={day}
            className="flex-1 text-xs font-semibold text-center text-gray-700 dark:text-gray-300 py-2 border-r last:border-r-0 border-gray-200 dark:border-gray-700"
            style={{ minWidth: '80px' }}
          >
            {DAY_LABELS[day]}
          </div>
        ))}
      </div>

      {/* Grid body */}
      <div className="flex">
        <div className="w-16 shrink-0 border-r border-gray-200 dark:border-gray-700 relative">
          {/* Total height = 48 slots × 20px = 960px */}
          {TIME_SLOTS.filter((_, i) => i % 2 === 0).map((time, hourIndex) => (
            <div
              key={time}
              className="absolute w-full flex items-center justify-center text-xs text-gray-400 border-t border-gray-200 dark:border-gray-700"
              style={{
                top: `${hourIndex * 40}px`,   // 2 slots × 20px = 40px per hour
                height: '40px',               // full 1-hour block
              }}
            >
              {time}
            </div>
          ))}
          {/* Spacer to maintain correct height */}
          <div style={{ height: `${48 * 20}px` }} />
        </div>

        {DAY_CODES.map((day, dayIndex) => (
          <div
            key={day}
            className="flex-1 relative border-r last:border-r-0 border-gray-200 dark:border-gray-700"
            style={{ minWidth: '80px' }}
          >
            {/* Slot cells — always behind blocks via z-index */}
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
                onClick={(e) => handleSlotClick(dayIndex, slotIndex, e)}
              />
            ))}

            {/* Blocks — absolute positioned, pointer-events only on the block element itself */}
            {renderBlocksForDay(day, blocksByDay[dayIndex])}
          </div>
        ))}
      </div>
    </div>
  );
}
