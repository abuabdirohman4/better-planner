export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import WeeklySyncClientEntry from './WeeklySyncClientEntry';

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

export default function WeeklySyncPage() {
  return <WeeklySyncClientEntry />;
} 