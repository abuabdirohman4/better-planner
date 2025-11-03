"use client";

import React, { useState } from 'react';

import { toast } from 'sonner';
import { useQuarterStore } from '@/stores/quarterStore';
import Skeleton from '@/components/ui/skeleton/Skeleton';

import type { WeeklyFocusModalProps } from './types';
import { ModalHeader } from './components/ModalHeader';
import { ModalFooter } from './components/ModalFooter';
import { MilestoneList } from './components/MilestoneList';
import { useHierarchicalData } from './hooks/useHierarchicalData';
import { useSelectionManagement } from './hooks/useSelectionManagement';
import { useExpansionManagement } from './hooks/useExpansionManagement';

export default function WeeklySyncModal({
  isOpen,
  onClose,
  onSave,
  year,
  initialSelectedItems = [],
  existingSelectedIds = new Set()
}: WeeklyFocusModalProps) {
  const { quarter } = useQuarterStore();
  const [loading, setLoading] = useState(false);
  
  const { hierarchicalData, dataLoading } = useHierarchicalData(year, quarter, isOpen);
  const { 
    selectedItems, 
    handleItemToggle, 
    handleSelectAll, 
    handleClearAll,
  } = useSelectionManagement(initialSelectedItems, existingSelectedIds);

  const { 
    expandedItems, 
    handleExpandAll, 
    handleCollapseAll, 
    toggleExpanded 
  } = useExpansionManagement(hierarchicalData, dataLoading);

  const handleSave = async () => {
    setLoading(true);
    try {
      // Just save the current selectedItems without aggressive cleanup
      // User should manually uncheck items they don't want
      await onSave(selectedItems);
      onClose();
    } catch (error) {
      console.error('Error saving weekly focus:', error);
      toast.error('Gagal menyimpan fokus mingguan');
    } finally {
      setLoading(false);
    }
  };

  // Return early AFTER all hooks
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="relative max-w-4xl mx-4 max-h-[90vh] w-full shadow-2xl border rounded-3xl bg-white p-6 dark:bg-gray-900 lg:p-10 flex flex-col">
        <ModalHeader onClose={onClose} />

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          {dataLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 2 }).map((_, questIdx) => (
                <div key={`skeleton-quest-${questIdx}`} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  {/* Quest title and expand button */}
                  <div className="flex items-center space-x-2 py-1 mb-3">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-20 rounded" />
                  </div>
                  
                  {/* Milestones skeleton */}
                  <div className="ml-2 space-y-3">
                    {Array.from({ length: 2 }).map((_, milestoneIdx) => (
                      <div key={`skeleton-milestone-${milestoneIdx}`} className="border-l-2 border-gray-300 dark:border-gray-600 pl-4">
                        {/* Milestone title and expand button */}
                        <div className="flex items-center space-x-2 py-1 mb-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-16 rounded" />
                        </div>
                        
                        {/* Tasks skeleton */}
                        <div className="ml-2 space-y-2">
                          {Array.from({ length: 2 }).map((_, taskIdx) => (
                            <div key={`skeleton-task-${taskIdx}`} className="border-l-2 border-gray-200 dark:border-gray-700 pl-4">
                              <div className="flex items-center space-x-2 py-1">
                                <Skeleton className="w-4 h-4 rounded" />
                                <Skeleton className="h-4 w-40" />
                              </div>
                              
                              {/* Subtasks skeleton (only for first task) */}
                              {taskIdx === 0 && (
                                <div className="ml-2 space-y-2 mt-2">
                                  {Array.from({ length: 1 }).map((_, subtaskIdx) => (
                                    <div key={`skeleton-subtask-${subtaskIdx}`} className="border-l-2 border-gray-100 dark:border-gray-700 pl-4">
                                      <div className="flex items-center space-x-2 py-1">
                                        <Skeleton className="w-4 h-4 rounded" />
                                        <Skeleton className="h-3 w-32" />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
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
                    <span className="font-medium text-blue-800 dark:text-blue-300">Info:</span> {existingSelectedIds.size} item sudah dipilih di slot lain dan tidak dapat dipilih lagi di slot ini.
                  </div>
                )}
              </div>
              
              {hierarchicalData
                .filter(quest => {
                  // Filter out quests with empty or null titles
                  const hasValidTitle = quest.title && quest.title.trim() !== '';
                  if (!hasValidTitle) return false;
                  
                  // Show all quests that have milestones, regardless of selection status
                  const allMilestones = quest.milestones || [];
                  if (allMilestones.length === 0) return false;

                  // Show quest if it has any tasks or subtasks (including already selected ones)
                  const hasAnyChild = allMilestones.some(milestone => {
                    const tasks = milestone.tasks || [];
                    if (tasks.length > 0) return true;
                    return tasks.some(task =>
                      (task.subtasks || []).length > 0
                    );
                  });
                  return hasAnyChild;
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