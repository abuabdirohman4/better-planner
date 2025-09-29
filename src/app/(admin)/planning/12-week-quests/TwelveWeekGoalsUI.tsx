import { useState } from "react";
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
import QuestInputSection from "./components/QuestInputSection";
import PairwiseMatrix from "./components/PairwiseMatrix";
import ActionButtons from "./components/ActionButtons";


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