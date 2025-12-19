"use client";

import React, { useState } from "react";
import DailyQuestList from "./components/DailyQuestList";
import Button from "@/components/ui/button/Button";

export default function DailyQuestsPage() {
  const [isAdding, setIsAdding] = useState(false);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Daily <span className="text-brand-600">Quests</span>
            </h1>
          </div>
          <Button
            onClick={() => setIsAdding(true)}
            className="btn btn-primary"
            size="md"
            variant="primary"
          >
            Add Task
          </Button>
        </div>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <DailyQuestList
          showAddForm={isAdding}
          onAddFormClose={() => setIsAdding(false)}
        />
      </div>
    </div>
  );
}
