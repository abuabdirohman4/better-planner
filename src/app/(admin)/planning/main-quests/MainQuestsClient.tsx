"use client";
import { useState } from "react";

import ComponentCard from '@/components/common/ComponentCard';
import Spinner from '@/components/ui/spinner/Spinner';
import { useQuarter } from '@/hooks/useQuarter';
import { useMainQuests } from '@/hooks/useQuests';

import QuestWorkspace from './QuestWorkspace';

export default function MainQuestsClient() {
  const { year, quarter } = useQuarter();
  const { quests, isLoading } = useMainQuests(year, quarter);
  const [activeTab, setActiveTab] = useState(0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size={64} />
      </div>
    );
  }

  if (!quests || quests.length === 0) {
    return (
      <ComponentCard title="Belum ada Main Quest" className="mb-4">
        <p className="text-gray-600">Belum ada Main Quest yang di-commit untuk kuartal ini.</p>
      </ComponentCard>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-2 md:px-0">
      <div className="mb-6">
        <div className="flex justify-evenly border-b border-gray-200 dark:border-gray-700 mx-36">
          {quests.map((quest, idx) => (
            <button
              key={quest.id}
              className={`px-4 py-2 -mb-px font-medium border-b-2 transition-colors duration-200 focus:outline-none ${activeTab === idx ? 'border-brand-500 text-brand-600 dark:text-brand-400' : 'border-transparent text-gray-500 dark:text-gray-400'}`}
              onClick={() => setActiveTab(idx)}
            >
              HIGH FOCUS GOAL #{idx + 1}
            </button>
          ))}
        </div>
        <div className="mt-6">
          {quests.map((quest, idx) => (
            <div key={quest.id} style={{ display: activeTab === idx ? 'block' : 'none' }}>
              <QuestWorkspace quest={quest} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 