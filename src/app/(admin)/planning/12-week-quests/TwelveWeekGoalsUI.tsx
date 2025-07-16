import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

import ComponentCard from '@/components/common/ComponentCard';
import Button from '@/components/ui/button/Button';
import Spinner from "@/components/ui/spinner/Spinner";
import CustomToast from '@/components/ui/toast/CustomToast';
import { useSidebar } from '@/context/SidebarContext';
import { useQuarter } from "@/hooks/common/useQuarter";

import { addMultipleQuests, updateQuests, finalizeQuests } from "../quests/actions";

const QUEST_LABELS = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'
];

interface Quest {
  id?: string;
  label: string;
  title: string;
}

interface RankedQuest extends Quest {
  score: number;
}

// Custom hook for quest state management
function useQuestState(initialQuests: { id?: string, title: string, label?: string }[]) {
  const [quests, setQuests] = useState<Quest[]>(
    QUEST_LABELS.map(label => ({ label, title: "" }))
  );
  const [highlightEmpty, setHighlightEmpty] = useState(false);

  useEffect(() => {
    if (initialQuests && initialQuests.length > 0) {
      const padded = QUEST_LABELS.map((label) => {
        const q = initialQuests.find(q => q.label === label);
        return q ? { id: q.id, label: label, title: q.title } : { label, title: "" };
      });
      setQuests(padded);
    } else {
      // Only reset if we don't have any quests with titles
      setQuests(prev => {
        const hasTitles = prev.some(q => q.title.trim() !== "");
        if (hasTitles) {
          return prev; // Keep existing data
        }
        return QUEST_LABELS.map(label => ({ label, title: "" }));
      });
    }
  }, [initialQuests]);

  const handleQuestTitleChange = (idx: number, value: string) => {
    setQuests(qs => {
      const next = [...qs];
      next[idx] = { ...next[idx], title: value };
      return next;
    });
    setHighlightEmpty(false);
  };

  return {
    quests,
    setQuests,
    highlightEmpty,
    setHighlightEmpty,
    handleQuestTitleChange
  };
}

// Custom hook for pairwise comparison management
function usePairwiseComparison(year: number, quarter: number, initialPairwiseResults: { [key: string]: string }) {
  const localKey = `better-planner-pairwise-${year}-Q${quarter}`;
  const [pairwiseResults, setPairwiseResults] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    // Prioritize server data over localStorage
    if (initialPairwiseResults && Object.keys(initialPairwiseResults).length > 0) {
      setPairwiseResults(initialPairwiseResults);
    } else {
      // Fallback to localStorage only if no server data
      try {
        const saved = localStorage.getItem(localKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && Object.keys(parsed).length > 0) {
            setPairwiseResults(parsed);
          }
        }
      } catch {
        // Ignore localStorage errors
      }
    }
  }, [initialPairwiseResults, localKey]);

  useEffect(() => {
    // Only save to localStorage if we have data and it's different from server data
    if (Object.keys(pairwiseResults).length > 0) {
      try {
        localStorage.setItem(localKey, JSON.stringify(pairwiseResults));
      } catch {
        // Ignore localStorage errors
      }
    }
  }, [pairwiseResults, localKey]);

  const handlePairwiseClick = (row: number, col: number, winner: 'row' | 'col', quests: Quest[]) => {
    const key = `${quests[row].label}-${quests[col].label}`;
    setPairwiseResults(prev => ({
      ...prev,
      [key]: winner === 'row' ? quests[row].label : quests[col].label
    }));
  };

  const handleReset = () => {
    setPairwiseResults({});
    if (typeof window !== 'undefined') {
      localStorage.removeItem(localKey);
    }
  };

  return {
    pairwiseResults,
    setPairwiseResults,
    handlePairwiseClick,
    handleReset,
    localKey
  };
}

