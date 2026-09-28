"use client";

import React, { useState, useEffect } from "react";
import { useQuarterStore } from "@/stores/quarterStore";
import { useDailyQuests } from "./hooks/useDailyQuests";
import DailyQuestList from "./components/DailyQuestList";
import Button from "@/components/ui/button/Button";
import CarryOverModal from "../components/CarryOverModal";
import { dailySyncKeys, swrMutate } from "@/lib/swr";

// Disable SSR untuk page ini karena menggunakan Zustand store
export const dynamic = 'force-dynamic';

export default function DailyQuestsPage() {
  const { year, quarter } = useQuarterStore();
  const { dailyQuests, isLoading, error, refetch, updateQuest, archiveQuest, deleteQuest } = useDailyQuests(year, quarter);
  const [isAdding, setIsAdding] = useState(false);
  const [isCarryOverOpen, setIsCarryOverOpen] = useState(false);

  // Reactive: Refetch when quarter changes
  useEffect(() => {
    refetch();
  }, [year, quarter, refetch]);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Daily <span className="text-brand-600">Quests</span>
            </h1>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setIsCarryOverOpen(true)}
              size="md"
              variant="outline"
              data-testid="carry-over-open-btn"
            >
              Ambil dari quarter sebelumnya
            </Button>
            <Button
              onClick={() => setIsAdding(true)}
              className="btn btn-primary"
              size="md"
              variant="primary"
              data-testid="daily-quest-add-btn"
            >
              Add Task
            </Button>
          </div>
        </div>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <DailyQuestList
          quests={dailyQuests}
          isLoading={isLoading}
          error={error}
          showAddForm={isAdding}
          onAddFormClose={() => setIsAdding(false)}
          onUpdate={updateQuest}
          onArchive={archiveQuest}
          onDelete={deleteQuest}
          refetch={refetch}
        />
      </div>
      <CarryOverModal
        type="DAILY_QUEST"
        year={year}
        quarter={quarter}
        isOpen={isCarryOverOpen}
        onClose={() => setIsCarryOverOpen(false)}
        onDone={() => {
          refetch();
          swrMutate(dailySyncKeys.dailyQuests(year, quarter));
        }}
      />
    </div>
  );
}
