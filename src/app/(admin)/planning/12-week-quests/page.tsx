import TwelveWeekGoalsLoader from "./TwelveWeekGoalsLoader";

export const metadata = {
  title: "12 Week Quests | Better Planner",
  description: "12 Week Quests untuk aplikasi Better Planner",
};

export default function Page() {
  return  (
    <div className="max-w-none w-full">
    <TwelveWeekGoalsLoader />;
  </div>
  )
  
} 