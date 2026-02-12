import React from 'react';
import { ActivityLogItem } from '../hooks/useActivityLogs';
import { calculateBlockStyle } from '@/lib/calendarUtils';
import { formatTimeRange } from '@/lib/dateUtils';

interface CalendarBlockProps {
  item: ActivityLogItem & { colIndex?: number; maxCols?: number };
  styleOverride?: React.CSSProperties; // Allow overriding style for discontinuous view
  onClick?: (item: ActivityLogItem) => void;
}

const CalendarBlock: React.FC<CalendarBlockProps> = ({ item, styleOverride, onClick }) => {
  const defaultStyle = calculateBlockStyle(item.start_time, item.duration_minutes);

  // Merge style: override takes precedence (especially top/height)
  const style = { ...defaultStyle, ...styleOverride };

  // Dynamic width based on overlaps/columns
  // Default to full width if no col info, otherwise calculate
  const width = item.maxCols && item.maxCols > 1
    ? `calc((100% - 40px) / ${item.maxCols || 1})`
    : 'calc(100% - 70px)';

  const left = item.colIndex
    ? `calc(40px + (100% - 40px) * ${item.colIndex} / ${item.maxCols || 1})`
    : '10px';

  // Determine color based on duration or task type (placeholder logic)
  // Short tasks get lighter color, long tasks darker
  const isShort = item.duration_minutes < 30;
  const bgColor = isShort ? 'bg-blue-100 dark:bg-blue-900/40' : 'bg-blue-200 dark:bg-blue-800/60';
  const borderColor = 'border-blue-300 dark:border-blue-600';
  const textColor = 'text-blue-900 dark:text-blue-100';

  return (
    <div
      className={`absolute left-10 right-2 rounded border ${bgColor} ${borderColor} ${textColor} p-1 text-xs overflow-hidden hover:z-10 hover:shadow-md transition-shadow cursor-pointer`}
      style={{
        top: style.top,
        height: style.height,
        left: left,
        width: width,
        zIndex: item.colIndex ? item.colIndex + 1 : 1
      }}
      onClick={() => onClick && onClick(item)}
      title={`${item.task_title || 'Task'} (${item.duration_minutes}m)`}
    >
      <div className="font-medium truncate">{item.task_title || 'Untitled Task'}</div>
      {item.duration_minutes >= 30 && (
        <div className="truncate opacity-80">{item.duration_minutes} min</div>
      )}
    </div>
  );
};

export default CalendarBlock;
