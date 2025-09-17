import React from 'react';
import { WeekSelector } from './WeekSelector';
import WeeklyGoalsTable from '../Table';
import ToDontListCard from '../ToDontListCard';

// Memoized components
const MemoizedWeeklyGoalsTable = React.memo(WeeklyGoalsTable);
const MemoizedToDontListCard = React.memo(ToDontListCard);
const MemoizedWeekSelector = React.memo(WeekSelector);

interface MainContentProps {
  // Week navigation
  displayWeek: number;
  totalWeeks: number;
  isWeekDropdownOpen: boolean;
  setIsWeekDropdownOpen: (value: boolean) => void;
  handleSelectWeek: (weekIdx: number) => void;
  goPrevWeek: () => void;
  goNextWeek: () => void;
  
  // Data
  year: number;
  mobileOptimizedGoals: any[];
  processedProgress: any;
  processedRules: any[];
  
  // Loading states
  toDontListLoading: boolean;
  
  // Handlers
  handleRefreshGoals: () => void;
  handleRefreshToDontList: () => void;
  
  // Loading time
  loadingTime: number | null;
}

export function MainContent({
  displayWeek,
  totalWeeks,
  isWeekDropdownOpen,
  setIsWeekDropdownOpen,
  handleSelectWeek,
  goPrevWeek,
  goNextWeek,
  year,
  mobileOptimizedGoals,
  processedProgress,
  processedRules,
  toDontListLoading,
  handleRefreshGoals,
  handleRefreshToDontList,
  loadingTime
}: MainContentProps) {

  return (
    <div className="container mx-auto py-8 pt-0">
      {/* Header: Judul halaman kiri, navigasi minggu kanan */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">
          Weekly Sync{loadingTime !== null ? ` (${loadingTime}s)` : ''}
        </h2>
        <MemoizedWeekSelector
          displayWeek={displayWeek}
          totalWeeks={totalWeeks}
          isWeekDropdownOpen={isWeekDropdownOpen}
          setIsWeekDropdownOpen={setIsWeekDropdownOpen}
          handleSelectWeek={handleSelectWeek}
          goPrevWeek={goPrevWeek}
          goNextWeek={goNextWeek}
        />
      </div>

      {/* Kolom 3 Goal Mingguan */}
      <MemoizedWeeklyGoalsTable
        year={year}
        weekNumber={displayWeek}
        goals={mobileOptimizedGoals}
        goalProgress={processedProgress}
        onRefreshGoals={handleRefreshGoals}
      />
      
      {/* === To Don't List Card === */}
      <MemoizedToDontListCard
        year={year}
        weekNumber={displayWeek}
        rules={processedRules}
        loading={toDontListLoading}
        onRefresh={handleRefreshToDontList}
      />
    </div>
  );
}
