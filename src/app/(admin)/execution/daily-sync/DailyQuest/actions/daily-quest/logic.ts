// NO "use server" — pure functions only

/**
 * Parse and validate FormData for adding a daily quest.
 * Throws if title is missing or empty.
 */
export function parseDailyQuestFormData(formData: FormData): {
  title: string;
  focusDuration: number;
} {
  const title = formData.get('title')?.toString();
  if (!title) throw new Error('Title is required');

  const focusDuration = Number(formData.get('focus_duration')) || 0;

  return { title, focusDuration };
}

/**
 * Extract session IDs from an array of timer session objects.
 */
export function extractSessionIds(sessions: { id: string }[]): string[] {
  return sessions.map(s => s.id);
}
