"use client";
import React, { useState, useTransition, useEffect } from "react";
import { getWeeklyGoalItems, setDailyPlan, getDailyPlan } from "./actions";
import { useQuarter } from '@/hooks/useQuarter';
import { getWeekDates, daysOfWeek, formatDateIndo } from '@/lib/dateUtils';
import { getWeekOfYear } from '@/lib/quarterUtils';
import { getQuarterWeekRange, getDateFromWeek } from '@/lib/quarterUtils';

interface WeeklyGoalItem {
  id: string;
  type: 'QUEST' | 'MILESTONE' | 'TASK' | 'SUBTASK';
  title: string;
  main_quest_id: string | null;
  main_quest_title: string;
  goal_slot?: number; // Added for grouping by goal slot
}

interface DailyPlanItem {
  id: string;
  item_id: string;
  item_type: 'QUEST' | 'MILESTONE' | 'TASK' | 'SUBTASK';
}

interface DailyPlan {
  daily_plan_items?: DailyPlanItem[];
}

interface DailySyncClientProps {
  initialPlan: DailyPlan | null;
  today: string;
}

const groupByMainQuest = (items: WeeklyGoalItem[]) => {
  const groups: Record<string, { main_quest_title: string; items: WeeklyGoalItem[] }> = {};
  items.forEach((item) => {
    const key = item.main_quest_id || 'other';
    if (!groups[key]) {
      groups[key] = { main_quest_title: item.main_quest_title || 'Lainnya', items: [] };
    }
    groups[key].items.push(item);
  });
  return groups;
};

function groupByGoalSlot(items: WeeklyGoalItem[]) {
  const groups: Record<number, WeeklyGoalItem[]> = { 1: [], 2: [], 3: [] };
  items.forEach(item => {
    if (item.goal_slot && groups[item.goal_slot]) {
      groups[item.goal_slot].push(item);
    }
  });
  return groups;
}

