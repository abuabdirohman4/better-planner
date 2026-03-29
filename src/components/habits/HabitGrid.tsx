import React, { useState, useCallback, useEffect, useRef } from "react";
import type { Habit, HabitCategory, HabitStats, MonthlyStats } from "@/types/habit";
import HabitGridRow from "@/components/habits/HabitGridRow";
import { getWeekOfYear, getQuarterFromWeek } from "@/lib/quarterUtils";

interface HabitGridProps {
  habits: Habit[];
  daysInMonth: number;
  year: number;
  month: number;
  todayDate: string;
  isCompleted: (habitId: string, date: string) => boolean;
  onToggle: (habitId: string, date: string) => void;
  monthlyStats: MonthlyStats;
  onEditHabit?: (habit: Habit) => void;
  onDeleteHabit?: (habit: Habit) => void;
}

const CATEGORY_ORDER: HabitCategory[] = ["spiritual", "kesehatan", "karir", "other"];

const CATEGORY_LABELS: Record<string, string> = {
  spiritual: "Spiritual",
  kesehatan: "Kesehatan",
  karir: "Karir",
  keuangan: "Keuangan",
  relasi: "Relasi",
  petualangan: "Petualangan",
  kontribusi: "Kontribusi",
  other: "Other",
};

function getStatsForHabit(habitId: string, perHabit: HabitStats[]): HabitStats {
  return (
    perHabit.find((s) => s.habit_id === habitId) ?? {
      habit_id: habitId,
      completed: 0,
      goal: 0,
      percentage: 0,
      current_streak: 0,
      best_streak: 0,
    }
  );
}

export interface WeekGroup {
  weekInQuarter: number;
  quarter: number;
  days: number[];
  yearWeek: number;
}

function buildWeekGroups(year: number, month: number, daysInMonth: number): WeekGroup[] {
  const paddedMonth = String(month).padStart(2, "0");
  const weekMap = new Map<number, WeekGroup>();
  const weekOrder: number[] = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const paddedDay = String(day).padStart(2, "0");
    const date = new Date(`${year}-${paddedMonth}-${paddedDay}T12:00:00`);
    const yearWeek = getWeekOfYear(date);
    const quarter = getQuarterFromWeek(yearWeek);
    const quarterStartWeek = (quarter - 1) * 13 + 1;
    const weekInQuarter = yearWeek - quarterStartWeek + 1;

    if (!weekMap.has(yearWeek)) {
      weekMap.set(yearWeek, { yearWeek, weekInQuarter, quarter, days: [] });
      weekOrder.push(yearWeek);
    }
    weekMap.get(yearWeek)!.days.push(day);
  }

  return weekOrder.map((yw) => weekMap.get(yw)!);
}

