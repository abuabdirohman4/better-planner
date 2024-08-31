export interface ReactSelect {
  value: number | string;
  label: string;
  data?: any;
}

export interface PeriodActive {
  name: string;
  startDate?: Date;
  endDate?: Date;
}

export interface Client {
  id?: number;
  email?: string;
  name?: string;
  periodName: string;
  Period?: Period;
  Vision?: Vision[];
  HighFocusGoal?: HighFocusGoal[];
  SelfDevelopmentCurriculum?: SelfDevelopmentCurriculum[];
  Task?: Task[];
  ToDontList?: ToDontList[];
  BrainDump?: BrainDump[];
}

export interface Period {
  id?: number;
  name: string;
  year: number;
  quarter: number;
  startDate: Date;
  endDate: Date;
  StatusHighFocusGoal?: StatusHighFocusGoal[];
  Client?: Client[];
  Week?: Week[];
}

export interface HighFocusGoal {
  id?: number;
  Client?: Client;
  clientId?: number;
  name: string;
  motivation?: string;
  periodName: string;
  point: number;
  order: number;
  completed: boolean;
  // Task?: Task[];
  // SelfDevelopmentCurriculum?: SelfDevelopmentCurriculum[];
  StatusHighFocusGoal?: StatusHighFocusGoal[];
}

export interface StatusHighFocusGoal {
  id?: number;
  HighFocusGoal?: HighFocusGoal;
  highFocusGoalId: number;
  Period?: Period;
  periodName: string;
  point: number;
  order: number;
  priority: number;
  completed: boolean;
}

export interface Task {
  id?: number;
  Client?: Client;
  clientId?: number;
  name: string;
  indent?: number;
  order?: number;
  completed?: boolean;
  milestoneId?: number;
  HighFocusGoal?: HighFocusGoal;
  highFocusGoalId?: number;
  Day?: Day[];
  TimeLog?: TimeLog[];
  TaskDay?: TaskDay[];
  TaskWeek?: TaskWeek[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Week {
  id: number;
  Period?: Period;
  periodName: string;
  week: number;
  startDate: Date;
  endDate: Date;
  TaskWeeks?: TaskWeek[];
  ToDontList?: ToDontList[];
}

export interface TaskWeek {
  id?: number;
  taskId: number;
  Task?: Task;
  weekId: number;
  Week?: Week;
}
