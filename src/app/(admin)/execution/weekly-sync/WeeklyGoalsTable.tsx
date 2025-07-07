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

  const getItemTypeLabel = (type: string) => {
    switch (type) {
      case 'QUEST': return 'Quest';
      case 'MILESTONE': return 'Milestone';
      case 'TASK': return 'Task';
      case 'SUBTASK': return 'Subtask';
      default: return type;
    }
  };

  // Helper: Render flat list with indent and color label per Main Quest
  function renderFlatHierarchicalList(items: GoalItem[]) {
    // 1. Build color mapping for parent_quest_id (urut priority_score desc)
    const questIdToPriority: Record<string, number> = {};
    items.forEach(item => {
      if (item.parent_quest_id && item.parent_quest_priority_score !== undefined) {
        questIdToPriority[item.parent_quest_id] = item.parent_quest_priority_score;
      }
    });
    // Sort quest ids by priority desc
    const sortedQuestIds = Object.entries(questIdToPriority)
      .sort((a, b) => b[1] - a[1])
      .map(([id]) => id);
    // Assign color per quest
    const questColors = [
      'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    ];
    const questIdToColor: Record<string, string> = {};
    sortedQuestIds.forEach((qid, idx) => {
      questIdToColor[qid] = questColors[idx % questColors.length];
    });
    // 2. Sort items: by parent_quest_priority_score desc, then by item_type order, then display_order
    const itemTypeOrder: Record<string, number> = { QUEST: 0, MILESTONE: 1, TASK: 2, SUBTASK: 3 };
    const sortedItems = [...items].sort((a, b) => {
      const pa = a.parent_quest_priority_score ?? 0;
      const pb = b.parent_quest_priority_score ?? 0;
      if (pb !== pa) return pb - pa;
      const ta = itemTypeOrder[a.item_type] ?? 99;
      const tb = itemTypeOrder[b.item_type] ?? 99;
      if (ta !== tb) return ta - tb;
      return (a.display_order ?? 0) - (b.display_order ?? 0);
    });
    // 3. Render flat list with indent and color label
    return (
      <div className="space-y-1">
        {sortedItems.map(item => {
          let indentClass = '';
          if (item.item_type === 'MILESTONE') indentClass = 'pl-4';
          else if (item.item_type === 'TASK') indentClass = 'pl-8';
          else if (item.item_type === 'SUBTASK') indentClass = 'pl-12';
          const colorClass = questIdToColor[item.parent_quest_id || ''] || questColors[0];
          return (
            <div key={item.id} className={`flex items-center space-x-2 ${indentClass}`}>
              <input type="checkbox" checked={item.status === 'DONE'} readOnly className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
              <span className={`text-xs px-2 py-1 rounded ${colorClass}`}>{getItemTypeLabel(item.item_type)}</span>
              <span className="text-sm text-gray-900 dark:text-white">{item.title}</span>
            </div>
          );
        })}
      </div>
    );
  }

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
                      <div className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded transition-colors" onClick={() => handleSlotClick(slotNumber)}>
                        {renderFlatHierarchicalList(goal.items)}
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Klik untuk mengedit</p>
                      </div>
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
        />
      )}
    </>
  );
} 