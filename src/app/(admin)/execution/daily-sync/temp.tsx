"use client";
import React, { useState, useTransition } from "react";

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

const DailySyncClient: React.FC<DailySyncClientProps> = ({ initialPlan }) => {
  const [plan, setPlan] = useState<DailyPlan | null>(initialPlan);
  const [showModal, setShowModal] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [weeklyItems, setWeeklyItems] = useState<WeeklyGoalItem[] | null>(null);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [loadingWeekly, setLoadingWeekly] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ambil year dan weekNumber dari hooks
  // const { year } = useQuarter();
  // const { weekNumber } = useWeek();

  // Ambil weekly goal items saat modal dibuka
  const handleOpenModal = async () => {
    setShowModal(true);
    setLoadingWeekly(true);
    setError(null);
    try {
      // The original code had getWeeklyGoalItems and setDailyPlan here.
      // Since they are no longer imported, this part of the logic needs to be removed
      // or replaced with new logic if available.
      // For now, we'll just set weeklyItems to null to indicate no data.
      setWeeklyItems(null);
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
      // The original code had setDailyPlan here.
      // Since it's no longer imported, this part of the logic needs to be removed
      // or replaced with new logic if available.
      // For now, we'll just set the plan to the new selected items.
      const newPlan: DailyPlan = { daily_plan_items: selectedItems.map((i) => ({ ...i, id: i.item_id })) };
      setPlan(newPlan);
      setShowModal(false);
    });
  };

  // Jika belum ada daily plan hari ini
  if (!plan) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh]">
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
      </div>
    );
  }

  // Jika sudah ada daily plan hari ini
  return (
    <div className="max-w-2xl mx-auto py-10">
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
    </div>
  );
};

export default DailySyncClient; 