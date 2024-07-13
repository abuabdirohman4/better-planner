import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { taskId, startTime, endTime } = body;
    const timeLog = await prisma.timeLog.create({
      data: {
        taskId,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
      },
    });
    return NextResponse.json(timeLog, { status: 200 });
  } catch (error) {
    console.error("Error creating timelogs:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
