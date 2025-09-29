"use client";

import { useState, useEffect } from "react";
import { getAllQuestsForQuarter } from "../actions";
import type { Quest } from "./useQuestState";

export interface QuestHistoryItem {
  year: number;
  quarter: number;
  quarterString: string;
  quests: Quest[];
  questCount: number;
}

/**
 * Custom hook for fetching quest history from previous quarters
 * Allows users to reuse quests from past quarters
 */
export function useQuestHistory(currentYear: number, currentQuarter: number) {
  const [questHistory, setQuestHistory] = useState<QuestHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuestHistory = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const history: QuestHistoryItem[] = [];
        
        // Get quests from previous quarters (up to 4 quarters back)
        for (let i = 1; i <= 4; i++) {
          let year = currentYear;
          let quarter = currentQuarter - i;
          
          // Handle year rollover
          if (quarter <= 0) {
            quarter += 4;
            year -= 1;
          }
          
          const quests = await getAllQuestsForQuarter(year, quarter);
          
          if (quests && quests.length > 0) {
            const questsWithLabels = quests.map(q => ({
              id: q.id,
              label: q.label || '',
              title: q.title
            }));
            
            history.push({
              year,
              quarter,
              quarterString: `Q${quarter} ${year}`,
              quests: questsWithLabels,
              questCount: questsWithLabels.length
            });
          }
        }
        
        setQuestHistory(history);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Gagal memuat riwayat quest');
        console.error('Error fetching quest history:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuestHistory();
  }, [currentYear, currentQuarter]);

  const getQuestsFromQuarter = (year: number, quarter: number): Quest[] => {
    const historyItem = questHistory.find(
      item => item.year === year && item.quarter === quarter
    );
    return historyItem?.quests || [];
  };

  const hasQuestHistory = questHistory.length > 0;

  return {
    questHistory,
    isLoading,
    error,
    getQuestsFromQuarter,
    hasQuestHistory
  };
}
