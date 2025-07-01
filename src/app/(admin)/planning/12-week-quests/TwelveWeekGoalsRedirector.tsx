"use client";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// Komponen ini adalah client-only redirector untuk halaman 12 Week Quests.
// - Mengecek apakah URL sudah mengandung param ?q=YYYY-Qn.
// - Jika belum, otomatis redirect ke URL dengan param q sesuai quarter saat ini.
// - Bertujuan agar state, localStorage, dan URL selalu sinkron dengan quarter yang dipilih user.
// - Tidak menampilkan UI apapun.

function getWeekOfYear(date: Date) {
  const start = new Date(date.getFullYear(), 0, 1);
  const diff = (date.getTime() - start.getTime()) / 86400000;
  const day = start.getDay() || 7;
  return Math.ceil((diff + day) / 7);
}

export default function TwelveWeekGoalsRedirector() {
  const router = useRouter();
  const searchParams = useSearchParams();
  useEffect(() => {
    const qParam = searchParams.get('q');
    if (!qParam) {
      const now = new Date();
      const year = now.getFullYear();
      const week = getWeekOfYear(now);
      let quarter = 1;
      if (week >= 1 && week <= 13) quarter = 1;
      else if (week >= 14 && week <= 26) quarter = 2;
      else if (week >= 27 && week <= 39) quarter = 3;
      else quarter = 4;
      router.replace(`/planning/12-week-quests?q=${year}-Q${quarter}`);
    }
  }, [searchParams, router]);
  return null;
} 