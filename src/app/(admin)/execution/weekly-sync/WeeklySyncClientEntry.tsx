"use client";
import { useWeek } from '@/hooks/useWeek';
import WeeklyGoalsTable from './WeeklyGoalsTable';
import WeeklySyncClient from './WeeklySyncClient';

export default function WeeklySyncClientEntry() {
  const { year, weekNumber } = useWeek();

  return (
    <div className="container mx-auto py-8 pt-0">
      <WeeklyGoalsTable year={year} weekNumber={weekNumber} />
      <WeeklySyncClient />
    </div>
  );
} 