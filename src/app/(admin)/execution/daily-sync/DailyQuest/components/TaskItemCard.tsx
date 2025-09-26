import { useState } from 'react';
import Skeleton from '@/components/ui/skeleton/Skeleton';
import Spinner from '@/components/ui/spinner/Spinner';
import { useTaskSession } from '../hooks/useTaskSession';
import { TaskCardProps } from '../types';
import { playSound } from '@/lib/soundUtils';

const TaskItemCard = ({ 
  item, 
  onStatusChange, 
  onSetActiveTask, 
  selectedDate,
  onTargetChange, 
  onFocusDurationChange, 
  completedSessions, 
  refreshKey, 
  forceRefreshTaskId 
}: TaskCardProps) => {
  const { completed, loading, target, savingTarget, handleTargetChange } = useTaskSession(
    item, 
    selectedDate || '', 
    completedSessions, 
    refreshKey, 
    forceRefreshTaskId
  );
  
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isUpdatingFocus, setIsUpdatingFocus] = useState(false);
  const [optimisticStatus, setOptimisticStatus] = useState<string | null>(null);

  const isCompleted = (optimisticStatus || item.status) === 'DONE';
  
  return (
    <div className={`rounded-lg p-4 shadow-sm border mb-3 transition-all duration-200 ${
      isCompleted 
        ? 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 opacity-60' 
        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
    }`}>
      
      {/* Title and Checkbox */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {onSetActiveTask ? (
            <button
              className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors ${
                isCompleted 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
              }`}
              onClick={() => !isCompleted && onSetActiveTask({
                id: item.item_id,
                title: item.title || `Task ${item.item_id}`,
                item_type: item.item_type,
                focus_duration: item.focus_duration || 25
              })}
              disabled={isCompleted}
              title={isCompleted ? "Quest sudah selesai" : "Mulai Pomodoro"}
            >
              <svg width="35" height="35" fill="currentColor" viewBox="0 0 20 20">
                <circle cx="10" cy="10" r="9" fill="currentColor" opacity="0.15"/>
                <polygon points="8,6 14,10 8,14" fill="currentColor"/>
              </svg>
            </button>
          ) : null}
          <h4 className={`font-medium text-sm leading-tight ${
            isCompleted 
              ? 'text-gray-500 dark:text-gray-500 line-through' 
              : 'text-gray-900 dark:text-gray-100'
          }`}>
            {item.title || `Task ${item.item_id}`}
          </h4>
        </div>
        <div className="flex items-center space-x-2">
          {/* Dropdown untuk durasi fokus dengan loading indicator */}
          <div className="relative">
            {isUpdatingFocus ? (
              <Spinner size={16} colorClass="border-blue-500" className="mr-2" />
            ) : (
              <div className="relative">
                <select
                    value={item.focus_duration || 25}
                    disabled={isUpdatingFocus || isCompleted}
                     onChange={async (e) => {
                       if (isCompleted) return;
                       
                       try {
                         setIsUpdatingFocus(true);
                         await onFocusDurationChange(item.id, parseInt(e.target.value));
                       } finally {
                         setIsUpdatingFocus(false);
                       }
                     }}
                  className={`appearance-none h-8 pl-3 pr-8 text-xs font-medium border rounded-lg transition-all duration-200 ${
                    isCompleted
                      ? 'border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400 dark:hover:border-gray-500'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {/* Testing option - only show in development */}
                  {process.env.NODE_ENV === 'development' && (
                    <option value={1} className="text-gray-700 dark:text-gray-200">1m</option>
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
            )}
          </div>
          
          {/* Custom Checkbox untuk status dengan loading indicator */}
          <div className="flex items-center">
            {isUpdatingStatus ? (
              <Spinner size={16} colorClass="border-brand-500" />
            ) : (
              <button
                type="button"
                disabled={isUpdatingStatus}
                onClick={async () => {
                  const newStatus = isCompleted ? 'TODO' : 'DONE';
                  
                  // Play completion sound when marking as DONE
                  if (newStatus === 'DONE') {
                    try {
                      await playSound('pop-up-notify', 0.7); // 70% volume
                    } catch (error) {
                      console.warn('Failed to play completion sound:', error);
                    }
                  }
                  
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
              className={`w-8 h-8 rounded focus:ring-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors border border-gray-300 ${
                isCompleted
                  ? 'bg-gray-100 text-gray-400 focus:ring-brand-400'
                  : ''
              }`}
            >
              {isCompleted && (
                <svg 
                  className="w-10 h-10" 
                  fill="currentColor" 
                  viewBox="0 0 20 20"
                >
                  <path 
                    fillRule="evenodd" 
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                    clipRule="evenodd" 
                  />
                </svg>
              )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Quest & Target */}
      {/* <div className="flex items-center justify-between">
        {item.quest_title && (
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {item.quest_title}
          </div>
        )}
        <div className="flex items-center space-x-1">
          <div className="flex items-center gap-1 text-xs">
            <button
              className={`px-1 text-lg disabled:opacity-50 ${
                isCompleted 
                  ? 'text-gray-400 cursor-not-allowed' 
                  : 'text-gray-500 hover:text-brand-600'
              }`}
              disabled={savingTarget || target <= 1 || isCompleted}
              onClick={() => !isCompleted && handleTargetChange(target - 1, onTargetChange)}
              aria-label="Kurangi target"
            >
              –
            </button>
            {loading ? (
              <span className="text-gray-400"><Skeleton className="w-4 h-4 rounded" /></span>
            ) : (
              <span className={`font-semibold ${
                isCompleted 
                  ? 'text-gray-400' 
                  : 'text-gray-700 dark:text-gray-300'
              }`}>
                ({completed} / {target})
              </span>
            )}
            <button
              className={`px-1 text-lg disabled:opacity-50 ${
                isCompleted 
                  ? 'text-gray-400 cursor-not-allowed' 
                  : 'text-gray-500 hover:text-brand-600'
              }`}
              disabled={savingTarget || isCompleted}
              onClick={() => !isCompleted && handleTargetChange(target + 1, onTargetChange)}
              aria-label="Tambah target"
            >
              +
            </button>
          </div>
        </div>
      </div> */}
    </div>
  );
};

export default TaskItemCard;
