interface HabitProgressBarProps {
  completed: number;
  goal: number;
  percentage: number;
}

export default function HabitProgressBar({
  completed,
  goal,
  percentage,
}: HabitProgressBarProps) {
  const clampedPct = Math.min(100, Math.max(0, percentage));

  const barColor =
    clampedPct >= 80
      ? "bg-green-500"
      : clampedPct >= 60
        ? "bg-amber-500"
        : "bg-red-500";

  return (
    <div className="flex flex-col gap-1 min-w-[80px] px-2 py-1">
      <span className="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
        {completed}/{goal} · {Math.round(clampedPct)}%
      </span>
      <div className="h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${barColor}`}
          style={{ width: `${clampedPct}%` }}
        />
      </div>
    </div>
  );
}
