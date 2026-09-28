"use client";

import React, { useState, useEffect } from "react";
import { useQuarterStore } from "@/stores/quarterStore";
import { useSideQuests } from "./hooks/useSideQuests";
import SideQuestList from "./components/SideQuestList";
import Button from "@/components/ui/button/Button";
import { toast } from "sonner";
import CarryOverModal from "../components/CarryOverModal";
import CarryOverButton from "../components/CarryOverButton";

// Disable SSR untuk page ini karena menggunakan Zustand store
export const dynamic = 'force-dynamic';

export default function SideQuestsPage() {
  const { year, quarter } = useQuarterStore();
  const { sideQuests, isLoading, error, refetch, toggleStatus, updateQuest, deleteQuest, addQuest } = useSideQuests(year, quarter);
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isCarryOverOpen, setIsCarryOverOpen] = useState(false);

  // Reactive: Refetch when quarter changes
  useEffect(() => {
    refetch();
  }, [year, quarter, refetch]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setIsSaving(true);
    try {
      await addQuest(newTitle);
      toast.success("Side quest ditambahkan");
      setNewTitle("");
      setIsAdding(false);
    } catch {
      toast.error("Gagal menambah side quest");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Side <span className="text-brand-600">Quests</span>
            </h1>
          </div>
          <div className="flex gap-2 shrink-0">
            <CarryOverButton onClick={() => setIsCarryOverOpen(true)} />
            <Button
              onClick={() => setIsAdding(true)}
              className="btn btn-primary whitespace-nowrap"
              size="md"
              variant="primary"
              data-testid="side-quest-add-btn"
            >
              Add Task
            </Button>
          </div>
        </div>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        {isAdding && (
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border border-gray-200 dark:border-gray-800 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Tambah Side Quest Baru</h3>
              <button onClick={() => setIsAdding(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleAdd} className="flex gap-3">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Contoh: Belajar Next.js..."
                className="flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                autoFocus
                data-testid="side-quest-new-title-input"
              />
              <Button
                type="submit"
                disabled={isSaving || !newTitle.trim()}
                loading={isSaving}
                size="sm"
                data-testid="side-quest-submit-btn"
              >
                Tambah
              </Button>
            </form>
          </div>
        )}
        <SideQuestList
          quests={sideQuests}
          isLoading={isLoading}
          error={error}
          onToggleStatus={toggleStatus}
          onUpdate={updateQuest}
          onDelete={deleteQuest}
        />
      </div>

      <CarryOverModal
        type="SIDE_QUEST"
        year={year}
        quarter={quarter}
        isOpen={isCarryOverOpen}
        onClose={() => setIsCarryOverOpen(false)}
        onDone={refetch}
      />
    </div>
  );
}
