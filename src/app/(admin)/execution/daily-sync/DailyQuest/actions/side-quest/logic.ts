// NO "use server" — pure functions only

/**
 * Parse and validate FormData for adding a side quest.
 * Throws if title or date is missing.
 */
export function parseSideQuestFormData(formData: FormData): { title: string; date: string } {
  const title = formData.get('title')?.toString();
  const date = formData.get('date')?.toString();

  if (!title && !date) throw new Error('Title and date are required');
  if (!title) throw new Error('Title is required');
  if (!date) throw new Error('Date is required');

  return { title, date };
}
