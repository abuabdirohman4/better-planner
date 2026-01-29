/**
 * Period Utility Functions
 *
 * Helper functions untuk menentukan period dates untuk aggregation
 */

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
 * Get yesterday's date
 */
export function getYesterday(): Date {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d;
}

/**
 * Get last week's start date
 */
export function getLastWeekStart(): Date {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return getWeekStart(d);
}

/**
 * Get last month's start date (4 weeks ago)
 */
export function getLastMonthStart(): Date {
  const d = new Date();
  d.setDate(d.getDate() - 28);
  return getMonthStart(d);
}

/**
 * Get last quarter's start date
 */
export function getLastQuarterStart(): Date {
  const d = new Date();
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
  return date.toISOString().split("T")[0];
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
