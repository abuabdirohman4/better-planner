import React from 'react';
import type { Milestone, SelectedItem } from '../types';
import { TaskList } from './TaskList';

interface MilestoneListProps {
  milestones: Milestone[];
  questId: string;
  expandedItems: Set<string>;
  existingSelectedIds: Set<string>;
  selectedItems: SelectedItem[];
  handleItemToggle: (itemId: string, itemType: 'QUEST' | 'MILESTONE' | 'TASK' | 'SUBTASK', subtasks?: any[], parentTaskId?: string) => void;
  toggleExpanded: (itemId: string) => void;
}

export const MilestoneList: React.FC<MilestoneListProps> = ({ 
  milestones, 
  questId, 
  expandedItems, 
  existingSelectedIds, 
  selectedItems,
  handleItemToggle,
  toggleExpanded 
}) => {
  const expanded = expandedItems.has(questId);
  const filteredMilestones = milestones.filter(milestone => {
    const allTasks = milestone.tasks || [];
    const allSubtasks = allTasks.flatMap(task => task.subtasks || []);
    const allIds = [
      ...allTasks.map(t => t.id),
      ...allSubtasks.map(st => st.id)
    ];
    if (allIds.length === 0) return true;
    return !allIds.every(id => existingSelectedIds.has(id));
  });
  
  if (filteredMilestones.length === 0) return null;
  
  return (
    <div
      className={`transition-all duration-300 ease-in-out overflow-hidden ${expanded ? 'opacity-100' : 'max-h-0 opacity-0'}`}
      style={{ willChange: 'max-height, opacity' }}
    >
      <div className="ml-2 space-y-3">
        {filteredMilestones.map((milestone) => (
          <div key={milestone.id} className="border-l-2 border-gray-300 dark:border-gray-600 pl-4">
            <div className="flex items-center space-x-2 py-1">
              <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                {milestone.title}
              </span>
              {milestone.tasks && milestone.tasks.length > 0 ? (
                <button
                  onClick={() => toggleExpanded(milestone.id)}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  {expandedItems.has(milestone.id) ? '▼' : '▶'} Langkah
                </button>
              ) : null}
            </div>
            {milestone.tasks ? (
              <TaskList
                tasks={milestone.tasks}
                milestoneId={milestone.id}
                expandedItems={expandedItems}
                existingSelectedIds={existingSelectedIds}
                selectedItems={selectedItems}
                handleItemToggle={handleItemToggle}
                toggleExpanded={toggleExpanded}
              />
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
};
