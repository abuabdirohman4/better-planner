import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export type Task = {
  id: number;
  title: string;
  description?: string | null;
  dueDate: Date;
  completed: boolean;
  userId: number;
};

// export type Task = PrismaClient["task"];
export type TimeLog = PrismaClient["timeLog"];
export type User = PrismaClient["user"];
