import { useState, useMemo, useCallback } from 'react';
import TaskItemCard from './components/TaskItemCard';
import SortableTaskItemCard from './components/SortableTaskItemCard';
import { TaskColumnProps } from './types';
import { EyeIcon, EyeCloseIcon } from '@/lib/icons';
import { useUIPreferencesStore } from '@/stores/uiPreferencesStore';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { toast } from 'sonner';
import { updateDailyPlanItemsDisplayOrder } from './actions/dailyPlanActions';
import { useSWRConfig } from 'swr';
import { dailySyncKeys } from '@/lib/swr';

const MainQuestListSection = ({ 
  title, 
  items, 
  onStatusChange, 
  onSelectTasks, 
  onSetActiveTask, 
  selectedDate, 
  onTargetChange, 
  onFocusDurationChange, 
  completedSessions, 
  refreshSessionKey, 
  forceRefreshTaskId, 
  showAddQuestButton,
  onRemove,
  onConvertToChecklist,
  onConvertToQuest
}: TaskColumnProps) => {
  const { showCompletedMainQuest, toggleShowCompletedMainQuest } = useUIPreferencesStore();
  const [isHovering, setIsHovering] = useState(false);
  const { mutate } = useSWRConfig();

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor),
    useSensor(KeyboardSensor)
  );

  // Filter items based on showCompletedMainQuest state
  const filteredItems = showCompletedMainQuest 
    ? items 
    : items.filter(item => item.status !== 'DONE');

  // Sort items by display_order
  const sortedItems = useMemo(() => {
    return [...filteredItems].sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
  }, [filteredItems]);

  // Handle drag end with optimistic updates
  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    
    const oldIndex = sortedItems.findIndex(item => item.id === String(active.id));
    const newIndex = sortedItems.findIndex(item => item.id === String(over.id));
    
    if (oldIndex === -1 || newIndex === -1) return;
    
    // Reorder array
    const newItems = arrayMove(sortedItems, oldIndex, newIndex);
    
    // Assign sequential display_order (1, 2, 3, ...)
    const itemsWithNewOrder = newItems.map((item, idx) => ({
      id: item.id,
      display_order: idx + 1
    }));
    
    // Save original for revert
    const originalItems = [...sortedItems];
    
    // Optimistic update
    const updatedItemsForUI = newItems.map((item, idx) => ({
      ...item,
      display_order: idx + 1
    }));
    
    try {
      // ✅ FIXED: Optimistic update using updater function (no fetch)
      if (selectedDate) {
        await mutate(
          dailySyncKeys.dailyPlan(selectedDate),
          (currentData: any) => {
            if (!currentData) return currentData;
            return {
              ...currentData,
              daily_plan_items: (currentData.daily_plan_items || []).map((item: any) => {
                const updatedItem = updatedItemsForUI.find(ui => ui.id === item.id);
                if (updatedItem && item.item_type === 'MAIN_QUEST') {
                  return { ...item, display_order: updatedItem.display_order };
                }
                return item;
              })
            };
          },
          { revalidate: false }
        );
      }
      
      // API call
      await updateDailyPlanItemsDisplayOrder(itemsWithNewOrder);
      
      toast.success('Urutan task berhasil diubah');
      
      // Small delay then revalidate
      await new Promise(resolve => setTimeout(resolve, 50));
      if (selectedDate) {
        await mutate(dailySyncKeys.dailyPlan(selectedDate));
      }
    } catch (error) {
      // ✅ FIXED: Revert using updater function (no fetch)
      if (selectedDate) {
        await mutate(
          dailySyncKeys.dailyPlan(selectedDate),
          (currentData: any) => {
            if (!currentData) return currentData;
            return {
              ...currentData,
              daily_plan_items: (currentData.daily_plan_items || []).map((item: any) => {
                const originalItem = originalItems.find(orig => orig.id === item.id);
                if (originalItem && item.item_type === 'MAIN_QUEST') {
                  return { ...item, display_order: originalItem.display_order };
                }
                return item;
              })
            };
          },
          { revalidate: false }
        );
      }
      toast.error('Gagal mengubah urutan task');
    }
  }, [sortedItems, mutate, selectedDate]);

  return (
    <div className="rounded-lg h-fit">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">{title}</h3>
        
        {/* Toggle Show/Hide Completed Button */}
        <div className="relative mr-9" onMouseEnter={() => setIsHovering(true)} onMouseLeave={() => setIsHovering(false)}>
          <button
            onClick={toggleShowCompletedMainQuest}
            className="mt-0.5 p-1.25 text-gray-500 rounded rounded-full hover:text-gray-900 hover:shadow-md transition-colors"
          >
            {showCompletedMainQuest ? (
              <EyeIcon className="w-5 h-5" />
            ) : (
              <EyeCloseIcon className="w-5 h-5" />
            )}
          </button>
          
          {/* Custom Tooltip with Arrow */}
          {/* {isHovering && (
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-0 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg whitespace-nowrap z-20 shadow-lg">
              {showCompletedMainQuest ? 'Hide completed' : 'Show completed'}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-4 border-t-gray-800"></div>
            </div>
          )} */}
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={sortedItems.map(item => item.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {sortedItems.map((item) => (
              <SortableTaskItemCard
                key={item.id}
                id={item.id}
                item={item}
                onStatusChange={onStatusChange}
                onSetActiveTask={onSetActiveTask}
                selectedDate={selectedDate}
                onTargetChange={onTargetChange}
                onFocusDurationChange={onFocusDurationChange}
                completedSessions={completedSessions}
                refreshKey={refreshSessionKey?.[item.id]}
                forceRefreshTaskId={forceRefreshTaskId}
                onRemove={onRemove}
                onConvertToChecklist={onConvertToChecklist}
                onConvertToQuest={onConvertToQuest}
              />
            ))}
            {sortedItems.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400">
            <p className="mb-6 py-8">
              {showCompletedMainQuest 
                ? 'Tidak ada main quest hari ini' 
                : 'Tidak ada main quest yang belum selesai'
              }
            </p>
            {onSelectTasks ? (
              <div className="border-t border-gray-200 pt-4">
                <button
                  onClick={() => onSelectTasks?.([])}
                  className="w-full px-4 py-2 bg-brand-500 text-white font-medium rounded-lg hover:bg-brand-600 transition-colors text-sm"
                >
                  Select Quest
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
        
            {/* Tombol Select Quest di dalam card Main Quest - hanya muncul jika ada task */}
            {showAddQuestButton && sortedItems.length > 0 ? (
          <div className="flex justify-center mt-6">
            <button 
              className="w-full px-4 py-2 bg-brand-500 text-white font-medium rounded-lg hover:bg-brand-600 transition-colors text-sm"
              onClick={() => onSelectTasks?.([])}
            >
              Select Quest
            </button>
          </div>
            ) : null}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};

export default MainQuestListSection;
