import { prisma } from "@/configs/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const highFocusGoalId = parseInt(url.pathname.split("/").pop()!, 10);

  if (isNaN(highFocusGoalId)) {
    return NextResponse.json(
      { error: "Invalid HighFocusGoal ID" },
      { status: 400 }
    );
  }

  try {
    const res = await prisma.highFocusGoal.findUnique({
      where: { id: highFocusGoalId },
      include: {
        StatusHighFocusGoal: true,
      },
    });

    if (!res) {
      return NextResponse.json(
        { error: "HighFocusGoal not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(res, { status: 200 });
  } catch (error) {
    console.error("Error fetching high focus goal:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  const url = new URL(req.url);
  const highFocusGoalId = parseInt(url.pathname.split("/").pop()!, 10);
  const { name, motivation, StatusHighFocusGoal } = await req.json();
  const { periodName, point, priority } = StatusHighFocusGoal[0];

  if (isNaN(highFocusGoalId)) {
    return NextResponse.json(
      { error: "Invalid HighFocusGoal ID" },
      { status: 400 }
    );
  }

  try {
    // const res = null;
    const res = await prisma.highFocusGoal.update({
      where: { id: highFocusGoalId },
      data: {
        name,
        motivation,
        StatusHighFocusGoal: {
          upsert: {
            where: {
              id:
                (
                  await prisma.statusHighFocusGoal.findFirst({
                    where: {
                      highFocusGoalId: highFocusGoalId,
                      periodName: periodName,
                    },
                    select: { id: true },
                  })
                )?.id || 0,
            },
            create: {
              periodName: periodName,
              point: point,
              priority: priority,
            },
            update: {
              periodName: periodName,
              point: point,
              priority: priority,
            },
          },
        },
      },
    });

    return NextResponse.json(res, { status: 200 });
  } catch (error) {
    console.error("Error updating high focus goal:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const url = new URL(req.url);
  const highFocusGoalId = parseInt(url.pathname.split("/").pop()!, 10);

  if (isNaN(highFocusGoalId)) {
    return NextResponse.json(
      { error: "Invalid HighFocusGoal ID" },
      { status: 400 }
    );
  }

  try {
    await prisma.highFocusGoal.delete({
      where: { id: highFocusGoalId },
    });

    return NextResponse.json(
      { message: "HighFocusGoal deleted successfully" },
      { status: 204 }
    );
  } catch (error) {
    console.error("Error deleting high focus goal:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
