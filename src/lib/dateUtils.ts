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

export {}; 