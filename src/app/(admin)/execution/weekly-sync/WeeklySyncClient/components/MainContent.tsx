import React from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { WeekSelector } from './WeekSelector';
import WeeklySyncTable from '../../WeeklySyncTable/WeeklySyncTable';
import ToDontListCard from '../../ToDontList/ToDontListCard';
import RefuelSyncCard from '../../RefuelSync/RefuelSyncCard';

// Memoized components
const MemoizedWeeklySyncTable = React.memo(WeeklySyncTable);
const MemoizedToDontListCard = React.memo(ToDontListCard);
const MemoizedWeekSelector = React.memo(WeekSelector);

import type { MainContentProps } from '../types';

export function MainContent({
  displayWeek,
  totalWeeks,
  isWeekDropdownOpen,
  setIsWeekDropdownOpen,
  handleSelectWeek,
  goPrevWeek,
  goNextWeek,
  quarter,
  year,
  mobileOptimizedGoals,
  goalsValidating,
  goalsError,
  processedProgress,
  processedRules,
  toDontListLoading,
  handleRefreshGoals,
  handleRefreshToDontList,
  dataSource
}: MainContentProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab') === 'refuel' ? 'refuel' : 'weekly';

  // Tulis ?tab= tanpa menghapus param lain (mis. ?q=).
  const setTab = (next: 'weekly' | 'refuel') => {
    const params = new URLSearchParams(searchParams.toString());
    if (next === 'refuel') params.set('tab', 'refuel');
    else params.delete('tab');
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  return (
    <div className="container mx-auto py-8 pt-0">
      {/* Header: Judul halaman kiri, navigasi minggu kanan */}
      <div className="md:flex justify-end mb-6">
        {/* <div>
           <h2 className="text-xl font-bold">
            Weekly Sync
            Weekly Sync Update 1.0 {loadingTime !== null ? ` (${loadingTime}s)` : ''}
          </h2> */}
          {/* {dataSource && (
            <div className={`text-xs font-medium mt-1 ${
              dataSource === 'ULTRA FAST RPC' 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-orange-600 dark:text-orange-400'
            }`}>
              📊 Data Source: {dataSource}
              {dataSource === 'ULTRA FAST RPC' && ' ⚡ (Optimized)'}
              {dataSource === 'WORKING FUNCTIONS' && ' 🔄 (Fallback)'}
              <button 
                onClick={() => window.location.reload()}
                className="ml-2 px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
              >
                🔄 Force Refresh
              </button>
            </div>
          )} 
        </div> */}
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

      {/* Tab bar */}
      <div className="mb-6 flex gap-1 border-b border-gray-200 dark:border-gray-800" role="tablist">
        {([['weekly', 'Weekly Sync'], ['refuel', 'Refuel Sync']] as const).map(([key, label]) => (
          <button
            key={key}
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-semibold transition-colors ${
              tab === key ? 'border-brand-500 text-brand-500' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'refuel' ? (
        <RefuelSyncCard year={year} quarter={quarter} weekNumber={displayWeek} goals={mobileOptimizedGoals} />
      ) : (
        <>
      {/* Kolom 3 Quest Week */}
      <MemoizedWeeklySyncTable
        year={year}
        quarter={quarter}
        weekNumber={displayWeek}
        goals={mobileOptimizedGoals}
        isValidating={goalsValidating}
        hasError={goalsError}
        goalProgress={processedProgress}
        onRefreshGoals={handleRefreshGoals}
      />
      
      {/* === To Don't List Card === */}
      <MemoizedToDontListCard
        year={year}
        quarter={quarter}
        weekNumber={displayWeek}
        rules={processedRules}
        loading={toDontListLoading}
        onRefresh={handleRefreshToDontList}
      />
        </>
      )}
    </div>
  );
}
