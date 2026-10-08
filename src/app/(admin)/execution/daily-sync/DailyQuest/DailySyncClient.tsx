"use client";
import React, { useState } from "react";

import DailySyncSkeleton from '@/components/ui/skeleton/DailySyncSkeleton';
import { useDailyPlanManagement } from './hooks/useDailyPlanManagement';
import MainQuestModal from './components/MainQuestModal';
import WorkQuestModal from './components/WorkQuestModal';
import DailyQuestModal from './components/DailyQuestModal';
import SideQuestModal from './components/SideQuestModal';
import SortableTaskItemCard from './components/SortableTaskItemCard';
import DailyFocusCard from './components/DailyFocusCard';
import WorkCyclesCard from './components/WorkCyclesCard';
import { useTimerStore } from '@/stores/timerStore';
import OtherTasksCard from './components/OtherTasksCard';
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
    switchFocusTab,
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

  // Tugas Lain: satu modal, tab Side | Daily; dua-duanya tetap ter-mount supaya pilihan tidak hilang saat pindah tab.
  const [otherTab, setOtherTab] = useState<'side' | 'daily' | null>(null);
  const [sidePicks, setSidePicks] = useState<SideQuest[]>([]);
  const openOther = (tab: 'side' | 'daily') => {
    setOtherTab(tab);
    setIsDailyQuestModalOpen(true);
  };
  const closeOther = () => {
    setOtherTab(null);
    setIsDailyQuestModalOpen(false);
  };

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
  const { core, bonus, other, missingHfg } = splitDailyItems(effectiveDailyPlan?.daily_plan_items);

  const openAdd = (kind: AddKind) => {
    if (kind === 'MAIN_QUEST') handleOpenModal('main');
    else if (kind === 'WORK_QUEST') handleOpenModal('work');
    else if (kind === 'SIDE_QUEST') openOther('side');
    else openOther('daily');
  };

  // Task dicentang selesai saat siklus berjalan -> baris "✓ judul" di catatan siklus (app-mgsb).
  const onStatusChange = async (itemId: string, status: 'TODO' | 'IN_PROGRESS' | 'DONE') => {
    await handleStatusChange(itemId, status);
    const timer = useTimerStore.getState();
    const done = effectiveDailyPlan?.daily_plan_items?.find((i: DailyPlanItem) => i.id === itemId);
    if (status === 'DONE' && done && (timer.timerState === 'FOCUSING' || timer.timerState === 'PAUSED')) {
      timer.addCycleNote(`✓ ${done.title}`);
    }
  };

  const cardProps = (item: DailyPlanItem) => ({
    item,
    onStatusChange,
    onSetActiveTask,
    selectedDate,
    onFocusDurationChange: handleFocusDurationChange,
    completedSessions,
    refreshKey: refreshSessionKey?.[item.id],
    forceRefreshTaskId,
    onRemove: handleRemoveItem,
  });
  const renderSortable = (item: DailyPlanItem) => <SortableTaskItemCard id={item.id} {...cardProps(item)} />;

  // Satu modal Daily Focus, tab HFG | Work; simpan dua jenis sekaligus (app-mgsb).
  const saveFocus = () => {
    const hfg = Object.entries(selectedTasks).filter(([, on]) => on).map(([id]) => ({ item_id: id, item_type: 'MAIN_QUEST' }));
    const work = selectedWorkQuests.map((id) => ({ item_id: id, item_type: 'WORK_QUEST' }));
    handleSaveSelection([...hfg, ...work], true, ['MAIN_QUEST', 'WORK_QUEST']);
  };
  const hfgCount = Object.values(selectedTasks).filter(Boolean).length;
  const focusTabs = (
    <div className="mb-4 flex gap-1 border-b border-gray-200" role="tablist">
      {([['main', 'HFG', hfgCount], ['work', 'Work', selectedWorkQuests.length]] as const).map(([key, label, n]) => (
        <button
          key={key}
          type="button"
          role="tab"
          aria-selected={modalState.modalType === key}
          data-testid={`focus-tab-${key}`}
          onClick={() => switchFocusTab(key)}
          className={`-mb-px border-b-2 px-4 py-2 text-sm font-semibold ${modalState.modalType === key ? 'border-brand-500 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          {label}{n > 0 ? ` · ${n}` : ''}
        </button>
      ))}
    </div>
  );

  const saveOther = async () => {
    const side = sidePicks.map((q) => ({ item_id: q.id, item_type: 'SIDE_QUEST' }));
    const daily = Object.entries(selectedDailyQuestIds).filter(([, on]) => on).map(([id]) => ({ item_id: id, item_type: 'DAILY_QUEST' }));
    await handleSaveSelection([...side, ...daily], true, ['SIDE_QUEST', 'DAILY_QUEST']);
    closeOther();
  };
  const dailyCount = Object.values(selectedDailyQuestIds).filter(Boolean).length;
  const otherTabs = (
    <div className="mb-4 flex gap-1 border-b border-gray-200" role="tablist">
      {([['side', 'Side', sidePicks.length], ['daily', 'Daily', dailyCount]] as const).map(([key, label, n]) => (
        <button
          key={key}
          type="button"
          role="tab"
          aria-selected={otherTab === key}
          data-testid={`other-tab-${key}`}
          onClick={() => setOtherTab(key)}
          className={`-mb-px border-b-2 px-4 py-2 text-sm font-semibold ${otherTab === key ? 'border-brand-500 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          {label}{n > 0 ? ` · ${n}` : ''}
        </button>
      ))}
    </div>
  );

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
        <WorkCyclesCard date={selectedDate} tasks={[...core, ...bonus]} otherTasks={other} plan={effectiveDailyPlan?.cycle_plan ?? null} />
        <OtherTasksCard
          items={other}
          renderItem={renderSortable}
          onReorder={handleReorder}
          onAdd={openAdd}
          onQuickAddSide={handleAddSideQuest}
        />
      </div>

      <MainQuestModal
        isOpen={modalState.showModal && modalState.modalType === 'main'}
        onClose={() => setShowModal(false)}
        tasks={effectiveWeeklyTasks}
        selectedTasks={selectedTasks}
        onTaskToggle={(taskId) => handleTaskToggle(taskId, 'main')}
        onSave={saveFocus}
        tabs={focusTabs}
        isLoading={modalLoading}
        savingLoading={savingLoading}
        completedTodayCount={groupedItems.MAIN_QUEST.filter(item => item.status === 'DONE').length}
      />

      <WorkQuestModal
        isOpen={modalState.showModal && modalState.modalType === 'work'}
        onClose={() => setShowModal(false)}
        selectedTasks={selectedWorkQuests}
        onTaskToggle={(taskId) => handleTaskToggle(taskId, 'work')}
        onSave={saveFocus}
        tabs={focusTabs}
        isLoading={modalLoading}
        savingLoading={savingLoading}
        completedTodayCount={groupedItems.WORK_QUEST.filter(item => item.status === 'DONE').length}
      />

      <div hidden={otherTab !== 'daily'}>
        <DailyQuestModal
          isOpen={otherTab !== null}
          onClose={closeOther}
          tasks={dailyQuests}
          selectedTasks={selectedDailyQuestIds}
          onTaskToggle={handleDailyQuestToggle}
          onSave={saveOther}
          tabs={otherTabs}
          isLoading={isLoadingDailyQuests}
          savingLoading={isSavingDailyQuests || savingLoading}
        />
      </div>

      <div hidden={otherTab !== 'side'}>
        <SideQuestModal
          isOpen={otherTab !== null}
          onClose={closeOther}
          onSave={saveOther}
          onSelectionChange={setSidePicks}
          tabs={otherTabs}
          selectedCount={existingSideQuestIds.length}
          completedTodayCount={groupedItems.SIDE_QUEST.filter(item => item.status === 'DONE').length}
          existingSideQuests={existingSideQuestIds}
        />
      </div>
    </div>
  );
};

export default DailySyncClient;
