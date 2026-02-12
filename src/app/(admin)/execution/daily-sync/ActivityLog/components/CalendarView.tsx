import React, { useEffect, useRef, useState } from 'react';
import HourlyGrid from './HourlyGrid';
import CalendarBlock from './CalendarBlock';
import CalendarTaskDetail from './CalendarTaskDetail';
import { ActivityLogItem } from '../hooks/useActivityLogs';
import { processOverlaps, getVisibleHours, calculateDiscontinuousStyle } from '@/lib/calendarUtils';

interface CalendarViewProps {
  items: ActivityLogItem[];
  currentDate: string;
}

const CalendarView: React.FC<CalendarViewProps> = ({ items, currentDate }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedTask, setSelectedTask] = useState<ActivityLogItem | null>(null);
  const [isDynamicView, setIsDynamicView] = useState(true); // Default to dynamic view

  // Calculate visible hours logic
  const { visibleHours, totalHeight } = React.useMemo(() => {
    if (!isDynamicView) {
      // 24h view
      return {
        visibleHours: undefined, // undefined signals full 24h to Grid
        totalHeight: 1440 // 24 * 60
      };
    }

    // Dynamic Discontinuous View
    const hours = getVisibleHours(items);
    return {
      visibleHours: hours,
      totalHeight: hours.length * 60
    };
  }, [items, isDynamicView]);

  // Memoize processed items for overlap handling
  const processedItems = React.useMemo(() => {
    return processOverlaps(items);
  }, [items]);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      {/* Calendar Controls */}
      <div className="p-2 border-b border-gray-100 dark:border-gray-700 flex justify-end">
        <button
          onClick={() => setIsDynamicView(!isDynamicView)}
          className={`text-xs px-2 py-1 rounded transition-colors bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-200`}
        >
          {isDynamicView ? 'Dynamic View' : '24h View'}
        </button>
      </div>

      <div
        ref={containerRef}
        className="relative flex-1 overflow-y-auto overflow-x-hidden pr-2 custom-scrollbar"
      >
        <div
          className="relative w-full ml-14 mt-4 mb-10 pl-[-10px] transition-all duration-300"
          style={{ height: `${totalHeight}px` }}
        >
          {/* Render updated grid */}
          <HourlyGrid visibleHours={visibleHours} />

          {/* Render blocks */}
          {processedItems.map((item) => {
            // If dynamic, use Discontinuous calculation. If 24h, use standard.
            // Standard CalendarBlock calculates its own style based on time. 
            // We need to override it if dynamic.

            let styleOverride: React.CSSProperties | undefined;

            if (isDynamicView && visibleHours) {
              const s = calculateDiscontinuousStyle(item.start_time, item.end_time, visibleHours);
              if (!s) return null; // Should not happen if visibleHours includes it
              styleOverride = s;
            }

            return (
              <CalendarBlock
                key={item.id}
                item={item}
                styleOverride={styleOverride}
                onClick={(task) => setSelectedTask(task)}
              />
            );
          })}
        </div>
      </div>

      {selectedTask && (
        <CalendarTaskDetail
          item={selectedTask}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </div>
  );
};
export default CalendarView;
