"use client";

import React from 'react';
import type { GoalItem } from '../types';

interface HorizontalGoalDisplayProps {
  items: GoalItem[];
  onClick: () => void;
  slotNumber: number;
}

const questColors = [
  'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
];

export default function HorizontalGoalDisplay({ items, onClick, slotNumber }: HorizontalGoalDisplayProps) {
  // Group items by parent quest with improved logic
  const groupItemsByQuest = (items: GoalItem[]) => {
    const groups: { [questId: string]: GoalItem[] } = {};
    const questItems: { [questId: string]: GoalItem } = {};
    const taskItems: { [taskId: string]: GoalItem } = {};
    
    // First pass: collect all items and identify quest and task items
    items.forEach(item => {
      if (item.item_type === 'QUEST') {
        questItems[item.item_id] = item;
      }
      if (item.item_type === 'TASK') {
        taskItems[item.item_id] = item;
      }
      const questId = item.parent_quest_id || item.item_id;
      if (!groups[questId]) {
        groups[questId] = [];
      }
      groups[questId].push(item);
    });

    // Second pass: apply grouping logic
    const result: { [questId: string]: GoalItem[] } = {};
    
    Object.keys(groups).forEach(questId => {
      const groupItems = groups[questId];
      const questItem = questItems[questId];
      
      // If this is a quest with children
      if (questItem && groupItems.length > 1) {
        const children = groupItems.filter(item => item.item_id !== questId);
        const allChildrenSelected = children.every(item => item.status === 'DONE');
        
        if (allChildrenSelected) {
          // Hide parent if all children are selected
          result[questId] = children;
        } else {
          // Show parent with its selection state
          result[questId] = groupItems;
        }
      } else {
        // Handle Task/Subtask relationships
        const processedItems: GoalItem[] = [];
        
        groupItems.forEach(item => {
          if (item.item_type === 'TASK') {
            // Check if this task has subtasks
            const subtasks = groupItems.filter(subtask => 
              subtask.item_type === 'SUBTASK' && subtask.parent_task_id === item.item_id
            );
            
            if (subtasks.length > 0) {
              const allSubtasksSelected = subtasks.every(subtask => subtask.status === 'DONE');
              
              if (allSubtasksSelected) {
                // Hide task if all subtasks are selected
                processedItems.push(...subtasks);
              } else {
                // Show task even if some subtasks are selected
                processedItems.push(item);
                processedItems.push(...subtasks);
              }
            } else {
              // Task has no subtasks, add normally
              processedItems.push(item);
            }
          } else if (item.item_type !== 'SUBTASK') {
            // Add non-subtask items (quests, milestones)
            processedItems.push(item);
          }
        });
        
        result[questId] = processedItems;
      }
    });
    
    return result;
  };

  const groupedItems = groupItemsByQuest(items);
  const sortedQuestIds = Object.keys(groupedItems).sort((a, b) => {
    const aPriority = items.find(item => (item.parent_quest_id || item.item_id) === a)?.parent_quest_priority_score ?? 0;
    const bPriority = items.find(item => (item.parent_quest_id || item.item_id) === b)?.parent_quest_priority_score ?? 0;
    return bPriority - aPriority;
  });

  return (
    <div className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-3 rounded transition-colors" onClick={onClick}>
      <div className="flex flex-wrap gap-3">
        {sortedQuestIds.map((questId, questIndex) => {
          const questItems = groupedItems[questId];
          const colorClass = questColors[(slotNumber-1)%questColors.length];
          
          return (
            <React.Fragment key={questId}>
              {questItems.map((item) => (
                <div
                  key={item.id}
                  className="inline-flex items-center space-x-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm shadow-sm hover:shadow-md transition-shadow"
                >
                  <input
                    type="checkbox"
                    checked={item.status === 'DONE'}
                    readOnly
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className={`px-2 py-1 rounded text-xs font-medium ${colorClass}`}>
                    {['Q1','Q2','Q3'][slotNumber-1] || item.item_type}
                  </span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    {item.title}
                  </span>
                </div>
              ))}
              {/* Add visual separator between quest groups if there are multiple quests */}
              {questIndex < sortedQuestIds.length - 1 && sortedQuestIds.length > 1 && (
                <div className="w-full h-px bg-gray-200 dark:bg-gray-600 my-3" />
              )}
            </React.Fragment>
          );
        })}
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">Klik untuk mengedit</p>
    </div>
  );
}
