export function buildQuestInsertData(
  quests: { title: string; label: string }[],
  userId: string,
  year: number,
  quarter: number
) {
  return quests.map(q => ({
    user_id: userId,
    title: q.title,
    label: q.label,
    year,
    quarter,
    is_committed: false,
    type: 'PERSONAL',
  }));
}

export function getTop3QuestIds(
  quests: { id: string; priority_score: number }[]
): string[] {
  return [...quests]
    .sort((a, b) => b.priority_score - a.priority_score)
    .slice(0, 3)
    .map(q => q.id);
}

export function sortQuestsByPriority<T extends { priority_score: number }>(
  quests: T[]
): T[] {
  return [...quests].sort((a, b) => b.priority_score - a.priority_score);
}
