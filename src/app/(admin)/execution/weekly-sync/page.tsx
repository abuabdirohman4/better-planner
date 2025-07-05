import type { Metadata } from "next";
import WeeklySyncClient from "./WeeklySyncClient";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Weekly Sync | Better Planner",
  description: "Pusat penjadwalan mingguan dan drag-and-drop tugas dari Main Quest Anda.",
  openGraph: {
    title: "Weekly Sync | Better Planner",
    description: "Pusat penjadwalan mingguan dan drag-and-drop tugas dari Main Quest Anda.",
    url: "/execution/weekly-sync",
    type: "website",
  },
}; 

export default function Page() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading Weekly Sync...</div>}>
      <WeeklySyncClient />
    </Suspense>
  );
} 