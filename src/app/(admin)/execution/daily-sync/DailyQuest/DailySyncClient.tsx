"use client";
import React, { useState } from "react";

import DailySyncSkeleton from '@/components/ui/skeleton/DailySyncSkeleton';
import { useDailyPlanManagement } from './hooks/useDailyPlanManagement';
import MainQuestModal from './components/MainQuestModal';
import WorkQuestModal from './components/WorkQuestModal';
import DailyQuestModal from './components/DailyQuestModal';
import SideQuestModal from './components/SideQuestModal';
import TaskItemCard from './components/TaskItemCard';
import SortableTaskItemCard from './components/SortableTaskItemCard';
import DailyFocusCard from './components/DailyFocusCard';
import OtherTasksCard from './components/OtherTasksCard';
import DailyRitualCard from './components/DailyRitualCard';
import type { AddKind } from './components/AddItemMenu';
import { groupItemsByType } from "./utils/groupItemsByType";
import { splitDailyItems } from './utils/dailyFocus';
import { DailySyncClientProps } from './types';
import type { DailyPlanItem } from '@/types/daily-plan';
import type { SideQuest } from '@/types/side-quest';

// Susunan kolom kiri (app-70vs): Daily Focus (3 inti + bonus) → Tugas Lain → Daily Ritual.
const DailySyncClient: React.FC<DailySyncClientProps> = ({
  year,
  quarter,
  weekNumber,
  selectedDate,
  onSetActiveTask,
  dailyPlan,
  loading,
  refreshSessionKey,
  forceRefreshTaskId
}) => {
  const {
    dailyPlan: hookDailyPlan,
    weeklyTasks: hookWeeklyTasks,
    completedSessions,
    loading: hookLoading,
    selectedTasks,
    setShowModal,
    modalLoading,
    savingLoading,
    handleOpenModal,
    handleTaskToggle,
    handleSaveSelection,
    handleStatusChange,
    handleAddSideQuest,
    handleFocusDurationChange,
    handleReorder,
    handleRemoveItem,
    handleConvertToChecklist,
    handleConvertToQuest,
    isDailyQuestModalOpen,
    setIsDailyQuestModalOpen,
    dailyQuests,
    selectedDailyQuestIds,
    handleDailyQuestToggle,
    handleSaveDailyQuestSelection,
    isLoadingDailyQuests,
    isSavingDailyQuests,
    modalState,
    selectedWorkQuests,
  } = useDailyPlanManagement(year, quarter, weekNumber, selectedDate);

  const [showSideModal, setShowSideModal] = useState(false);

  const effectiveDailyPlan = hookDailyPlan || dailyPlan;
  const effectiveWeeklyTasks = hookWeeklyTasks;

  // ✅ FIX BLINK: skeleton hanya saat load awal (belum ada data)
  const hasData = effectiveDailyPlan !== undefined;
  if (!hasData && (hookLoading || loading)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] py-16">
        <DailySyncSkeleton />
      </div>
    );
  }

  const groupedItems = groupItemsByType(effectiveDailyPlan?.daily_plan_items);
  const { core, bonus, side, routine, missingHfg } = splitDailyItems(effectiveDailyPlan?.daily_plan_items);

  const openAdd = (kind: AddKind) => {
    if (kind === 'MAIN_QUEST') handleOpenModal('main');
    else if (kind === 'WORK_QUEST') handleOpenModal('work');
    else if (kind === 'SIDE_QUEST') setShowSideModal(true);
    else setIsDailyQuestModalOpen(true);
  };

  const cardProps = (item: DailyPlanItem) => ({
    item,
    onStatusChange: handleStatusChange,
    onSetActiveTask,
    selectedDate,
    onFocusDurationChange: handleFocusDurationChange,
    completedSessions,
    refreshKey: refreshSessionKey?.[item.id],
    forceRefreshTaskId,
    onRemove: handleRemoveItem,
    onConvertToChecklist: handleConvertToChecklist,
    onConvertToQuest: handleConvertToQuest,
  });
  const renderItem = (item: DailyPlanItem) => <TaskItemCard {...cardProps(item)} />;
  const renderSortable = (item: DailyPlanItem) => <SortableTaskItemCard id={item.id} {...cardProps(item)} />;

  const existingSideQuestIds = groupedItems.SIDE_QUEST.map(i => i.item_id);

  return (
    <div className="mx-auto relative">
      <div className="flex flex-col gap-4 md:gap-6">
        <DailyFocusCard
          core={core}
          bonus={bonus}
          missingHfg={missingHfg}
          renderItem={renderSortable}
          onReorder={handleReorder}
          onAdd={openAdd}
        />
        <OtherTasksCard
          items={side}
          renderItem={renderItem}
          onAdd={openAdd}
          onQuickAddSide={handleAddSideQuest}
        />
        <DailyRitualCard
          selectedDate={selectedDate}
          routine={routine}
          renderItem={renderItem}
          onAddDaily={() => openAdd('DAILY_QUEST')}
        />
      </div>

      <MainQuestModal
        isOpen={modalState.showModal && modalState.modalType === 'main'}
        onClose={() => setShowModal(false)}
        tasks={effectiveWeeklyTasks}
        selectedTasks={selectedTasks}
        onTaskToggle={(taskId) => handleTaskToggle(taskId, 'main')}
        onSave={() => {
          const selectedItems = Object.entries(selectedTasks)
            .filter(([, selected]) => selected)
            .map(([taskId]) => ({ item_id: taskId, item_type: 'MAIN_QUEST' }));
          handleSaveSelection(selectedItems, true);
        }}
        isLoading={modalLoading}
        savingLoading={savingLoading}
        completedTodayCount={groupedItems.MAIN_QUEST.filter(item => item.status === 'DONE').length}
      />

      <WorkQuestModal
        isOpen={modalState.showModal && modalState.modalType === 'work'}
        onClose={() => setShowModal(false)}
        selectedTasks={selectedWorkQuests}
        onTaskToggle={(taskId) => handleTaskToggle(taskId, 'work')}
        onSave={() => {
          const workQuestItems = selectedWorkQuests.map(taskId => ({ item_id: taskId, item_type: 'WORK_QUEST' }));
          handleSaveSelection(workQuestItems, true);
        }}
        isLoading={modalLoading}
        savingLoading={savingLoading}
        completedTodayCount={groupedItems.WORK_QUEST.filter(item => item.status === 'DONE').length}
      />

      <DailyQuestModal
        isOpen={isDailyQuestModalOpen}
        onClose={() => setIsDailyQuestModalOpen(false)}
        tasks={dailyQuests}
        selectedTasks={selectedDailyQuestIds}
        onTaskToggle={handleDailyQuestToggle}
        onSave={() => handleSaveDailyQuestSelection()}
        isLoading={isLoadingDailyQuests}
        savingLoading={isSavingDailyQuests}
      />

      <SideQuestModal
        isOpen={showSideModal}
        onClose={() => setShowSideModal(false)}
        onSave={async (quests: SideQuest[]) => {
          await handleSaveSelection(
            quests.map(q => ({ item_id: q.id, item_type: 'SIDE_QUEST' })),
            true
          );
          setShowSideModal(false);
        }}
        selectedCount={existingSideQuestIds.length}
        completedTodayCount={groupedItems.SIDE_QUEST.filter(item => item.status === 'DONE').length}
        existingSideQuests={existingSideQuestIds}
      />
    </div>
  );
};

export default DailySyncClient;