const DAY_ABBR = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export default function HabitGrid({
  habits,
  daysInMonth,
  year,
  month,
  todayDate,
  isCompleted,
  onToggle,
  monthlyStats,
  onEditHabit,
  onDeleteHabit,
}: HabitGridProps) {
  const paddedMonth = String(month).padStart(2, "0");
  const weekGroups = buildWeekGroups(year, month, daysInMonth);

  // localStorage key scoped to year-month so each month has independent state
  const storageKey = `habit-grid-collapsed-weeks-${year}-${paddedMonth}`;

  const getInitialCollapsed = (): Set<number> => {
    if (typeof window === "undefined") return new Set<number>();
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const arr: number[] = JSON.parse(saved);
        return new Set(arr);
      }
    } catch {
      // ignore
    }
    return new Set<number>();
  };

  const [collapsedWeeks, setCollapsedWeeks] = useState<Set<number>>(getInitialCollapsed);
  const isInitialLoad = useRef(true);

  // Persist to localStorage whenever collapsedWeeks changes (skip first render)
  useEffect(() => {
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      return;
    }
    try {
      localStorage.setItem(storageKey, JSON.stringify(Array.from(collapsedWeeks)));
    } catch {
      // ignore
    }
  }, [collapsedWeeks, storageKey]);

  // Reset collapsed state when month changes
  useEffect(() => {
    isInitialLoad.current = true;
    setCollapsedWeeks(getInitialCollapsed());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  const toggleWeek = useCallback((yearWeek: number) => {
    setCollapsedWeeks((prev) => {
      const next = new Set(prev);
      if (next.has(yearWeek)) next.delete(yearWeek);
      else next.add(yearWeek);
      return next;
    });
  }, []);

  // Group habits by category
  const habitsByCategory = new Map<string, Habit[]>();
  for (const habit of habits) {
    if (!habitsByCategory.has(habit.category)) habitsByCategory.set(habit.category, []);
    habitsByCategory.get(habit.category)!.push(habit);
  }

  const allCategories = new Set(habits.map((h) => h.category));
  const orderedCategories: string[] = [
    ...CATEGORY_ORDER.filter((c) => allCategories.has(c)),
    ...[...allCategories].filter((c) => !CATEGORY_ORDER.includes(c as HabitCategory)),
  ];

  // Total columns = 1 (name) + sum of each week's colspan + 1 (progress)
  // Collapsed week = 1 col, expanded week = N day cols
  const totalCols =
    1 +
    weekGroups.reduce((sum, wg) => sum + (collapsedWeeks.has(wg.yearWeek) ? 1 : wg.days.length), 0) +
    1;

  return (
    <div className="overflow-x-auto w-full">
      <table className="border-collapse w-full" style={{ tableLayout: "auto" }}>
        <thead>
          {/* Row 1: week group headers */}
          <tr className="border-b border-gray-200 dark:border-gray-700">
            {/* Habit Name — rowSpan=2 */}
            <th
              rowSpan={2}
              className="sticky left-0 z-20 bg-white dark:bg-gray-900 min-w-[200px] px-3 py-3 border-r border-gray-200 dark:border-gray-700 border-b-2 text-center text-sm font-bold text-gray-700 dark:text-gray-300 align-middle"
            >
              Habit Name
            </th>

            {weekGroups.map(({ yearWeek, weekInQuarter, days: weekDays }) => {
              const isCollapsed = collapsedWeeks.has(yearWeek);
              return (
                <th
                  key={yearWeek}
                  colSpan={isCollapsed ? 1 : weekDays.length}
                  className="text-center py-2 border-r border-gray-200 dark:border-gray-700 last:border-r-0"
                >
                  <button
                    type="button"
                    onClick={() => toggleWeek(yearWeek)}
                    className="flex items-center justify-center gap-1 mx-auto group/week px-1 w-full"
                    title={isCollapsed ? `Expand Week ${weekInQuarter}` : `Collapse Week ${weekInQuarter}`}
                  >
                    {isCollapsed ? (
                      <span className="flex items-center gap-1">
                        <svg className="w-3 h-3 text-gray-400 group-hover/week:text-green-500 transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                        </svg>
                        <span className="text-[10px] font-bold text-gray-400 group-hover/week:text-green-500 uppercase tracking-wide transition-colors whitespace-nowrap">
                          W{weekInQuarter}
                        </span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <span className="text-xs font-bold text-green-600 dark:text-green-400 uppercase tracking-widest whitespace-nowrap">
                          {weekDays.length === 1 ? "W" : "Week"} {weekInQuarter}
                        </span>
                        <svg className="w-3 h-3 text-gray-300 group-hover/week:text-green-500 transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </span>
                    )}
                  </button>
                </th>
              );
            })}

            {/* Progress — rowSpan=2 */}
            <th
              rowSpan={2}
              className="sticky right-0 z-20 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 border-b-2 px-3 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap min-w-[160px] align-middle"
            >
              Progress
            </th>
          </tr>

          {/* Row 2: day headers for expanded weeks; empty header for collapsed weeks */}
          <tr className="border-b-2 border-gray-200 dark:border-gray-700">
            {weekGroups.map(({ yearWeek, weekInQuarter, days: weekDays }) => {
              const isCollapsed = collapsedWeeks.has(yearWeek);

              if (isCollapsed) {
                // Single empty header cell for the collapsed summary column
                return (
                  <th key={yearWeek} className="min-w-[70px] p-0" />
                );
              }

              // Expanded: render individual day header cells
              return weekDays.map((day) => {
                const paddedDay = String(day).padStart(2, "0");
                const dateStr = `${year}-${paddedMonth}-${paddedDay}`;
                const isToday = dateStr === todayDate;
                const dayOfWeek = new Date(`${year}-${paddedMonth}-${paddedDay}T12:00:00`).getDay();
                const dayAbbr = DAY_ABBR[dayOfWeek];

                return (
                  <th
                    key={day}
                    className={`min-w-[40px] p-0 text-center ${isToday ? "bg-green-50 dark:bg-green-950/30" : ""}`}
                  >
                    <div className="flex flex-col items-center py-1.5 gap-0.5">
                      <span className={`text-[10px] font-medium ${isToday ? "text-green-600 dark:text-green-400" : "text-gray-400 dark:text-gray-500"}`}>
                        {dayAbbr}
                      </span>
                      <span className={`text-xs font-semibold ${isToday ? "text-green-600 dark:text-green-400" : "text-gray-600 dark:text-gray-400"}`}>
                        {day}
                      </span>
                    </div>
                  </th>
                );
              });
            })}
          </tr>
        </thead>

        <tbody>
          {orderedCategories.map((category) => {
            const categoryHabits = habitsByCategory.get(category) ?? [];
            if (categoryHabits.length === 0) return null;
            const label = CATEGORY_LABELS[category] ?? category;

            return (
              <React.Fragment key={category}>
                <tr className="bg-gray-50 dark:bg-gray-800/50">
                  <td colSpan={totalCols} className="px-3 py-1.5 sticky left-0">
                    <span className="text-sm ml-3 font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {label}
                    </span>
                  </td>
                </tr>

                {categoryHabits.map((habit) => (
                  <HabitGridRow
                    key={habit.id}
                    habit={habit}
                    year={year}
                    month={month}
                    todayDate={todayDate}
                    isCompleted={isCompleted}
                    onToggle={onToggle}
                    stats={getStatsForHabit(habit.id, monthlyStats.per_habit)}
                    onEditHabit={onEditHabit}
                    onDeleteHabit={onDeleteHabit}
                    weekGroups={weekGroups}
                    collapsedWeeks={collapsedWeeks}
                    paddedMonth={paddedMonth}
                  />
                ))}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
