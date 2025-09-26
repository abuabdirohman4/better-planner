"use client";

import React, { useState } from 'react';
import ComponentCard from '@/components/common/ComponentCard';
import { toast } from 'sonner';
import { setWeeklyGoalItems, removeWeeklyGoal } from '../actions/weeklyGoalsActions';
import WeeklySyncModal from '../WeeklySyncModal/WeeklySyncModal';
import GoalRow from './components/GoalRow';
import { useWeeklyGoalsProgress, getSlotProgress } from './hooks/useWeeklyGoalsProgress';
import { EyeIcon, EyeCloseIcon } from '@/lib/icons';
import { useUIPreferencesStore } from '@/stores/uiPreferencesStore';
import type { WeeklyGoalsTableProps } from './types';

export default function WeeklySyncTable({ 
  goals = [], 
  goalProgress = {}, // Keep for backward compatibility, but will use client calculation
  onRefreshGoals, 
  ...props 
}: WeeklyGoalsTableProps) {
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  
  // 🚀 OPTIMIZED: Use client-side progress calculation
  const clientProgress = useWeeklyGoalsProgress(goals);
  
  // Get showCompletedTasks state from store - gunakan state yang terpisah untuk weekly sync
  const { showCompletedMainQuest, toggleShowCompletedMainQuest } = useUIPreferencesStore();

  const handleSlotClick = (slotNumber: number) => {
    setSelectedSlot(slotNumber);
    setIsModalOpen(true);
  };

  const handleModalSave = async (selectedItems: Array<{ id: string; type: 'QUEST' | 'MILESTONE' | 'TASK' | 'SUBTASK' }>) => {
    if (!selectedSlot) return;

    console.log('💾 handleModalSave called:', {
      selectedSlot,
      selectedItems,
      selectedItemsLength: selectedItems.length,
      items: selectedItems.map(item => ({ id: item.id, type: item.type }))
    });

    try {
      if (selectedItems.length === 0) {
        // Hapus goal mingguan untuk slot ini
        const goal = goals.find(goal => goal.goal_slot === selectedSlot);
        if (goal) {
          console.log('🗑️ Removing weekly goal:', goal.id);
          await removeWeeklyGoal(goal.id);
          toast.success('Goal mingguan berhasil dihapus!');
        }
      } else {
        console.log('💾 Saving weekly goal items:', {
          year: props.year,
          quarter: props.quarter,
          weekNumber: props.weekNumber,
          goalSlot: selectedSlot,
          items: selectedItems,
          selectedItemsDetails: selectedItems.map(item => ({ id: item.id, type: item.type }))
        });
        
        try {
          console.log('🚀 Calling setWeeklyGoalItems...');
          
          // Filter out items that are DONE (not visible in UI)
          const visibleItems = selectedItems.filter(item => {
            // For now, we'll keep all items since we don't have access to status here
            // The filtering should be done in the modal before calling onSave
            return true;
          });
          
          console.log('📝 Filtered items for saving:', {
            original: selectedItems.length,
            filtered: visibleItems.length,
            items: visibleItems.map(item => ({ id: item.id, type: item.type }))
          });
          
          await setWeeklyGoalItems({
            year: props.year,
            quarter: props.quarter,
            weekNumber: props.weekNumber,
            goalSlot: selectedSlot,
            items: visibleItems
          });
          console.log('✅ setWeeklyGoalItems completed successfully');
          toast.success('Goal mingguan berhasil disimpan!');
        } catch (setError) {
          console.error('❌ Error in setWeeklyGoalItems:', setError);
          throw setError; // Re-throw to be caught by outer try-catch
        }
      }
      
      // FIXED: Always refresh goals after any operation
      if (onRefreshGoals) {
        console.log('🔄 Refreshing goals...');
        onRefreshGoals();
      }
    } catch (error) {
      console.error('Error saving weekly goal:', error);
      toast.error('Gagal menyimpan goal mingguan');
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
        title=""
        className="mb-6"
      >
        {/* Custom Header with Toggle Button */}
        <div className="flex items-center justify-between mb-4 pt-8">
          <div className="flex-1"></div>
          <h2 className="text-center text-xl font-extrabold text-gray-900 dark:text-gray-100">
            3 Quest Week {props.weekNumber}
          </h2>
          <div className="flex-1 flex justify-end">
            {/* Toggle Show/Hide Completed Button */}
            <div className="relative" onMouseEnter={() => setIsHovering(true)} onMouseLeave={() => setIsHovering(false)}>
              <button
                onClick={toggleShowCompletedMainQuest}
                className="p-1.5 text-gray-500 rounded-full hover:text-gray-900 hover:shadow-md transition-colors"
              >
                {showCompletedMainQuest ? (
                  <EyeIcon className="w-5 h-5" />
                ) : (
                  <EyeCloseIcon className="w-5 h-5" />
                )}
              </button>
              
              {/* Custom Tooltip with Arrow */}
              {isHovering && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg whitespace-nowrap z-20 shadow-lg">
                  {showCompletedMainQuest ? 'Hide completed' : 'Show completed'}
                  {/* Arrow pointing down */}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-4 border-t-gray-800"></div>
                </div>
              )}
            </div>
          </div>
        </div>
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
                  showCompletedTasks={showCompletedMainQuest}
                />
              );
            })}
          </tbody>
        </table>
      </ComponentCard>

      {/* Hierarchical Modal */}
      {selectedSlot ? (
        <WeeklySyncModal
          key={`modal-${selectedSlot}`} // Force re-render when slot changes
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedSlot(null);
          }}
          onSave={handleModalSave}
          year={props.year}
          initialSelectedItems={(() => {
            const currentGoal = goals.find(goal => goal.goal_slot === selectedSlot);
            const items = currentGoal?.items || [];
            const mappedItems = items.map(item => ({ 
              id: item.item_id, // item_id adalah task ID dari database
              type: 'TASK' as const // Semua item di weekly_goal_items adalah TASK
            }));
            
            console.log('🔍 Initial selected items for slot', selectedSlot, ':', {
              currentGoal,
              items,
              mappedItems: mappedItems.map(item => ({ id: item.id, type: item.type }))
            });
            
            return mappedItems;
          })()}
          existingSelectedIds={getExistingSelectedIds(selectedSlot)}
        />
      ) : null}
    </>
  );
}
