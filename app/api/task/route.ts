import { prisma } from "@/configs/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const periodName = searchParams.get("periodName");
    const highFocusGoalId = searchParams.get("highFocusGoalId");
    const milestoneId = searchParams.get("milestoneId");

    const where: Record<string, any> = {};
    const include: Record<string, any> = {};
    if (highFocusGoalId) where.highFocusGoalId = parseInt(highFocusGoalId, 10);
    if (milestoneId) where.milestoneId = parseInt(milestoneId, 10);

    if (periodName) {
      where.HighFocusGoal = {
        StatusHighFocusGoal: {
          some: {
            Period: {
              name: periodName,
            },
          },
        },
      };
    }
    const res = await prisma.task.findMany({
      where,
      include,
    });
    return NextResponse.json(res, { status: 200 });
  } catch (error) {
    console.error("Error fetching period:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      indent,
      order,
      completed,
      isMilestone,
      milestoneId,
      isHighFocusGoal,
      highFocusGoalId,
    } = body;
    const clientId = 1;

    const res = await prisma.task.create({
      data: {
        name,
        indent,
        order,
        completed,
        isMilestone,
        milestoneId,
        isHighFocusGoal,
        HighFocusGoal: highFocusGoalId
          ? {
              connect: {
                id: highFocusGoalId,
              },
            }
          : undefined,
        Client: {
          connect: {
            id: clientId,
          },
        },
      },
    });

    return NextResponse.json(res, { status: 200 });
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
