"use client";
import React, { useState, useEffect, useRef } from "react";
import { useQuarterStore } from "@/stores/quarterStore";
import { useWorkQuests } from "@/app/(admin)/quests/work-quests/hooks/useWorkQuests";
import type { WorkQuest } from '@/types/work-quest';
import QuestPickerShell from "./QuestPickerShell";
import QuestPickRow, { ChevronButton, ChevronSpacer } from "./QuestPickRow";
import { TaskItemSkeleton } from "@/components/ui/skeleton";

interface WorkQuestModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTasks: string[];
  onTaskToggle: (taskId: string) => void;
  onSave: () => void;
  tabs?: React.ReactNode;
  isLoading: boolean;
  savingLoading: boolean;
  completedTodayCount?: number;
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
  tabs,
  isLoading,
  savingLoading,
  completedTodayCount = 0
}) => {
  const { year, quarter } = useQuarterStore();
  const { workQuests, isLoading: workQuestsLoading, mutate: refetchWorkQuests } = useWorkQuests(year, quarter);
  // Task yang baru ditambah di halaman Work Quest memakai kunci cache lain: ambil ulang tiap modal dibuka.
  useEffect(() => {
    if (isOpen) refetchWorkQuests();
  }, [isOpen, refetchWorkQuests]);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Initialize state with data from localStorage
  const getInitialExpandedItems = (): Set<string> => {
    if (typeof window === 'undefined') return new Set<string>();
    
    try {
      const expandedKey = 'workquest-modal-expanded';
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

  const [expandedItems, setExpandedItems] = useState<Set<string>>(getInitialExpandedItems);
  const isInitialLoad = useRef(true);
  
  // Cookie key untuk menyimpan expanded state
  const expandedKey = 'workquest-modal-expanded';

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

  // Convert work quests to hierarchical structure (task yang belum DONE, termasuk IN_PROGRESS)
  const hierarchicalItems: HierarchicalItem[] = workQuests.map(quest => {
    const todoTasks = quest.tasks?.filter(task => task.status !== 'DONE') || [];
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
  }).filter(quest => quest.children.length > 0); // Only show projects that still have open tasks

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

  const selectedCount = selectedTasks.length;

  return (
    <QuestPickerShell
      title="Daily Focus"
      selectedCount={selectedCount}
      completedTodayCount={completedTodayCount}
      onClose={onClose}
      onSave={onSave}
      tabs={tabs}
      cancelDisabled={savingLoading}
      saveDisabled={selectedTasks.length === 0}
      saving={savingLoading}
    >
      {workQuestsLoading ? (
        <TaskItemSkeleton count={3} showButton={false} />
      ) : filteredHierarchicalItems.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">
            {searchTerm ? 'Tidak ada work quest yang sesuai dengan pencarian' : 'Belum ada Work Quest'}
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {filteredHierarchicalItems.map((project) => {
            const hasChildren = project.children.length > 0;
            const isExpanded = expandedItems.has(project.id);

            return (
              <div key={project.id} className="space-y-1">
                <QuestPickRow
                  title={project.title}
                  subtitle={project.description}
                  selected={areAllChildrenSelected(project.id)}
                  onToggle={() => handleParentToggle(project.id)}
                  chevron={hasChildren
                    ? <ChevronButton expanded={isExpanded} onClick={() => toggleExpanded(project.id)} />
                    : <ChevronSpacer />}
                  trailing={hasChildren && (
                    <span className="text-xs text-gray-400 dark:text-gray-500">({project.children.length})</span>
                  )}
                />

                {hasChildren && (
                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <div className="ml-9 space-y-1 border-l border-gray-200 dark:border-gray-700 pl-3">
                      {project.children.map((task) => (
                        <QuestPickRow
                          key={task.id}
                          title={task.title}
                          subtitle={task.description}
                          selected={selectedTasks.includes(task.id)}
                          onToggle={() => onTaskToggle(task.id)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </QuestPickerShell>
  );
};

export default WorkQuestModal;
