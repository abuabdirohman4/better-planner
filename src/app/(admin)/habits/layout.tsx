import { Metadata } from "next";
import HabitsTabLayout from "./HabitsTabLayout";

export const metadata: Metadata = {
  title: "Habits | Better Planner",
  description: "Track and manage your daily habits",
};

export default function HabitsLayout({ children }: { children: React.ReactNode }) {
  return <HabitsTabLayout>{children}</HabitsTabLayout>;
}
