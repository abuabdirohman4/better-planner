import React from 'react';
import { ActivityLogItem } from '../hooks/useActivityLogs';
import { formatTimeRange } from '@/lib/dateUtils';

interface CalendarTaskDetailProps {
  item: ActivityLogItem | null;
  onClose: () => void;
}

const CalendarTaskDetail: React.FC<CalendarTaskDetailProps> = ({ item, onClose }) => {
  if (!item) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-start bg-gray-50/50 dark:bg-gray-800/50">
          <div className="flex-1">
            <div className="flex items-center gap-2 text-base font-medium text-gray-900 dark:text-gray-100">
              <span>{formatTimeRange(item.start_time, item.end_time).replace(' - ', ' - ')}</span>
              <span className="text-gray-400">•</span>
              <span>{item.duration_minutes} menit</span>
            </div>
            <div className="font-semibold text-lg text-gray-900 dark:text-gray-100 mt-0.5">
              ({item.task_title || 'Untitled Task'})
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors ml-4"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6 bg-blue-50/50 dark:bg-gray-900/50 min-h-[300px]">
          {/* Output / Result */}
          <div>
            <div className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
              Apa yang diselesaikan:
            </div>
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3 rounded-lg text-base text-gray-800 dark:text-gray-200 shadow-sm min-h-[48px]">
              {item.what_done || '-'}
            </div>
          </div>

          {/* Thoughts / Notes */}
          <div>
            <div className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
              Yang masih dipikirkan:
            </div>
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3 rounded-lg text-base text-gray-800 dark:text-gray-200 shadow-sm min-h-[48px]">
              {item.what_think || '-'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarTaskDetail;
