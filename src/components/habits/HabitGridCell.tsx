interface HabitGridCellProps {
  habitId: string;
  date: string; // "YYYY-MM-DD"
  isCompleted: boolean;
  isFuture: boolean; // date > today
  isOffSchedule: boolean; // weekly habit, not one of its target days
  isNegative: boolean; // tracking_type === 'negative'
  onToggle: (habitId: string, date: string) => void;
}

const CheckIcon = () => (
  <svg
    className="w-4 h-4 md:w-5 md:h-5 text-white"
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
);

export default function HabitGridCell({
  habitId,
  date,
  isCompleted,
  isFuture,
  isOffSchedule,
  isNegative,
  onToggle,
}: HabitGridCellProps) {
  const handleClick = () => {
    onToggle(habitId, date);
  };

  // Not scheduled: a faint dot, deliberately NOT the empty box used for a miss,
  // and not clickable — an off day must not read as a failure (app-pizc).
  if (isOffSchedule) {
    return (
      <td className="p-1 text-center align-middle">
        <span
          className="flex items-center justify-center w-6 h-6 md:w-7 md:h-7 mx-auto"
          title={`Tidak dijadwalkan (${date})`}
          aria-label={`Not scheduled on ${date}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700" />
        </span>
      </td>
    );
  }

  if (isFuture) {
    return (
      <td className="p-1 text-center align-middle">
        <span className="flex items-center justify-center w-6 h-6 md:w-7 md:h-7 rounded-lg bg-gray-100 dark:bg-gray-800/60 mx-auto" />
      </td>
    );
  }

  if (isCompleted) {
    return (
      <td className="p-1 text-center align-middle">
        <button
          type="button"
          onClick={handleClick}
          title={isNegative ? `Avoided on ${date}` : `Completed on ${date}`}
          className="flex items-center justify-center w-6 h-6 md:w-7 md:h-7 rounded-lg bg-green-500 hover:bg-green-600 active:scale-90 transition-all duration-100 mx-auto shadow-sm"
          aria-label={`Mark ${date} as incomplete`}
        >
          <CheckIcon />
        </button>
      </td>
    );
  }

  return (
    <td className="p-1 text-center align-middle">
      <button
        type="button"
        onClick={handleClick}
        title={date}
        className="flex items-center justify-center w-6 h-6 md:w-7 md:h-7 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-green-100 dark:hover:bg-green-950/40 hover:border hover:border-green-400 active:scale-90 transition-all duration-100 mx-auto"
        aria-label={`Mark ${date} as complete`}
      />
    </td>
  );
}
