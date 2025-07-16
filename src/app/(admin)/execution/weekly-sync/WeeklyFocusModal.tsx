"use client";

import React, { useState, useEffect, useCallback } from 'react';

import Button from '@/components/ui/button/Button';
import Spinner from '@/components/ui/spinner/Spinner';
import CustomToast from '@/components/ui/toast/CustomToast';
import { useWeek } from '@/hooks/common/useWeek';
import { isMobileDevice } from '@/lib/deviceUtils';

import { getHierarchicalData } from './actions';

// For future implementation: lazy load heavy drag & drop components
// const DragDropHierarchy = lazy(() => import('./DragDropHierarchy'));

interface Quest {
  id: string;
  title: string;
  milestones: Milestone[];
}

interface Milestone {
  id: string;
  title: string;
  quest_id: string;
  tasks: Task[];
}

interface Task {
  id: string;
  title: string;
  status: 'TODO' | 'DONE';
  milestone_id: string;
  subtasks: Subtask[];
}

interface Subtask {
  id: string;
  title: string;
  status: 'TODO' | 'DONE';
  parent_task_id: string;
}

interface SelectedItem {
  id: string;
  type: 'QUEST' | 'MILESTONE' | 'TASK' | 'SUBTASK';
}

interface WeeklyFocusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (selectedItems: SelectedItem[]) => void;
  year: number;
  initialSelectedItems?: SelectedItem[];
  existingSelectedIds?: Set<string>;
}

// Mobile-optimized simple hierarchy view (without drag & drop)
function SimpleHierarchyView({ 
  hierarchicalData, 
  selectedItems, 
  onItemToggle,
  existingSelectedIds 
}: {
  hierarchicalData: Quest[];
  selectedItems: SelectedItem[];
  onItemToggle: (item: SelectedItem) => void;
  existingSelectedIds: Set<string>;
}) {
  const selectedIds = new Set(selectedItems.map(item => item.id));
  
  const renderItem = (item: SelectedItem, title: string, level: number = 0) => {
    const isSelected = selectedIds.has(item.id);
    const isExisting = existingSelectedIds.has(item.id);
    const isDisabled = isExisting && !isSelected;
    
    return (
      <div 
        key={item.id}
        className={`flex items-center gap-2 p-2 rounded ${level > 0 ? 'ml-4' : ''}`}
        style={{ paddingLeft: `${level * 1}rem` }}
      >
        <input
          type="checkbox"
          checked={isSelected}
          disabled={isDisabled}
          onChange={() => onItemToggle(item)}
          className="flex-shrink-0"
        />
        <span className={`text-sm ${isDisabled ? 'text-gray-400' : ''}`}>
          {title}
        </span>
        {isExisting && !isSelected ? (
          <span className="text-xs text-gray-400 ml-auto">
            (Sudah digunakan)
          </span>
        ) : null}
      </div>
    );
  };
  
  return (
    <div className="space-y-4">
      {hierarchicalData.map((quest) => (
        <div key={quest.id} className="border rounded-lg p-4">
          {renderItem({ id: quest.id, type: 'QUEST' }, quest.title)}
          
          {quest.milestones.map((milestone) => (
            <div key={milestone.id} className="mt-2">
              {renderItem({ id: milestone.id, type: 'MILESTONE' }, milestone.title, 1)}
              
              {milestone.tasks.map((task) => (
                <div key={task.id} className="mt-1">
                  {renderItem({ id: task.id, type: 'TASK' }, task.title, 2)}
                  
                  {task.subtasks.map((subtask) => (
                    <div key={subtask.id} className="mt-1">
                      {renderItem({ id: subtask.id, type: 'SUBTASK' }, subtask.title, 3)}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
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

  const handleItemToggle = useCallback((item: SelectedItem) => {
    setSelectedItems(prev => {
      const existingIndex = prev.findIndex(selected => selected.id === item.id);
      if (existingIndex >= 0) {
        // Remove item
        return prev.filter((_, index) => index !== existingIndex);
      } else {
        // Add item
        return [...prev, item];
      }
    });
  }, []);



  const handleClearAll = useCallback(() => {
    setSelectedItems([]);
  }, []);

  return {
    selectedItems,
    setSelectedItems,
    handleItemToggle,
    handleClearAll
  };
}

// Modal header component
function ModalHeader({ onClose, selectedCount }: { onClose: () => void; selectedCount: number }) {
  return (
    <div className="flex items-center justify-between pb-4 border-b">
      <h3 className="text-lg font-semibold">
        Pilih Weekly Focus ({selectedCount} dipilih)
      </h3>
      <Button
        variant="outline"
        size="sm"
        onClick={onClose}
        className="text-gray-500 hover:text-gray-700"
      >
        ✕
      </Button>
    </div>
  );
}

// Modal footer component
function ModalFooter({ 
  onClose, 
  onSave, 
  loading, 
  selectedCount 
}: { 
  onClose: () => void; 
  onSave: () => void; 
  loading: boolean; 
  selectedCount: number; 
}) {
  return (
    <div className="flex justify-end gap-3 pt-4 border-t">
      <Button
        variant="outline"
        onClick={onClose}
        disabled={loading}
      >
        Batal
      </Button>
      <Button
        onClick={onSave}
        disabled={loading || selectedCount === 0}
        className="bg-blue-600 hover:bg-blue-700 text-white"
      >
        {loading ? 'Menyimpan...' : `Simpan (${selectedCount})`}
      </Button>
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
  
  const isMobile = isMobileDevice();
  
  const { hierarchicalData, dataLoading } = useHierarchicalData(year, quarter, isOpen);
  const { 
    selectedItems, 
    setSelectedItems, 
    handleItemToggle, 
    handleClearAll 
  } = useSelectionManagement(initialSelectedItems);

  // Set selected items when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedItems(initialSelectedItems);
    }
  }, [isOpen, initialSelectedItems, setSelectedItems]);

  // Future: Progressive enhancement for desktop

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
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className={`relative ${isMobile ? 'mx-4 max-h-[90vh] w-full' : 'max-w-4xl mx-4 max-h-[90vh] w-full'} shadow-2xl border rounded-3xl bg-white p-6 dark:bg-gray-900 lg:p-10 flex flex-col`}>
        <ModalHeader onClose={onClose} selectedCount={selectedItems.length} />

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-y-auto mt-4">
          {dataLoading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner size={32} />
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
              {/* Action buttons */}
              <div className="flex justify-between items-center py-2">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearAll}
                    disabled={selectedItems.length === 0}
                  >
                    Clear All
                  </Button>
                </div>
                
                                 {/* Future: Desktop enhancement button */}
              </div>

                             {/* Content: Mobile-optimized simple view */}
               <SimpleHierarchyView
                 hierarchicalData={hierarchicalData}
                 selectedItems={selectedItems}
                 onItemToggle={handleItemToggle}
                 existingSelectedIds={existingSelectedIds}
               />
            </div>
          )}
        </div>

        <ModalFooter
          onClose={onClose}
          onSave={handleSave}
          loading={loading}
          selectedCount={selectedItems.length}
        />
      </div>
    </div>
  );
} 