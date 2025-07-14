import type { Metadata } from "next";
import MainQuestsClient from './MainQuestsClient';
import { getQuests } from '../quests/actions';
import { parseQParam } from '@/lib/quarterUtils';

export const metadata: Metadata = {
  title: "Main Quests | Better Planner",
  description: "Main Quests untuk aplikasi Better Planner",
};

export default async function Page({ searchParams }: { searchParams?: Promise<{ q?: string }> }) {
  const params = await searchParams;
  const { year, quarter } = parseQParam(params?.q || null);
  const quests = await getQuests(year, quarter, true);
  return <MainQuestsClient quests={quests || []} />;
}
