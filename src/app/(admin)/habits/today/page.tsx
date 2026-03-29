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

  const todayYear = useMemo(() => parseInt(todayDate.slice(0, 4)), [todayDate]);
  const todayMonth = useMemo(() => parseInt(todayDate.slice(5, 7)), [todayDate]);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const { habits, isLoading: habitsLoading, addHabit, updateHabit } = useHabits();
  const {
    completions,
    isCompleted,
    toggleCompletion,
    isLoading: completionsLoading,
  } = useHabitCompletions(todayYear, todayMonth);

  const monthlyStats = useMonthlyStats(habits, completions, todayYear, todayMonth);

  const isLoading = habitsLoading || completionsLoading;

  // Stats for the header
  const todayCompleted = habits.filter((h) => isCompleted(h.id, todayDate)).length;
  const totalHabits = habits.length;
  const completionPct =
    totalHabits > 0 ? Math.round((todayCompleted / totalHabits) * 100) : 0;

  // Format display date: "March 28, 2026"
  const displayDate = new Date(todayDate + "T00:00:00").toLocaleDateString(
    "en-US",
    { year: "numeric", month: "long", day: "numeric" }
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Today&apos;s Habits
          </h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {displayDate}
            </span>
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
              {todayCompleted} of {totalHabits} habits done today
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
          onToggle={toggleCompletion}
          monthlyStats={monthlyStats}
          todayDate={todayDate}
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
