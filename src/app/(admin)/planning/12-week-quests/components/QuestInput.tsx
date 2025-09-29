import type { Quest, RankedQuest } from "../hooks";

interface QuestInputProps {
  quest: Quest;
  idx: number;
  ranking: RankedQuest[] | null;
  highlightEmpty: boolean;
  onQuestChange: (idx: number, value: string) => void;
}

export default function QuestInput({ 
  quest, 
  idx, 
  ranking, 
  highlightEmpty, 
  onQuestChange 
}: QuestInputProps) {
  let rankIdx = -1;
  let score = 0;
  if (ranking) {
    const found = ranking.find((r) => r.label === quest.label);
    if (found) {
      rankIdx = ranking.indexOf(found);
      score = found.score;
    }
  }
  const highlight = rankIdx > -1 && rankIdx < 3 && score > 0;

  return (
    <div
      className={`flex items-center gap-2 pl-1 relative rounded transition-colors ${highlight ? 'bg-brand-100 border border-brand-400' : ''}`}
    >
      <span className="w-6 text-right font-bold dark:text-white/90">{quest.label}.</span>
      <input
        className={`flex-1 h-11 rounded-lg border px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-400 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800 ${highlightEmpty && !quest.title.trim() ? 'border-red-500 ring-2 ring-red-200' : ''}`}
        placeholder={`Quest ${idx+1}`}
        value={quest.title}
        onChange={e => onQuestChange(idx, e.target.value)}
        required
      />
      <div className="absolute right-0 top-1/2 -translate-y-1/2 mr-2">
        <span className="inline-block min-w-[28px] px-2 py-0.5 rounded bg-gray-200 text-xs font-bold text-gray-700 border border-gray-300 text-center select-none">
          {score}
        </span>
      </div>
    </div>
  );
}
