import React from "react";

import {
  CalenderIcon,
  GridIcon,
  PieChartIcon,
  PlugInIcon,
  UserCircleIcon,
  TaskIcon,
  EyeIcon,
  CheckCircleIcon,
  PencilIcon,
  ShootingStarIcon,
} from "@/lib/icons";

export type SubNavItem = { name: string; path: string; pro?: boolean; new?: boolean };

export type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: SubNavItem[];
};

export const executionNav: NavItem[] = [
  {
    icon: <GridIcon />,
    name: "Dashboard",
    path: "/dashboard",
  },
  {
    icon: <TaskIcon />,
    name: "Daily Sync",
    path: "/execution/daily-sync",
  },
  {
    icon: <CalenderIcon />,
    name: "Weekly Sync",
    path: "/execution/weekly-sync",
  },
  {
    icon: <CheckCircleIcon />,
    name: "Habit Tracker",
    path: "/habits/today",
  },
  {
    icon: <PencilIcon />,
    name: "Brain Dump",
    path: "/execution/brain-dump",
  },
];

export const planningNav: NavItem[] = [
  {
    icon: <EyeIcon />,
    name: "Vision",
    path: "/planning/vision",
  },
  {
    icon: <TaskIcon />,
    name: "12 Week Quests",
    path: "/planning/12-week-quests",
  },
  {
    icon: <PieChartIcon />,
    name: "Main Quests",
    path: "/planning/main-quests",
  },
  // {
  //   icon: <DocsIcon />,
  //   name: "Self Development Curriculum",
  //   path: "/planning/curriculum",
  // },
  {
    icon: <ShootingStarIcon />,
    name: "Best Week",
    path: "/planning/best-week",
  },
  {
    icon: <CheckCircleIcon />,
    name: "12 Week Sync",
    path: "/planning/12-week-sync",
  },
];

export const questsNav: NavItem[] = [
  {
    icon: <TaskIcon />,
    name: "Work Quests",
    path: "/quests/work-quests",
  },
  {
    icon: <TaskIcon />,
    name: "Daily Quests",
    path: "/quests/daily-quests",
  },
  {
    icon: <TaskIcon />,
    name: "Side Quests",
    path: "/quests/side-quests",
  },
];

export const trackingNav: NavItem[] = [
  {
    icon: <UserCircleIcon />,
    name: "AW Quests",
    path: "/aw-quests",
  },
  {
    icon: <CheckCircleIcon />,
    name: "Habit Tracker",
    path: "/habits/today",
  },
  {
    icon: <PieChartIcon />,
    name: "Reports",
    path: "/reports",
  },
];

export const settingsNav: NavItem[] = [
  // {
  //   icon: <PlugInIcon />,
  //   name: "Settings",
  //   path: "/profile",
  // },
  {
    icon: <UserCircleIcon />,
    name: "Profile",
    path: "/settings/profile",
  },
  {
    icon: <PlugInIcon />,
    name: "Notifications",
    path: "/settings/notifications",
  },
];

// Grup menu yang dipakai sidebar desktop dan sheet menu bottom nav HP.
export const navGroups: { title: string; items: NavItem[] }[] = [
  { title: "Execution", items: executionNav },
  { title: "Planning", items: planningNav },
  { title: "Quests", items: questsNav },
  { title: "Settings", items: settingsNav },
];
