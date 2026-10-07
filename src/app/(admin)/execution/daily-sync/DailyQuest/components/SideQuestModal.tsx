"use client";

import React, { useState, useEffect, useRef } from "react";
import { useQuarterStore } from "@/stores/quarterStore";
import { useSideQuests } from "@/app/(admin)/quests/side-quests/hooks/useSideQuests";
import type { SideQuest } from '@/types/side-quest';
import QuestPickerShell from "./QuestPickerShell";
import QuestPickRow from "./QuestPickRow";
import { TaskItemSkeleton } from "@/components/ui/skeleton";

interface SideQuestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (selectedQuests: SideQuest[]) => void;
  selectedCount?: number;
  completedTodayCount?: number;
  existingSideQuests?: string[]; // Array of existing side quest IDs for today
  tabs?: React.ReactNode;
  /** Pilihan terkini, untuk simpan gabungan dengan tab Daily (app-mgsb). */
  onSelectionChange?: (quests: SideQuest[]) => void;
}

const SideQuestModal: React.FC<SideQuestModalProps> = ({
  isOpen,
  onClose,
  onSave,
  tabs,
  onSelectionChange,
  selectedCount = 0,
  completedTodayCount = 0,
  existingSideQuests = [],
}) => {
  const { year, quarter } = useQuarterStore();
  const { sideQuests, isLoading, error, refetch: refetchSideQuests } = useSideQuests(year, quarter);
  // Cache 2 menit: ambil ulang tiap modal dibuka supaya Side Quest baru langsung terlihat.
  useEffect(() => {
    if (isOpen) refetchSideQuests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);
  const [selectedTasks, setSelectedTasks] = useState<SideQuest[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCompleted, setShowCompleted] = useState(true);
  
  // Initialize state with data from localStorage
  const getInitialExpandedItems = (): Set<string> => {
    if (typeof window === 'undefined') return new Set<string>();
    
    try {
      const expandedKey = 'sidequest-modal-expanded';
      const saved = localStorage.getItem(expandedKey);
      if (saved) {
        const expandedArray: string[] = JSON.parse(saved);
        return new Set(expandedArray);
      }
    } catch (error) {
      console.warn('Failed to load initial expanded state:', error);
    }
    return new Set<string>();
  };

  const [expandedItems, setExpandedItems] = useState<Set<string>>(getInitialExpandedItems);
  const isInitialLoad = useRef(true);
  
  // Cookie key untuk menyimpan expanded state
  const expandedKey = 'sidequest-modal-expanded';

  // Save expanded state to localStorage whenever it changes (but not on initial load)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      return; // Skip saving during initial load
    }
    
    try {
      const expandedArray = Array.from(expandedItems);
      localStorage.setItem(expandedKey, JSON.stringify(expandedArray));
    } catch (error) {
      console.warn('Failed to save expanded state to localStorage:', error);
    }
  }, [expandedItems, expandedKey]);

  // Filter side quests based on search term and completed status
  const filteredSideQuests = sideQuests.filter(quest => {
    const matchesSearch = quest.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         quest.description?.toLowerCase().includes(searchTerm.toLowerCase());
    // Semua yang belum DONE, termasuk IN_PROGRESS.
    const matchesCompleted = quest.status !== 'DONE';
    return matchesSearch && matchesCompleted;
  });

  // Toggle expanded state
  const toggleExpanded = (questId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questId)) {
        newSet.delete(questId);
      } else {
        newSet.add(questId);
      }
      return newSet;
    });
  };

  // Handle task selection
  const handleTaskToggle = (quest: SideQuest) => {
    setSelectedTasks(prev => {
      const isSelected = prev.some(task => task.id === quest.id);
      if (isSelected) {
        return prev.filter(task => task.id !== quest.id);
      } else {
        return [...prev, quest];
      }
    });
  };

  // Handle save
  useEffect(() => {
    onSelectionChange?.(selectedTasks);
  }, [selectedTasks, onSelectionChange]);

  const handleSave = () => {
    onSave(selectedTasks);
    onClose();
  };

  // Isi pilihan awal dari rencana SEKALI per pembukaan modal. Dulu jalan tiap halaman induk render ulang
  // (existingSideQuests = array baru), jadi centang langsung dibatalkan begitu pilihan dikirim ke induk.
  const initialized = useRef(false);
  useEffect(() => {
    if (!isOpen) {
      initialized.current = false;
      return;
    }
    if (initialized.current || sideQuests.length === 0) return;
    initialized.current = true;
    setSelectedTasks(sideQuests.filter(quest => existingSideQuests.includes(quest.id)));
  }, [isOpen, sideQuests, existingSideQuests]);

  // Reset selection when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedTasks([]);
      setSearchTerm("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <QuestPickerShell
      title="Tugas Lain"
      selectedCount={selectedCount}
      completedTodayCount={completedTodayCount}
      onClose={onClose}
      onSave={handleSave}
      tabs={tabs}
    >
      {isLoading ? (
        <TaskItemSkeleton count={3} showButton={false} />
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-red-500">Error: {error}</p>
        </div>
      ) : filteredSideQuests.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">Belum ada Side Quest di kuartal ini</p>
        </div>
      ) : (
        <div className="space-y-1">
          {filteredSideQuests.map((quest) => (
            <QuestPickRow
              key={quest.id}
              title={quest.title || 'Untitled Task'}
              selected={selectedTasks.some(task => task.id === quest.id)}
              done={quest.status === 'DONE'}
              onToggle={() => handleTaskToggle(quest)}
            />
          ))}
        </div>
      )}
    </QuestPickerShell>
  );
};

export default SideQuestModal;