// Custom hook for ranking calculation
function useRankingCalculation(quests: Quest[], pairwiseResults: { [key: string]: string }, initialQuests: { id?: string, title: string, label?: string }[]) {
  const [ranking, setRanking] = useState<RankedQuest[] | null>(null);

  useEffect(() => {
    const filledQuests = quests.filter(q => q.title.trim() !== "");
    if (filledQuests.length < 2) {
      setRanking(null);
      return;
    }
    
    const scores: { [label: string]: number } = {};
    quests.forEach(q => { scores[q.label] = 0; });
    
    Object.values(pairwiseResults).forEach(winner => {
      if (scores[winner] !== undefined) scores[winner] += 1;
    });
    
    const result = quests.map((q) => {
      const initial = initialQuests.find(init => init.label === q.label);
      return {
        ...q,
        score: scores[q.label] || 0,
        id: initial?.id,
      };
    }).sort((a, b) => b.score - a.score);
    
    setRanking(result);
  }, [quests, pairwiseResults, initialQuests]);

  return { ranking };
}

// Custom hook for quest operations
function useQuestOperations(year: number, quarter: number, quests: Quest[], initialQuests: { id?: string, title: string, label?: string }[]) {
  const router = useRouter();

  const handleSaveQuests = async () => {
    const questsWithId = quests.filter(q => q.id);
    const newQuests = quests.filter(q => !q.id && q.title.trim() !== "");
    try {
      if (questsWithId.length > 0) {
        await updateQuests(questsWithId.map(q => ({ id: q.id!, title: q.title, label: q.label })));
      }
      if (newQuests.length > 0) {
        await addMultipleQuests(newQuests.map(q => ({ title: q.title, label: q.label })), year, quarter);
      }
      CustomToast.success("Quest berhasil disimpan/diupdate!");
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Gagal menyimpan quest.";
      CustomToast.error(errorMsg);
    }
  };

  const handleCommit = async (pairwiseResults: { [key: string]: string }, ranking: RankedQuest[] | null, localKey: string) => {
    if (!ranking) return;
    try {
      const scores: { [label: string]: number } = {};
      quests.forEach(q => { scores[q.label] = 0; });
      Object.values(pairwiseResults).forEach(winner => {
        if (scores[winner] !== undefined) scores[winner] += 1;
      });
      const questsWithScore = quests
        .map((q, idx) => ({
          id: initialQuests[idx]?.id,
          title: q.title,
          priority_score: scores[q.label] || 0,
        }))
        .filter((q): q is { id: string; title: string; priority_score: number } => typeof q.id === 'string');
      const result = await finalizeQuests(pairwiseResults, questsWithScore, year, quarter);
      localStorage.removeItem(localKey);
      CustomToast.success(result?.message || "Prioritas berhasil ditentukan dan 3 Main Quest telah ditetapkan!");
      if (result?.url) router.push(result.url);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Gagal commit main quest.";
      CustomToast.error(errorMsg);
    }
  };

  return { handleSaveQuests, handleCommit };
}

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
function QuestInputSection({ quests, ranking, highlightEmpty, onQuestChange, onSave }: {
  quests: Quest[];
  ranking: RankedQuest[] | null;
  highlightEmpty: boolean;
  onQuestChange: (idx: number, value: string) => void;
  onSave: () => void;
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

export default function TwelveWeekGoalsUI({ initialQuests = [], initialPairwiseResults = {}, loading = false }: { initialQuests?: { id?: string, title: string, label?: string }[], initialPairwiseResults?: { [key: string]: string }, loading?: boolean }) {
  const { isExpanded } = useSidebar();
  const { year, quarter } = useQuarter();

  const { quests, highlightEmpty, handleQuestTitleChange } = useQuestState(initialQuests);
  const { pairwiseResults, handlePairwiseClick, handleReset, localKey } = usePairwiseComparison(year, quarter, initialPairwiseResults);
  const { ranking } = useRankingCalculation(quests, pairwiseResults, initialQuests);
  const { handleSaveQuests, handleCommit } = useQuestOperations(year, quarter, quests, initialQuests);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[800px]">
        <Spinner size={164} />
      </div>
    );
  }

  const handlePairwiseClickWithQuests = (row: number, col: number, winner: 'row' | 'col') => {
    handlePairwiseClick(row, col, winner, quests);
  };

  const handleCommitWithParams = () => {
    handleCommit(pairwiseResults, ranking, localKey);
  };

  return (
    <div className="w-full max-w-none bg-white dark:bg-gray-800 shadow-lg rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col md:flex-row">
      <QuestInputSection
        quests={quests}
        ranking={ranking}
        highlightEmpty={highlightEmpty}
        onQuestChange={handleQuestTitleChange}
        onSave={handleSaveQuests}
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
    </div>
  );
} 