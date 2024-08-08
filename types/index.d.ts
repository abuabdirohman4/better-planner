import { PrismaClient } from "@prisma/client";
export type TimeLog = PrismaClient["timeLog"];
export type User = PrismaClient["user"];

export interface BulletPoint {
  id?: number;
  text: string;
  indent: number;
  order: number;
}

export interface Client {
  id: number;
  email: string;
  name?: string;
  periodName: string;
  Period: Period;
  Vision: Vision[];
  HighFocusGoal: HighFocusGoal[];
  SelfDevelopmentCurriculum: SelfDevelopmentCurriculum[];
  Task: Task[];
  ToDontList: ToDontList[];
  BrainDump: BrainDump[];
}

export interface Period {
  id: number;
  name: string;
  year: number;
  quarter: number;
  startDate: Date;
  endDate: Date;
  StatusHighFocusGoal: StatusHighFocusGoal[];
  Client: Client[];
  Week: Week[];
}

export interface VisionCategory {
  id: number;
  name: string;
  Vision: Vision[];
}

export interface Vision {
  id: number;
  Client: Client;
  clientId: number;
  name?: string;
  category: number;
  startDate: Date;
  endDate: Date;
  VisionCategory: VisionCategory;
}

export interface HighFocusGoal {
  id?: number;
  // Client: Client;
  // clientId: number;
  name?: string;
  motivation?: string;
  // Task: Task[];
  SelfDevelopmentCurriculum?: SelfDevelopmentCurriculum[];
  StatusHighFocusGoal?: StatusHighFocusGoal[];
}

export interface StatusHighFocusGoal {
  id: number;
  HighFocusGoal: HighFocusGoal;
  highFocusGoalId: number;
  Period: Period;
  periodName: string;
  point: number;
  priority: number;
}

export interface SelfDevelopmentCurriculum {
  id: number;
  Client: Client;
  clientId: number;
  skill: string;
  order: number;
  highFocusGoalId: number;
  HighFocusGoal: HighFocusGoal;
  Knowledge: Knowledge[];
}

export interface Knowledge {
  id: number;
  name: string;
  type: "Book" | "Workshop"; // Enum values
  SelfDevelopmentCurriculum: SelfDevelopmentCurriculum;
  SelfDevelopmentCurriculumId: number;
}

export interface Task {
  id?: number;
  // Client: Client;
  clientId: number;
  name: string;
  indent: number;
  order: number;
  completed: boolean;
  // isMilestone: boolean;
  milestoneId?: number;
  // isHighFocusGoal: boolean;
  // HighFocusGoal?: HighFocusGoal;
  highFocusGoalId?: number;
  // Day: Day[];
  // TimeLog: TimeLog[];
  // TaskWeek: TaskWeek[];
}

export interface TimeLog {
  id: number;
  task: Task;
  taskId: number;
  journal?: string;
  startTime: Date;
  endTime?: Date;
  duration?: Date;
}

export interface ToDontList {
  id: number;
  Client: Client;
  clientId: number;
  name: string;
  order: number;
  Week: Week;
  weekId: number;
}

export interface BrainDump {
  id: number;
  Client: Client;
  clientId: number;
  text: string;
  day: Date;
}

export interface Day {
  id: number;
  taskId: number;
  Task: Task;
  date: Date;
}

export interface Week {
  id: number;
  Period: Period;
  periodName: string;
  week: number;
  startDate: Date;
  endDate: Date;
  TaskWeeks: TaskWeek[];
  ToDontList: ToDontList[];
}

export interface TaskWeek {
  id: number;
  taskId: number;
  Task: Task;
  weekId: number;
  Week: Week;
}

export interface ReactSelect {
  value: number | string;
  label: string;
}
