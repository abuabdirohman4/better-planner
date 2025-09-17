import React from 'react';
import type { HierarchicalItem, SelectedItem } from '../types';

interface SubtaskListProps {
  subtasks: HierarchicalItem[];
  taskId: string;
  expandedItems: Set<string>;
  existingSelectedIds: Set<string>;
  selectedItems: SelectedItem[];
  handleItemToggle: (itemId: string, itemType: 'QUEST' | 'MILESTONE' | 'TASK' | 'SUBTASK', subtasks?: HierarchicalItem[], parentTaskId?: string) => void;
}

export const SubtaskList: React.FC<SubtaskListProps> = ({ 
  subtasks, 
  taskId, 
  expandedItems, 
  existingSelectedIds, 
  selectedItems, 
  handleItemToggle 
}) => {
  const expanded = expandedItems.has(taskId);
  const filteredSubtasks = subtasks.filter(subtask => subtask.status !== 'DONE' && !existingSelectedIds.has(subtask.id));
  
  return (
    <div
      className={`transition-all duration-300 ease-in-out overflow-hidden ${expanded ? 'opacity-100' : 'max-h-0 opacity-0'}`}
      style={{ willChange: 'max-height, opacity' }}
    >
      <div className="ml-2 space-y-2">
        {filteredSubtasks.map((subtask) => {
          const parentTaskSelected = selectedItems.some(item => item.id === taskId && item.type === 'TASK');
          return (
            <div key={subtask.id} className="border-l-2 border-gray-100 dark:border-gray-700 pl-4">
              <div className="flex items-center space-x-2 py-1">
                <input
                  type="checkbox"
                  checked={selectedItems.some(item => item.id === subtask.id && item.type === 'SUBTASK') || parentTaskSelected}
                  onChange={() => handleItemToggle(subtask.id, 'SUBTASK', [], taskId)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  disabled={parentTaskSelected}
                />
                <span className="text-sm text-gray-800 dark:text-gray-200">
                  {subtask.title}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
