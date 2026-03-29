"use client";

import { useMemo, useState } from "react";
import { useHabits } from "@/app/(admin)/habits/hooks/useHabits";
import { useHabitCompletions } from "@/app/(admin)/habits/hooks/useHabitCompletions";
import { useMonthlyStats } from "@/app/(admin)/habits/hooks/useMonthlyStats";
import HabitGrid from "@/components/habits/HabitGrid";
import MonthNavigator from "@/components/habits/MonthNavigator";
import HabitFormModal from "@/components/habits/HabitFormModal";
import Spinner from "@/components/ui/spinner/Spinner";
import type { Habit } from "@/types/habit";

const PRODUCTIVITY_TIPS = [
  "\"Jangan fokus pada hasil akhir, fokuslah pada mempertahankan rantai kebiasaan (streak). Satu hari terlewat tidak masalah, jangan sampai dua hari.\"",
  "\"Konsistensi kecil setiap hari lebih berdampak daripada usaha besar yang sesekali. 1% lebih baik setiap hari.\"",
  "\"Habit stacking: gabungkan kebiasaan baru dengan kebiasaan yang sudah ada. Setelah shalat Subuh, langsung baca Al Qur'an.\"",
  "\"Lingkungan menentukan perilaku. Siapkan alat olahragamu malam sebelumnya supaya pagi lebih mudah memulai.\"",
  "\"Progress bukan tentang sempurna. 70% konsisten selama setahun jauh lebih baik dari 100% dua minggu lalu berhenti.\"",
];

function getWIBToday(): { year: number; month: number; dateStr: string } {
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
  const [year, month] = dateStr.split("-").map(Number);
  return { year, month, dateStr };
}

export default function HabitsMonthlyPage() {
  const { year: todayYear, month: todayMonth, dateStr: todayDate } = useMemo(
    () => getWIBToday(),
    []
  );

  const [year, setYear] = useState(todayYear);
  const [month, setMonth] = useState(todayMonth);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | undefined>(undefined);
  const [deletingHabit, setDeletingHabit] = useState<Habit | undefined>(undefined);
  const [isDeleting, setIsDeleting] = useState(false);

  const { habits, isLoading: habitsLoading, addHabit, updateHabit, archiveHabit, deleteHabit } = useHabits();
  const {
    completions,
    isLoading: completionsLoading,
    toggleCompletion,
    isCompleted,
  } = useHabitCompletions(year, month);

  const monthlyStats = useMonthlyStats(habits, completions, year, month);
  const daysInMonth = new Date(year, month, 0).getDate();
  const isLoading = habitsLoading || completionsLoading;

  // Pick a tip based on day of month so it rotates daily
  const tipIndex = useMemo(
    () => new Date().getDate() % PRODUCTIVITY_TIPS.length,
    []
  );

  const handleMonthChange = (newYear: number, newMonth: number) => {
    setYear(newYear);
    setMonth(newMonth);
  };

  const handleOpenEdit = (habit: Habit) => {
    setEditingHabit(habit);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingHabit(undefined);
  };

  const handleOpenDelete = (habit: Habit) => {
    setDeletingHabit(habit);
  };

  const handleConfirmDelete = async () => {
    if (!deletingHabit) return;
    setIsDeleting(true);
    try {
      await deleteHabit(deletingHabit.id);
    } finally {
      setIsDeleting(false);
      setDeletingHabit(undefined);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 min-h-screen">

      {/* ── PAGE HEADER ─────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

        {/* Left: Title block */}
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <svg className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth={2} />
              <line x1="16" y1="2" x2="16" y2="6" strokeWidth={2} strokeLinecap="round" />
              <line x1="8" y1="2" x2="8" y2="6" strokeWidth={2} strokeLinecap="round" />
              <line x1="3" y1="10" x2="21" y2="10" strokeWidth={2} />
            </svg>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Monthly Challenge
            </h1>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 ml-8">
            Consistency is the key to success.
          </p>
        </div>

        {/* Right: Stat cards */}
        <div className="flex justify-center items-center gap-3 flex-shrink-0">
          {/* Best Streak card */}
          <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm min-w-[140px]">
            <div className="w-9 h-9 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Best Streak</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100 leading-tight">
                {monthlyStats.best_streak} <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Days</span>
              </p>
            </div>
          </div>

          {/* Total Habits card */}
          <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm min-w-[120px]">
            <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Total Habits</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100 leading-tight">
                {habits.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── CONTROLS ROW: Month navigator + Add Habit ────────────────── */}
      <div className="flex items-center justify-between gap-3">
        <MonthNavigator year={year} month={month} onChange={handleMonthChange} />

        <button
          type="button"
          onClick={() => { setEditingHabit(undefined); setIsModalOpen(true); }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Habit
        </button>
      </div>

      {/* ── GRID ─────────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner size={40} colorClass="border-green-500" />
        </div>
      ) : habits.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
          <span className="text-4xl" aria-hidden="true">📋</span>
          <p className="text-gray-600 dark:text-gray-400 font-medium">No habits yet</p>
          <p className="text-sm text-gray-400 dark:text-gray-500">Add your first habit to start tracking.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-900 shadow-sm">
          <HabitGrid
            habits={habits}
            daysInMonth={daysInMonth}
            year={year}
            month={month}
            todayDate={todayDate}
            isCompleted={isCompleted}
            onToggle={toggleCompletion}
            monthlyStats={monthlyStats}
            onEditHabit={handleOpenEdit}
            onDeleteHabit={handleOpenDelete}
          />
        </div>
      )}

      {/* ── PRODUCTIVITY TIP ─────────────────────────────────────────── */}
      {!isLoading && (
        <div className="rounded-xl bg-green-900 dark:bg-green-950 p-5">
          <p className="text-[11px] font-bold text-green-400 uppercase tracking-widest mb-2">
            Productivity Tip
          </p>
          <p className="text-sm text-green-100 leading-relaxed">
            {PRODUCTIVITY_TIPS[tipIndex]}
          </p>
        </div>
      )}

      <HabitFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        habit={editingHabit}
        onAdd={addHabit}
        onUpdate={updateHabit}
        onArchive={archiveHabit}
      />

      {/* ── DELETE CONFIRMATION ───────────────────────────────────────── */}
      {deletingHabit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-sm">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Delete Habit
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-5">
              Are you sure you want to delete <span className="font-medium text-gray-900 dark:text-gray-100">&ldquo;{deletingHabit.name}&rdquo;</span>? This will also remove all completion history. This cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingHabit(undefined)}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-red-600 hover:bg-red-700 text-white transition disabled:opacity-50 flex items-center gap-2"
              >
                {isDeleting && (
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                  </svg>
                )}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
