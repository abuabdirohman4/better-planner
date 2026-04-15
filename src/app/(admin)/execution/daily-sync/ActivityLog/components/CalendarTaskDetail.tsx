'use client';
import React, { useState } from 'react';
import type { ActivityLogItem } from '@/types/activity-log';
import { formatTimeRange } from '@/lib/dateUtils';

interface CalendarTaskDetailProps {
  item: ActivityLogItem | null;
  onClose: () => void;
  onDelete: (logId: string) => Promise<void>;
}

const CalendarTaskDetail: React.FC<CalendarTaskDetailProps> = ({ item, onClose, onDelete }) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!item) return null;

  const handleConfirmDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleting(true);
    try {
      await onDelete(item.id);
      onClose();
    } catch {
      setIsDeleting(false);
      setConfirmDelete(false);
    }
  };

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

          <div className="flex items-center gap-2 ml-4">
            {confirmDelete ? (
              <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                <span className="text-xs text-red-600 dark:text-red-400">Hapus?</span>
                <button
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {isDeleting ? '...' : 'Ya'}
                </button>
                <button
                  onClick={e => { e.stopPropagation(); setConfirmDelete(false); }}
                  className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                >
                  Batal
                </button>
              </div>
            ) : (
              <button
                onClick={e => { e.stopPropagation(); setConfirmDelete(true); }}
                className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                title="Hapus activity log"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6 bg-blue-50/50 dark:bg-gray-900/50 min-h-[300px]">
          <div>
            <div className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
              Apa yang diselesaikan:
            </div>
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3 rounded-lg text-base text-gray-800 dark:text-gray-200 shadow-sm min-h-[48px]">
              {item.what_done || '-'}
            </div>
          </div>
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
