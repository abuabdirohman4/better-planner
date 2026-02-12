import React, { useCallback, useEffect, useRef, useState } from 'react';
import HourlyGrid from './HourlyGrid';
import CalendarBlock from './CalendarBlock';
import CalendarTaskDetail from './CalendarTaskDetail';
import { ActivityLogItem } from '../hooks/useActivityLogs';
import { TaskSchedule } from '../../DailyQuest/types';
import { processOverlaps, getVisibleHours, calculateDiscontinuousStyle } from '@/lib/calendarUtils';

// Unified Event Type
export interface CalendarEvent {
  id: string;
  type: 'LOG' | 'SCHEDULE';
  subType?: 'FOCUS' | 'SHORT_BREAK' | 'LONG_BREAK' | 'BREAK';
  title: string;
  itemType?: string;
  startTime: string;
  endTime: string;
  duration: number;
  data: ActivityLogItem | TaskSchedule;
  maxDuration?: number; // Max allowed duration for resize (based on focus settings)
}

interface CalendarViewProps {
  items: CalendarEvent[];
  currentDate: string;
  onScheduleClick?: (schedule: TaskSchedule) => void;
  onScheduleUpdate?: (scheduleId: string, newStartTime: string, newEndTime: string, newDuration: number) => void;
  onTaskDrop?: (taskData: any, startMinutes: number) => void;
  calendarMode?: 'BOTH' | 'PLAN' | 'ACTUAL';
  onCalendarModeChange?: (mode: 'BOTH' | 'PLAN' | 'ACTUAL') => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({
  items, currentDate, onScheduleClick, onScheduleUpdate, onTaskDrop,
  calendarMode, onCalendarModeChange
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const calendarAreaRef = useRef<HTMLDivElement>(null);
  const [selectedTask, setSelectedTask] = useState<CalendarEvent | null>(null);
  const [isDynamicView, setIsDynamicView] = useState(true);

  // Current time indicator
  const [currentTimeMinutes, setCurrentTimeMinutes] = useState(() => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setCurrentTimeMinutes(now.getHours() * 60 + now.getMinutes());
    }, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  // Drag preview state
  const [dragPreview, setDragPreview] = useState<{
    itemId: string;
    startTime?: string;
    endTime?: string;
    duration?: number;
  } | null>(null);

  // Calculate visible hours
  const { visibleHours, totalHeight } = React.useMemo(() => {
    if (!isDynamicView) {
      return { visibleHours: undefined, totalHeight: 1440 };
    }
    const adapterItems = items.map(i => ({
      start_time: i.startTime,
      end_time: i.endTime
    }));
    const hours = getVisibleHours(adapterItems as any);
    return { visibleHours: hours, totalHeight: hours.length * 60 };
  }, [items, isDynamicView]);

  // Apply drag preview to items
  const displayItems = React.useMemo(() => {
    if (!dragPreview) return items;
    return items.map(item => {
      if (item.id === dragPreview.itemId) {
        return {
          ...item,
          startTime: dragPreview.startTime || item.startTime,
          endTime: dragPreview.endTime || item.endTime,
          duration: dragPreview.duration ?? item.duration,
        };
      }
      return item;
    });
  }, [items, dragPreview]);

  // Process overlaps
  const processedItems = React.useMemo(() => {
    const mappedForProcessing = displayItems.map(i => ({
      ...i,
      start_time: i.startTime,
      end_time: i.endTime,
      duration_minutes: i.duration
    }));
    return processOverlaps(mappedForProcessing as any);
  }, [displayItems]);

  // Handle drag move
  const handleDragMove = useCallback((item: CalendarEvent, newStartMinutes: number) => {
    const hours = Math.floor(newStartMinutes / 60);
    const mins = newStartMinutes % 60;
    const startDate = new Date(currentDate + 'T00:00:00');
    startDate.setHours(hours, mins, 0, 0);
    const endDate = new Date(startDate.getTime() + item.duration * 60000);
    setDragPreview({
      itemId: item.id,
      startTime: startDate.toISOString(),
      endTime: endDate.toISOString(),
      duration: item.duration,
    });
  }, [currentDate]);

  // Handle drag resize
  const handleDragResize = useCallback((item: CalendarEvent, newDuration: number) => {
    const startDate = dragPreview?.startTime
      ? new Date(dragPreview.startTime)
      : new Date(item.startTime);
    const endDate = new Date(startDate.getTime() + newDuration * 60000);
    setDragPreview({
      itemId: item.id,
      startTime: startDate.toISOString(),
      endTime: endDate.toISOString(),
      duration: newDuration,
    });
  }, [dragPreview]);

  // Commit drag result on mouse up
  useEffect(() => {
    const handleGlobalMouseUp = async () => {
      if (dragPreview && onScheduleUpdate) {
        const displayItem = displayItems.find(i => i.id === dragPreview.itemId);
        if (displayItem) {
          // Call update (optimistic update will handle UI immediately)
          await onScheduleUpdate(
            dragPreview.itemId,
            dragPreview.startTime || displayItem.startTime,
            dragPreview.endTime || displayItem.endTime,
            dragPreview.duration ?? displayItem.duration,
          );
        }
      }
      // Clear drag preview AFTER update completes
      // The optimistic update will maintain the new position
      setDragPreview(null);
    };
    document.addEventListener('mouseup', handleGlobalMouseUp);
    return () => document.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [dragPreview, onScheduleUpdate, displayItems]);

  // Handle external task drop (from quest cards)
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const taskDataStr = e.dataTransfer.getData('application/task-schedule');
    if (!taskDataStr || !onTaskDrop || !calendarAreaRef.current) return;

    try {
      const taskData = JSON.parse(taskDataStr);
      const rect = calendarAreaRef.current.getBoundingClientRect();
      const relativeY = e.clientY - rect.top + (containerRef.current?.scrollTop || 0);
      // Snap to 15-minute intervals
      const rawMinutes = Math.max(0, Math.min(1440, relativeY));
      const snappedMinutes = Math.round(rawMinutes / 15) * 15;
      onTaskDrop(taskData, snappedMinutes);
    } catch (err) {
      console.error('Failed to parse dropped task data:', err);
    }
  }, [onTaskDrop]);

  // Current time position
  const currentTimePosition = React.useMemo(() => {
    if (isDynamicView && visibleHours) {
      const hour = Math.floor(currentTimeMinutes / 60);
      const minute = currentTimeMinutes % 60;
      const index = visibleHours.indexOf(hour);
      if (index === -1) return null;
      return index * 60 + minute;
    }
    return currentTimeMinutes;
  }, [currentTimeMinutes, isDynamicView, visibleHours]);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      {/* Calendar Controls */}
      <div className="p-2 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
        {calendarMode && onCalendarModeChange ? (
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5">
            <button
              onClick={() => onCalendarModeChange('PLAN')}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${calendarMode === 'PLAN'
                ? 'bg-white dark:bg-gray-600 text-green-600 dark:text-green-400 shadow-sm'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                }`}
            >Plan</button>
            <button
              onClick={() => onCalendarModeChange('BOTH')}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${calendarMode === 'BOTH'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                }`}
            >Both</button>
            <button
              onClick={() => onCalendarModeChange('ACTUAL')}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${calendarMode === 'ACTUAL'
                ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                }`}
            >Actual</button>
          </div>
        ) : <div />}
        <button
          onClick={() => setIsDynamicView(!isDynamicView)}
          className="text-xs px-2 py-1 rounded transition-colors bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-200"
        >
          {isDynamicView ? 'Dynamic View' : '24h View'}
        </button>
      </div>

      <div
        ref={containerRef}
        className="relative flex-1 min-h-0 overflow-y-auto overflow-x-hidden pr-2 custom-scrollbar"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div
          ref={calendarAreaRef}
          className="relative w-[92%] ml-14 mt-4 mb-10 pl-[-10px] transition-all duration-300"
          style={{ height: `${totalHeight}px` }}
        >
          <HourlyGrid visibleHours={visibleHours} />

          {/* Current Time Indicator */}
          {currentTimePosition !== null && (
            <div
              className="absolute left-[-18px] right-0 z-20 pointer-events-none"
              style={{ top: `${currentTimePosition}px` }}
            >
              {/* Red circle at left */}
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-red-500 rounded-full" />
              {/* Red line */}
              <div className="absolute left-3 right-0 h-[2px] bg-red-500 top-1/2 -translate-y-1/2" />
            </div>
          )}

          {/* Render blocks */}
          {processedItems.map((item: any) => {
            let styleOverride: React.CSSProperties | undefined;
            if (isDynamicView && visibleHours) {
              const s = calculateDiscontinuousStyle(item.start_time, item.end_time, visibleHours);
              if (!s) return null;
              styleOverride = s;
            }

            return (
              <CalendarBlock
                key={item.id}
                item={item}
                styleOverride={styleOverride}
                containerRef={calendarAreaRef}
                maxDuration={item.maxDuration}
                onDragMove={item.type === 'SCHEDULE' ? handleDragMove : undefined}
                onDragResize={item.type === 'SCHEDULE' ? handleDragResize : undefined}
                onClick={(task) => {
                  if (task.type === 'SCHEDULE' && onScheduleClick) {
                    onScheduleClick(task.data as TaskSchedule);
                  } else {
                    setSelectedTask(task);
                  }
                }}
              />
            );
          })}
        </div>
      </div>

      {selectedTask && selectedTask.type === 'LOG' && (
        <CalendarTaskDetail
          item={selectedTask.data as ActivityLogItem}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </div>
  );
};
export default CalendarView;
