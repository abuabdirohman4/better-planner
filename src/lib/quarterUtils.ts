// Helper: get week of year
export function getWeekOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 1);
  const diff = (date.getTime() - start.getTime()) / 86400000;
  const day = start.getDay() || 7;
  return Math.ceil((diff + day) / 7);
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

// Get quarter dates
export function getQuarterDates(year: number, quarter: number): { startDate: Date; endDate: Date } {
  const startMonth = (quarter - 1) * 3;
  const startDate = new Date(year, startMonth, 1);
  const endDate = new Date(year, startMonth + 3, 0); // Last day of the quarter
  return { startDate, endDate };
}

// Get quarter week range
export function getQuarterWeekRange(year: number, quarter: number): { startWeek: number; endWeek: number } {
  const { startDate, endDate } = getQuarterDates(year, quarter);
  const startWeek = getWeekOfYear(startDate);
  const endWeek = getWeekOfYear(endDate);
  return { startWeek, endWeek };
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