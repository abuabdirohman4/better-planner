import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Daily Quests | Better Planner",
  description: "Manage your daily recurring tasks",
};

export default function DailyQuestsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
