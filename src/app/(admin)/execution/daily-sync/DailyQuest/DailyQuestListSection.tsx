import { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import TaskItemCard from './components/TaskItemCard';
import SortableTaskItemCard from './components/SortableTaskItemCard';
import { TaskColumnProps } from './types';
import { EyeIcon, EyeCloseIcon, PlusIcon } from '@/lib/icons';
import { useUIPreferencesStore } from '@/stores/uiPreferencesStore';
import Button from '@/components/ui/button/Button';
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
import { updateDailyPlanItemsDisplayOrder } from './actions';
import { useSWRConfig } from 'swr';
import { dailySyncKeys } from '@/lib/swr';
import HabitQuestRow from './components/HabitQuestRow';
import { useDailySyncHabits } from './hooks/useDailySyncHabits';

const DailyQuestListSection = ({
  title,
  items,
  onStatusChange,
  onSelectTasks,
  onSetActiveTask,
  selectedDate,
  onTargetChange,
  onFocusDurationChange,
  forceRefreshTaskId,
  showAddQuestButton,
  completedSessions,
  refreshSessionKey,
  onRemove,
  onConvertToChecklist,
  onConvertToQuest
}: TaskColumnProps) => {
  const { showCompletedDailyQuest, toggleShowCompletedDailyQuest } = useUIPreferencesStore();
  const [isHovering, setIsHovering] = useState(false);
  const { mutate } = useSWRConfig();

  // Habits flagged show_in_daily_sync ride along in this list (app-cr6i). They live in
  // habit_completions, not daily_plan_items, so they stay outside the sortable context.
  const {
    date: habitDate,
    habits: syncHabits,
    isCompleted: isHabitCompleted,
    toggleCompletion: toggleHabit,
    streakOf,
    pendingOtherCount,
    scheduledOtherCount,
  } = useDailySyncHabits(selectedDate ?? '');

  const todayWIB = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
  const isFutureDate = habitDate > todayWIB;

  const visibleHabits = syncHabits.filter(
    (h) => showCompletedDailyQuest || !isHabitCompleted(h.id, habitDate, h.daily_target ?? 1)
  );

  const handleToggleHabit = async (habitId: string) => {
    try {
      await toggleHabit(habitId, habitDate);
    } catch {
      toast.error('Gagal memperbarui kebiasaan');
    }
  };

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor),
    useSensor(KeyboardSensor)
  );

  // Filter items based on showCompletedDailyQuest state
  const filteredItems = showCompletedDailyQuest
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

    // Virtual items can't be reordered in DB yet
    if (String(active.id).startsWith('virtual-') || String(over.id).startsWith('virtual-')) {
      toast.info('Selesaikan tugas ini terlebih dahulu untuk mengaturnya');
      return;
    }

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
      if (selectedDate) {
        await mutate(
          dailySyncKeys.dailyPlan(selectedDate),
          (currentData: any) => {
            if (!currentData) return currentData;
            return {
              ...currentData,
              daily_plan_items: (currentData.daily_plan_items || []).map((item: any) => {
                const updatedItem = updatedItemsForUI.find(ui => ui.id === item.id);
                if (updatedItem && item.item_type === 'DAILY_QUEST') {
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

      toast.success('Urutan daily quest berhasil diubah');

      // Small delay then revalidate
      await new Promise(resolve => setTimeout(resolve, 50));
      if (selectedDate) {
        await mutate(dailySyncKeys.dailyPlan(selectedDate));
      }
    } catch (error) {
      if (selectedDate) {
        await mutate(
          dailySyncKeys.dailyPlan(selectedDate),
          (currentData: any) => {
            if (!currentData) return currentData;
            return {
              ...currentData,
              daily_plan_items: (currentData.daily_plan_items || []).map((item: any) => {
                const originalItem = originalItems.find(orig => orig.id === item.id);
                if (originalItem && item.item_type === 'DAILY_QUEST') {
                  return { ...item, display_order: originalItem.display_order };
                }
                return item;
              })
            };
          },
          { revalidate: false }
        );
      }
      toast.error('Gagal mengubah urutan daily quest');
    }
  }, [sortedItems, mutate, selectedDate]);

  return (
    <div className="rounded-lg h-fit">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">{title}</h3>

        {/* Toggle Show/Hide Completed Button */}
        <div className="relative mr-9" onMouseEnter={() => setIsHovering(true)} onMouseLeave={() => setIsHovering(false)}>
          <button
            onClick={toggleShowCompletedDailyQuest}
            className="mt-0.5 p-1.25 text-gray-500 rounded-full hover:text-gray-900 hover:shadow-md transition-colors"
          >
            {showCompletedDailyQuest ? (
              <EyeIcon className="w-5 h-5" />
            ) : (
              <EyeCloseIcon className="w-5 h-5" />
            )}
          </button>
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
            {visibleHabits.map((habit) => (
              <HabitQuestRow
                key={habit.id}
                habit={habit}
                isCompleted={isHabitCompleted(habit.id, habitDate, habit.daily_target ?? 1)}
                currentStreak={streakOf(habit.id)}
                onToggle={() => handleToggleHabit(habit.id)}
                disabled={isFutureDate}
              />
            ))}

            {scheduledOtherCount > 0 ? (
              <Link
                href="/habits/today"
                data-testid="daily-quest-habit-reminder"
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 text-sm text-gray-600 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                <span aria-hidden="true">🔁</span>
                <span className="flex-1">
                  {pendingOtherCount > 0
                    ? `${pendingOtherCount} kebiasaan lain belum selesai hari ini`
                    : `${scheduledOtherCount} kebiasaan lain sudah selesai hari ini`}
                </span>
                <span aria-hidden="true">→</span>
              </Link>
            ) : null}

            {sortedItems.length === 0 && visibleHabits.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400">
                <p className="mb-6 py-8">
                  {showCompletedDailyQuest
                    ? 'Tidak ada daily quest hari ini'
                    : 'Tidak ada daily quest yang belum selesai'
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
          </div>
        </SortableContext>
      </DndContext>

      {/* Tombol Select Quest di bawah list - hanya muncul jika ada task */}
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
  );
};

export default DailyQuestListSection;
