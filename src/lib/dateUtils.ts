export function formatDateIndo(date: Date): string {
  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}


export const daysOfWeek: string[] = [
  "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"
];

export function getWeekDates(date: Date): Date[] {
  const d = new Date(date);
  let day = d.getDay();
  // Jika hari Minggu, treat as 7 (bukan 0)
  if (day === 0) day = 7;
  // Mundur ke Senin
  d.setDate(d.getDate() - (day - 1));
  d.setHours(12, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(d);
    day.setDate(d.getDate() + i);
    return day;
  });
}

/**
 * Get local date string in YYYY-MM-DD format
 * This prevents timezone conversion issues when converting to ISO string
 */
export function getLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export {}; 