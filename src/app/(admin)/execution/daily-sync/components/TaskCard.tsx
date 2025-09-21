import React from 'react';
import Skeleton from '@/components/ui/skeleton/Skeleton';
import { useTaskSession } from '../hooks/useTaskSession';
import { TaskCardProps } from '../types';

const TaskCard: React.FC<TaskCardProps> = ({ 
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
          {/* Dropdown untuk durasi fokus */}
          <select
            value={item.focus_duration || 25}
            onChange={(e) => onFocusDurationChange(item.item_id, parseInt(e.target.value))}
            className="w-16 h-8 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:ring-brand-500 focus:border-brand-500"
          >
            <option value={25}>25m</option>
            <option value={60}>60m</option>
            <option value={90}>90m</option>
          </select>
          
          {/* Checkbox untuk status */}
          <input
            type="checkbox"
            checked={item.status === 'DONE'}
            onChange={(e) => onStatusChange(item.item_id, e.target.checked ? 'DONE' : 'TODO')}
            className="w-6 h-6 text-brand-500 bg-gray-100 border-gray-300 rounded focus:ring-brand-500 focus:ring-2"
          />
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

export default TaskCard;
