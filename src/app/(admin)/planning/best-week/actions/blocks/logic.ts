import type { BestWeekBlock, BlockFormData, DayCode } from '@/lib/best-week/types';

// Convert "HH:MM" (UI) → "HH:MM:00" (Supabase TIME)
export function toDbTime(time: string): string {
  return time.length === 5 ? `${time}:00` : time;
}

// Convert "HH:MM:SS" (Supabase) → "HH:MM" (UI)
export function toUiTime(time: string): string {
  return time.substring(0, 5);
}

export function validateBlockForm(data: BlockFormData): void {
  if (!data.title.trim()) throw new Error('Judul block tidak boleh kosong');
  if (data.days.length === 0) throw new Error('Pilih minimal 1 hari');
  if (!data.start_time || !data.end_time) throw new Error('Waktu tidak boleh kosong');
  if (data.start_time >= data.end_time) throw new Error('Waktu selesai harus setelah waktu mulai');
}

// Check if two blocks overlap on a specific day
export function blocksOverlapOnDay(a: BestWeekBlock, b: BestWeekBlock, day: DayCode): boolean {
  if (!a.days.includes(day) || !b.days.includes(day)) return false;
  return a.start_time < b.end_time && a.end_time > b.start_time;
}

// Calculate total hours for a category (accounting for number of days)
export function calcTotalHours(blocks: BestWeekBlock[], category: string): number {
  return blocks
    .filter(b => b.category === category)
    .reduce((sum, b) => {
      const [sh, sm] = b.start_time.split(':').map(Number);
      const [eh, em] = b.end_time.split(':').map(Number);
      const durationHours = (eh * 60 + em - (sh * 60 + sm)) / 60;
      return sum + durationHours * b.days.length;
    }, 0);
}
