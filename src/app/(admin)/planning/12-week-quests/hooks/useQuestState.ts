"use client";

import { useState, useEffect } from "react";

const QUEST_LABELS = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'
];

export interface Quest {
  id?: string;
  label: string;
  title: string;
}

/**
 * Custom hook for managing quest state and input handling
 * Handles quest initialization, updates, and validation
 */
export function useQuestState(initialQuests: { id?: string, title: string, label?: string }[]) {
  const [quests, setQuests] = useState<Quest[]>(
    QUEST_LABELS.map(label => ({ label, title: "" }))
  );
  const [highlightEmpty, setHighlightEmpty] = useState(false);

  useEffect(() => {
    if (initialQuests && initialQuests.length > 0) {
      const padded = QUEST_LABELS.map((label) => {
        const q = initialQuests.find(q => q.label === label);
        return q ? { id: q.id, label: label, title: q.title } : { label, title: "" };
      });
      setQuests(padded);
    } else {
      // Only reset if we don't have any quests with titles
      setQuests(prev => {
        const hasTitles = prev.some(q => q.title.trim() !== "");
        if (hasTitles) {
          return prev; // Keep existing data
        }
        return QUEST_LABELS.map(label => ({ label, title: "" }));
      });
    }
  }, [initialQuests?.length, initialQuests?.map(q => `${q.id}-${q.title}`).join(',')]);

  const handleQuestTitleChange = (idx: number, value: string) => {
    setQuests(qs => {
      const next = [...qs];
      next[idx] = { ...next[idx], title: value };
      return next;
    });
    setHighlightEmpty(false);
  };

  const validateQuests = () => {
    const emptyQuests = quests.filter(q => q.title.trim() === "");
    if (emptyQuests.length > 0) {
      setHighlightEmpty(true);
      return false;
    }
    return true;
  };

  const getFilledQuests = () => quests.filter(q => q.title.trim() !== "");

  const importQuests = (importedQuests: Quest[]) => {
    // Map imported quests to current quest structure
    // Only replace quests that have matching labels, keep others unchanged
    setQuests(prev => {
      const newQuests = [...prev];
      
      importedQuests.forEach(imported => {
        const index = newQuests.findIndex(q => q.label === imported.label);
        if (index !== -1) {
          newQuests[index] = {
            id: imported.id,
            label: imported.label,
            title: imported.title
          };
        }
      });
      
      return newQuests;
    });
    
    setHighlightEmpty(false);
  };

  const clearAllQuests = () => {
    setQuests(QUEST_LABELS.map(label => ({ label, title: "" })));
    setHighlightEmpty(false);
  };

  return {
    quests,
    setQuests,
    highlightEmpty,
    setHighlightEmpty,
    handleQuestTitleChange,
    validateQuests,
    getFilledQuests,
    importQuests,
    clearAllQuests,
    QUEST_LABELS
  };
}
