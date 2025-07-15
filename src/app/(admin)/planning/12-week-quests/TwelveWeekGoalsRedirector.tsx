"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

import { getWeekOfYear, getQuarterFromWeek, formatQParam } from "@/lib/quarterUtils";

// Komponen ini adalah client-only redirector untuk halaman 12 Week Quests.
// - Mengecek apakah URL sudah mengandung param ?q=YYYY-Qn.
// - Jika belum, otomatis redirect ke URL dengan param q sesuai quarter saat ini.
// - Bertujuan agar state, localStorage, dan URL selalu sinkron dengan quarter yang dipilih user.
// - Tidak menampilkan UI apapun.

export default function TwelveWeekGoalsRedirector() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  useEffect(() => {
    const qParam = searchParams.get('q');
    if (!qParam) {
      const now = new Date();
      const year = now.getFullYear();
      const week = getWeekOfYear(now);
      const quarter = getQuarterFromWeek(week);
      const qParamValue = formatQParam(year, quarter);
      router.replace(`/planning/12-week-quests?q=${qParamValue}`);
    }
  }, [searchParams, router]);
  
  return null;
} 