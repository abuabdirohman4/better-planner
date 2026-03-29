import type { Habit, MonthlyStats } from "@/types/habit";
import TodayHabitItem from "./TodayHabitItem";

interface TodayHabitListProps {
  habits: Habit[];
  isCompleted: (habitId: string, date: string) => boolean;
  onToggle: (habitId: string, date: string) => void;
  monthlyStats: MonthlyStats;
  todayDate: string; // "YYYY-MM-DD"
}

interface TimeGroup {
  key: string;
  label: string;
  habits: Habit[];
}

function getTimeGroup(habit: Habit): string {
  const t = habit.target_time;
  if (!t) {
    return "anytime";
  }
  const hhmm = t.slice(0, 5); // "HH:MM"
  if (hhmm < "12:00") return "morning";
  if (hhmm < "17:00") return "afternoon";
  if (hhmm < "20:00") return "evening";
  return "before_sleep";
}

const TIME_GROUP_META: { key: string; label: string }[] = [
  { key: "morning", label: "🌅 Morning" },
  { key: "afternoon", label: "☀️ Afternoon" },
  { key: "evening", label: "🌆 Evening" },
  { key: "before_sleep", label: "🌙 Before Sleep" },
  { key: "anytime", label: "✨ Anytime" },
];

export default function TodayHabitList({
  habits,
  isCompleted,
  onToggle,
  monthlyStats,
  todayDate,
}: TodayHabitListProps) {
  // Build groups
  const groupMap: Record<string, Habit[]> = {
    morning: [],
    afternoon: [],
    evening: [],
    before_sleep: [],
    anytime: [],
  };

  for (const habit of habits) {
    const key = getTimeGroup(habit);
    groupMap[key].push(habit);
  }

  // Sort each group by sort_order
  for (const key of Object.keys(groupMap)) {
    groupMap[key].sort((a, b) => a.sort_order - b.sort_order);
  }

  const groups: TimeGroup[] = TIME_GROUP_META.map(({ key, label }) => ({
    key,
    label,
    habits: groupMap[key],
  })).filter((g) => g.habits.length > 0);

  if (groups.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <p className="text-sm">No habits yet. Add your first habit to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {groups.map((group) => {
        const doneCount = group.habits.filter((h) =>
          isCompleted(h.id, todayDate)
        ).length;

        return (
          <div key={group.key}>
            {/* Group header */}
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-300">
                {group.label}
              </h3>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {doneCount}/{group.habits.length} done
              </span>
            </div>

            {/* Habit items */}
            <div className="space-y-2">
              {group.habits.map((habit) => {
                const stats = monthlyStats.per_habit.find(
                  (s) => s.habit_id === habit.id
                );
                const currentStreak = stats?.current_streak ?? 0;

                return (
                  <TodayHabitItem
                    key={habit.id}
                    habit={habit}
                    isCompleted={isCompleted(habit.id, todayDate)}
                    currentStreak={currentStreak}
                    onToggle={() => onToggle(habit.id, todayDate)}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
