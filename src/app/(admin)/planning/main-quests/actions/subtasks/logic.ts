export function isValidParentTaskId(id: string): boolean {
  return typeof id === 'string' && id.trim().length > 0;
}
