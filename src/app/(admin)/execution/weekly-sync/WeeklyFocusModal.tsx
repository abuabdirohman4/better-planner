"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Button from '@/components/ui/button/Button';
import CustomToast from '@/components/ui/toast/CustomToast';
import { getHierarchicalData } from './actions';
import { useWeek } from '@/hooks/useWeek';

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
}

interface SelectedItem {
  id: string;
  type: 'QUEST' | 'MILESTONE' | 'TASK' | 'SUBTASK';
}

export default function WeeklyFocusModal({
  isOpen,
  onClose,
  onSave,
  year,
  initialSelectedItems = []
}: WeeklyFocusModalProps) {
  const { quarter } = useWeek();
  const [hierarchicalData, setHierarchicalData] = useState<Quest[]>([]);
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>(initialSelectedItems);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

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

  // Load hierarchical data when modal opens
  useEffect(() => {
    if (isOpen) {
      loadHierarchicalData();
      setSelectedItems(initialSelectedItems); // Set dari props, bukan reset kosong
    }
  }, [isOpen, loadHierarchicalData, initialSelectedItems]);

  // Auto-expand all quests when hierarchical data is loaded
  useEffect(() => {
    if (hierarchicalData.length > 0 && !dataLoading) {
      const questIds = hierarchicalData.map(quest => quest.id);
      setExpandedItems(new Set(questIds));
    }
  }, [hierarchicalData, dataLoading]);

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

  const handleItemToggle = (itemId: string, itemType: 'QUEST' | 'MILESTONE' | 'TASK' | 'SUBTASK') => {
    setSelectedItems(prev => {
      const existingIndex = prev.findIndex(item => item.id === itemId && item.type === itemType);
      if (existingIndex >= 0) {
        // Remove item
        return prev.filter((_, index) => index !== existingIndex);
      } else {
        // Add item
        return [...prev, { id: itemId, type: itemType }];
      }
    });
  };

  const isItemSelected = (itemId: string, itemType: 'QUEST' | 'MILESTONE' | 'TASK' | 'SUBTASK') => {
    return selectedItems.some(item => item.id === itemId && item.type === itemType);
  };

  // Get all available items from hierarchical data
  const getAllAvailableItems = (): Array<{ id: string; type: 'QUEST' | 'MILESTONE' | 'TASK' | 'SUBTASK' }> => {
    const items: Array<{ id: string; type: 'QUEST' | 'MILESTONE' | 'TASK' | 'SUBTASK' }> = [];
    
    hierarchicalData.forEach(quest => {
      items.push({ id: quest.id, type: 'QUEST' });
      
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

  const handleSelectAll = () => {
    const allItems = getAllAvailableItems();
    setSelectedItems(allItems);
  };

  const handleClearAll = () => {
    setSelectedItems([]);
  };

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

  const renderSubtasks = (subtasks: HierarchicalItem[], taskId: string) => {
    const expanded = expandedItems.has(taskId);
    return (
      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${expanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
        style={{ willChange: 'max-height, opacity' }}
      >
        <div className="ml-2 space-y-2">
          {subtasks.map((subtask) => (
            <div key={subtask.id} className="border-l-2 border-gray-100 dark:border-gray-700 pl-4">
              <div className="flex items-center space-x-2 py-1">
                <input
                  type="checkbox"
                  checked={isItemSelected(subtask.id, 'SUBTASK')}
                  onChange={() => handleItemToggle(subtask.id, 'SUBTASK')}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-800 dark:text-gray-200">
                  {subtask.title}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderTasks = (tasks: (HierarchicalItem & { subtasks: HierarchicalItem[] })[], milestoneId: string) => {
    const expanded = expandedItems.has(milestoneId);
    return (
      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${expanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
        style={{ willChange: 'max-height, opacity' }}
      >
        <div className="ml-2 space-y-2">
          {tasks.map((task) => (
            <div key={task.id} className="border-l-2 border-gray-200 dark:border-gray-700 pl-4">
              <div className="flex items-center space-x-2 py-1">
                <input
                  type="checkbox"
                  checked={isItemSelected(task.id, 'TASK')}
                  onChange={() => handleItemToggle(task.id, 'TASK')}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                  {task.title}
                </span>
                {task.subtasks && task.subtasks.length > 0 && (
                  <button
                    onClick={() => toggleExpanded(task.id)}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    {expandedItems.has(task.id) ? '▼' : '▶'} Quests
                  </button>
                )}
              </div>
              {task.subtasks && renderSubtasks(task.subtasks, task.id)}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderMilestones = (milestones: Milestone[], questId: string) => {
    const expanded = expandedItems.has(questId);
    return (
      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${expanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
        style={{ willChange: 'max-height, opacity' }}
      >
        <div className="ml-2 space-y-3">
          {milestones.map((milestone) => (
            <div key={milestone.id} className="border-l-2 border-gray-300 dark:border-gray-600 pl-4">
              <div className="flex items-center space-x-2 py-1">
                <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                  {milestone.title}
                </span>
                {milestone.tasks && milestone.tasks.length > 0 && (
                  <button
                    onClick={() => toggleExpanded(milestone.id)}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    {expandedItems.has(milestone.id) ? '▼' : '▶'} Langkah
                  </button>
                )}
              </div>
              {milestone.tasks && renderTasks(milestone.tasks, milestone.id)}
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-opacity-30 backdrop-blur-[32px] flex items-center justify-center z-50">
      <div className="relative max-w-4xl mx-4 max-h-[90vh] w-full shadow-2xl border rounded-3xl bg-white p-6 dark:bg-gray-900 lg:p-10 flex flex-col">
        {/* Header */}
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

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          {dataLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
              </div>
              

              
              {hierarchicalData.map((quest) => (
                <div key={quest.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-center space-x-2 py-1">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {quest.title}
                    </span>
                    {quest.milestones && quest.milestones.length > 0 && (
                      <button
                        onClick={() => toggleExpanded(quest.id)}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        {expandedItems.has(quest.id) ? '▼' : '▶'} Milestones
                      </button>
                    )}
                  </div>
                  {quest.milestones && renderMilestones(quest.milestones, quest.id)}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 left-0 right-0 bg-white dark:bg-gray-900 pt-4 mt-6 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between z-10">
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {selectedItems.length} item dipilih
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleSelectAll}
                className="text-xs"
              >
                Select All
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleClearAll}
                className="text-xs"
              >
                Clear All
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
      </div>
    </div>
  );
} 