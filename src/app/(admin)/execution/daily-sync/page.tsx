import type { Metadata } from "next";
import { getDailyPlan } from "./actions";
import DailySyncClient from "./DailySyncClient";

export const metadata: Metadata = {
  title: "Daily Sync | Better Planner",
  description: "Daily Sync untuk aplikasi Better Planner",
};

const getTodayDate = () => {
  const today = new Date();
  return today.toISOString().slice(0, 10);
};

export default async function DailySyncPage() {
  const today = getTodayDate();
  const plan = await getDailyPlan(today);
  return <DailySyncClient initialPlan={plan} today={today} />;
}
