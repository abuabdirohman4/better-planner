"use client";

import React from "react";
import SideQuestList from "./components/SideQuestList";

export default function SideQuestsPage() {
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
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Daftar Side Quest
        </h2>
        <SideQuestList />
      </div>
    </div>
  );
}
