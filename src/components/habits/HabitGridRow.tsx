import type { Habit, HabitStats } from "@/types/habit";
import type { WeekGroup } from "@/components/habits/HabitGrid";
import HabitGridCell from "@/components/habits/HabitGridCell";
import HabitProgressBar from "@/components/habits/HabitProgressBar";

const CATEGORY_DOT_COLORS: Record<string, string> = {
  spiritual: "bg-purple-500",
  kesehatan: "bg-green-500",
  karir: "bg-blue-500",
  other: "bg-gray-400",
  keuangan: "bg-yellow-500",
  relasi: "bg-pink-400",
  petualangan: "bg-orange-400",
  kontribusi: "bg-teal-400",
};

interface HabitGridRowProps {
  habit: Habit;
  year: number;
  month: number;
  todayDate: string;
  isCompleted: (habitId: string, date: string) => boolean;
  onToggle: (habitId: string, date: string) => void;
  stats: HabitStats;
  onEditHabit?: (habit: Habit) => void;
  onDeleteHabit?: (habit: Habit) => void;
  weekGroups: WeekGroup[];
  collapsedWeeks: Set<number>;
  paddedMonth: string;
}

export default function HabitGridRow({
  habit,
  year,
  month,
  todayDate,
  isCompleted,
  onToggle,
  stats,
  onEditHabit,
  onDeleteHabit,
  weekGroups,
  collapsedWeeks,
  paddedMonth,
}: HabitGridRowProps) {
  const dotColor = CATEGORY_DOT_COLORS[habit.category] ?? "bg-gray-400";

  return (
    <tr className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
      {/* Habit name — sticky left */}
      <td className="sticky left-0 z-10 bg-white dark:bg-gray-900 min-w-[200px] px-1 py-2 border-r border-gray-200 dark:border-gray-700 group/row">
        <div className="flex items-center justify-between">
          <div className="flex items-center ml-2 gap-1.5 min-w-0">
            <span className={"flex-shrink-0 w-2 h-2 rounded-full " + dotColor} aria-hidden="true" />
            <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate leading-snug" title={habit.name}>
              {habit.name}
              {habit.tracking_type === "negative" && (
                <span className="ml-1" title="Negative habit" aria-label="Negative habit">🚫</span>
              )}
            </span>
          </div>
          <div className="flex flex-shrink-0">
            {onEditHabit && (
              <button
                type="button"
                onClick={() => onEditHabit(habit)}
                aria-label={"Edit " + habit.name}
                title={"Edit " + habit.name}
                className="opacity-0 group-hover/row:opacity-100 focus:opacity-100 p-0.5 rounded text-gray-400 hover:text-blue-500 dark:hover:text-blue-200 transition-opacity"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            )}
            {onDeleteHabit && (
              <button
                type="button"
                onClick={() => onDeleteHabit(habit)}
                aria-label={"Delete " + habit.name}
                title={"Delete " + habit.name}
                className="opacity-0 group-hover/row:opacity-100 focus:opacity-100 p-0.5 rounded text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-opacity"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </td>

      {/* Week columns: expanded = day cells, collapsed = summary badge */}
      {weekGroups.map(({ yearWeek, days: weekDays }) => {
        const isCollapsed = collapsedWeeks.has(yearWeek);

        if (isCollapsed) {
          // Count completions for this week
          const completed = weekDays.filter((day) => {
            const paddedDay = String(day).padStart(2, "0");
            const dateStr = `${year}-${paddedMonth}-${paddedDay}`;
            return isCompleted(habit.id, dateStr);
          }).length;
          const total = weekDays.length;
          const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

          const badgeColor =
            pct >= 80
              ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
              : pct >= 50
              ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
              : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400";

          return (
            <td
              key={yearWeek}
              className="min-w-[70px] text-center px-1 py-2 border-r border-gray-200 dark:border-gray-700"
            >
              <span className={"mx-auto inline-flex items-center justify-center rounded-md px-1.5 py-0.5 text-xs font-semibold tabular-nums " + badgeColor}>
                {completed}/{total}
              </span>
            </td>
          );
        }

        // Expanded: individual day cells
        return weekDays.map((day) => {
          const paddedDay = String(day).padStart(2, "0");
          const dateStr = `${year}-${paddedMonth}-${paddedDay}`;
          const isFuture = dateStr > todayDate;
          const completed = isCompleted(habit.id, dateStr);

          return (
            <HabitGridCell
              key={dateStr}
              habitId={habit.id}
              date={dateStr}
              isCompleted={completed}
              isFuture={isFuture}
              isNegative={habit.tracking_type === "negative"}
              onToggle={onToggle}
            />
          );
        });
      })}

      {/* Progress bar — sticky right */}
      <td className="sticky right-0 z-10 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 py-1">
        <HabitProgressBar
          completed={stats.completed}
          goal={stats.goal}
          percentage={stats.percentage}
        />
      </td>
    </tr>
  );
}
