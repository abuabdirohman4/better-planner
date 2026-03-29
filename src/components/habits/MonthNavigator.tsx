interface MonthNavigatorProps {
  year: number;
  month: number; // 1-12
  onChange: (year: number, month: number) => void;
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function MonthNavigator({
  year,
  month,
  onChange,
}: MonthNavigatorProps) {
  const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' }); // "YYYY-MM-DD"
  const [todayYear, todayMonth] = todayStr.split('-').map(Number);
  const isCurrentMonth = year === todayYear && month === todayMonth;

  const handlePrev = () => {
    if (month === 1) {
      onChange(year - 1, 12);
    } else {
      onChange(year, month - 1);
    }
  };

  const handleNext = () => {
    if (isCurrentMonth) return;
    if (month === 12) {
      onChange(year + 1, 1);
    } else {
      onChange(year, month + 1);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handlePrev}
        className="flex items-center justify-center w-8 h-8 rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
        aria-label="Previous month"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </button>

      <span className="text-base font-semibold text-gray-900 dark:text-gray-100 min-w-[140px] text-center">
        {MONTH_NAMES[month - 1]} {year}
      </span>

      <button
        type="button"
        onClick={handleNext}
        disabled={isCurrentMonth}
        className={`flex items-center justify-center w-8 h-8 rounded-md transition-colors ${
          isCurrentMonth
            ? "text-gray-300 dark:text-gray-600 cursor-not-allowed"
            : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100"
        }`}
        aria-label="Next month"
        aria-disabled={isCurrentMonth}
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </button>
    </div>
  );
}
