import React from 'react';
import Skeleton from '@/components/ui/skeleton/Skeleton';
import { useTaskSession } from '../hooks/useTaskSession';
import { TaskCardProps } from '../types';

const TaskItemCard: React.FC<TaskCardProps> = ({ 
  item, 
  onStatusChange, 
  onSetActiveTask, 
  selectedDate,
  onTargetChange, 
  onFocusDurationChange, 
  completedSessions, 
  refreshKey, 
  forceRefreshTaskId 
}) => {
  const { completed, loading, target, savingTarget, handleTargetChange } = useTaskSession(
    item, 
    selectedDate || '', 
    completedSessions, 
    refreshKey, 
    forceRefreshTaskId
  );
  
  const [isUpdatingStatus, setIsUpdatingStatus] = React.useState(false);
  const [isUpdatingFocus, setIsUpdatingFocus] = React.useState(false);
  const [optimisticStatus, setOptimisticStatus] = React.useState<string | null>(null);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700 mb-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {onSetActiveTask ? (
            <button
              className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200"
              onClick={() => onSetActiveTask({
                id: item.item_id,
                title: item.title || `Task ${item.item_id}`,
                item_type: item.item_type,
                focus_duration: item.focus_duration || 25
              })}
              title="Mulai Pomodoro"
            >
              <svg width="35" height="35" fill="currentColor" viewBox="0 0 20 20">
                <circle cx="10" cy="10" r="9" fill="currentColor" opacity="0.15"/>
                <polygon points="8,6 14,10 8,14" fill="currentColor"/>
              </svg>
            </button>
          ) : null}
          <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm leading-tight">
            {item.title || `Task ${item.item_id}`}
          </h4>
        </div>
        <div className="flex items-center space-x-2">
          {/* Dropdown untuk durasi fokus dengan loading indicator */}
          <div className="relative">
            <div className="relative">
              <select
                value={item.focus_duration || 25}
                disabled={isUpdatingFocus}
                onChange={async (e) => {
                  setIsUpdatingFocus(true);
                  try {
                    await onFocusDurationChange(item.id, parseInt(e.target.value));
                  } finally {
                    setIsUpdatingFocus(false);
                  }
                }}
                className="appearance-none h-8 pl-3 pr-8 text-xs font-medium border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500"
              >
                {/* Testing option - only show in development */}
                {process.env.NODE_ENV === 'development' && (
                  <option value={10} className="text-gray-700 dark:text-gray-200">10s</option>
                )}
                <option value={25} className="text-gray-700 dark:text-gray-200">25m</option>
                <option value={60} className="text-gray-700 dark:text-gray-200">60m</option>
                <option value={90} className="text-gray-700 dark:text-gray-200">90m</option>
              </select>
              {/* Custom dropdown arrow */}
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <svg 
                  className="w-3 h-3 text-gray-400 dark:text-gray-500" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            {/* Loading spinner overlay */}
            {isUpdatingFocus && (
              <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-gray-700 rounded-lg">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>
          
          {/* Checkbox untuk status dengan loading indicator */}
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={(optimisticStatus || item.status) === 'DONE'}
              disabled={isUpdatingStatus}
              onChange={async (e) => {
                const newStatus = e.target.checked ? 'DONE' : 'TODO';
                
                // Optimistic update - update UI immediately
                setOptimisticStatus(newStatus);
                setIsUpdatingStatus(true);
                
                try {
                  await onStatusChange(item.id, newStatus);
                  // Clear optimistic status after successful update
                  setOptimisticStatus(null);
                } catch (error) {
                  // Revert optimistic update on error
                  setOptimisticStatus(null);
                  console.error('Error updating status:', error);
                } finally {
                  setIsUpdatingStatus(false);
                }
              }}
              className="w-6 h-6 text-brand-500 bg-gray-100 border-gray-300 rounded focus:ring-brand-500 focus:ring-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            />
            {/* Loading spinner overlay */}
            {isUpdatingStatus && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between">
        {item.quest_title && (
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {item.quest_title}
          </div>
        )}
        <div className="flex items-center space-x-1">
          <div className="flex items-center gap-1 text-xs">
            <button
              className="px-1 text-lg text-gray-500 hover:text-brand-600 disabled:opacity-50"
              disabled={savingTarget || target <= 1}
              onClick={() => handleTargetChange(target - 1, onTargetChange)}
              aria-label="Kurangi target"
            >
              –
            </button>
            {loading ? (
              <span className="text-gray-400"><Skeleton className="w-4 h-4 rounded" /></span>
            ) : (
              <span className="font-semibold">({completed} / {target})</span>
            )}
            <button
              className="px-1 text-lg text-gray-500 hover:text-brand-600 disabled:opacity-50"
              disabled={savingTarget}
              onClick={() => handleTargetChange(target + 1, onTargetChange)}
              aria-label="Tambah target"
            >
              +
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskItemCard;
