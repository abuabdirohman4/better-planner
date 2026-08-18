"use client";

import { useMemo, useState } from "react";
import { useHabits } from "@/app/(admin)/habits/hooks/useHabits";
import { useHabitCompletions } from "@/app/(admin)/habits/hooks/useHabitCompletions";
import { useMonthlyStats } from "@/app/(admin)/habits/hooks/useMonthlyStats";
import TodayHabitList from "@/components/habits/TodayHabitList";
import HabitFormModal from "@/components/habits/HabitFormModal";

export default function TodayHabitsPage() {
  // Get today's date in WIB (Asia/Jakarta)
  const todayDate = useMemo(
    () =>
      new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" }),
    []
  );

  // Day being viewed/edited (bp-uv4). Defaults to today; past days editable, future blocked.
  const [selectedDate, setSelectedDate] = useState(todayDate);
  const isToday = selectedDate === todayDate;
  const shiftDay = (delta: number) => {
    const d = new Date(selectedDate + "T00:00:00");
    d.setDate(d.getDate() + delta);
    const next = d.toLocaleDateString("en-CA");
    if (next <= todayDate) setSelectedDate(next);
  };

  const selYear = parseInt(selectedDate.slice(0, 4));
  const selMonth = parseInt(selectedDate.slice(5, 7));

  const [isModalOpen, setIsModalOpen] = useState(false);

  const { habits, isLoading: habitsLoading, addHabit, updateHabit } = useHabits();
  const {
    completions,
    isCompleted,
    getCount,
    toggleCompletion,
    adjustCompletion,
    isLoading: completionsLoading,
  } = useHabitCompletions(selYear, selMonth);

  const monthlyStats = useMonthlyStats(habits, completions, selYear, selMonth);

  const isLoading = habitsLoading || completionsLoading;

  // Stats for the header
  const todayCompleted = habits.filter((h) => isCompleted(h.id, selectedDate, h.daily_target)).length;
  const totalHabits = habits.length;
  const completionPct =
    totalHabits > 0 ? Math.round((todayCompleted / totalHabits) * 100) : 0;

  // Format display date: "Senin, 13 Apr 2026"
  const displayDate = new Date(selectedDate + "T00:00:00").toLocaleDateString(
    "id-ID",
    { weekday: "long", day: "numeric", month: "short", year: "numeric" }
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Habits
          </h1>
          <div className="flex items-center gap-3">
            {/* Day navigator */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => shiftDay(-1)}
                aria-label="Previous day"
                data-testid="habit-day-prev"
                className="flex items-center justify-center w-8 h-8 rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="text-sm text-gray-500 dark:text-gray-400 min-w-[130px] text-center" data-testid="habit-day-label">
                {displayDate}
              </span>
              <button
                type="button"
                onClick={() => shiftDay(1)}
                disabled={isToday}
                aria-label="Next day"
                data-testid="habit-day-next"
                className="flex items-center justify-center w-8 h-8 rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              {!isToday && (
                <button
                  type="button"
                  onClick={() => setSelectedDate(todayDate)}
                  data-testid="habit-day-today"
                  className="text-xs px-2 py-1 rounded-md bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/60"
                >
                  Hari Ini
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition-colors"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Add Habit
            </button>
          </div>
        </div>

        {/* Stats bar */}
        {!isLoading && totalHabits > 0 && (
          <div className="mt-3 flex items-center gap-3">
            <span className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
              {todayCompleted} of {totalHabits} habits done{isToday ? " today" : ""}
            </span>
            <div className="flex-1 flex items-center gap-2">
              {/* Progress bar */}
              <div className="flex-1 h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                <div
                  className="h-full rounded-full bg-green-500 transition-all duration-300"
                  style={{ width: `${completionPct}%` }}
                />
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-10 text-right">
                {completionPct}%
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-28" />
              {[1, 2].map((j) => (
                <div
                  key={j}
                  className="h-16 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                />
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Habit list */}
      {!isLoading && (
        <TodayHabitList
          habits={habits}
          isCompleted={isCompleted}
          getCount={getCount}
          onToggle={toggleCompletion}
          onAdjust={adjustCompletion}
          monthlyStats={monthlyStats}
          selectedDate={selectedDate}
        />
      )}

      <HabitFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={addHabit}
        onUpdate={updateHabit}
      />
    </div>
  );
}
