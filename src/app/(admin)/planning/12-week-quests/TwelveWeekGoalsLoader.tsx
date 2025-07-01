"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getUncommittedQuests } from "../quests/actions";
import TwelveWeekGoalsUI from "./TwelveWeekGoalsUI";

// Komponen ini adalah client data loader/wrapper untuk 12 Week Goals.
// - Membaca quarter & year dari URL param `q`.
// - Melakukan fetch quest dari server (getUncommittedQuests).
// - Meneruskan hasil fetch ke komponen presentasi TwelveWeekGoalsUI melalui props.
// - Tidak ada UI/logic presentasi di sini.

function getWeekOfYear(date: Date) {
  const start = new Date(date.getFullYear(), 0, 1);
  const diff = (date.getTime() - start.getTime()) / 86400000;
  const day = start.getDay() || 7;
  return Math.ceil((diff + day) / 7);
}

function parseQParam(q: string | null): { year: number; quarter: number } {
  if (!q) {
    const now = new Date();
    const week = getWeekOfYear(now);
    let quarter = 1;
    if (week >= 1 && week <= 13) quarter = 1;
    else if (week >= 14 && week <= 26) quarter = 2;
    else if (week >= 27 && week <= 39) quarter = 3;
    else quarter = 4;
    return { year: now.getFullYear(), quarter };
  }
  const match = q.match(/(\d{4})-Q([1-4])/);
  if (match) {
    return { year: parseInt(match[1]), quarter: parseInt(match[2]) };
  }
  // fallback
  const now = new Date();
  const week = getWeekOfYear(now);
  let quarter = 1;
  if (week >= 1 && week <= 13) quarter = 1;
  else if (week >= 14 && week <= 26) quarter = 2;
  else if (week >= 27 && week <= 39) quarter = 3;
  else quarter = 4;
  return { year: now.getFullYear(), quarter };
}

export default function TwelveWeekGoalsLoader() {
  const searchParams = useSearchParams();
  const qParam = searchParams.get("q");
  const { year, quarter } = parseQParam(qParam);
  const [quests, setQuests] = useState<{ id?: string; title: string }[]>([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    setLoading(true);
    getUncommittedQuests(year, quarter).then(result => {
      setQuests(result);
      setLoading(false);
    });
  }, [year, quarter]);
  return <TwelveWeekGoalsUI initialQuests={quests} loading={loading} />;
} 