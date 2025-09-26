import { useState, useEffect } from 'react';
import type { SelectedItem, HierarchicalItem, Quest } from '../../WeeklySyncClient/types';

export function useSelectionManagement(initialSelectedItems: SelectedItem[], existingSelectedIds: Set<string> = new Set()) {
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>(initialSelectedItems);

  // Initialize selectedItems with initialSelectedItems only once on mount
  useEffect(() => {
    setSelectedItems(initialSelectedItems);
  }, []); // Empty dependency array - only run on mount

  // Clean up selectedItems by removing items that are not visible in UI
  // This should be called when items are filtered out due to DONE status
  const cleanupSelectedItems = (visibleItemIds: Set<string>) => {
    setSelectedItems(prev => {
      const cleaned = prev.filter(item => visibleItemIds.has(item.id));
      if (cleaned.length !== prev.length) {
        console.log('🧹 Cleaned up selectedItems:', {
          before: prev.length,
          after: cleaned.length,
          removed: prev.length - cleaned.length
        });
      }
      return cleaned;
    });
  };

  // Debug: Log selectedItems changes
  useEffect(() => {
    console.log('📊 selectedItems changed:', selectedItems);
  }, [selectedItems]);

  // Debug: Log initialSelectedItems changes
  useEffect(() => {
    console.log('📥 initialSelectedItems changed:', initialSelectedItems);
    // Don't override selectedItems after user interaction
  }, [initialSelectedItems]);

  // Debug: Log existingSelectedIds changes
  useEffect(() => {
    console.log('🔍 existingSelectedIds changed:', Array.from(existingSelectedIds));
  }, [existingSelectedIds]);

  // Debug: Log all state changes
  useEffect(() => {
    console.log('🔄 State Debug:', {
      selectedItems,
      initialSelectedItems,
      existingSelectedIds: Array.from(existingSelectedIds)
    });
  }, [selectedItems, initialSelectedItems, existingSelectedIds]);

  // Debug: Log component mount
  useEffect(() => {
    console.log('🚀 useSelectionManagement mounted');
  }, []);

  // Debug: Log handleItemToggle calls
  const debugHandleItemToggle = (
    itemId: string,
    itemType: 'QUEST' | 'MILESTONE' | 'TASK' | 'SUBTASK',
    subtasks: HierarchicalItem[] = [],
    parentTaskId?: string
  ) => {
    console.log('🎯 handleItemToggle called:', {
      itemId,
      itemType,
      subtasks,
      parentTaskId,
      currentSelectedItems: selectedItems
    });
    return handleItemToggle(itemId, itemType, subtasks, parentTaskId);
  };

  // Debug: Log selectedItems changes with more detail
  useEffect(() => {
    console.log('📊 selectedItems changed:', {
      selectedItems,
      length: selectedItems.length,
      items: selectedItems.map(item => ({ id: item.id, type: item.type }))
    });
  }, [selectedItems]);

  // Debug: Log initialSelectedItems changes with more detail
  useEffect(() => {
    console.log('📥 initialSelectedItems changed:', {
      initialSelectedItems,
      length: initialSelectedItems.length,
      items: initialSelectedItems.map(item => ({ id: item.id, type: item.type }))
    });
  }, [initialSelectedItems]);

  // Debug: Log existingSelectedIds changes with more detail
  useEffect(() => {
    console.log('🔍 existingSelectedIds changed:', {
      existingSelectedIds: Array.from(existingSelectedIds),
      length: existingSelectedIds.size
    });
  }, [existingSelectedIds]);

  // Debug: Log all state changes with more detail
  useEffect(() => {
    console.log('🔄 State Debug:', {
      selectedItems: {
        length: selectedItems.length,
        items: selectedItems.map(item => ({ id: item.id, type: item.type }))
      },
      initialSelectedItems: {
        length: initialSelectedItems.length,
        items: initialSelectedItems.map(item => ({ id: item.id, type: item.type }))
      },
      existingSelectedIds: {
        length: existingSelectedIds.size,
        items: Array.from(existingSelectedIds)
      }
    });
  }, [selectedItems, initialSelectedItems, existingSelectedIds]);

  const handleItemToggle = (
    itemId: string,
    itemType: 'QUEST' | 'MILESTONE' | 'TASK' | 'SUBTASK',
    subtasks: HierarchicalItem[] = [],
    parentTaskId?: string
  ) => {
    // Check for hierarchy conflicts before toggling
    if (itemType === 'TASK') {
      // Check if any subtasks of this task exist in existingSelectedIds
      const conflictingSubtasks = subtasks.filter(st => existingSelectedIds.has(st.id));
      if (conflictingSubtasks.length > 0) {
        console.warn('⚠️ Hierarchy conflict: Subtasks already selected in other slots:', conflictingSubtasks.map(st => st.id));
        // For now, just log warning. Could show toast or prevent selection.
      }
    } else if (itemType === 'SUBTASK' && parentTaskId) {
      // Check if parent task exists in existingSelectedIds
      if (existingSelectedIds.has(parentTaskId)) {
        console.warn('⚠️ Hierarchy conflict: Parent task already selected in other slot:', parentTaskId);
        // For now, just log warning. Could show toast or prevent selection.
      }
    }
    setSelectedItems(prev => {
      const isSelected = prev.some(item => item.id === itemId && item.type === itemType);
      const isExistingSelected = existingSelectedIds.has(itemId);
      
      console.log('🔄 Toggle Debug:', {
        itemId,
        itemType,
        isSelected,
        isExistingSelected,
        prevSelectedItems: prev,
        existingSelectedIds: Array.from(existingSelectedIds)
      });
      
      if (itemType === 'TASK') {
        const isCurrentlyChecked = isSelected || isExistingSelected;
        
        if (isCurrentlyChecked) {
          // Remove from current selection (uncheck)
          console.log('✅ Unchecking task:', itemId);
          const newItems = prev.filter(
            item =>
              !(item.id === itemId && item.type === 'TASK') &&
              !subtasks.some(st => st.id === item.id && item.type === 'SUBTASK')
          );
          console.log('📝 New items after uncheck:', newItems);
          return newItems;
        } else {
          // Add to current selection (check)
          console.log('➕ Checking task:', itemId);
          const newItems = [
            ...prev,
            { id: itemId, type: 'TASK' as const },
            ...subtasks.map(st => ({ id: st.id, type: 'SUBTASK' as const })),
          ];
          console.log('📝 New items after check:', newItems);
          return newItems;
        }
      } else if (itemType === 'SUBTASK') {
        if (parentTaskId && (prev.some(item => item.id === parentTaskId && item.type === 'TASK') || existingSelectedIds.has(parentTaskId))) return prev;
        
        // Check if subtask is selected either as SUBTASK or TASK (for compatibility)
        const isSelectedAsSubtask = prev.some(item => item.id === itemId && item.type === 'SUBTASK');
        const isSelectedAsTask = prev.some(item => item.id === itemId && item.type === 'TASK');
        const isCurrentlyChecked = isSelectedAsSubtask || isSelectedAsTask || existingSelectedIds.has(itemId);
        
        if (isCurrentlyChecked) {
          console.log('✅ Unchecking subtask:', itemId);
          // Remove both SUBTASK and TASK entries for this ID
          return prev.filter(item => !(item.id === itemId && (item.type === 'SUBTASK' || item.type === 'TASK')));
        } else {
          console.log('➕ Checking subtask:', itemId);
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
    handleItemToggle: debugHandleItemToggle,
    isItemSelected,
    handleSelectAll,
    handleClearAll,
    cleanupSelectedItems
  };
}
