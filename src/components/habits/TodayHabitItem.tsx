"use client";

import { useState } from "react";
import type { Habit, HabitCompletion } from "@/types/habit";
import {
  completionTime,
  getTimeliness,
} from "@/app/(admin)/habits/actions/completions/logic";

interface TodayHabitItemProps {
  habit: Habit;
  isCompleted: boolean;
  count: number;
  currentStreak: number;
  onToggle: () => void;
  onAdjust: (delta: 1 | -1) => void;
  /** Baris yang dinilai untuk hari ini (yang pertama dikerjakan). Undefined = belum dicentang. */
  scoredCompletion?: HabitCompletion;
  onSetDoneAt?: (completionId: string, time: string | null) => Promise<void>;
}

function capitalizeFirst(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export default function TodayHabitItem({
  habit,
  isCompleted,
  count,
  currentStreak,
  onToggle,
  onAdjust,
  scoredCompletion,
  onSetDoneAt,
}: TodayHabitItemProps) {
  const [editingTime, setEditingTime] = useState<string | null>(null);

  // Penilaian tepat waktu (app-r02c). Habit tanpa deadline_time -> null, tampil persis seperti dulu.
  const timeliness = getTimeliness(habit, scoredCompletion);
  const doneTime = scoredCompletion ? completionTime(scoredCompletion) : null;
  const canEditTime = !!timeliness && !!scoredCompletion && !!onSetDoneAt;

  const saveTime = async (value: string) => {
    setEditingTime(null);
    if (!scoredCompletion || !onSetDoneAt || !value) return;
    await onSetDoneAt(scoredCompletion.id, value);
  };

  const displayTime = habit.target_time ? habit.target_time.slice(0, 5) : null;
  const subtitle = [capitalizeFirst(habit.category), displayTime]
    .filter(Boolean)
    .join(" • ");
  const target = habit.daily_target ?? 1;
  const isMulti = target > 1;
  // Binary habit: whole row is the toggle button. Multi: row is a div, +/- buttons control count.
  const Row = isMulti ? "div" : "button";
  const rowProps = isMulti ? {} : { type: "button" as const, onClick: onToggle };

  const isLate = timeliness === "late";

  return (
    <div className="relative">
    <Row
      {...rowProps}
      data-testid={`habit-item-${habit.id}`}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border transition-colors duration-150 text-left min-h-[64px] ${
        isCompleted
          ? isLate
            ? "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800"
            : "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800"
          : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
      }`}
    >
      {/* Checkbox */}
      <span
        className={`flex-shrink-0 w-8 h-8 rounded border-2 flex items-center justify-center transition-colors duration-150 ${
          isCompleted
            ? isLate
              ? "bg-amber-500 border-amber-500"
              : "bg-green-500 border-green-500"
            : "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-500"
        }`}
        aria-hidden="true"
      >
        {isCompleted && (
          <svg
            className="w-5 h-5 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M5 13l4 4L19 7"
            />
          </svg>
        )}
      </span>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`font-semibold text-sm leading-snug ${
              isCompleted
                ? isLate
                  ? "text-amber-700 dark:text-amber-400 line-through"
                  : "text-green-700 dark:text-green-400 line-through"
                : "text-gray-900 dark:text-gray-100"
            }`}
          >
            {habit.name}
          </span>
          {habit.tracking_type === "negative" && (
            <span title="Negative habit" aria-label="Negative habit">
              🚫
            </span>
          )}
        </div>
        {subtitle && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {subtitle}
          </p>
        )}
        {/* Penanda tepat waktu — hanya habit ber-deadline yang sudah dicentang */}
        {timeliness && (
          <p
            data-testid={`habit-timeliness-${habit.id}`}
            className={`text-xs mt-0.5 ${
              isLate
                ? "text-amber-600 dark:text-amber-400"
                : "text-green-600 dark:text-green-400"
            }`}
          >
            {doneTime} · {isLate ? `telat (batas ${habit.deadline_time})` : "tepat waktu"}
          </p>
        )}
      </div>

      {/* Multi-completion counter */}
      {isMulti && (
        <div className="flex-shrink-0 flex items-center gap-2">
          {target <= 10 && (
            <div className="hidden sm:flex items-center gap-1" aria-hidden="true">
              {Array.from({ length: target }, (_, i) => (
                <span
                  key={i}
                  className={`w-2 h-2 rounded-full ${
                    i < count ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"
                  }`}
                />
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={() => onAdjust(-1)}
            disabled={count === 0}
            aria-label="Kurangi"
            data-testid={`habit-dec-${habit.id}`}
            className="w-7 h-7 rounded-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            −
          </button>
          <span className="text-sm font-medium tabular-nums min-w-[36px] text-center text-gray-800 dark:text-gray-200">
            {count}/{target}
          </span>
          <button
            type="button"
            onClick={() => onAdjust(1)}
            disabled={count >= target}
            aria-label="Tambah"
            data-testid={`habit-inc-${habit.id}`}
            className="w-7 h-7 rounded-full border border-green-500 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            +
          </button>
        </div>
      )}

      {/* Streak */}
      {currentStreak > 0 && (
        <span className="flex-shrink-0 flex items-center gap-1 text-sm font-medium text-orange-500 dark:text-orange-400">
          🔥 {currentStreak}
        </span>
      )}
    </Row>

    {/* Koreksi jam dikerjakan (app-r02c). Di luar Row karena baris binary itu sendiri
        sebuah <button> — tombol di dalam tombol bukan HTML yang sah.
        Sengaja inline, bukan modal: satu input time, blur/change langsung simpan. */}
    {canEditTime && (
      editingTime === null ? (
        <button
          type="button"
          onClick={() => setEditingTime(doneTime ?? "")}
          data-testid={`habit-edit-time-${habit.id}`}
          className="absolute right-3 bottom-1.5 text-[11px] underline text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
        >
          ubah jam
        </button>
      ) : (
        <input
          type="time"
          autoFocus
          value={editingTime}
          onChange={(e) => setEditingTime(e.target.value)}
          onBlur={(e) => saveTime(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
            if (e.key === "Escape") setEditingTime(null);
          }}
          data-testid={`habit-time-input-${habit.id}`}
          className="absolute right-3 bottom-1.5 w-[104px] rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-1.5 py-0.5 text-xs text-gray-900 dark:text-gray-100"
        />
      )
    )}
    </div>
  );
}
