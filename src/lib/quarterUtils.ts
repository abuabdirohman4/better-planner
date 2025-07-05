// Helper: get week of year (menggunakan logika yang sama dengan getDateFromWeek & getQuarterDates)
export function getWeekOfYear(date: Date): number {
  const year = date.getFullYear();
  
  // 1. Tentukan tanggal 1 Januari untuk tahun yang diberikan.
  const janFirst = new Date(year, 0, 1);

  // 2. Cari hari Senin pertama dari tahun perencanaan (menggunakan logika yang sama dengan getQuarterDates).
  const dayOfWeekJan1 = janFirst.getDay();
  const daysToSubtract = dayOfWeekJan1 === 0 ? 6 : dayOfWeekJan1 - 1;
  
  const planningYearStartDate = new Date(janFirst);
  planningYearStartDate.setDate(janFirst.getDate() - daysToSubtract);

  // 3. Hitung berapa minggu dari planningYearStartDate ke tanggal target
  const diffInDays = (date.getTime() - planningYearStartDate.getTime()) / 86400000;
  const weekNumber = Math.floor(diffInDays / 7) + 1;
  
  return Math.max(1, weekNumber);
}

// Helper: get date from week number and day of week (1 = Monday, 2 = Tuesday, etc.)
export function getDateFromWeek(year: number, week: number, dayOfWeek: number = 1): Date {
  // 1. Tentukan tanggal 1 Januari untuk tahun yang diberikan.
  const janFirst = new Date(year, 0, 1);

  // 2. Cari hari Senin pertama dari tahun perencanaan (menggunakan logika yang sama dengan getQuarterDates).
  // getDay() -> 0=Minggu, 1=Senin, ..., 6=Sabtu
  const dayOfWeekJan1 = janFirst.getDay();
  // Hitung berapa hari harus mundur dari 1 Januari untuk mencapai hari Senin.
  // Jika 1 Jan adalah Minggu (0), mundur 6 hari. Jika Selasa (2), mundur 1 hari.
  const daysToSubtract = dayOfWeekJan1 === 0 ? 6 : dayOfWeekJan1 - 1;
  
  const planningYearStartDate = new Date(janFirst);
  planningYearStartDate.setDate(janFirst.getDate() - daysToSubtract);

  // 3. Hitung tanggal target berdasarkan week number dan day of week
  // week - 1 karena week 1 dimulai dari planningYearStartDate
  // dayOfWeek - 1 karena dayOfWeek 1 = Senin, jadi offset 0 hari dari Senin
  const targetDate = new Date(planningYearStartDate);
  targetDate.setDate(planningYearStartDate.getDate() + (week - 1) * 7 + (dayOfWeek - 1));
  
  return targetDate;
}

// Helper: parse q param (e.g. 2025-Q2)
export function parseQParam(q: string | null): { year: number; quarter: number } {
  if (!q) {
    const now = new Date();
    const week = getWeekOfYear(now);
    let quarter = 1;
    if (week >= 1 && week <= 13) quarter = 1;
    else if (week >= 14 && week <= 26) quarter = 2;
    else if (week >= 27 && week <= 39) quarter = 3;
    else quarter = 4;
    return { year: now.getFullYear(), quarter };
  }
  const match = q.match(/(\d{4})-Q([1-4])/);
  if (match) {
    return { year: parseInt(match[1]), quarter: parseInt(match[2]) };
  }
  // fallback
  const now = new Date();
  const week = getWeekOfYear(now);
  let quarter = 1;
  if (week >= 1 && week <= 13) quarter = 1;
  else if (week >= 14 && week <= 26) quarter = 2;
  else if (week >= 27 && week <= 39) quarter = 3;
  else quarter = 4;
  return { year: now.getFullYear(), quarter };
}

export function formatQParam(year: number, quarter: number): string {
  return `${year}-Q${quarter}`;
}

// Get previous quarter
export function getPrevQuarter(year: number, quarter: number): { year: number; quarter: number } {
  if (quarter === 1) return { year: year - 1, quarter: 4 };
  return { year, quarter: quarter - 1 };
}

// Get next quarter
export function getNextQuarter(year: number, quarter: number): { year: number; quarter: number } {
  if (quarter === 4) return { year: year + 1, quarter: 1 };
  return { year, quarter: quarter + 1 };
}

// Get quarter week range
export function getQuarterWeekRange(quarter: number): { startWeek: number; endWeek: number } {
  let startWeek: number;
  let endWeek: number;
  
  switch (quarter) {
    case 1:
      startWeek = 1;
      endWeek = 13;
      break;
    case 2:
      startWeek = 14;
      endWeek = 26;
      break;
    case 3:
      startWeek = 27;
      endWeek = 39;
      break;
    case 4:
      startWeek = 40;
      endWeek = 52;
      break;
    default:
      startWeek = 1;
      endWeek = 13;
  }
  
  return { startWeek, endWeek };
}

// Get quarter dates (Monday to Sunday)
/**
 * Mendapatkan tanggal mulai dan selesai untuk kuartal tertentu dalam setahun,
 * berdasarkan sistem 13 minggu per kuartal.
 * Tahun perencanaan dimulai pada hari Senin di minggu yang sama dengan 1 Januari.
 */
export const getQuarterDates = (year: number, quarter: number): { startDate: Date; endDate: Date } => {
  // 1. Tentukan tanggal 1 Januari untuk tahun yang diberikan.
  const janFirst = new Date(year, 0, 1);

  // 2. Cari hari Senin pertama dari tahun perencanaan.
  // getDay() -> 0=Minggu, 1=Senin, ..., 6=Sabtu
  const dayOfWeek = janFirst.getDay();
  // Hitung berapa hari harus mundur dari 1 Januari untuk mencapai hari Senin.
  // Jika 1 Jan adalah Minggu (0), mundur 6 hari. Jika Selasa (2), mundur 1 hari.
  const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  
  const planningYearStartDate = new Date(janFirst);
  planningYearStartDate.setDate(janFirst.getDate() - daysToSubtract);

  // 3. Hitung tanggal mulai kuartal yang diminta.
  // Setiap kuartal adalah 13 minggu * 7 hari = 91 hari.
  const daysToAdd = (quarter - 1) * 91;
  const quarterStartDate = new Date(planningYearStartDate);
  quarterStartDate.setDate(planningYearStartDate.getDate() + daysToAdd);

  // 4. Hitung tanggal akhir kuartal.
  const quarterEndDate = new Date(quarterStartDate);
  quarterEndDate.setDate(quarterStartDate.getDate() + 90); // 91 hari total, jadi tambah 90 hari dari tanggal mulai.

  return { startDate: quarterStartDate, endDate: quarterEndDate };
};

// Check if quarter is current
export function isCurrentQuarter(year: number, quarter: number): boolean {
  const currentQuarter = parseQParam(null);
  return currentQuarter.year === year && currentQuarter.quarter === quarter;
}

// Get quarter string
export function getQuarterString(year: number, quarter: number): string {
  return `Q${quarter} ${year}`;
}

// Get quarter display info
export function getQuarterInfo(year: number, quarter: number) {
  const { startDate, endDate } = getQuarterDates(year, quarter);
  const { startWeek, endWeek } = getQuarterWeekRange(quarter);
  
  return {
    year,
    quarter,
    quarterString: getQuarterString(year, quarter),
    startDate,
    endDate,
    weekRange: `Week ${startWeek}-${endWeek}`,
    isCurrentQuarter: isCurrentQuarter(year, quarter)
  };
}