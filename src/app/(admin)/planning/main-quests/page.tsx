import type { Metadata } from "next";
import MainQuestsClient from './MainQuestsClient';
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Main Quests | Better Planner",
  description: "Main Quests untuk aplikasi Better Planner",
};

export default function Page() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading Main Quests...</div>}>
      <MainQuestsClient />
    </Suspense>
  );
}
