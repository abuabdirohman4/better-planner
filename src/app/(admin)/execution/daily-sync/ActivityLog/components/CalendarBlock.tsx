import React, { useCallback, useRef, useState } from 'react';
import { calculateBlockStyle } from '@/lib/calendarUtils';
import { CalendarEvent } from './CalendarView';

interface CalendarBlockProps {
  item: CalendarEvent & { colIndex?: number; maxCols?: number };
  styleOverride?: React.CSSProperties;
  onClick?: (item: CalendarEvent) => void;
  onDragMove?: (item: CalendarEvent, newStartMinutes: number) => void;
  onDragResize?: (item: CalendarEvent, newDurationMinutes: number) => void;
  containerRef?: React.RefObject<HTMLDivElement | null>;
  maxDuration?: number;
}

const SNAP_INTERVAL = 5; // Snap to 5-minute intervals for precise session-length resize

const snapToGrid = (minutes: number) =>
  Math.round(minutes / SNAP_INTERVAL) * SNAP_INTERVAL;

const CalendarBlock: React.FC<CalendarBlockProps> = ({
  item, styleOverride, onClick, onDragMove, onDragResize, containerRef, maxDuration
}) => {
  const defaultStyle = calculateBlockStyle(item.startTime, item.duration);
  const style = { ...defaultStyle, ...styleOverride };

  const colIndex = item.colIndex || 0;
  const maxCols = item.maxCols || 1;

  const columnWidth = maxCols > 1
    ? `calc((100% - 20px) / ${maxCols})`
    : 'calc(100% - 20px)';

  const columnLeft = maxCols > 1
    ? `calc(10px + (100% - 20px) * ${colIndex} / ${maxCols})`
    : '10px';

  const isSchedule = item.type === 'SCHEDULE';
  const isShort = item.duration < 30;
  const isDraggable = isSchedule && (onDragMove || onDragResize);

  // Drag state
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const hasDraggedRef = useRef(false);
  const dragStartRef = useRef<{ y: number; startMinutes: number; duration: number } | null>(null);

  // Format time display
  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };
  const timeDisplay = `${formatTime(item.startTime)} - ${formatTime(item.endTime)}`;

  const getMinutesFromY = useCallback((clientY: number): number => {
    if (!containerRef?.current) return 0;
    const rect = containerRef.current.getBoundingClientRect();
    const relativeY = clientY - rect.top + containerRef.current.scrollTop;
    // 1 minute = 1 pixel in our calendar
    return Math.max(0, Math.min(1440, relativeY));
  }, [containerRef]);

  // Handle drag move
  const handleMouseDownMove = useCallback((e: React.MouseEvent) => {
    if (!isDraggable || !onDragMove) return;
    e.preventDefault();
    e.stopPropagation();

    const startDate = new Date(item.startTime);
    const startMinutes = startDate.getHours() * 60 + startDate.getMinutes();

    dragStartRef.current = {
      y: e.clientY,
      startMinutes,
      duration: item.duration
    };
    hasDraggedRef.current = false;
    setIsDragging(true);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!dragStartRef.current) return;
      const deltaY = moveEvent.clientY - dragStartRef.current.y;
      if (Math.abs(deltaY) > 3) hasDraggedRef.current = true;
      const deltaMinutes = deltaY; // 1px = 1 minute
      const newStart = snapToGrid(dragStartRef.current.startMinutes + deltaMinutes);

      // Clamp to valid range
      const clampedStart = Math.max(0, Math.min(1440 - item.duration, newStart));
      onDragMove(item, clampedStart);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      dragStartRef.current = null;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [isDraggable, onDragMove, item]);

  // Handle resize from bottom edge
  const handleMouseDownResize = useCallback((e: React.MouseEvent) => {
    if (!isDraggable || !onDragResize) return;
    e.preventDefault();
    e.stopPropagation();

    dragStartRef.current = {
      y: e.clientY,
      startMinutes: 0,
      duration: item.duration
    };
    hasDraggedRef.current = false;
    setIsResizing(true);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!dragStartRef.current) return;
      const deltaY = moveEvent.clientY - dragStartRef.current.y;
      if (Math.abs(deltaY) > 3) hasDraggedRef.current = true;
      const newDuration = snapToGrid(dragStartRef.current.duration + deltaY);
      const maxAllowed = maxDuration || 480;
      const clampedDuration = Math.max(5, Math.min(maxAllowed, newDuration));
      onDragResize(item, clampedDuration);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      dragStartRef.current = null;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [isDraggable, onDragResize, item]);

  // Determine quest type for colors
  const type = item.itemType || 'DEFAULT';

  // Base colors map
  const colorMap: Record<string, { bg: string, border: string, text: string, actualBg: string }> = {
    'MAIN_QUEST': {
      bg: 'bg-green-50 dark:bg-green-900/10',
      actualBg: 'bg-green-100 dark:bg-green-900/40',
      border: 'border-green-400 dark:border-green-600',
      text: 'text-green-700 dark:text-green-300'
    },
    'WORK_QUEST': {
      bg: 'bg-blue-50 dark:bg-blue-900/10',
      actualBg: 'bg-blue-100 dark:bg-blue-900/40',
      border: 'border-blue-400 dark:border-blue-600',
      text: 'text-blue-700 dark:text-blue-300'
    },
    'DAILY_QUEST': {
      bg: 'bg-amber-50 dark:bg-amber-900/10',
      actualBg: 'bg-amber-100 dark:bg-amber-900/40',
      border: 'border-amber-400 dark:border-amber-600',
      text: 'text-amber-700 dark:text-amber-300'
    },
    'SIDE_QUEST': {
      bg: 'bg-rose-50 dark:bg-rose-900/10',
      actualBg: 'bg-rose-100 dark:bg-rose-900/40',
      border: 'border-rose-400 dark:border-rose-600',
      text: 'text-rose-700 dark:text-rose-300'
    },
    'LEARNING': {
      bg: 'bg-violet-50 dark:bg-violet-900/10',
      actualBg: 'bg-violet-100 dark:bg-violet-900/40',
      border: 'border-violet-400 dark:border-violet-600',
      text: 'text-violet-700 dark:text-violet-300'
    },
    'DEFAULT': { // Fallback
      bg: 'bg-slate-50 dark:bg-slate-800/40',
      actualBg: 'bg-slate-100 dark:bg-slate-800',
      border: 'border-slate-400 dark:border-slate-500',
      text: 'text-slate-700 dark:text-slate-300'
    }
  };

  const colors = colorMap[type] || colorMap['DEFAULT'];

  // Apply visual distinction:
  // Schedule (Plan): White/transparent bg + Dashed Border + Colored Text
  // Log (Actual): Solid Colored Bg + Solid Border + Colored Text
  const bgClass = isSchedule
    ? 'bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm'
    : colors.actualBg;

  const borderClass = isSchedule
    ? `border-2 border-dashed ${colors.border}`
    : `border-l-4 border-y border-r ${colors.border}`;

  const dragCursor = isDragging ? 'cursor-grabbing' : isSchedule ? 'cursor-grab' : 'cursor-pointer';

  return (
    <div
      className={`absolute rounded px-2 py-1 text-xs overflow-hidden cursor-pointer transition-all hover:brightness-95 hover:z-20 ${bgClass} ${borderClass} ${colors.text} ${dragCursor} ${isDragging || isResizing ? 'z-30 shadow-lg opacity-80' : ''} select-none`}
      style={{
        top: style.top,
        height: style.height,
        left: columnLeft,
        width: columnWidth,
        zIndex: isDragging || isResizing ? 50 : colIndex + 1,
      }}
      onClick={(e) => {
        if (!isDragging && !isResizing && !hasDraggedRef.current && onClick) {
          onClick(item);
        }
      }}
      onMouseDown={isSchedule ? handleMouseDownMove : undefined}
      title={`${item.title} (${item.duration}m) - ${item.type}`}
    >
      <div className="flex gap-1">
        <div className="font-medium truncate flex items-center gap-1">
          {item.title}
        </div>
        <div className="self-end truncate opacity-70 text-[10px]">{timeDisplay} ({item.duration} min)</div>
      </div>

      {/* Resize handle at bottom - only for schedules */}
      {isSchedule && onDragResize && (
        <div
          className="absolute bottom-0 left-0 right-0 h-2 cursor-s-resize hover:bg-green-300/50 dark:hover:bg-green-600/50 rounded-b"
          onMouseDown={handleMouseDownResize}
        />
      )}
    </div>
  );
};

export default CalendarBlock;
