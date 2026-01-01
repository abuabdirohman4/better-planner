"use client";

import React, { useEffect } from "react";
import { useQuarterStore } from "@/stores/quarterStore";
import { useSideQuests } from "./hooks/useSideQuests";
import SideQuestList from "./components/SideQuestList";

// Disable SSR untuk page ini karena menggunakan Zustand store
export const dynamic = 'force-dynamic';

export default function SideQuestsPage() {
  const { year, quarter } = useQuarterStore();
  const { sideQuests, isLoading, error, refetch, toggleStatus, updateQuest, deleteQuest } = useSideQuests(year, quarter);

  // Reactive: Refetch when quarter changes
  useEffect(() => {
    refetch();
  }, [year, quarter, refetch]);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4">
        <div className="flex items-center justify-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Side <span className="text-brand-600">Quests</span>
            </h1>
          </div>
        </div>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <SideQuestList
          quests={sideQuests}
          isLoading={isLoading}
          error={error}
          onToggleStatus={toggleStatus}
          onUpdate={updateQuest}
          onDelete={deleteQuest}
        />
      </div>
    </div>
  );
}
