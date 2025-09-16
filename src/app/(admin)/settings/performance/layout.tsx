import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Performance Dashboard | Better Planner",
  description: "Monitor and analyze Better Planner performance metrics",
};

export default function PerformanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
