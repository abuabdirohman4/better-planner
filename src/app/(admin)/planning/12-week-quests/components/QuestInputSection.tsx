import ComponentCard from '@/components/common/ComponentCard';
import Button from '@/components/ui/button/Button';
import type { Quest, RankedQuest } from "../hooks";
import QuestInput from './QuestInput';

interface QuestInputSectionProps {
  quests: Quest[];
  ranking: RankedQuest[] | null;
  highlightEmpty: boolean;
  onQuestChange: (idx: number, value: string) => void;
  onSave: () => void;
  onShowHistory: () => void;
  hasQuestHistory: boolean;
  isLoadingHistory?: boolean;
}

export default function QuestInputSection({ 
  quests, 
  ranking, 
  highlightEmpty, 
  onQuestChange, 
  onSave, 
  onShowHistory, 
  hasQuestHistory,
  isLoadingHistory = false
}: QuestInputSectionProps) {
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
      {isLoadingHistory ? (
        <div className="mx-10">
          <div className="w-full h-11 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse flex items-center justify-center">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
              <div className="w-32 h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      ) : hasQuestHistory ? (
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
      ) : null}
      
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
