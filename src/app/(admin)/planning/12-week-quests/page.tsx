import TwelveWeekGoalsRedirector from './TwelveWeekGoalsRedirector';
import TwelveWeekGoalsLoader from "./TwelveWeekGoalsLoader";
import { Suspense } from "react";

export const metadata = {
  title: "12 Week Quests | Better Planner",
  description: "12 Week Quests untuk aplikasi Better Planner",
};

export default function Page() {
  return  (
    <>
      <Suspense fallback={null}>
        <TwelveWeekGoalsRedirector />
      </Suspense>
      <div className="max-w-none w-full">
        <Suspense fallback={<div className="p-8 text-center">Loading 12 Week Quests...</div>}>
          <TwelveWeekGoalsLoader />
        </Suspense>
      </div>
    </>
  );
} 