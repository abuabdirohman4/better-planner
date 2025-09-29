import { useState } from "react";
import ComponentCard from '@/components/common/ComponentCard';
import Button from '@/components/ui/button/Button';
import TwelveWeekGoalsSkeleton from "@/components/ui/skeleton/TwelveWeekGoalsSkeleton";
import { useSidebar } from '@/stores/sidebarStore';
import { 
  useQuestState, 
  usePairwiseComparison, 
  useRankingCalculation, 
  useQuestOperations,
  useQuestHistory,
  type Quest,
  type RankedQuest 
} from "./hooks";
import { useQuarterStore } from "@/stores/quarterStore";
import QuestHistorySelector from "./components/QuestHistorySelector";

// Component for quest input
function QuestInput({ quest, idx, ranking, highlightEmpty, onQuestChange }: {
  quest: Quest;
  idx: number;
  ranking: RankedQuest[] | null;
  highlightEmpty: boolean;
  onQuestChange: (idx: number, value: string) => void;
}) {
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

// Component for quest input section
function QuestInputSection({ 
  quests, 
  ranking, 
  highlightEmpty, 
  onQuestChange, 
  onSave, 
  onShowHistory, 
  hasQuestHistory 
}: {
  quests: Quest[];
  ranking: RankedQuest[] | null;
  highlightEmpty: boolean;
  onQuestChange: (idx: number, value: string) => void;
  onSave: () => void;
  onShowHistory: () => void;
  hasQuestHistory: boolean;
}) {
  return (
    <div className="w-full md:w-1/3 md:border-r border-gray-200 dark:border-gray-700 pb-6 md:pb-8 flex flex-col justify-between">
      <ComponentCard className="text-center !shadow-none !bg-transparent !rounded-none !border-0 p-0" title="INPUT 10 QUESTS" classNameTitle="text-xl font-semibold text-gray-900 mt-4 dark:text-white">
        <div className="space-y-5">
          {quests.map((quest, idx) => (
            <QuestInput
              key={quest.label}
              quest={quest}
              idx={idx}
              ranking={ranking}
              highlightEmpty={highlightEmpty}
              onQuestChange={onQuestChange}
            />
          ))}
        </div>
      </ComponentCard>
      
      {/* Quest History Button */}
      {hasQuestHistory && (
        <div className="mt-4 mx-10">
          <Button
            type="button"
            size="md"
            variant="outline"
            onClick={onShowHistory}
            className="w-full"
          >
            📋 Gunakan Quest Sebelumnya
          </Button>
        </div>
      )}
      
      <div className="mt-2 mx-10 flex">
        <Button
          type="button"
          size="md"
          variant="primary"
          onClick={onSave}
          className="w-full"
        >
          Simpan
        </Button>
      </div>
    </div>
  );
}

// Component for pairwise comparison cell
function PairwiseCell({ rowQ, colQ, i, j, pairwiseResults, onPairwiseClick }: {
  rowQ: Quest;
  colQ: Quest;
  i: number;
  j: number;
  pairwiseResults: { [key: string]: string };
  onPairwiseClick: (row: number, col: number, winner: 'row' | 'col') => void;
}) {
  if (i === j) {
    return <td className="border px-1 py-1 bg-gray-100 text-center" />;
  }
  if (i < j) {
    const key = `${rowQ.label}-${colQ.label}`;
    const winner = pairwiseResults[key];
    return (
      <td className="border px-1 py-1 text-center">
        {winner ? (
          <span className="font-bold text-[16px] text-brand-400">{winner}</span>
        ) : (
          <div className="flex gap-1 justify-center">
            <Button
              type="button"
              size="xs"
              variant="outline"
              className="!rounded bg-brand-100 hover:bg-brand-200 text-brand-700 text-xs font-semibold border border-brand-200"
              onClick={() => onPairwiseClick(i, j, 'row')}
            >
              {rowQ.label}
            </Button>
            <Button
              type="button"
              size="xs"
              variant="outline"
              className="!rounded bg-brand-100 hover:bg-brand-200 text-brand-700 text-xs font-semibold border border-brand-200"
              onClick={() => onPairwiseClick(i, j, 'col')}
            >
              {colQ.label}
            </Button>
          </div>
        )}
      </td>
    );
  }
  return <td className="border px-1 py-1 bg-gray-100 text-center" />;
}

// Component for pairwise comparison matrix
function PairwiseMatrix({ quests, pairwiseResults, onPairwiseClick, isExpanded }: {
  quests: Quest[];
  pairwiseResults: { [key: string]: string };
  onPairwiseClick: (row: number, col: number, winner: 'row' | 'col') => void;
  isExpanded: boolean;
}) {
  return (
      <ComponentCard className="text-center !shadow-none !bg-transparent !rounded-none !border-0 p-0" title="HIGHEST FIRST" classNameTitle="text-xl font-semibold text-gray-900 mt-4 dark:text-white">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse border text-xs">
            <thead>
              <tr>
                <th className="border px-1 py-1 min-w-14 bg-gray-50" />
                {quests.map((q) => (
                  <th key={q.label} className={`border px-1 py-1 min-w-14 bg-gray-50 font-bold`}>
                    {q.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {quests.map((rowQ, i) => (
                <tr key={rowQ.label}>
                  <th
                    className={`border px-1 py-1 w-10 ${isExpanded ? 'h-[3.61rem]' : 'h-[3.71rem]'} bg-gray-50 font-bold text-center`}
                  >
                    {rowQ.label}
                  </th>
                  {quests.map((colQ, j) => (
                    <PairwiseCell
                      key={colQ.label}
                      rowQ={rowQ}
                      colQ={colQ}
                      i={i}
                      j={j}
                      pairwiseResults={pairwiseResults}
                      onPairwiseClick={onPairwiseClick}
                    />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ComponentCard>
  );
}

// Component for action buttons
function ActionButtons({ onReset, onCommit }: { onReset: () => void; onCommit: () => void }) {
  return (
    <div className="mt-2 mx-10 flex gap-2">
      <Button
        type="button"
        size="md"
        variant="outline"
        onClick={onReset}
        className="w-full"
      >
        Reset
      </Button>
      <Button
        type="button"
        size="md"
        variant="primary"
        className="w-full"
        onClick={onCommit}
      >
        Submit
      </Button>
    </div>
  );
}

export default function TwelveWeekGoalsUI({ 
  initialQuests = [], 
  initialPairwiseResults = {}, 
  loading = false 
}: { 
  initialQuests?: { id?: string, title: string, label?: string }[], 
  initialPairwiseResults?: { [key: string]: string }, 
  loading?: boolean 
}) {
  const { isExpanded } = useSidebar();
  const { year, quarter } = useQuarterStore();

  // Use separated hooks
  const { 
    quests, 
    highlightEmpty, 
    handleQuestTitleChange,
    validateQuests,
    getFilledQuests,
    importQuests,
    clearAllQuests,
    QUEST_LABELS
  } = useQuestState(initialQuests);
  
  const { 
    pairwiseResults, 
    handlePairwiseClick, 
    handleReset, 
    localKey,
    getCompletionPercentage
  } = usePairwiseComparison(quests, year, quarter, initialPairwiseResults);
  
  const { 
    ranking,
    getTopQuests,
    getQuestRank,
    isQuestInTopThree
  } = useRankingCalculation(quests, pairwiseResults, initialQuests);
  
  const { 
    handleSaveQuests, 
    handleCommit 
  } = useQuestOperations(year, quarter, quests, initialQuests);

  // Quest history hook
  const { 
    questHistory, 
    isLoading: isLoadingHistory, 
    hasQuestHistory 
  } = useQuestHistory(year, quarter);

  if (loading) {
    return <TwelveWeekGoalsSkeleton />;
  }

  const handlePairwiseClickWithQuests = (row: number, col: number, winner: 'row' | 'col') => {
    handlePairwiseClick(row, col, winner);
  };

  const handleCommitWithParams = () => {
    handleCommit(pairwiseResults, ranking, localKey);
  };

  const handleSaveWithValidation = () => {
    if (validateQuests()) {
      handleSaveQuests();
    }
  };

  // Quest history state
  const [showQuestHistory, setShowQuestHistory] = useState(false);

  const handleImportQuests = (importedQuests: Quest[]) => {
    importQuests(importedQuests);
    setShowQuestHistory(false);
  };

  return (
    <div className="w-full max-w-none bg-white dark:bg-gray-800 shadow-lg rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col md:flex-row">
      <QuestInputSection
        quests={quests}
        ranking={ranking}
        highlightEmpty={highlightEmpty}
        onQuestChange={handleQuestTitleChange}
        onSave={handleSaveWithValidation}
        onShowHistory={() => setShowQuestHistory(true)}
        hasQuestHistory={hasQuestHistory}
      />
      <div className="w-full md:w-2/3 pb-6 md:pb-8 flex flex-col">
        <PairwiseMatrix
          quests={quests}
          pairwiseResults={pairwiseResults}
          onPairwiseClick={handlePairwiseClickWithQuests}
          isExpanded={isExpanded}
        />
        <ActionButtons onReset={handleReset} onCommit={handleCommitWithParams} />
      </div>
      
      {/* Quest History Modal */}
      {showQuestHistory && (
        <QuestHistorySelector
          questHistory={questHistory}
          isLoading={isLoadingHistory}
          onSelectQuests={handleImportQuests}
          onClose={() => setShowQuestHistory(false)}
        />
      )}
    </div>
  );
} 