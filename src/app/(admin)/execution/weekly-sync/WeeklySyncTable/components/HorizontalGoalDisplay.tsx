"use client";

import React from 'react';
import type { GoalItem } from '../../WeeklySyncClient/types';
import type { HorizontalGoalDisplayProps } from '../types';

const questColors = [
  'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 border border-blue-200 dark:border-blue-700',
  'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300 border border-green-200 dark:border-green-700',
  'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300 border border-orange-200 dark:border-orange-700',
];

export default function HorizontalGoalDisplay({ items, onClick, slotNumber }: HorizontalGoalDisplayProps) {
  // Group items by parent quest with improved logic
  const groupItemsByQuest = (items: GoalItem[]) => {
    const groups: { [questId: string]: GoalItem[] } = {};
    const questItems: { [questId: string]: GoalItem } = {};
    const taskItems: { [taskId: string]: GoalItem } = {};
    
    // First pass: collect all items and identify quest and task items
    items.forEach(item => {
      // Since we removed item_type, all items in weekly_goal_items are MAIN_QUEST
      taskItems[item.item_id] = item;
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
          // Since we removed item_type, all items are MAIN_QUEST
          if (!item.parent_task_id) {
            // Check if this task has subtasks
            const subtasks = groupItems.filter(subtask => 
              subtask.parent_task_id === item.item_id
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
          } else {
            // Add subtask items
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
    <div className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 md:p-4 rounded-lg transition-all duration-200 border border-transparent hover:border-gray-200 dark:hover:border-gray-700" onClick={onClick}>
      <div className="space-y-3 space-x-3">
        {sortedQuestIds.map((questId, questIndex) => {
          const questItems = groupedItems[questId];
          const colorClass = questColors[(slotNumber-1)%questColors.length];
          
          return (
            questItems.map((item) => (
              <div
                key={item.id}
                className={`inline-flex items-center space-x-2 rounded-lg px-3 py-2 text-sm transition-all duration-300 transform hover:scale-105 ${
                  item.status === 'DONE' 
                    ? 'bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 opacity-75' 
                    : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-lg'
                }`}
              >
                {/* Custom Checkbox dengan animation */}
                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                  item.status === 'DONE' 
                    ? 'bg-blue-600 border-blue-600 scale-110' 
                    : 'border-gray-300 dark:border-gray-500 hover:border-blue-400'
                }`}>
                  {item.status === 'DONE' && (
                    <svg 
                      className="w-2.5 h-2.5 text-white animate-pulse" 
                      fill="currentColor" 
                      viewBox="0 0 20 20"
                    >
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                
                {/* Label dengan hover effect */}
                <span className={`px-2 py-1 rounded-full text-xs font-semibold transition-colors duration-200 ${colorClass}`}>
                  {['Q1','Q2','Q3'][slotNumber-1] || 'MAIN_QUEST'}
                </span>
                
                {/* Text dengan better typography */}
                <span className={`text-sm font-medium leading-relaxed transition-colors duration-200 ${
                  item.status === 'DONE' 
                    ? 'text-gray-500 dark:text-gray-400 line-through' 
                    : 'text-gray-900 dark:text-white'
                }`}>
                  {item.title}
                </span>
              </div>
            ))
          );
        })}
      </div>
      
      {/* Edit hint dengan styling yang lebih subtle */}
      <div className="my-3 border-t border-gray-100 dark:border-gray-700">
        <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
          Klik untuk mengedit
        </p>
      </div>
    </div>
  );
}
