interface HabitStatsCardProps {
  label: string;
  value: string | number;
  icon?: string; // emoji
  highlight?: boolean; // green highlight for good score
}

export default function HabitStatsCard({
  label,
  value,
  icon,
  highlight = false,
}: HabitStatsCardProps) {
  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
        highlight
          ? "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800"
          : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
      }`}
    >
      {icon && (
        <span className="text-base leading-none flex-shrink-0" aria-hidden="true">
          {icon}
        </span>
      )}
      <div className="flex flex-col min-w-0">
        <span
          className={`text-lg font-bold leading-tight ${
            highlight
              ? "text-green-700 dark:text-green-400"
              : "text-gray-900 dark:text-gray-100"
          }`}
        >
          {value}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
          {label}
        </span>
      </div>
    </div>
  );
}
