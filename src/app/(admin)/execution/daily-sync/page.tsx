"use client";
import React, { useState, useEffect } from "react";

import DailySyncSkeleton from '@/components/ui/skeleton/DailySyncSkeleton';
import { useWeekManagement, useTimerManagement, useDailyPlanManagement, useGlobalTimer } from './hooks';
import { WeekSelector, DaySelector, BrainDumpSection, SideQuestSection, MainQuestModal, ActivityLog, PomodoroTimer } from './components';
import { groupItemsByType } from './utils/groupItemsByType';
import { setDailyPlan } from './actions/dailyPlanActions';
import { getWeekDates } from '@/lib/dateUtils';

// Daily Sync Client Component (merged from DailySyncClient.tsx)
function DailySyncClient({ 
  year, 
  weekNumber, 
  selectedDate, 
  onSetActiveTask, 
  dailyPlan, 
  setDailyPlanState, 
  setDailyPlanAction, 
  loading, 
  refreshSessionKey, 
  forceRefreshTaskId 
}: {
  year: number;
  quarter: number;
  weekNumber: number;
  selectedDate: string;
  onSetActiveTask?: (task: { id: string; title: string; item_type: string; focus_duration?: number }) => void;
  dailyPlan: any;
  setDailyPlanState: (plan: any) => void;
  setDailyPlanAction?: typeof setDailyPlan;
  loading: boolean;
  refreshSessionKey?: Record<string, number>;
  forceRefreshTaskId?: string | null;
}) {
  const {
    dailyPlan: hookDailyPlan,
    weeklyTasks: hookWeeklyTasks,
    completedSessions,
    loading: hookLoading,
    selectedTasks,
    showModal,
    setShowModal,
    modalLoading,
    handleOpenModal,
    handleTaskToggle,
    handleSaveSelection,
    handleStatusChange,
    handleAddSideQuest,
    handleTargetChange,
    handleFocusDurationChange
  } = useDailyPlanManagement(year, weekNumber, selectedDate);

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

  return (
    <div className="mx-auto relative">
      <div className="flex flex-col gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <SideQuestSection
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
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <SideQuestSection
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
      </div>
      
      <MainQuestModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        tasks={effectiveWeeklyTasks}
        selectedTasks={selectedTasks}
        onTaskToggle={handleTaskToggle}
        onSave={handleSaveSelection}
        isLoading={modalLoading}
      />
    </div>
  );
}

function DailySyncContent() {
  const {
    year,
    quarter,
    currentWeek,
    weekCalculations,
    isWeekDropdownOpen,
    setIsWeekDropdownOpen,
    getDefaultDayIndexForWeek,
    goPrevWeek,
    goNextWeek,
    handleSelectWeek
  } = useWeekManagement();

  const weekDates = getWeekDates(currentWeek);
  const [selectedDayIdx, setSelectedDayIdx] = useState(() => getDefaultDayIndexForWeek(currentWeek));
  const selectedDate = weekDates[selectedDayIdx];
  const selectedDateStr = selectedDate.toISOString().slice(0, 10);

  const { displayWeek, totalWeeks } = weekCalculations;

  const { loading, initialLoading, dailyPlan, mutate } = useDailyPlanManagement(year, displayWeek, selectedDateStr);

  const { handleSetActiveTask, activityLogRefreshKey } = useTimerManagement(selectedDateStr);
  
  // Global timer - hanya ada 1 interval untuk seluruh aplikasi
  useGlobalTimer();

  useEffect(() => {
    setSelectedDayIdx(getDefaultDayIndexForWeek(currentWeek));
  }, [currentWeek]);

  const handleGoPrevWeek = () => {
    const defaultDayIdx = goPrevWeek();
    setSelectedDayIdx(defaultDayIdx);
  };

  const handleGoNextWeek = () => {
    const defaultDayIdx = goNextWeek();
    setSelectedDayIdx(defaultDayIdx);
  };

  const handleSelectWeekWithDay = (weekIdx: number) => {
    const defaultDayIdx = handleSelectWeek(weekIdx);
    setSelectedDayIdx(defaultDayIdx);
  };

  return (
    <div className="mx-auto">
      {initialLoading ? (
        <DailySyncSkeleton />
      ) : (
        <>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-3 md:mb-6 gap-4">
            <WeekSelector
              displayWeek={displayWeek}
              totalWeeks={totalWeeks}
              isWeekDropdownOpen={isWeekDropdownOpen}
              setIsWeekDropdownOpen={setIsWeekDropdownOpen}
              handleSelectWeek={handleSelectWeekWithDay}
              goPrevWeek={handleGoPrevWeek}
              goNextWeek={handleGoNextWeek}
            />
            <DaySelector
              weekDates={weekDates}
              selectedDayIdx={selectedDayIdx}
              setSelectedDayIdx={setSelectedDayIdx}
            />
          </div>
          {loading ? (
            <DailySyncSkeleton />
          ) : (
            <>
              <div className="block md:hidden mb-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 relative">
                  <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-gray-100">Pomodoro Timer</h3>
                  <PomodoroTimer />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <DailySyncClient
                    year={year}
                    quarter={quarter}
                    weekNumber={displayWeek}
                    selectedDate={selectedDateStr}
                    onSetActiveTask={handleSetActiveTask}
                    dailyPlan={dailyPlan}
                    setDailyPlanState={mutate}
                    setDailyPlanAction={setDailyPlan}
                    loading={loading}
                    refreshSessionKey={{}}
                    forceRefreshTaskId={null}
                  />
                </div>
                <div className="flex flex-col gap-6">
                  <div className="hidden md:block">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 relative">
                      <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-gray-100">Pomodoro Timer</h3>
                      <PomodoroTimer />
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 h-full min-h-[285px] flex flex-col">
                    <h3 className="font-bold text-lg mb-3 text-gray-900 dark:text-gray-100">Log Aktivitas Hari Ini</h3>
                    <ActivityLog date={selectedDateStr} refreshKey={activityLogRefreshKey} />
                  </div>
                </div>
              </div>
              <BrainDumpSection />
            </>
          )}
        </>
      )}
    </div>
  );
}

export default function DailySyncPage() {
  return <DailySyncContent />;
}