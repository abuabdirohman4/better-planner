import React, { useState, useEffect, useRef, useMemo } from 'react';
import Skeleton from '@/components/ui/skeleton/Skeleton';
import QuestPickerShell from './QuestPickerShell';
import QuestPickRow, { ChevronButton, ChevronSpacer } from './QuestPickRow';
import { TaskSelectionModalProps } from '../types';
import { getTaskTitles } from '@/app/(admin)/execution/weekly-sync/actions/weeklyTaskActions';

const MainQuestModal: React.FC<TaskSelectionModalProps> = ({ 
  isOpen, 
  onClose, 
  tasks, 
  selectedTasks, 
  onTaskToggle, 
  onSave, 
  tabs,
  isLoading,
  savingLoading = false,
  completedTodayCount = 0
}) => {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const isInitialLoad = useRef(true);
  const [parentTaskTitles, setParentTaskTitles] = useState<Record<string, string>>({});
  
  // Cookie key untuk menyimpan expanded state
  const expandedKey = 'mainquest-modal-expanded';

  // Initialize state with data from localStorage
  const getInitialExpandedItems = (): Set<string> => {
    if (typeof window === 'undefined') return new Set<string>();
    
    try {
      const saved = localStorage.getItem(expandedKey);
      if (saved) {
        const expandedArray: string[] = JSON.parse(saved);
        return new Set(expandedArray);
      }
    } catch (error) {
      console.warn('Failed to load initial expanded state:', error);
    }
    return new Set<string>();
  };

  // Initialize expanded state
  useEffect(() => {
    if (isOpen) {
      setExpandedItems(getInitialExpandedItems());
    }
  }, [isOpen]);

  // Save expanded state to localStorage whenever it changes (but not on initial load)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      return; // Skip saving during initial load
    }
    
    try {
      const expandedArray = Array.from(expandedItems);
      localStorage.setItem(expandedKey, JSON.stringify(expandedArray));
    } catch (error) {
      console.warn('Failed to save expanded state to localStorage:', error);
    }
  }, [expandedItems, expandedKey]);

  const groupByGoalSlot = useMemo(() => {
    return (tasks: any[]) => {
      const groups: Record<number, any[]> = {};
      tasks.forEach(task => {
        if (!groups[task.goal_slot]) {
          groups[task.goal_slot] = [];
        }
        groups[task.goal_slot].push(task);
      });
      return groups;
    };
  }, []);

  // ✅ NEW: Create stable dependency key for parent task IDs per goal slot
  // We need to process this per goal slot, so we'll do it inside the map function
  // But we need a way to track parent task IDs across all slots
  const allParentTaskIds = useMemo(() => {
    const parentTaskIdsMap: Record<number, string[]> = {};
    
    if (!isOpen || !tasks || tasks.length === 0) return parentTaskIdsMap;
    
    const grouped = groupByGoalSlot(tasks);
    Object.entries(grouped).forEach(([goalSlot, slotTasks]) => {
      const hasRootItems = slotTasks.some(task => !task.parent_task_id);
      
      if (!hasRootItems && slotTasks.length > 0) {
        const parentTaskIds = [...new Set(
          slotTasks
            .map(task => task.parent_task_id)
            .filter((id): id is string => !!id)
        )].sort();
        
        if (parentTaskIds.length > 0) {
          parentTaskIdsMap[Number(goalSlot)] = parentTaskIds;
        }
      }
    });
    
    return parentTaskIdsMap;
  }, [tasks, isOpen, groupByGoalSlot]);

  // ✅ NEW: Fetch parent task titles when needed
  const parentTaskTitlesRef = useRef<Record<string, string>>({});
  useEffect(() => {
    parentTaskTitlesRef.current = parentTaskTitles;
  }, [parentTaskTitles]);

  useEffect(() => {
    if (!isOpen) return;
    
    // Collect all unique parent task IDs from all goal slots
    const allParentIds = Object.values(allParentTaskIds).flat();
    
    if (allParentIds.length === 0) {
      if (Object.keys(parentTaskTitlesRef.current).length > 0) {
        setParentTaskTitles({});
      }
      return;
    }

    const fetchParentTitles = async () => {
      // ✅ FIXED: Check if titles already exist using ref to avoid dependency issues
      const currentTitles = parentTaskTitlesRef.current;
      const needsFetch = allParentIds.some(id => !currentTitles[id]);
      
      if (needsFetch) {
        try {
          const titles = await getTaskTitles(allParentIds);
          setParentTaskTitles(prev => {
            // ✅ Only update if titles actually changed to prevent unnecessary re-renders
            const hasChanges = allParentIds.some(id => titles[id] !== prev[id]);
            return hasChanges ? { ...prev, ...titles } : prev;
          });
        } catch (error) {
          console.error('Failed to fetch parent task titles:', error);
        }
      }
    };

    fetchParentTitles();
  }, [allParentTaskIds, isOpen]);

  // Build hierarchical structure like HierarchicalGoalDisplay
  // ✅ Memoized to use latest parentTaskTitles and expandedItems
  const buildHierarchy = useMemo(() => {
    return (tasks: any[], goalSlot: number) => {
      const hierarchy: { [key: string]: any } = {};
      const rootItems: any[] = [];
      
      // First, identify root items (items without parent_task_id)
      tasks.forEach(task => {
        if (!task.parent_task_id) {
          rootItems.push(task);
        }
      });

      // ✅ NEW: If no root items found, check if we need to create virtual parents
      if (rootItems.length === 0) {
        // Collect unique parent_task_id values from subtasks
        const parentTaskIds = [...new Set(
          tasks
            .map(task => task.parent_task_id)
            .filter((id): id is string => !!id)
        )];
        
        if (parentTaskIds.length > 0) {
          // Create virtual parent tasks for subtasks that have parent_task_id
          parentTaskIds.forEach(parentTaskId => {
            const children = tasks.filter(task => task.parent_task_id === parentTaskId);
            if (children.length > 0) {
              // ✅ Create virtual parent: has id but not in tasks array (indicates not selected)
              hierarchy[parentTaskId] = {
                id: parentTaskId,
                title: parentTaskTitles[parentTaskId] || 'Parent Task', // ✅ Use fetched title or placeholder
                status: undefined, // ✅ Key: undefined status means virtual parent (not selected)
                children: children,
                isExpanded: expandedItems.has(parentTaskId),
                isVirtualParent: true // ✅ Flag to identify virtual parent
              };
            }
          });
        } else {
          // Fallback: no parent_task_id at all, treat as before
          tasks.forEach(task => {
            hierarchy[task.id] = {
              ...task,
              children: [],
              isExpanded: expandedItems.has(task.id)
            };
          });
        }
      } else {
        // Existing logic: build hierarchy for each root item
        rootItems.forEach(rootItem => {
          const children = tasks.filter(task => task.parent_task_id === rootItem.id);
          
          hierarchy[rootItem.id] = {
            ...rootItem,
            children: children.length > 0 ? children : [],
            isExpanded: expandedItems.has(rootItem.id)
          };
        });
      }

      return hierarchy;
    };
  }, [parentTaskTitles, expandedItems]);

  // ✅ FIXED: Move all hooks before conditional return to maintain hook order
  // Filter out tasks that are not available for selection
  // Tasks that were completed yesterday are already filtered out in getTasksForWeek
  // But we need to ensure tasks added today are still available
  const availableTasks = useMemo(() => {
    if (!isOpen) return [];
    return tasks.filter(task => {
      // Always show tasks that are currently selected (added today)
      if (selectedTasks[task.id]) {
        return true;
      }
      // Show all other available tasks (filtered by getTasksForWeek)
      return true;
    });
  }, [tasks, selectedTasks, isOpen]);

  const groupedTasks = useMemo(() => {
    if (!isOpen) return {};
    return groupByGoalSlot(availableTasks);
  }, [availableTasks, groupByGoalSlot, isOpen]);

  // Toggle expanded state
  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  // Render item recursively like HierarchicalGoalDisplay
  const renderItem = (item: any, level: number = 0): React.ReactNode => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.has(item.id);
    const isSelected = selectedTasks[item.id] || false;
    // Induk virtual: hanya penanda hierarki, tanpa kotak centang
    const isVirtualParent = item.status === undefined || item.isVirtualParent === true;

    return (
      <div key={item.id} className="space-y-1">
        <QuestPickRow
          title={item.title || 'Untitled Task'}
          selected={!isVirtualParent && isSelected}
          done={item.status === 'DONE'}
          showCheckbox={!isVirtualParent}
          disabled={savingLoading}
          // Induk virtual: klik judul = buka/tutup; lainnya = pilih
          onToggle={() => {
            if (isVirtualParent) { if (hasChildren) toggleExpanded(item.id); }
            else if (!savingLoading) onTaskToggle(item.id);
          }}
          chevron={hasChildren
            ? <ChevronButton expanded={isExpanded} onClick={() => toggleExpanded(item.id)} />
            : <ChevronSpacer />}
          trailing={hasChildren && (
            <span className="text-xs text-gray-400 dark:text-gray-500">({item.children.length})</span>
          )}
        />

        {hasChildren && (
          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
            }`}
          >
            <div className="ml-9 space-y-1 border-l border-gray-200 dark:border-gray-700 pl-3">
              {item.children.map((child: any) => renderItem(child, level + 1))}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  const selectedCount = Object.values(selectedTasks).filter(Boolean).length;

  return (
    <QuestPickerShell
      title="Daily Focus"
      selectedCount={selectedCount}
      completedTodayCount={completedTodayCount}
      onClose={onClose}
      onSave={onSave}
      tabs={tabs}
      cancelDisabled={savingLoading}
      saveDisabled={selectedCount === 0}
      saving={savingLoading}
    >
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={`skeleton-task-${i}`} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-50 dark:bg-white/5">
              <Skeleton className="w-4 h-4 rounded" />
              <div className="flex-1">
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ) : Object.keys(groupedTasks).length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <p className="font-medium">Belum ada task HFG minggu ini</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedTasks).map(([goalSlot, slotTasks]) => {
            const hierarchy = buildHierarchy(slotTasks, Number(goalSlot));
            const rootItems = Object.values(hierarchy);

            return (
              <div key={goalSlot}>
                <h3 className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 px-3 mb-1">
                  Goal Mingguan {goalSlot}
                </h3>
                <div className="space-y-1">
                  {rootItems.length > 0 ? (
                    rootItems.map((item: any) => renderItem(item))
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400 px-3 py-2">
                      Tidak ada task di goal slot ini
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </QuestPickerShell>
  );
};

export default MainQuestModal;
