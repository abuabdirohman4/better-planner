import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import type { SelectedItem, HierarchicalItem, Quest } from '../../WeeklySyncClient/types';

export function useSelectionManagement(initialSelectedItems: SelectedItem[], existingSelectedIds: Set<string> = new Set()) {
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>(initialSelectedItems);

  // Initialize selectedItems with initialSelectedItems only once on mount
  useEffect(() => {
    setSelectedItems(initialSelectedItems);
  }, []); // Empty dependency array - only run on mount

  const handleItemToggle = (
    itemId: string,
    itemType: 'QUEST' | 'MILESTONE' | 'TASK' | 'SUBTASK',
    subtasks: HierarchicalItem[] = [],
    parentTaskId?: string
  ) => {
    // STRICT HIERARCHY RULE: Prevent conflicts before toggling
    if (itemType === 'TASK') {
      // Check if any subtasks of this task exist in existingSelectedIds
      const conflictingSubtasks = subtasks.filter(st => existingSelectedIds.has(st.id));
      if (conflictingSubtasks.length > 0) {
        toast.error(`Tidak bisa memilih parent task karena ada ${conflictingSubtasks.length} subtask yang sudah dipilih di slot lain`);
        return; // Prevent selection
      }
    } else if (itemType === 'SUBTASK' && parentTaskId) {
      // Check if parent task exists in existingSelectedIds
      if (existingSelectedIds.has(parentTaskId)) {
        toast.error('Tidak bisa memilih subtask karena parent task sudah dipilih di slot lain');
        return; // Prevent selection
      }
    }
    setSelectedItems(prev => {
      const isSelected = prev.some(item => item.id === itemId && item.type === itemType);
      const isExistingSelected = existingSelectedIds.has(itemId);
      
      
      if (itemType === 'TASK') {
        const isCurrentlyChecked = isSelected || isExistingSelected;
        
        if (isCurrentlyChecked) {
          // Remove from current selection (uncheck)
          // ✅ SMART UNCHECK: If all subtasks are selected, uncheck all; otherwise preserve subtasks
          const nonDoneSubtasks = subtasks.filter(st => st.status !== 'DONE');
          
          // Check if ALL non-DONE subtasks are currently selected
          const allSubtasksSelected = nonDoneSubtasks.length > 0 && 
            nonDoneSubtasks.every(st => {
              const isInCurrentSelection = prev.some(item => item.id === st.id && item.type === 'SUBTASK');
              const isInExistingSelection = existingSelectedIds.has(st.id);
              return isInCurrentSelection || isInExistingSelection;
            });
          
          if (allSubtasksSelected) {
            // All subtasks are selected → uncheck task AND all subtasks
            const newItems = prev.filter(
              item =>
                !(item.id === itemId && item.type === 'TASK') &&
                !subtasks.some(st => st.id === item.id && item.type === 'SUBTASK')
            );
            return newItems;
          } else {
            // Not all subtasks are selected → only remove task, preserve subtasks
            const newItems = prev.filter(
              item => !(item.id === itemId && item.type === 'TASK')
            );
            return newItems;
          }
        } else {
          // Add to current selection (check)
          // ✅ AUTO-SELECT: Automatically select ALL non-DONE subtasks when task is selected
          // This ensures all subtasks are included regardless of database status
          const subtasksToAdd = subtasks
            .filter(st => {
              // Only include subtasks that are not completed (DONE status)
              // All non-DONE subtasks are automatically selected
              return st.status !== 'DONE';
            })
            .map(st => ({ id: st.id, type: 'SUBTASK' as const }));
          
          const newItems = [
            ...prev,
            { id: itemId, type: 'TASK' as const },
            ...subtasksToAdd,
          ];
          return newItems;
        }
      } else if (itemType === 'SUBTASK') {
        if (parentTaskId && (prev.some(item => item.id === parentTaskId && item.type === 'TASK') || existingSelectedIds.has(parentTaskId))) return prev;
        
        // Check if subtask is selected either as SUBTASK or TASK (for compatibility)
        const isSelectedAsSubtask = prev.some(item => item.id === itemId && item.type === 'SUBTASK');
        const isSelectedAsTask = prev.some(item => item.id === itemId && item.type === 'TASK');
        const isCurrentlyChecked = isSelectedAsSubtask || isSelectedAsTask || existingSelectedIds.has(itemId);
        
        if (isCurrentlyChecked) {
          // Remove both SUBTASK and TASK entries for this ID
          return prev.filter(item => !(item.id === itemId && (item.type === 'SUBTASK' || item.type === 'TASK')));
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
    handleSelectAll,
    handleClearAll,
  };
}
