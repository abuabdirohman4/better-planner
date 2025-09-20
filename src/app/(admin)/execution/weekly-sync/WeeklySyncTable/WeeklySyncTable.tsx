"use client";

import React, { useState } from 'react';
import ComponentCard from '@/components/common/ComponentCard';
import CustomToast from '@/components/ui/toast/CustomToast';
import { setWeeklyGoalItems, removeWeeklyGoal } from '../actions/weeklyGoalsActions';
import WeeklySyncModal from '../WeeklySyncModal/WeeklySyncModal';
import GoalRow from './components/GoalRow';
import { useWeeklyGoalsProgress, getSlotProgress } from '@/hooks/features/useWeeklyGoalsProgress';
import type { WeeklyGoalsTableProps } from '../types';

export default function WeeklySyncTable({ 
  goals = [], 
  goalProgress = {}, // Keep for backward compatibility, but will use client calculation
  onRefreshGoals, 
  ...props 
}: WeeklyGoalsTableProps) {
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // 🚀 OPTIMIZED: Use client-side progress calculation
  const clientProgress = useWeeklyGoalsProgress(goals);

  const handleSlotClick = (slotNumber: number) => {
    setSelectedSlot(slotNumber);
    setIsModalOpen(true);
  };

  const handleModalSave = async (selectedItems: Array<{ id: string; type: 'QUEST' | 'MILESTONE' | 'TASK' | 'SUBTASK' }>) => {
    if (!selectedSlot) return;

    try {
      if (selectedItems.length === 0) {
        // Hapus goal mingguan untuk slot ini
        const goal = goals.find(goal => goal.goal_slot === selectedSlot);
        if (goal) {
          await removeWeeklyGoal(goal.id);
          CustomToast.success('Goal mingguan berhasil dihapus!');
        }
      } else {
        await setWeeklyGoalItems({
          year: props.year,
          weekNumber: props.weekNumber,
          goalSlot: selectedSlot,
          items: selectedItems
        });
        CustomToast.success('Goal mingguan berhasil disimpan!');
      }
      
      // FIXED: Always refresh goals after any operation
      if (onRefreshGoals) {
        onRefreshGoals();
      }
    } catch (error) {
      console.error('Error saving weekly goal:', error);
      CustomToast.error('Gagal menyimpan goal mingguan');
    }
  };

  // Get all existing selected item IDs from other slots (for anti-duplication)
  const getExistingSelectedIds = (currentSlot: number) => {
    const existingIds = new Set<string>();
    goals.forEach(goal => {
      if (goal.goal_slot !== currentSlot) {
        goal.items.forEach(item => {
          existingIds.add(item.item_id);
        });
      }
    });
    return existingIds;
  };

  return (
    <>
      <ComponentCard 
        title={`3 Goal Minggu ${props.weekNumber}`} 
        classNameTitle='text-center text-xl !font-extrabold' 
        classNameHeader="pt-8 pb-0" 
        className="mb-6"
      >
        <table className="w-full">
          <tbody>
            {[1, 2, 3].map((slotNumber: number) => {
              const goal = goals.find(goal => goal.goal_slot === slotNumber);
              // 🚀 OPTIMIZED: Use client-side calculated progress
              const progress = getSlotProgress(clientProgress, slotNumber);

              return (
                <GoalRow
                  key={slotNumber}
                  slotNumber={slotNumber}
                  goal={goal}
                  progress={progress}
                  onSlotClick={handleSlotClick}
                />
              );
            })}
          </tbody>
        </table>
      </ComponentCard>

      {/* Hierarchical Modal */}
      {selectedSlot ? (
        <WeeklySyncModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedSlot(null);
          }}
          onSave={handleModalSave}
          year={props.year}
          initialSelectedItems={
            (goals.find(goal => goal.goal_slot === selectedSlot)?.items || []).map(item => ({ 
              id: item.item_id, 
              type: item.item_type 
            }))
          }
          existingSelectedIds={getExistingSelectedIds(selectedSlot)}
        />
      ) : null}
    </>
  );
}
