export function validateBrainDumpDate(date: string): void {
  if (!date) {
    throw new Error('Tanggal tidak boleh kosong');
  }
}

export function sanitizeContent(content: string): string {
  return content ? content.trim() : '';
}
