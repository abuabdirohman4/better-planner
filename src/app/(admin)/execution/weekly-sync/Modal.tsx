"use client";

import React, { useState, useEffect } from 'react';

import CustomToast from '@/components/ui/toast/CustomToast';
import { useWeek } from '@/hooks/common/useWeek';

import type { WeeklyFocusModalProps } from './types';
import { ModalHeader } from './Modal/ModalHeader';
import { ModalFooter } from './Modal/ModalFooter';
import { MilestoneList } from './Modal/MilestoneList';
import { useHierarchicalData } from './Modal/useHierarchicalData';
import { useSelectionManagement } from './Modal/useSelectionManagement';
import { useExpansionManagement } from './Modal/useExpansionManagement';

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
      await onSave(selectedItems);
      onClose();
    } catch (error) {
      console.error('Error saving weekly focus:', error);
      CustomToast.error('Gagal menyimpan fokus mingguan');
    } finally {
      setLoading(false);
    }
  };

  // Return early AFTER all hooks
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