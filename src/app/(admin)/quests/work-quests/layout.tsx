import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Work Quests | Better Planner",
  description: "Manage your professional project tasks",
};

export default function WorkQuestsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
