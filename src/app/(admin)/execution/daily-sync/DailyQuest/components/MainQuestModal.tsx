import React from 'react';
import Skeleton from '@/components/ui/skeleton/Skeleton';
import Button from '@/components/ui/button/Button';
import { TaskSelectionModalProps } from '../types';

const MainQuestModal: React.FC<TaskSelectionModalProps> = ({ 
  isOpen, 
  onClose, 
  tasks, 
  selectedTasks, 
  onTaskToggle, 
  onSave, 
  isLoading,
  savingLoading = false,
  completedTodayCount = 0
}) => {
  const groupByGoalSlot = (tasks: any[]) => {
    const groups: Record<number, any[]> = {};
    tasks.forEach(task => {
      if (!groups[task.goal_slot]) {
        groups[task.goal_slot] = [];
      }
      groups[task.goal_slot].push(task);
    });
    return groups;
  };

  if (!isOpen) return null;

  // Filter out tasks that are not available for selection
  // Tasks that were completed yesterday are already filtered out in getTasksForWeek
  // But we need to ensure tasks added today are still available
  const availableTasks = tasks.filter(task => {
    // Always show tasks that are currently selected (added today)
    if (selectedTasks[task.id]) {
      return true;
    }
    // Show all other available tasks (filtered by getTasksForWeek)
    return true;
  });

  const groupedTasks = groupByGoalSlot(availableTasks);
  const selectedCount = Object.values(selectedTasks).filter(Boolean).length;

  return (
    <div className="fixed inset-0 bg-black/40 bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Select Main Quest</h2>
            <p className="text-gray-600 mb-2">
              Hanya menampilkan task dengan status TODO
            </p>
            <p className="text-gray-700 font-medium">
              Selected : {selectedCount} Quest
            </p>

            {completedTodayCount > 0 && (
              <>
                <p className="text-gray-700 font-medium">
                  Done : {completedTodayCount} Quest
                </p>
              </>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Main Quest List */}
        {isLoading ? (
          <div className="space-y-6">
            {/* Skeleton for 2-3 goal slot groups */}
            {Array.from({ length: 1 }).map((_, groupIndex) => (
              <div key={`skeleton-group-${groupIndex}`} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                {/* Goal slot title skeleton */}
                <Skeleton className="h-6 w-48 mb-4" />
                
                {/* Task items skeleton */}
                <div className="space-y-3">
                  {Array.from({ length: 3 + (groupIndex % 3) }).map((_, taskIndex) => (
                    <div key={`skeleton-task-${taskIndex}`} className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50">
                      {/* Checkbox skeleton */}
                      <Skeleton className="w-4 h-4 rounded" />
                      
                      {/* Task content skeleton */}
                      <div className="flex-1">
                        {/* Task title skeleton */}
                        <Skeleton className="h-4 w-3/4 mb-2" />
                        {/* Task subtitle skeleton */}
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-6 max-h-96 overflow-y-auto">
            {Object.entries(groupedTasks).map(([goalSlot, slotTasks]) => (
              <div key={goalSlot} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-4">Goal Mingguan {goalSlot}</h3>
                <div className="space-y-3">
                  {slotTasks.map((task, index) => {
                    const isSelected = selectedTasks[task.id] || false;
                    // Create unique key by combining task.id with goal_slot and index to prevent duplicates
                    const uniqueKey = `${task.id}-${task.goal_slot}-${index}`;
                    return (
                      <div 
                        key={uniqueKey} 
                        className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                          savingLoading 
                            ? 'cursor-not-allowed opacity-50' 
                            : 'cursor-pointer'
                        } ${
                          isSelected 
                            ? 'bg-blue-50 border border-blue-200' 
                            : 'bg-gray-50 border border-transparent'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => onTaskToggle(task.id)}
                          disabled={savingLoading}
                          className={`w-4 h-4 rounded focus:ring-2 ${
                            isSelected
                              ? 'text-blue-600 bg-blue-600 border-blue-600 focus:ring-blue-500'
                              : 'text-brand-500 bg-gray-100 border-gray-300 focus:ring-brand-500'
                          } ${savingLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        />
                        <div className="flex-1">
                          <span className={`text-sm font-medium block ${
                            isSelected ? 'text-gray-900' : 'text-gray-900'
                          }`}>
                            {task.title}
                          </span>
                          <span className={`text-xs block ${
                            isSelected ? 'text-gray-600' : 'text-gray-500'
                          }`}>
                            {task.quest_title} • {task.type}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
          <Button
            onClick={onClose}
            disabled={savingLoading}
            variant="outline"
            size="md"
          >
            Cancel
          </Button>
          <Button
            onClick={onSave}
            disabled={selectedCount === 0}
            loading={savingLoading}
            loadingText="Menyimpan..."
            variant="primary"
            size="md"
          >
            Submit
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MainQuestModal;
