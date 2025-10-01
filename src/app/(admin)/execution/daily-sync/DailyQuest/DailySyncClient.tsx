"use client";
import React, { useState } from "react";

import DailySyncSkeleton from '@/components/ui/skeleton/DailySyncSkeleton';
import { useDailyPlanManagement } from './hooks/useDailyPlanManagement';
import { useWorkQuests } from '@/app/(admin)/quests/work-quests/hooks/useWorkQuests';
import MainQuestListSection from './MainQuestListSection';
import SideQuestListSection from './SideQuestListSection';
import WorkQuestListSection from './WorkQuestListSection';
import MainQuestModal from './components/MainQuestModal';
import WorkQuestModal from './components/WorkQuestModal';
import { groupItemsByType } from "./utils/groupItemsByType";
import { DailySyncClientProps } from './types';
import CollapsibleCard from '@/components/common/CollapsibleCard';
import { useUIPreferencesStore } from '@/stores/uiPreferencesStore';

const DailySyncClient: React.FC<DailySyncClientProps> = ({ 
  year, 
  quarter, 
  weekNumber, 
  selectedDate, 
  onSetActiveTask, 
  dailyPlan, 
  setDailyPlanState, 
  setDailyPlanAction, 
  loading, 
  refreshSessionKey, 
  forceRefreshTaskId 
}) => {
  const { cardCollapsed, toggleCardCollapsed } = useUIPreferencesStore();
  
  const {
    dailyPlan: hookDailyPlan,
    weeklyTasks: hookWeeklyTasks,
    completedSessions,
    loading: hookLoading,
    selectedTasks,
    showModal,
    setShowModal,
    modalLoading,
    savingLoading,
    handleOpenModal,
    handleTaskToggle,
    handleSaveSelection,
    handleStatusChange,
    handleAddSideQuest,
    handleTargetChange,
    handleFocusDurationChange
  } = useDailyPlanManagement(year, weekNumber, selectedDate);

  // Get work quests data
  const { workQuests } = useWorkQuests();

  // Work Quest state
  const [showWorkQuestModal, setShowWorkQuestModal] = useState(false);
  const [selectedWorkQuests, setSelectedWorkQuests] = useState<string[]>([]);
  const [workQuestModalLoading, setWorkQuestModalLoading] = useState(false);
  const [workQuestSavingLoading, setWorkQuestSavingLoading] = useState(false);

  // Use hook data
  const effectiveDailyPlan = hookDailyPlan || dailyPlan;
  const effectiveWeeklyTasks = hookWeeklyTasks;
  const effectiveLoading = hookLoading || loading;

  if (effectiveLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] py-16">
        <DailySyncSkeleton />
      </div>
    );
  }

  const groupedItems = groupItemsByType(effectiveDailyPlan?.daily_plan_items);

  // Work Quest handlers
  const handleOpenWorkQuestModal = () => {
    setShowWorkQuestModal(true);
  };

  const handleWorkQuestToggle = (taskId: string) => {
    setSelectedWorkQuests(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  const handleWorkQuestSave = async () => {
    setWorkQuestSavingLoading(true);
    try {
      // Convert selected work quest task IDs to daily plan items with title
      const workQuestItems = selectedWorkQuests.map(taskId => {
        // Find the task in work quests
        let taskTitle = `Work Quest ${taskId}`;
        let questTitle = '';
        
        for (const quest of workQuests) {
          const task = quest.tasks?.find(t => t.id === taskId);
          if (task) {
            taskTitle = task.title;
            questTitle = quest.title;
            break;
          }
        }
        
        return {
          item_id: taskId,
          item_type: 'WORK_QUEST',
          title: questTitle ? `${questTitle} - ${taskTitle}` : taskTitle
        };
      });

      // Preserve existing main quests and side quests
      const existingMainQuests = effectiveDailyPlan?.daily_plan_items?.filter((item: any) => 
        item.item_type === 'MAIN_QUEST'
      ) || [];
      
      const existingSideQuests = effectiveDailyPlan?.daily_plan_items?.filter((item: any) => 
        item.item_type === 'SIDE_QUEST'
      ) || [];

      // Combine all items: existing main quests + existing side quests + new work quests
      const allItems = [
        ...existingMainQuests.map((item: any) => ({
          item_id: item.item_id,
          item_type: item.item_type,
          title: item.title
        })),
        ...existingSideQuests.map((item: any) => ({
          item_id: item.item_id,
          item_type: item.item_type,
          title: item.title
        })),
        ...workQuestItems
      ];

      if (allItems.length === 0) return;
      
      // Save all items to daily plan
      if (!setDailyPlanAction) {
        throw new Error('setDailyPlanAction is not available');
      }
      await setDailyPlanAction(selectedDate, allItems);
      
      // Close modal and reset selection
      setShowWorkQuestModal(false);
      setSelectedWorkQuests([]);
    } catch (error) {
      console.error('Failed to save work quest selection:', error);
    } finally {
      setWorkQuestSavingLoading(false);
    }
  };

  return (
    <div className="mx-auto relative">
      <div className="flex flex-col gap-6">
        <CollapsibleCard
          isCollapsed={cardCollapsed.mainQuest}
          onToggle={() => toggleCardCollapsed('mainQuest')}
          className="main-quest-card"
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 pt-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <MainQuestListSection
              title="Main Quest"
              items={groupedItems['MAIN_QUEST']}
              onStatusChange={handleStatusChange}
              onSelectTasks={handleOpenModal}
              onSetActiveTask={onSetActiveTask}
              selectedDate={selectedDate}
              onTargetChange={handleTargetChange}
              onFocusDurationChange={handleFocusDurationChange}
              completedSessions={completedSessions}
              refreshSessionKey={refreshSessionKey}
              forceRefreshTaskId={forceRefreshTaskId}
              showAddQuestButton={true}
            />
          </div>
        </CollapsibleCard>
        
        <CollapsibleCard
          isCollapsed={cardCollapsed.sideQuest}
          onToggle={() => toggleCardCollapsed('sideQuest')}
          className="side-quest-card"
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 pt-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <SideQuestListSection
              title="Side Quest"
              items={groupedItems['SIDE_QUEST']}
              onStatusChange={handleStatusChange}
              onAddSideQuest={handleAddSideQuest}
              onSetActiveTask={onSetActiveTask}
              selectedDate={selectedDate}
              onTargetChange={handleTargetChange}
              onFocusDurationChange={handleFocusDurationChange}
              completedSessions={completedSessions}
              refreshSessionKey={refreshSessionKey}
              forceRefreshTaskId={forceRefreshTaskId}
            />
          </div>
        </CollapsibleCard>

        <CollapsibleCard
          isCollapsed={cardCollapsed.workQuest}
          onToggle={() => toggleCardCollapsed('workQuest')}
          className="work-quest-card"
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 pt-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <WorkQuestListSection
              title="Work Quest"
              items={groupedItems['WORK_QUEST'] || []}
              onStatusChange={handleStatusChange}
              onSelectTasks={handleOpenWorkQuestModal}
              onSetActiveTask={onSetActiveTask}
              selectedDate={selectedDate}
              onTargetChange={handleTargetChange}
              onFocusDurationChange={handleFocusDurationChange}
              completedSessions={completedSessions}
              refreshSessionKey={refreshSessionKey}
              forceRefreshTaskId={forceRefreshTaskId}
              showAddQuestButton={true}
            />
          </div>
        </CollapsibleCard>
      </div>
      
      <MainQuestModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        tasks={effectiveWeeklyTasks}
        selectedTasks={selectedTasks}
        onTaskToggle={handleTaskToggle}
        onSave={handleSaveSelection}
        isLoading={modalLoading}
        savingLoading={savingLoading}
        completedTodayCount={groupedItems.MAIN_QUEST?.filter((item: any) => item.status === 'DONE').length || 0}
      />

      <WorkQuestModal
        isOpen={showWorkQuestModal}
        onClose={() => setShowWorkQuestModal(false)}
        selectedTasks={selectedWorkQuests}
        onTaskToggle={handleWorkQuestToggle}
        onSave={handleWorkQuestSave}
        isLoading={workQuestModalLoading}
        savingLoading={workQuestSavingLoading}
      />
    </div>
  );
};

export default DailySyncClient;
