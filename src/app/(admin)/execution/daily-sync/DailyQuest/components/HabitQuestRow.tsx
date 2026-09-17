"use client";

import Link from "next/link";
import type { Habit } from "@/types/habit";

interface HabitQuestRowProps {
  habit: Habit;
  isCompleted: boolean;
  currentStreak: number;
  /** Ticking marks the WHOLE day done (inserts daily_target rows), it is not +1. */
  onToggle: () => void;
  disabled?: boolean;
}

/**
 * A habit shown inside the Daily Quest list (app-cr6i). It writes to habit_completions,
 * never to daily_plan_items — hence no timer, no target sessions, no drag handle.
 */
export default function HabitQuestRow({
  habit,
  isCompleted,
  currentStreak,
  onToggle,
  disabled = false,
}: HabitQuestRowProps) {
  const target = habit.daily_target ?? 1;

  return (
    <div
      data-testid={`daily-quest-habit-${habit.id}`}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg border transition-colors ${
        isCompleted
          ? "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800"
          : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        disabled={disabled}
        aria-pressed={isCompleted}
        aria-label={`Tandai ${habit.name} selesai`}
        className={`flex-shrink-0 w-7 h-7 rounded border-2 flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
          isCompleted
            ? "bg-green-500 border-green-500"
            : "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-500 hover:border-green-400"
        }`}
      >
        {isCompleted && (
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span title="Kebiasaan" aria-label="Kebiasaan">
            🔁
          </span>
          <span
            className={`font-semibold text-sm leading-snug ${
              isCompleted
                ? "text-green-700 dark:text-green-400 line-through"
                : "text-gray-900 dark:text-gray-100"
            }`}
          >
            {habit.name}
          </span>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          Habit{target > 1 ? ` • ${target}x/hari` : ""}
          {" • "}
          <Link href="/habits/today" className="underline hover:text-gray-700 dark:hover:text-gray-300">
            atur
          </Link>
        </p>
      </div>

      {currentStreak > 0 && (
        <span className="flex-shrink-0 flex items-center gap-1 text-sm font-medium text-orange-500 dark:text-orange-400">
          🔥 {currentStreak}
        </span>
      )}
    </div>
  );
}
