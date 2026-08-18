/**
 * Period Utility Functions
 *
 * Helper functions untuk menentukan period dates untuk aggregation
 */

/**
 * Format a Date as YYYY-MM-DD in the user's timezone (WIB).
 * DB columns local_date/plan_date store WIB dates, so never use toISOString()
 * for them — at 06:00 WIB the UTC date is still the previous day.
 */
export function formatLocalDate(date: Date, timezone = "Asia/Jakarta"): string {
  return date.toLocaleDateString("en-CA", { timeZone: timezone });
}

/**
 * Get the start of the week (Monday) for a given date
 */
export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  return new Date(d.setDate(diff));
}

/**
 * Get the start of the month (first Monday) for a given date
 * Using 4-week period instead of calendar month
 */
export function getMonthStart(date: Date): Date {
  const d = new Date(date);
  const weekStart = getWeekStart(d);

  // Find the first Monday of the current 4-week period
  const dayOfMonth = d.getDate();
  const weekOfMonth = Math.floor((dayOfMonth - 1) / 7);
  const fourWeekPeriod = Math.floor(weekOfMonth / 4);

  const firstMonday = new Date(
    d.getFullYear(),
    d.getMonth(),
    1 + fourWeekPeriod * 28
  );
  return getWeekStart(firstMonday);
}

/**
 * Get the start of the quarter for a given date
 */
export function getQuarterStart(date: Date): Date {
  const d = new Date(date);
  const month = d.getMonth();
  const quarterMonth = Math.floor(month / 3) * 3; // 0, 3, 6, or 9

  return new Date(d.getFullYear(), quarterMonth, 1);
}

/**
 * Get "now" as a Date whose local fields are WIB wall-clock.
 * Vercel runs in UTC, so date arithmetic on a raw `new Date()` is a day off
 * during 00:00-07:00 WIB.
 */
export function nowInUserTimezone(timezone = "Asia/Jakarta"): Date {
  return new Date(new Date().toLocaleString("en-US", { timeZone: timezone }));
}

/**
 * Get yesterday's date (WIB)
 */
export function getYesterday(): Date {
  const d = nowInUserTimezone();
  d.setDate(d.getDate() - 1);
  return d;
}

/**
 * Get last week's start date
 */
export function getLastWeekStart(): Date {
  const d = nowInUserTimezone();
  d.setDate(d.getDate() - 7);
  return getWeekStart(d);
}

/**
 * Get last month's start date (4 weeks ago)
 */
export function getLastMonthStart(): Date {
  const d = nowInUserTimezone();
  d.setDate(d.getDate() - 28);
  return getMonthStart(d);
}

/**
 * Get last quarter's start date
 */
export function getLastQuarterStart(): Date {
  const d = nowInUserTimezone();
  d.setMonth(d.getMonth() - 3);
  return getQuarterStart(d);
}

/**
 * Convert UTC time to user's timezone (UTC+7 for Indonesia)
 */
export function convertToUserTimezone(utcTime: string, timezone = "Asia/Jakarta"): Date {
  return new Date(
    new Date(utcTime).toLocaleString("en-US", { timeZone: timezone })
  );
}

/**
 * Check if it's time to send notification based on user preferences
 */
export function shouldSendNotification(
  preferredTime: string, // HH:MM:SS format
  timezone = "Asia/Jakarta"
): boolean {
  const now = new Date();
  const userNow = new Date(
    now.toLocaleString("en-US", { timeZone: timezone })
  );

  const [hours, minutes] = preferredTime.split(":").map(Number);
  const currentHour = userNow.getHours();
  const currentMinute = userNow.getMinutes();

  // Check if current time matches preferred time (within 15-minute window)
  return currentHour === hours && Math.abs(currentMinute - minutes) < 15;
}

/**
 * Format date for display
 */
export function formatDate(date: Date): string {
  return formatLocalDate(date);
}

/**
 * Get date range as string
 */
export function getDateRangeString(start: Date, end: Date): string {
  const startStr = start.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const endStr = end.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return `${startStr} - ${endStr}`;
}
