"use client";

import { useQuarter } from "@/hooks/common/useQuarter";
import { useQuestsAndPairwise } from "@/hooks/planning/useQuests";

import TwelveWeekGoalsUI from "./TwelveWeekGoalsUI";

// Komponen ini adalah client data loader/wrapper untuk 12 Week Goals.
// - Membaca quarter & year dari URL param `q` menggunakan useQuarter hook.
// - Melakukan fetch quest dari server (getAllQuestsForQuarter).
// - Meneruskan hasil fetch ke komponen presentasi TwelveWeekGoalsUI melalui props.
// - Tidak ada UI/logic presentasi di sini.

export default function TwelveWeekGoalsLoader() {
  const { year, quarter } = useQuarter();
  const { quests, pairwiseResults, error, isLoading } = useQuestsAndPairwise(year, quarter);

  // Handle localStorage fallback for pairwise results only if server data is empty
  const finalPairwiseResults = pairwiseResults || (() => {
    try {
      const localKey = `better-planner-pairwise-${year}-Q${quarter}`;
      const saved = localStorage.getItem(localKey);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  })();

  if (error) {
    console.error('Error loading data:', error);
  }
  
  return (
    <TwelveWeekGoalsUI 
      initialQuests={quests} 
      initialPairwiseResults={finalPairwiseResults} 
      loading={isLoading} 
    />
  );
} 