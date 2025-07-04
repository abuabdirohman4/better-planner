"use client";
import { useEffect, useState } from "react";
import { getAllQuestsForQuarter, getPairwiseResults } from "../quests/actions";
import TwelveWeekGoalsUI from "./TwelveWeekGoalsUI";
import { useQuarter } from "@/hooks/useQuarter";

// Komponen ini adalah client data loader/wrapper untuk 12 Week Goals.
// - Membaca quarter & year dari URL param `q` menggunakan useQuarter hook.
// - Melakukan fetch quest dari server (getAllQuestsForQuarter).
// - Meneruskan hasil fetch ke komponen presentasi TwelveWeekGoalsUI melalui props.
// - Tidak ada UI/logic presentasi di sini.

export default function TwelveWeekGoalsLoader() {
  const { year, quarter } = useQuarter();
  const [quests, setQuests] = useState<{ id?: string; title: string; is_committed?: boolean; priority_score?: number }[]>([]);
  const [pairwiseResults, setPairwiseResults] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    setLoading(true);
    Promise.all([
      getAllQuestsForQuarter(year, quarter),
      getPairwiseResults(year, quarter),
    ]).then(([questsResult, pairwiseResult]) => {
      setQuests(questsResult);
      if (pairwiseResult) {
        setPairwiseResults(pairwiseResult);
      } else {
        // Fallback ke localStorage jika belum ada di DB
        try {
          const localKey = `better-planner-pairwise-${year}-Q${quarter}`;
          const saved = localStorage.getItem(localKey);
          if (saved) setPairwiseResults(JSON.parse(saved));
        } catch {}
      }
      setLoading(false);
    });
  }, [year, quarter]);
  
  return <TwelveWeekGoalsUI initialQuests={quests} initialPairwiseResults={pairwiseResults} loading={loading} />;
} 