const DailySyncClient: React.FC<DailySyncClientProps> = ({ initialPlan, today }) => {
  const [plan, setPlan] = useState<DailyPlan | null>(initialPlan);
  const [showModal, setShowModal] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [weeklyItems, setWeeklyItems] = useState<WeeklyGoalItem[] | null>(null);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [loadingWeekly, setLoadingWeekly] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ambil year dan quarter dari useQuarter
  const { year, quarter } = useQuarter();
  // Tambahkan state currentWeekMonday lebih dulu
  const [currentWeekMonday] = useState(() => {
    const now = new Date(today);
    const day = now.getDay() || 7; // 1=Senin, 7=Minggu
    const monday = new Date(now);
    monday.setDate(now.getDate() - (day - 1));
    monday.setHours(0, 0, 0, 0);
    return monday;
  });
  // Deklarasi startWeek, endWeek, totalWeeks setelah currentWeekMonday
  const { startWeek, endWeek } = getQuarterWeekRange(year, quarter);
  const totalWeeks = endWeek - startWeek + 1;
  // State minggu yang dipilih dalam quarter (1-13)
  const [selectedWeekInQuarter, setSelectedWeekInQuarter] = useState<number>(() => {
    const today = new Date();
    const weekAbs = getWeekOfYear(today);
    return Math.max(1, Math.min(totalWeeks, weekAbs - startWeek + 1));
  });
  // Update selectedWeekInQuarter setelah currentWeekMonday, year, quarter tersedia
  useEffect(() => {
    const weekAbs = startWeek + selectedWeekInQuarter - 1;
    const monday = getDateFromWeek(year, weekAbs, 1);
    monday.setHours(0, 0, 0, 0);

    // Cek apakah minggu yang dipilih adalah minggu saat ini
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thisMonday = new Date(today);
    thisMonday.setDate(today.getDate() - ((today.getDay() || 7) - 1));
    thisMonday.setHours(0, 0, 0, 0);

    if (monday.getTime() === thisMonday.getTime()) {
      // Minggu ini, pilih hari ini jika ada di minggu itu
      const weekDates = getWeekDates(monday);
      const todayStr = today.toISOString().slice(0, 10);
      const found = weekDates.find(d => d.toISOString().slice(0, 10) === todayStr);
      setSelectedDate(found ? todayStr : monday.toISOString().slice(0, 10));
    } else {
      // Minggu lain, pilih Senin
      setSelectedDate(monday.toISOString().slice(0, 10));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedWeekInQuarter, year, quarter]);
  // Dropdown minggu
  const [isWeekDropdownOpen, setIsWeekDropdownOpen] = useState(false);
  // Range tanggal minggu
  const weekStartDate = getDateFromWeek(year, startWeek + selectedWeekInQuarter - 1, 1);
  const weekEndDate = getDateFromWeek(year, startWeek + selectedWeekInQuarter - 1, 7);

  // Tambahkan state selectedDate
  const [selectedDate, setSelectedDate] = useState<string>(today);

  // Fetch plan setiap kali selectedDate berubah
  useEffect(() => {
    if (selectedDate === today && initialPlan) {
      setPlan(initialPlan);
      return;
    }
    let ignore = false;
    setLoadingWeekly(true);
    getDailyPlan(selectedDate).then((plan) => {
      if (!ignore) setPlan(plan);
    }).finally(() => {
      if (!ignore) setLoadingWeekly(false);
    });
    return () => { ignore = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  // Daftar tanggal minggu berjalan
  // Hitung Senin minggu yang dipilih
  const weekAbs = startWeek + selectedWeekInQuarter - 1;
  const mondayOfSelected = getDateFromWeek(year, weekAbs, 1);
  // Generate weekDates dari Senin minggu yang dipilih
  const weekDates = getWeekDates(mondayOfSelected);
  // Hitung minggu ke berapa dalam tahun pakai quarterUtils
  const weekNumber = getWeekOfYear(currentWeekMonday);
  // Hapus deklarasi weekNumber lain jika ada

  // Navigasi minggu
  // Hapus fungsi goPrevWeek dan goNextWeek

  // Ambil weekly goal items saat modal dibuka
  const handleOpenModal = async () => {
    setShowModal(true);
    setLoadingWeekly(true);
    setError(null);
    try {
      const items = await getWeeklyGoalItems(year, weekNumber);
      console.log('items', items)
      setWeeklyItems(items);
      setSelected({});
    } catch {
      setError("Gagal mengambil data goal mingguan");
      setWeeklyItems([]);
    }
    setLoadingWeekly(false);
  };

  // Submit ke server action setDailyPlan
  const handlePlanSubmit = async () => {
    const selectedItems = Object.entries(selected)
      .filter(([, v]) => v)
      .map(([id]) => {
        const item = weeklyItems?.find((i) => i && i.id === id);
        if (!item) return undefined;
        return { item_id: item.id, item_type: item.type as 'QUEST' | 'MILESTONE' | 'TASK' | 'SUBTASK' };
      })
      .filter((i): i is { item_id: string; item_type: 'QUEST' | 'MILESTONE' | 'TASK' | 'SUBTASK' } => !!i);
    if (!selectedItems.length) return;
    startTransition(async () => {
      await setDailyPlan(today, selectedItems);
      // Setelah submit, ambil ulang plan
      const newPlan: DailyPlan = { daily_plan_items: selectedItems.map((i) => ({ ...i, id: i.item_id })) };
      setPlan(newPlan);
      setShowModal(false);
    });
  };

  // Selector minggu dan hari di pojok kanan atas
  return (
    <div className="max-w-2xl mx-auto py-10">
      <div className="flex flex-row justify-end mb-6">
        <div className="flex flex-col items-end gap-2">
          {/* Selector Minggu ala WeeklySyncClient */}
          <div className="flex items-center gap-2 mb-1">
            <button
              className="px-2 py-1 rounded bg-gray-200 dark:bg-gray-700"
              onClick={() => setSelectedWeekInQuarter((w) => Math.max(1, w - 1))}
              aria-label="Minggu sebelumnya"
              disabled={selectedWeekInQuarter <= 1}
            >
              &lt;
            </button>
            <div className="relative">
              <button
                className="flex items-center justify-center gap-1 px-8 py-2.5 rounded-lg border border-gray-400 bg-white dark:text-white dark:bg-gray-900 cursor-pointer min-w-24 dropdown-toggle hover:bg-gray-50 dark:hover:bg-gray-800"
                onClick={() => setIsWeekDropdownOpen((v) => !v)}
                aria-haspopup="listbox"
                aria-expanded={isWeekDropdownOpen}
              >
                <span>Minggu {selectedWeekInQuarter}</span>
              </button>
              {isWeekDropdownOpen && (
                <div className="absolute z-10 bg-white dark:bg-gray-900 border rounded shadow mt-1 w-full max-h-64 overflow-y-auto">
                  {Array.from({ length: totalWeeks }, (_, i) => (
                    <div
                      key={i + 1}
                      onClick={() => {
                        setSelectedWeekInQuarter(i + 1);
                        setIsWeekDropdownOpen(false);
                      }}
                      className={`px-4 py-2 cursor-pointer hover:bg-brand-100 dark:hover:bg-brand-900/30 ${selectedWeekInQuarter === i + 1 ? "bg-brand-100 dark:bg-brand-900/30 font-semibold !text-center" : "!text-center"}`}
                    >
                      Minggu {i + 1}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button
              className="px-2 py-1 rounded bg-gray-200 dark:bg-gray-700"
              onClick={() => setSelectedWeekInQuarter((w) => Math.min(totalWeeks, w + 1))}
              aria-label="Minggu berikutnya"
              disabled={selectedWeekInQuarter >= totalWeeks}
            >
              &gt;
            </button>
          </div>
          <div className="text-xs text-gray-500 mb-2">{formatDateIndo(weekStartDate)} – {formatDateIndo(weekEndDate)}</div>
          {/* Selector Hari */}
          <div className="flex gap-1">
            {weekDates.map((date, idx) => {
              const dateStr = date.toISOString().slice(0, 10);
              const isActive = selectedDate === dateStr;
              return (
                <button
                  key={dateStr}
                  className={`flex flex-col items-center px-2 py-1 rounded transition text-xs font-medium border-2 ${isActive ? "bg-brand-500 text-white border-brand-500" : "bg-gray-100 dark:bg-gray-800 border-transparent text-gray-700 dark:text-gray-200"}`}
                  onClick={() => setSelectedDate(dateStr)}
                >
                  <span>{daysOfWeek[idx]}</span>
                  <span className="text-[10px] font-normal">{formatDateIndo(date)}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-8 flex flex-col items-center justify-center min-h-[220px]">
        {!plan ? (
          <>
            <div className="mb-6 text-lg font-semibold text-gray-700 dark:text-gray-200">Belum ada rencana untuk hari ini</div>
            <button
              className="px-8 py-4 text-lg rounded-lg bg-brand-500 text-white font-bold shadow-lg hover:bg-brand-600 transition"
              onClick={handleOpenModal}
            >
              + Rencanakan Hari Ini
            </button>
            {showModal && (
              <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-8 min-w-[350px] max-w-lg w-full">
                  <div className="mb-4 font-bold text-lg">Pilih Tugas Harian</div>
                  {loadingWeekly ? (
                    <div>Loading...</div>
                  ) : error ? (
                    <div className="text-red-500">{error}</div>
                  ) : weeklyItems && weeklyItems.length ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handlePlanSubmit();
                      }}
                    >
                      <div className="max-h-64 overflow-y-auto mb-4">
                        {Object.entries(groupByGoalSlot(weeklyItems)).map(([slot, items]) => (
                          <div key={slot} className="mb-4">
                            <div className="font-bold mb-2">Goal Mingguan {slot}</div>
                            {items.length === 0 ? (
                              <div className="text-gray-400 text-sm mb-2">Belum ada item.</div>
                            ) : (
                              Object.entries(groupByMainQuest(items)).map(
                                ([mainQuestId, group]) => (
                                  <div key={mainQuestId} className="mb-3">
                                    <div className="font-semibold mb-1">{group.main_quest_title}</div>
                                    <ul className="pl-2">
                                      {group.items.map((item) => (
                                        <li key={item.id} className="flex items-center mb-1">
                                          <input
                                            type="checkbox"
                                            id={item.id}
                                            checked={!!selected[item.id]}
                                            onChange={(e) =>
                                              setSelected((prev) => ({ ...prev, [item.id]: e.target.checked }))
                                            }
                                            className="mr-2"
                                          />
                                          <label htmlFor={item.id}>
                                            {item.title} <span className="text-xs text-gray-400 ml-1">({item.type})</span>
                                          </label>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )
                              )
                            )}
                          </div>
                        ))}
                      </div>
                      <button
                        type="submit"
                        className="w-full px-4 py-2 rounded bg-brand-500 text-white font-bold disabled:opacity-60"
                        disabled={isPending}
                      >
                        {isPending ? "Menyimpan..." : "Mulai Hari Ini"}
                      </button>
                    </form>
                  ) : (
                    <div className="text-gray-500">Tidak ada goal mingguan tersedia.</div>
                  )}
                  <button className="mt-6 px-4 py-2 rounded bg-gray-200 w-full" onClick={() => setShowModal(false)}>
                    Tutup
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold mb-6">Tugas Harian Anda</h1>
            <ul className="space-y-3 mb-8">
              {plan.daily_plan_items?.length ? (
                plan.daily_plan_items.map((item: DailyPlanItem) => (
                  <li key={item.id} className="p-4 rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-between">
                    <span>{item.item_id} ({item.item_type})</span>
                    <button className="px-3 py-1 rounded bg-brand-500 text-white text-sm">Mulai Sesi</button>
                  </li>
                ))
              ) : (
                <li className="text-gray-500">Belum ada tugas terpilih.</li>
              )}
            </ul>
            {/* Dummy komponen Pomodoro, Brain Dump, Log Aktivitas */}
            <div className="mb-4 p-4 rounded bg-white dark:bg-gray-900 shadow">[Pomodoro Timer Placeholder]</div>
            <div className="mb-4 p-4 rounded bg-white dark:bg-gray-900 shadow">[Brain Dump Placeholder]</div>
            <div className="mb-4 p-4 rounded bg-white dark:bg-gray-900 shadow">[Log Aktivitas Placeholder]</div>
          </>
        )}
      </div>
    </div>
  );
};

export default DailySyncClient; 