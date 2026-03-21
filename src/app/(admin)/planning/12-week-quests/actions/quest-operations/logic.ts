export interface QuestInput {
  id?: string;
  title: string;
  label?: string;
  type?: string;
  source_quest_id?: string;
  is_continuation?: boolean;
  continuation_strategy?: string;
  continuation_date?: string;
}

export interface SeparatedQuests {
  questsWithId: QuestInput[];
  newQuests: QuestInput[];
  emptyQuests: QuestInput[];
}

export function separateQuestsByState(quests: QuestInput[]): SeparatedQuests {
  const filledQuests = quests.filter(q => q.title.trim() !== '');
  const questsWithId = filledQuests.filter(q => q.id);
  const newQuests = filledQuests.filter(q => !q.id);
  const emptyQuests = quests.filter(q => !q.title.trim() && q.id);
  return { questsWithId, newQuests, emptyQuests };
}

export function buildQuestInsertPayload(
  quest: QuestInput,
  userId: string,
  year: number,
  quarter: number
) {
  return {
    title: quest.title,
    label: quest.label,
    type: 'PERSONAL',
    year,
    quarter,
    user_id: userId,
    source_quest_id: quest.source_quest_id || null,
    is_continuation: quest.is_continuation || false,
    continuation_strategy: quest.continuation_strategy || null,
    continuation_date: quest.continuation_date || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export function sortQuestsByScore<T extends { priority_score: number }>(quests: T[]): T[] {
  return [...quests].sort((a, b) => b.priority_score - a.priority_score);
}

export function getTop3Quests<T extends { priority_score: number }>(quests: T[]): T[] {
  return sortQuestsByScore(quests).slice(0, 3);
}

export function buildFinalizeResult(
  top3Quests: { title: string; priority_score: number }[]
) {
  const top3Titles = top3Quests.map(q => q.title).join(', ');
  return {
    success: true,
    message: `Prioritas berhasil ditentukan! Top 3 quest: ${top3Titles}`,
    url: '/planning/main-quests',
  };
}
