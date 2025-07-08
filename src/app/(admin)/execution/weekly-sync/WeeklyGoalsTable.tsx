"use client";

import React, { useState, useEffect } from 'react';
import ComponentCard from '@/components/common/ComponentCard';
import Button from '@/components/ui/button/Button';
import CustomToast from '@/components/ui/toast/CustomToast';
import { getWeeklyGoals, setWeeklyGoalItems, calculateGoalProgress, removeWeeklyGoal } from './actions';
import WeeklyFocusModal from './WeeklyFocusModal';

interface GoalItem {
  id: string;
  item_id: string;
  item_type: 'QUEST' | 'MILESTONE' | 'TASK' | 'SUBTASK';
  title: string;
  status: string;
  display_order?: number;
  priority_score?: number;
  quest_id?: string;
  milestone_id?: string;
  parent_task_id?: string;
  parent_quest_id?: string;
  parent_quest_title?: string;
  parent_quest_priority_score?: number;
}

interface WeeklyGoal {
  id: string;
  goal_slot: number;
  items: GoalItem[];
}

interface WeeklyGoalsTableProps {
  year: number;
  weekNumber: number;
}

export interface TreeGoalItem extends GoalItem {
  children: TreeGoalItem[];
}

const questColors = [
  'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
];

// New component for horizontal inline display of selected goals
const HorizontalGoalDisplay: React.FC<{ items: GoalItem[]; onClick: () => void; slotNumber: number }> = ({ items, onClick, slotNumber }) => {
  // Group items by parent quest with improved logic
  const groupItemsByQuest = (items: GoalItem[]) => {
    const groups: { [questId: string]: GoalItem[] } = {};
    const questItems: { [questId: string]: GoalItem } = {};
    const taskItems: { [taskId: string]: GoalItem } = {};
    
    // First pass: collect all items and identify quest and task items
    items.forEach(item => {
      if (item.item_type === 'QUEST') {
        questItems[item.item_id] = item;
      }
      if (item.item_type === 'TASK') {
        taskItems[item.item_id] = item;
      }
      const questId = item.parent_quest_id || item.item_id;
      if (!groups[questId]) {
        groups[questId] = [];
      }
      groups[questId].push(item);
    });

    // Second pass: apply grouping logic
    const result: { [questId: string]: GoalItem[] } = {};
    
    Object.keys(groups).forEach(questId => {
      const groupItems = groups[questId];
      const questItem = questItems[questId];
      
      // If this is a quest with children
      if (questItem && groupItems.length > 1) {
        const children = groupItems.filter(item => item.item_id !== questId);
        const allChildrenSelected = children.every(item => item.status === 'DONE');
        
        if (allChildrenSelected) {
          // Hide parent if all children are selected
          result[questId] = children;
        } else {
          // Show parent with its selection state
          result[questId] = groupItems;
        }
      } else {
        // Handle Task/Subtask relationships
        const processedItems: GoalItem[] = [];
        
        groupItems.forEach(item => {
          if (item.item_type === 'TASK') {
            // Check if this task has subtasks
            const subtasks = groupItems.filter(subtask => 
              subtask.item_type === 'SUBTASK' && subtask.parent_task_id === item.item_id
            );
            
            if (subtasks.length > 0) {
              const allSubtasksSelected = subtasks.every(subtask => subtask.status === 'DONE');
              
              if (allSubtasksSelected) {
                // Hide task if all subtasks are selected
                processedItems.push(...subtasks);
              } else {
                // Show task even if some subtasks are selected
                processedItems.push(item);
                processedItems.push(...subtasks);
              }
            } else {
              // Task has no subtasks, add normally
              processedItems.push(item);
            }
          } else if (item.item_type !== 'SUBTASK') {
            // Add non-subtask items (quests, milestones)
            processedItems.push(item);
          }
        });
        
        result[questId] = processedItems;
      }
    });
    
    return result;
  };

  const groupedItems = groupItemsByQuest(items);
  const sortedQuestIds = Object.keys(groupedItems).sort((a, b) => {
    const aPriority = items.find(item => (item.parent_quest_id || item.item_id) === a)?.parent_quest_priority_score ?? 0;
    const bPriority = items.find(item => (item.parent_quest_id || item.item_id) === b)?.parent_quest_priority_score ?? 0;
    return bPriority - aPriority;
  });

  return (
    <div className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-3 rounded transition-colors" onClick={onClick}>
      <div className="flex flex-wrap gap-3">
        {sortedQuestIds.map((questId, questIndex) => {
          const questItems = groupedItems[questId];
          const colorClass = questColors[(slotNumber-1)%questColors.length];
          
          return (
            <React.Fragment key={questId}>
              {questItems.map((item) => (
                <div
                  key={item.id}
                  className="inline-flex items-center space-x-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm shadow-sm hover:shadow-md transition-shadow"
                >
                  <input
                    type="checkbox"
                    checked={item.status === 'DONE'}
                    readOnly
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className={`px-2 py-1 rounded text-xs font-medium ${colorClass}`}>
                    {item.item_type}
                  </span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    {item.title}
                  </span>
                </div>
              ))}
              {/* Add visual separator between quest groups if there are multiple quests */}
              {questIndex < sortedQuestIds.length - 1 && sortedQuestIds.length > 1 && (
                <div className="w-full h-px bg-gray-200 dark:bg-gray-600 my-3" />
              )}
            </React.Fragment>
          );
        })}
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">Klik untuk mengedit</p>
    </div>
  );
};

