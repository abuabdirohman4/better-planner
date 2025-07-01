import type { Metadata } from "next";
import TwelveWeekGoals from "./TwelveWeekGoals";
import { getUncommittedQuests } from "../quests/actions";

export const metadata: Metadata = {
  title: "12 Week Quests | Better Planner",
  description: "12 Week Quests untuk aplikasi Better Planner",
};

export default async function Page({ searchParams }: { searchParams?: Promise<{ q?: string }> }) {
  // HARUS await di baris paling atas!
  const params = await searchParams;
  const qParam = params?.q;
  let year: number, quarter: number;
  if (qParam) {
    const [q, y] = qParam.split(' ');
    quarter = Number(q.replace('Q', ''));
    year = Number(y);
  } else {
    const now = new Date();
    year = now.getFullYear();
    quarter = Math.floor(now.getMonth() / 3) + 1;
  }

  const quests = await getUncommittedQuests(year, quarter);

  return <TwelveWeekGoals year={year} quarter={quarter} initialQuests={quests} />;
} 