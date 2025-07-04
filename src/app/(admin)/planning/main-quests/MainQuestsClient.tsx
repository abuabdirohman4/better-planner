"use client";
import { useEffect, useState } from "react";
import QuestWorkspace from './QuestWorkspace';
import ComponentCard from '@/components/common/ComponentCard';
import { getQuests } from '../quests/actions';
import { useQuarter } from "@/hooks/useQuarter";

export default function MainQuestsClient() {
  const { year, quarter } = useQuarter();
  const [quests, setQuests] = useState<{ id: string; title: string; motivation?: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    setLoading(true);
    (async () => {
      try {
        const data = await getQuests(year, quarter, true);
        setQuests(data || []);
      } catch {
        setQuests([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [year, quarter]);

  if (loading) {
    return (
      <ComponentCard title="Loading..." className="mb-4">
        <p className="text-gray-600">Memuat data Main Quest...</p>
      </ComponentCard>
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
      {/* <h1 className="text-2xl text-center font-bold mb-6">Main Quest 🎯</h1> */}
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