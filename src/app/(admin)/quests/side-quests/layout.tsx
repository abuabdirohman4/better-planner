import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Side Quests | Better Planner",
  description: "Manage your personal development and side projects",
};

export default function SideQuestsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
