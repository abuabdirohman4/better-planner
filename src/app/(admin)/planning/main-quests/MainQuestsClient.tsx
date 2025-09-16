"use client";
import { useState } from "react";

import ComponentCard from '@/components/common/ComponentCard';
import Spinner from '@/components/ui/spinner/Spinner';
import { useQuarter } from '@/hooks/common/useQuarter';
import { useMainQuests } from '@/hooks/planning/useQuests';

import Quest from './Quest';

export default function MainQuestsClient() {
  const { year, quarter } = useQuarter();
  const { quests, isLoading } = useMainQuests(year, quarter);
  const [activeTab, setActiveTab] = useState(0);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[800px]">
        <Spinner size={164} />
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
        {/* Mobile: Horizontal scroll, Desktop: Centered */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-evenly">
            <div className="flex min-w-max">
              {quests.map((quest, idx) => (
                <button
                  key={quest.id}
                  className={`px-3 py-2 -mb-px font-medium border-b-2 transition-colors duration-200 focus:outline-none whitespace-nowrap text-sm md:text-base md:px-4 ${activeTab === idx ? 'border-brand-500 text-brand-600 dark:text-brand-400' : 
                    'border-transparent text-gray-500 dark:text-gray-400'}`}
                  onClick={() => setActiveTab(idx)}
                >
                  <span className="hidden sm:inline">HIGH FOCUS GOAL</span>
                  <span className="sm:hidden">HFG</span>
                  <span className="ml-1">#{idx + 1}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-6">
          {quests.map((quest, idx) => (
            <div key={quest.id} style={{ display: activeTab === idx ? 'block' : 'none' }}>
              <Quest quest={quest} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 