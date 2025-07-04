// Helper: get week of year (ISO week)
export function getWeekOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 1);
  const diff = (date.getTime() - start.getTime()) / 86400000;
  const day = start.getDay() || 7;
  return Math.ceil((diff + day) / 7);
}

// Helper: get date from week number and day of week (0 = Sunday, 1 = Monday, etc.)
export function getDateFromWeek(year: number, week: number, dayOfWeek: number = 1): Date {
  // Get January 1st of the year
  const jan1 = new Date(year, 0, 1);
  
  // Find the first Monday of the year
  const firstMonday = new Date(jan1);
  const dayOfJan1 = jan1.getDay();
  const daysToAdd = dayOfJan1 === 0 ? 1 : (8 - dayOfJan1); // 0 = Sunday, so we need Monday (1)
  firstMonday.setDate(jan1.getDate() + daysToAdd);
  
  // Calculate the target date
  const targetDate = new Date(firstMonday);
  targetDate.setDate(firstMonday.getDate() + (week - 1) * 7 + (dayOfWeek - 1));
  
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
export function getQuarterWeekRange(year: number, quarter: number): { startWeek: number; endWeek: number } {
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
export function getQuarterDates(year: number, quarter: number): { startDate: Date; endDate: Date } {
  const { startWeek, endWeek } = getQuarterWeekRange(year, quarter);
  
  // Calculate start date (Monday of start week)
  const startDate = getDateFromWeek(year, startWeek, 1); // 1 = Monday
  
  // Calculate end date (Sunday of end week)
  const endDate = getDateFromWeek(year, endWeek, 7); // 7 = Sunday
  
  return { startDate, endDate };
}

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
  const { startWeek, endWeek } = getQuarterWeekRange(year, quarter);
  
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