"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { FaCheck, FaTimes, FaExpand, FaCompress } from 'react-icons/fa';

import Button from '@/components/ui/button/Button';
import CustomToast from '@/components/ui/toast/CustomToast';
import { useWeek } from '@/hooks/common/useWeek';

import { getHierarchicalData } from './actions';

interface HierarchicalItem {
  id: string;
  title: string;
  status?: string;
  subtasks?: HierarchicalItem[];
}

interface Milestone extends HierarchicalItem {
  tasks: (HierarchicalItem & { subtasks: HierarchicalItem[] })[];
}

interface Quest extends HierarchicalItem {
  milestones: Milestone[];
}

interface WeeklyFocusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (selectedItems: Array<{ id: string; type: 'QUEST' | 'MILESTONE' | 'TASK' | 'SUBTASK' }>) => void;
  year: number;
  initialSelectedItems?: Array<{ id: string; type: 'QUEST' | 'MILESTONE' | 'TASK' | 'SUBTASK' }>;
  existingSelectedIds?: Set<string>;
}

interface SelectedItem {
  id: string;
  type: 'QUEST' | 'MILESTONE' | 'TASK' | 'SUBTASK';
}

// Custom hook for hierarchical data management
function useHierarchicalData(year: number, quarter: number, isOpen: boolean) {
  const [hierarchicalData, setHierarchicalData] = useState<Quest[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  const loadHierarchicalData = useCallback(async () => {
    setDataLoading(true);
    try {
      const data = await getHierarchicalData(year, quarter);
      setHierarchicalData(data);
    } catch (error) {
      console.error('Error loading hierarchical data:', error);
      CustomToast.error('Gagal memuat data hierarkis');
    } finally {
      setDataLoading(false);
    }
  }, [year, quarter]);

  useEffect(() => {
    if (isOpen) {
      loadHierarchicalData();
    }
  }, [isOpen, loadHierarchicalData]);

  return { hierarchicalData, dataLoading };
}

// Custom hook for selection management
function useSelectionManagement(initialSelectedItems: SelectedItem[]) {
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>(initialSelectedItems);

  const handleItemToggle = (
    itemId: string,
    itemType: 'QUEST' | 'MILESTONE' | 'TASK' | 'SUBTASK',
    subtasks: HierarchicalItem[] = [],
    parentTaskId?: string
  ) => {
    setSelectedItems(prev => {
      const isSelected = prev.some(item => item.id === itemId && item.type === itemType);
      if (itemType === 'TASK') {
        if (isSelected) {
          return prev.filter(
            item =>
              !(item.id === itemId && item.type === 'TASK') &&
              !subtasks.some(st => st.id === item.id && item.type === 'SUBTASK')
          );
        } else {
          return [
            ...prev,
            { id: itemId, type: 'TASK' },
            ...subtasks.map(st => ({ id: st.id, type: 'SUBTASK' as const })),
          ];
        }
      } else if (itemType === 'SUBTASK') {
        if (parentTaskId && prev.some(item => item.id === parentTaskId && item.type === 'TASK')) return prev;
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

  const getAllAvailableItems = (hierarchicalData: Quest[]): Array<{ id: string; type: 'QUEST' | 'MILESTONE' | 'TASK' | 'SUBTASK' }> => {
    const items: Array<{ id: string; type: 'QUEST' | 'MILESTONE' | 'TASK' | 'SUBTASK' }> = [];
    
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

// Custom hook for expansion management
function useExpansionManagement(hierarchicalData: Quest[], dataLoading: boolean) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (hierarchicalData.length > 0 && !dataLoading) {
      const questIds = hierarchicalData.map(quest => quest.id);
      setExpandedItems(new Set(questIds));
    }
  }, [hierarchicalData, dataLoading]);

  const getAllExpandableIds = () => {
    const ids: string[] = [];
    hierarchicalData.forEach(quest => {
      ids.push(quest.id);
      quest.milestones?.forEach(milestone => {
        ids.push(milestone.id);
        milestone.tasks?.forEach(task => {
          ids.push(task.id);
        });
      });
    });
    return ids;
  };

  const handleExpandAll = () => {
    setExpandedItems(new Set(getAllExpandableIds()));
  };

  const handleCollapseAll = () => {
    setExpandedItems(new Set());
  };

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

  return {
    expandedItems,
    handleExpandAll,
    handleCollapseAll,
    toggleExpanded
  };
}

// Component for subtask rendering
function SubtaskList({ 
  subtasks, 
  taskId, 
  expandedItems, 
  existingSelectedIds, 
  selectedItems, 
  handleItemToggle 
}: {
  subtasks: HierarchicalItem[];
  taskId: string;
  expandedItems: Set<string>;
  existingSelectedIds: Set<string>;
  selectedItems: SelectedItem[];
  handleItemToggle: (itemId: string, itemType: 'QUEST' | 'MILESTONE' | 'TASK' | 'SUBTASK', subtasks?: HierarchicalItem[], parentTaskId?: string) => void;
}) {
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
}

// Component for task rendering
function TaskList({ 
  tasks, 
  milestoneId, 
  expandedItems, 
  existingSelectedIds, 
  selectedItems, 
  handleItemToggle, 
  toggleExpanded 
}: {
  tasks: (HierarchicalItem & { subtasks: HierarchicalItem[] })[];
  milestoneId: string;
  expandedItems: Set<string>;
  existingSelectedIds: Set<string>;
  selectedItems: SelectedItem[];
  handleItemToggle: (itemId: string, itemType: 'QUEST' | 'MILESTONE' | 'TASK' | 'SUBTASK', subtasks?: HierarchicalItem[], parentTaskId?: string) => void;
  toggleExpanded: (itemId: string) => void;
}) {
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
}

// Component for milestone rendering
function MilestoneList({ 
  milestones, 
  questId, 
  expandedItems, 
  existingSelectedIds, 
  selectedItems,
  handleItemToggle,
  toggleExpanded 
}: {
  milestones: Milestone[];
  questId: string;
  expandedItems: Set<string>;
  existingSelectedIds: Set<string>;
  selectedItems: SelectedItem[];
  handleItemToggle: (itemId: string, itemType: 'QUEST' | 'MILESTONE' | 'TASK' | 'SUBTASK', subtasks?: HierarchicalItem[], parentTaskId?: string) => void;
  toggleExpanded: (itemId: string) => void;
}) {
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
}

// Component for modal header
function ModalHeader({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        Pilih Fokus Mingguan
      </h3>
      <button
        onClick={onClose}
        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
      >
        ✕
      </button>
    </div>
  );
}

// Component for modal footer
function ModalFooter({ 
  selectedItems, 
  handleSelectAll, 
  handleClearAll, 
  handleExpandAll, 
  handleCollapseAll, 
  onClose, 
  handleSave, 
  loading, 
  hierarchicalData 
}: {
  selectedItems: SelectedItem[];
  handleSelectAll: (hierarchicalData: Quest[]) => void;
  handleClearAll: () => void;
  handleExpandAll: () => void;
  handleCollapseAll: () => void;
  onClose: () => void;
  handleSave: () => void;
  loading: boolean;
  hierarchicalData: Quest[];
}) {
  return (
    <div className="sticky bottom-0 left-0 right-0 bg-white dark:bg-gray-900 pt-4 mt-6 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between z-10">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {selectedItems.length} item dipilih
        </div>
        <div className="flex gap-2 flex-wrap bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
          <Button
            size="sm"
            variant="primary"
            onClick={() => handleSelectAll(hierarchicalData)}
            className="text-xs flex items-center gap-1 hover:bg-blue-600 hover:text-white transition-colors"
            aria-label="Pilih semua item"
          >
            <FaCheck className="w-3 h-3" /> Select All
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleClearAll}
            className="text-xs flex items-center gap-1 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            aria-label="Kosongkan semua pilihan"
          >
            <FaTimes className="w-3 h-3" /> Clear All
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleExpandAll}
            className="text-xs flex items-center gap-1 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            aria-label="Expand semua quest dan milestone"
          >
            <FaExpand className="w-3 h-3" /> Expand All
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleCollapseAll}
            className="text-xs flex items-center gap-1 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            aria-label="Collapse semua quest dan milestone"
          >
            <FaCompress className="w-3 h-3" /> Collapse All
          </Button>
        </div>
      </div>
      <div className="flex space-x-2">
        <Button
          size="sm"
          variant="outline"
          onClick={onClose}
          disabled={loading}
        >
          Batal
        </Button>
        <Button
          size="sm"
          variant="primary"
          onClick={handleSave}
          disabled={loading}
        >
          {loading ? 'Menyimpan...' : 'Simpan Fokus'}
        </Button>
      </div>
    </div>
  );
}

export default function WeeklyFocusModal({
  isOpen,
  onClose,
  onSave,
  year,
  initialSelectedItems = [],
  existingSelectedIds = new Set()
}: WeeklyFocusModalProps) {
  const { quarter } = useWeek();
  const [loading, setLoading] = useState(false);
  
  const { hierarchicalData, dataLoading } = useHierarchicalData(year, quarter, isOpen);
  const { 
    selectedItems, 
    setSelectedItems, 
    handleItemToggle, 
    handleSelectAll, 
    handleClearAll 
  } = useSelectionManagement(initialSelectedItems);
  const { 
    expandedItems, 
    handleExpandAll, 
    handleCollapseAll, 
    toggleExpanded 
  } = useExpansionManagement(hierarchicalData, dataLoading);

  // Set selected items when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedItems(initialSelectedItems);
    }
  }, [isOpen, initialSelectedItems, setSelectedItems]);

  const handleSave = async () => {
    setLoading(true);
    try {
      onSave(selectedItems);
      onClose();
    } catch (error) {
      console.error('Error saving weekly focus:', error);
      CustomToast.error('Gagal menyimpan fokus mingguan');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-opacity-30 backdrop-blur-[32px] flex items-center justify-center z-50">
      <div className="relative max-w-4xl mx-4 max-h-[90vh] w-full shadow-2xl border rounded-3xl bg-white p-6 dark:bg-gray-900 lg:p-10 flex flex-col">
        <ModalHeader onClose={onClose} />

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          {dataLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              <span className="ml-2 text-gray-600 dark:text-gray-400">Memuat data...</span>
            </div>
          ) : hierarchicalData.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">
                Belum ada Main Quest yang tersedia.
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                Silakan buat Main Quest terlebih dahulu di halaman Planning.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Pilih item-item yang ingin menjadi fokus mingguan ini. Anda dapat memilih kombinasi Quest, Milestone, atau Task.
                {existingSelectedIds.size > 0 && (
                  <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md text-xs">
                    <span className="font-medium text-blue-800 dark:text-blue-300">Info:</span> {existingSelectedIds.size} item sudah dipilih di slot lain dan tidak ditampilkan di sini.
                  </div>
                )}
              </div>
              
              {hierarchicalData
                .filter(quest => {
                  const allMilestones = quest.milestones || [];
                  const remainingMilestones = allMilestones.filter(m => !existingSelectedIds.has(m.id));
                  if (remainingMilestones.length === 0) return false;

                  const hasAnyAvailableChild = remainingMilestones.some(milestone => {
                    const tasks = milestone.tasks || [];
                    if (tasks.some(task => !existingSelectedIds.has(task.id))) return true;
                    return tasks.some(task =>
                      (task.subtasks || []).some(subtask => !existingSelectedIds.has(subtask.id))
                    );
                  });
                  return hasAnyAvailableChild;
                })
                .map((quest) => (
                <div key={quest.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-center space-x-2 py-1">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {quest.title}
                    </span>
                    {quest.milestones && quest.milestones.length > 0 ? (
                      <button
                        onClick={() => toggleExpanded(quest.id)}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        {expandedItems.has(quest.id) ? '▼' : '▶'} Milestones
                      </button>
                    ) : null}
                  </div>
                                     {quest.milestones ? (
                     <MilestoneList
                       milestones={quest.milestones}
                       questId={quest.id}
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
          )}
        </div>

        <ModalFooter
          selectedItems={selectedItems}
          handleSelectAll={handleSelectAll}
          handleClearAll={handleClearAll}
          handleExpandAll={handleExpandAll}
          handleCollapseAll={handleCollapseAll}
          onClose={onClose}
          handleSave={handleSave}
          loading={loading}
          hierarchicalData={hierarchicalData}
        />
      </div>
    </div>
  );
} 