export default function WeeklyGoalsTable({ year, weekNumber }: WeeklyGoalsTableProps) {
  const [weeklyGoals, setWeeklyGoals] = useState<WeeklyGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [goalProgress, setGoalProgress] = useState<{ [key: number]: { completed: number; total: number; percentage: number } }>({});

  // Load weekly goals
  useEffect(() => {
    const loadWeeklyGoals = async () => {
      setLoading(true);
      try {
        const goals = await getWeeklyGoals(year, weekNumber);
        setWeeklyGoals(goals);
        
        // Calculate progress for each goal slot
        const progressData: { [key: number]: { completed: number; total: number; percentage: number } } = {};
        
        await Promise.all(
          goals.map(async (goal) => {
            if (goal.items.length > 0) {
              const progress = await calculateGoalProgress(goal.items);
              progressData[goal.goal_slot] = progress;
            } else {
              progressData[goal.goal_slot] = { completed: 0, total: 0, percentage: 0 };
            }
          })
        );
        
        setGoalProgress(progressData);
      } catch (error) {
        console.error('Error loading weekly goals:', error);
        setWeeklyGoals([]);
      } finally {
        setLoading(false);
      }
    };

    if (year && weekNumber) {
      loadWeeklyGoals();
    }
  }, [year, weekNumber]);

  const handleSlotClick = (slotNumber: number) => {
    setSelectedSlot(slotNumber);
    setIsModalOpen(true);
  };

  const handleModalSave = async (selectedItems: Array<{ id: string; type: 'QUEST' | 'MILESTONE' | 'TASK' | 'SUBTASK' }>) => {
    if (!selectedSlot) return;

    try {
      if (selectedItems.length === 0) {
        // Hapus goal mingguan untuk slot ini
        const goal = getGoalForSlot(selectedSlot);
        if (goal) {
          await removeWeeklyGoal(goal.id);
          CustomToast.success('Goal mingguan berhasil dihapus!');
        }
      } else {
        await setWeeklyGoalItems({
          year,
          weekNumber,
          goalSlot: selectedSlot,
          items: selectedItems
        });
        CustomToast.success('Goal mingguan berhasil disimpan!');
      }
      // Reload weekly goals
      const goals = await getWeeklyGoals(year, weekNumber);
      setWeeklyGoals(goals);
      // Recalculate progress
      const progressData: { [key: number]: { completed: number; total: number; percentage: number } } = {};
      await Promise.all(
        goals.map(async (goal) => {
          if (goal.items.length > 0) {
            const progress = await calculateGoalProgress(goal.items);
            progressData[goal.goal_slot] = progress;
          } else {
            progressData[goal.goal_slot] = { completed: 0, total: 0, percentage: 0 };
          }
        })
      );
      setGoalProgress(progressData);
    } catch (error) {
      console.error('Error saving weekly goal:', error);
      CustomToast.error('Gagal menyimpan goal mingguan');
    }
  };

  const getGoalForSlot = (slotNumber: number) => {
    return weeklyGoals.find(goal => goal.goal_slot === slotNumber);
  };

  const getProgressForSlot = (slotNumber: number) => {
    return goalProgress[slotNumber] || { completed: 0, total: 0, percentage: 0 };
  };

  // Get all existing selected item IDs from other slots (for anti-duplication)
  const getExistingSelectedIds = (currentSlot: number) => {
    const existingIds = new Set<string>();
    weeklyGoals.forEach(goal => {
      if (goal.goal_slot !== currentSlot) {
        goal.items.forEach(item => {
          existingIds.add(item.item_id);
        });
      }
    });
    return existingIds;
  };

  if (loading) {
    return (
      <ComponentCard title={`3 Goal Minggu ${weekNumber}`} className="mb-6">
        <div className="animate-pulse">
          <table className="w-full">
            <tbody>
              {[1, 2, 3].map((slot) => (
                <tr key={slot} className="border-b border-gray-200 dark:border-gray-700">
                  <td className="py-4 px-4 w-16">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  </td>
                  <td className="py-4 px-4 w-32">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ComponentCard>
    );
  }

  return (
    <>
      <ComponentCard title={`3 Goal Minggu ${weekNumber}`} classNameTitle='text-center text-xl !font-extrabold' classNameHeader="pt-8 pb-0" className="mb-6">
        <table className="w-full">
          <tbody>
            {[1, 2, 3].map((slotNumber) => {
              const goal = getGoalForSlot(slotNumber);
              const progress = getProgressForSlot(slotNumber);
              const isCompleted = progress.percentage === 100;

              return (
                <tr key={slotNumber} className="border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                  {/* Column 1 - Auto Checkbox */}
                  <td className="py-4 px-4 w-16 text-center">
                    <input
                      type="checkbox"
                      checked={isCompleted}
                      readOnly
                      className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                    />
                  </td>
                  {/* Column 2 - Focus Selector */}
                  <td className="py-4 px-4">
                    {goal && goal.items.length > 0 ? (
                      <HorizontalGoalDisplay
                        items={goal.items}
                        onClick={() => handleSlotClick(slotNumber)}
                        slotNumber={slotNumber}
                      />
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSlotClick(slotNumber)}
                        className="w-full justify-start"
                      >
                        + Tetapkan Fokus
                      </Button>
                    )}
                  </td>
                  {/* Column 3 - Auto Progress */}
                  <td className="py-4 px-4 w-32">
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Progress</span>
                        <span className="font-semibold">{progress.percentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${progress.percentage}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {progress.completed}/{progress.total}
                      </p>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </ComponentCard>

      {/* Hierarchical Modal */}
      {selectedSlot && (
        <WeeklyFocusModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedSlot(null);
          }}
          onSave={handleModalSave}
          year={year}
          initialSelectedItems={
            (getGoalForSlot(selectedSlot)?.items || []).map(item => ({ id: item.item_id, type: item.item_type }))
          }
          existingSelectedIds={getExistingSelectedIds(selectedSlot)}
        />
      )}
    </>
  );
} 