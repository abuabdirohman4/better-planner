import { PrismaClient } from "@prisma/client";
export type TimeLog = PrismaClient["timeLog"];
export type User = PrismaClient["user"];

export interface BulletPoint {
  id?: number;
  text: string;
  indent: number;
  order: number;
}

// Client Model
export interface Client {
  id: number;
  email: string;
  name?: string;
  Vision?: Vision[];
  HighFocusGoal?: HighFocusGoal[];
  SelfDevelopmentCurriculum?: SelfDevelopmentCurriculum[];
  Task?: Task[];
  ToDontList?: ToDontList[];
  BrainDump?: BrainDump[];
}

// Period Model
export interface Period {
  id: number;
  year: number;
  quarter: number;
  startDate: Date;
  endDate: Date;
  StatusHighFocusGoal?: StatusHighFocusGoal[];
}

// VisionCategory Model
export interface VisionCategory {
  id: number;
  name: string;
  Vision?: Vision[];
}

// Vision Model
export interface Vision {
  id: number;
  Client: Client;
  clientId: number;
  name?: string;
  period?: string;
  category: number;
  VisionCategory: VisionCategory;
}

// HighFocusGoal Model
export interface HighFocusGoal {
  id: number;
  Client: Client;
  clientId: number;
  name: string;
  motivation: string;
  Task?: Task[];
  SelfDevelopmentCurriculum?: SelfDevelopmentCurriculum[];
  StatusHighFocusGoal?: StatusHighFocusGoal[];
}

// StatusHighFocusGoal Model
export interface StatusHighFocusGoal {
  id: number;
  HighFocusGoal: HighFocusGoal;
  highFocusGoalId: number;
  Period: Period;
  periodId: number;
  point: number;
  priority: number;
}

// SelfDevelopmentCurriculum Model
export interface SelfDevelopmentCurriculum {
  id: number;
  Client: Client;
  clientId: number;
  skill: string;
  order: number;
  highFocusGoalId: number;
  HighFocusGoal: HighFocusGoal;
  Knowledge?: Knowledge[];
}

// Knowledge Model
export interface Knowledge {
  id: number;
  name: string;
  type: 'Book' | 'Workshop'; // Enum values
  SelfDevelopmentCurriculum: SelfDevelopmentCurriculum;
  SelfDevelopmentCurriculumId: number;
}

// Task Model
export interface Task {
  id: number;
  Client: Client;
  clientId: number;
  name: string;
  indent: number;
  order: number;
  completed: boolean;
  isMilestone: boolean;
  milestoneId?: number;
  isHighFocusGoal: boolean;
  HighFocusGoal?: HighFocusGoal;
  highFocusGoalId?: number;
  Day?: Day[];
  TimeLog?: TimeLog[];
  TaskWeek?: TaskWeek[];
  createdAt: Date;
  updatedAt: Date;
}

// TimeLog Model
export interface TimeLog {
  id: number;
  task: Task;
  taskId: number;
  journal?: string;
  startTime: Date;
  endTime?: Date;
  duration?: Date;
}

// ToDontList Model
export interface ToDontList {
  id: number;
  Client: Client;
  clientId: number;
  name: string;
  order: number;
  week: any; // Replace with proper type if known
}

// BrainDump Model
export interface BrainDump {
  id: number;
  Client: Client;
  clientId: number;
  text: string;
  day: Date;
}

// Day Model
export interface Day {
  id: number;
  taskId: number;
  Task: Task;
  date: Date;
}

// Week Model
export interface Week {
  id: number;
  year: number;
  quarter: number;
  week: number;
  startDate: Date;
  endDate: Date;
  TaskWeeks?: TaskWeek[];
}

// TaskWeek Model
export interface TaskWeek {
  id: number;
  taskId: number;
  Task: Task;
  weekId: number;
  Week: Week;
}
