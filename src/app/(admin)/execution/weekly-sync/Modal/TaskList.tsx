import React from 'react';
import type { HierarchicalItem, SelectedItem } from '../types';
import { SubtaskList } from './SubtaskList';

interface TaskListProps {
  tasks: (HierarchicalItem & { subtasks: HierarchicalItem[] })[];
  milestoneId: string;
  expandedItems: Set<string>;
  existingSelectedIds: Set<string>;
  selectedItems: SelectedItem[];
  handleItemToggle: (itemId: string, itemType: 'QUEST' | 'MILESTONE' | 'TASK' | 'SUBTASK', subtasks?: HierarchicalItem[], parentTaskId?: string) => void;
  toggleExpanded: (itemId: string) => void;
}

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
  const filteredTasks = tasks.filter(task => {
    if (task.status === 'DONE') return false;
    if (existingSelectedIds.has(task.id)) {
      return false;
    }
    if (task.subtasks && task.subtasks.length > 0) {
      const unselectedSubtasks = task.subtasks.filter(subtask => !existingSelectedIds.has(subtask.id));
      return unselectedSubtasks.length > 0;
    }
    return true;
  });
  
  if (filteredTasks.length === 0) return null;
  
  return (
    <div
      className={`transition-all duration-300 ease-in-out overflow-hidden ${expanded ? 'opacity-100' : 'max-h-0 opacity-0'}`}
      style={{ willChange: 'max-height, opacity' }}
    >
      <div className="ml-2 space-y-2">
        {filteredTasks.map((task) => (
          <div key={task.id} className="border-l-2 border-gray-200 dark:border-gray-700 pl-4">
            <div className="flex items-center space-x-2 py-1">
              <input
                type="checkbox"
                checked={selectedItems.some(item => item.id === task.id && item.type === 'TASK')}
                onChange={() => handleItemToggle(task.id, 'TASK', task.subtasks || [])}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
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
        ))}
      </div>
    </div>
  );
};
