import React from 'react';
import { SubtaskList } from './SubtaskList';

import type { TaskListProps } from '../types';

export const TaskList: React.FC<TaskListProps> = ({ 
  tasks, 
  milestoneId, 
  expandedItems, 
  existingSelectedIds, 
  selectedItems, 
  handleItemToggle, 
  toggleExpanded 
}) => {
  const expanded = expandedItems.has(milestoneId);
  // Show all tasks that are not done, OR are already selected (even if DONE)
  // Also filter out tasks with empty or null titles
  const filteredTasks = tasks.filter((task: any) => {
    const hasValidTitle = task.title && task.title.trim() !== '';
    const isNotDone = task.status !== 'DONE';
    const isAlreadySelected = selectedItems.some(item => item.id === task.id && item.type === 'TASK');
    const isInExistingSelection = existingSelectedIds.has(task.id);
    
    return hasValidTitle && (isNotDone || isAlreadySelected || isInExistingSelection);
  });
  
  
  if (filteredTasks.length === 0) return null;
  
  return (
    <div
      className={`transition-all duration-300 ease-in-out overflow-hidden ${expanded ? 'opacity-100' : 'max-h-0 opacity-0'}`}
      style={{ willChange: 'max-height, opacity' }}
    >
      <div className="ml-2 space-y-2">
        {filteredTasks.map((task: any) => {
          const isInCurrentSelection = selectedItems.some(item => item.id === task.id && item.type === 'TASK');
          const isInExistingSelection = existingSelectedIds.has(task.id);
          const isChecked = isInCurrentSelection || isInExistingSelection;
          
          
          return (
            <div key={task.id} className="border-l-2 border-gray-200 dark:border-gray-700 pl-4">
              <div className="flex items-center space-x-2 py-1">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => {
                    // If task is already selected in another slot, don't allow toggle
                    if (existingSelectedIds.has(task.id)) {
                      return;
                    }
                    handleItemToggle(task.id, 'TASK', task.subtasks || []);
                  }}
                  className={`w-4 h-4 text-blue-600 rounded focus:ring-blue-500 ${
                    existingSelectedIds.has(task.id) ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  disabled={existingSelectedIds.has(task.id)}
                />
              <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                {task.title}
              </span>
              {task.subtasks && task.subtasks.length > 0 ? (
                <button
                  onClick={() => toggleExpanded(task.id)}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  {expandedItems.has(task.id) ? '▼' : '▶'} Quests
                </button>
              ) : null}
            </div>
            {task.subtasks ? (
              <SubtaskList
                subtasks={task.subtasks}
                taskId={task.id}
                expandedItems={expandedItems}
                existingSelectedIds={existingSelectedIds}
                selectedItems={selectedItems}
                handleItemToggle={handleItemToggle}
              />
            ) : null}
          </div>
          );
        })}
      </div>
    </div>
  );
};
