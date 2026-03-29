import type { Habit } from "@/types/habit";

interface TodayHabitItemProps {
  habit: Habit;
  isCompleted: boolean;
  currentStreak: number;
  onToggle: () => void;
}

function capitalizeFirst(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export default function TodayHabitItem({
  habit,
  isCompleted,
  currentStreak,
  onToggle,
}: TodayHabitItemProps) {
  const displayTime = habit.target_time ? habit.target_time.slice(0, 5) : null;
  const subtitle = [capitalizeFirst(habit.category), displayTime]
    .filter(Boolean)
    .join(" • ");

  return (
    <button
      type="button"
      onClick={onToggle}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border transition-colors duration-150 text-left min-h-[64px] ${
        isCompleted
          ? "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800"
          : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
      }`}
    >
      {/* Checkbox */}
      <span
        className={`flex-shrink-0 w-8 h-8 rounded border-2 flex items-center justify-center transition-colors duration-150 ${
          isCompleted
            ? "bg-green-500 border-green-500"
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
                ? "text-green-700 dark:text-green-400 line-through"
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
      </div>

      {/* Streak */}
      {currentStreak > 0 && (
        <span className="flex-shrink-0 flex items-center gap-1 text-sm font-medium text-orange-500 dark:text-orange-400">
          🔥 {currentStreak}
        </span>
      )}
    </button>
  );
}
