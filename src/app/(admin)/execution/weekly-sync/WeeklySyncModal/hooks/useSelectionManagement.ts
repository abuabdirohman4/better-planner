import { useState, useEffect } from 'react';
import type { SelectedItem, HierarchicalItem, Quest } from '../../WeeklySyncClient/types';

export function useSelectionManagement(initialSelectedItems: SelectedItem[], existingSelectedIds: Set<string> = new Set()) {
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>(initialSelectedItems);

  // Update selectedItems when initialSelectedItems changes
  useEffect(() => {
    setSelectedItems(initialSelectedItems);
  }, [initialSelectedItems, existingSelectedIds]);

  const handleItemToggle = (
    itemId: string,
    itemType: 'QUEST' | 'MILESTONE' | 'TASK' | 'SUBTASK',
    subtasks: HierarchicalItem[] = [],
    parentTaskId?: string
  ) => {
    setSelectedItems(prev => {
      const isSelected = prev.some(item => item.id === itemId && item.type === itemType);
      const isExistingSelected = existingSelectedIds.has(itemId);
      
      if (itemType === 'TASK') {
        if (isSelected) {
          // Remove from current selection (uncheck)
          return prev.filter(
            item =>
              !(item.id === itemId && item.type === 'TASK') &&
              !subtasks.some(st => st.id === item.id && item.type === 'SUBTASK')
          );
        } else if (isExistingSelected) {
          // Task is selected in another slot, add to current selection
          return [
            ...prev,
            { id: itemId, type: 'TASK' },
            ...subtasks.map(st => ({ id: st.id, type: 'SUBTASK' as const })),
          ];
        } else {
          // Add to current selection (check)
          return [
            ...prev,
            { id: itemId, type: 'TASK' },
            ...subtasks.map(st => ({ id: st.id, type: 'SUBTASK' as const })),
          ];
        }
      } else if (itemType === 'SUBTASK') {
        if (parentTaskId && (prev.some(item => item.id === parentTaskId && item.type === 'TASK') || existingSelectedIds.has(parentTaskId))) return prev;
        if (isSelected) {
          return prev.filter(item => !(item.id === itemId && item.type === 'SUBTASK'));
        } else {
          return [...prev, { id: itemId, type: 'SUBTASK' as const }];
        }
      } else {
        if (isSelected) {
          return prev.filter(item => !(item.id === itemId && item.type === itemType));
        } else {
          return [...prev, { id: itemId, type: itemType }];
        }
      }
    });
  };

  const isItemSelected = (itemId: string, itemType: 'QUEST' | 'MILESTONE' | 'TASK' | 'SUBTASK') => {
    return selectedItems.some(item => item.id === itemId && item.type === itemType);
  };

  const getAllAvailableItems = (hierarchicalData: Quest[]): SelectedItem[] => {
    const items: SelectedItem[] = [];
    
    hierarchicalData.forEach(quest => {
      quest.milestones?.forEach(milestone => {
        items.push({ id: milestone.id, type: 'MILESTONE' });
        
        milestone.tasks?.forEach(task => {
          items.push({ id: task.id, type: 'TASK' });
          
          task.subtasks?.forEach(subtask => {
            items.push({ id: subtask.id, type: 'SUBTASK' });
          });
        });
      });
    });
    
    return items;
  };

  const handleSelectAll = (hierarchicalData: Quest[]) => {
    const allItems = getAllAvailableItems(hierarchicalData);
    setSelectedItems(allItems);
  };

  const handleClearAll = () => {
    setSelectedItems([]);
  };

  return {
    selectedItems,
    setSelectedItems,
    handleItemToggle,
    isItemSelected,
    handleSelectAll,
    handleClearAll
  };
}
