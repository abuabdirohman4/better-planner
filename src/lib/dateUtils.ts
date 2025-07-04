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
  const monday = new Date(date);
  monday.setDate(date.getDate() - ((date.getDay() + 6) % 7)); // Senin
  return Array.from({ length: 7 }, (_, i: number): Date => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

export {}; 