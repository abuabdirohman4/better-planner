"use client";

import { useRouter } from "next/navigation";
import { toast } from 'sonner';
import type { Quest } from './useQuestState';
import type { RankedQuest } from './useRankingCalculation';
import { saveQuests, finalizeQuests } from '../actions';

/**
 * Custom hook for quest operations (save, commit)
 * Handles all quest-related API operations with proper error handling
 */
export function useQuestOperations(
  year: number, 
  quarter: number, 
  quests: Quest[], 
  initialQuests: { id?: string, title: string, label?: string }[]
) {
  const router = useRouter();

  const handleSaveQuests = async () => {
    try {
      const result = await saveQuests(quests, year, quarter);
      
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Gagal menyimpan quest.";
      toast.error(errorMsg);
    }
  };

  const handleCommit = async (
    pairwiseResults: { [key: string]: string }, 
    ranking: RankedQuest[] | null, 
    localKey: string
  ) => {
    if (!ranking) {
      toast.error("Tidak ada ranking yang tersedia untuk di-commit.");
      return;
    }

    try {
      // Calculate scores for all quests
      const scores: { [label: string]: number } = {};
      quests.forEach(q => { scores[q.label] = 0; });
      Object.values(pairwiseResults).forEach(winner => {
        if (scores[winner] !== undefined) scores[winner] += 1;
      });

      // Prepare quests with scores for finalization
      const questsWithScore = quests
        .map((q, idx) => ({
          id: initialQuests[idx]?.id,
          title: q.title,
          priority_score: scores[q.label] || 0,
        }))
        .filter((q): q is { id: string; title: string; priority_score: number } => 
          typeof q.id === 'string'
        );

      const result = await finalizeQuests(pairwiseResults, questsWithScore, year, quarter);
      
      if (result.success) {
        // Clear localStorage after successful commit
        if (typeof window !== 'undefined') {
          localStorage.removeItem(localKey);
        }
        
        toast.success(result.message);
        
        if (result.url) {
          router.push(result.url);
        }
      } else {
        toast.error(result.message);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Gagal commit main quest.";
      toast.error(errorMsg);
    }
  };

  return { 
    handleSaveQuests, 
    handleCommit 
  };
}
