export interface ParsedJournalFormData {
  taskId: string;
  sessionType: 'FOCUS' | 'SHORT_BREAK' | 'LONG_BREAK';
  date: string;
  startTime: string;
  endTime: string;
  whatDone: string | undefined;
  whatThink: string | undefined;
}

export function parseJournalFormData(formData: FormData): ParsedJournalFormData {
  const taskId = formData.get('taskId')?.toString();
  const sessionType = formData.get('sessionType')?.toString() as 'FOCUS' | 'SHORT_BREAK' | 'LONG_BREAK';
  const date = formData.get('date')?.toString();
  const startTime = formData.get('startTime')?.toString();
  const endTime = formData.get('endTime')?.toString();
  const whatDone = formData.get('whatDone')?.toString();
  const whatThink = formData.get('whatThink')?.toString();

  if (!taskId || !sessionType || !date || !startTime || !endTime) {
    throw new Error('Missing required fields');
  }

  return { taskId, sessionType, date, startTime, endTime, whatDone, whatThink };
}

export function calculateDurationMinutes(startTime: string, endTime: string): number {
  const durationInSeconds =
    (new Date(endTime).getTime() - new Date(startTime).getTime()) / 1000;
  return Math.max(1, Math.round(durationInSeconds / 60));
}

export function sanitizeJournalField(value: string | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed || null;
}
