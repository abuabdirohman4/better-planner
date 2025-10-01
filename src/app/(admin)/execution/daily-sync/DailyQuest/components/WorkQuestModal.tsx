"use client";
import React, { useState, useEffect } from "react";
import { useWorkQuests } from "@/app/(admin)/quests/work-quests/hooks/useWorkQuests";
import { WorkQuest } from "@/app/(admin)/quests/work-quests/types";
import Button from "@/components/ui/button/Button";

interface WorkQuestModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTasks: string[];
  onTaskToggle: (taskId: string) => void;
  onSave: () => void;
  isLoading: boolean;
  savingLoading: boolean;
}

interface HierarchicalItem {
  id: string;
  title: string;
  description?: string;
  type: 'project' | 'task';
  parentId?: string;
  children: HierarchicalItem[];
  taskCount?: number;
}

const WorkQuestModal: React.FC<WorkQuestModalProps> = ({
  isOpen,
  onClose,
  selectedTasks,
  onTaskToggle,
  onSave,
  isLoading,
  savingLoading
}) => {
  const { workQuests, isLoading: workQuestsLoading } = useWorkQuests();
  const [searchTerm, setSearchTerm] = useState("");

  // Convert work quests to hierarchical structure (only TODO tasks)
  const hierarchicalItems: HierarchicalItem[] = workQuests.map(quest => {
    const todoTasks = quest.tasks?.filter(task => task.status === 'TODO') || [];
    return {
      id: quest.id,
      title: quest.title,
      description: quest.description,
      type: 'project' as const,
      children: todoTasks.map(task => ({
        id: task.id,
        title: task.title,
        description: task.description,
        type: 'task' as const,
        parentId: quest.id,
        children: []
      })),
      taskCount: todoTasks.length
    };
  }).filter(quest => quest.children.length > 0); // Only show projects that have TODO tasks

  // Filter hierarchical items based on search term
  const filteredHierarchicalItems = hierarchicalItems.filter(item =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.children.some(child => 
      child.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      child.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // Get all child IDs for a parent
  const getAllChildIds = (parentId: string): string[] => {
    const parent = hierarchicalItems.find(item => item.id === parentId);
    if (!parent) return [];
    return parent.children.map(child => child.id);
  };

  // Check if all children are selected
  const areAllChildrenSelected = (parentId: string): boolean => {
    const childIds = getAllChildIds(parentId);
    if (childIds.length === 0) return false; // No children = not selected
    const allSelected = childIds.every(childId => selectedTasks.includes(childId));
    return allSelected;
  };


  // Handle parent selection (select/deselect all children)
  const handleParentToggle = (parentId: string) => {
    const childIds = getAllChildIds(parentId);
    const allChildrenSelected = areAllChildrenSelected(parentId);
    
    if (allChildrenSelected) {
      // Deselect all children
      childIds.forEach(childId => {
        if (selectedTasks.includes(childId)) {
          onTaskToggle(childId);
        }
      });
    } else {
      // Select all children
      childIds.forEach(childId => {
        if (!selectedTasks.includes(childId)) {
          onTaskToggle(childId);
        }
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        {/* Modal */}
        {/* <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full"> */}
          <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  Pilih Work Quest
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Hanya menampilkan task dengan status TODO
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Search */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Cari work quest..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Work Quest List */}
            <div className="max-h-96 overflow-y-auto">
              {workQuestsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : filteredHierarchicalItems.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">
                    {searchTerm ? 'Tidak ada work quest yang sesuai dengan pencarian' : 'Belum ada work quest'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredHierarchicalItems.map((project) => (
                    <div key={project.id} className="space-y-2">
                      {/* Parent Project */}
                      <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <div className="flex items-start space-x-3">
                          <input
                            type="checkbox"
                            checked={areAllChildrenSelected(project.id)}
                            onChange={() => handleParentToggle(project.id)}
                            className="mt-1 h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                          />
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center">
                              <span className="mr-2">📁</span>
                              {project.title}
                            </h4>
                            {project.description && (
                              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                {project.description}
                              </p>
                            )}
                            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                              {(project.taskCount || 0) > 0 && (
                                <span className="flex items-center">
                                  <span className="w-2 h-2 bg-yellow-400 rounded-full mr-1"></span>
                                  {project.taskCount} task TODO
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Child Tasks */}
                      {project.children.length > 0 && (
                        <div className="ml-6 space-y-2">
                          {project.children.map((task) => (
                            <div
                              key={task.id}
                              className="border border-gray-100 dark:border-gray-700 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                              <div className="flex items-start space-x-3">
                                <input
                                  type="checkbox"
                                  checked={selectedTasks.includes(task.id)}
                                  onChange={() => onTaskToggle(task.id)}
                                  className="mt-1 h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                                />
                                <div className="flex-1">
                                  <h5 className="text-sm font-medium text-gray-800 dark:text-gray-200 flex items-center">
                                    <span className="mr-2">📄</span>
                                    {task.title}
                                    <span className="ml-2 px-2 py-1 text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 rounded-full">
                                      TODO
                                    </span>
                                  </h5>
                                  {task.description && (
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                      {task.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
              >
                Batal
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={onSave}
                disabled={selectedTasks.length === 0}
                loading={savingLoading}
                loadingText="Menyimpan..."
              >
                Pilih Quest
              </Button>
            </div>
          </div>
        {/* </div> */}
      </div>
    </div>
  );
};

export default WorkQuestModal;
