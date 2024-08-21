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
  const id = parseInt(url.pathname.split("/").pop()!, 10);
  const { name, motivation, order, StatusHighFocusGoal } = await req.json();
  const { periodName, point, priority } = StatusHighFocusGoal[0];

  if (isNaN(id)) {
    return NextResponse.json(
      { error: "Invalid HighFocusGoal ID" },
      { status: 400 }
    );
  }

  try {
    // const res = null;
    const res = await prisma.highFocusGoal.update({
      where: { id },
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
                      highFocusGoalId: id,
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
              order: order,
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
  const id = parseInt(url.pathname.split("/").pop()!, 10);
  const { periodName } = await req.json();

  if (isNaN(id)) {
    return NextResponse.json(
      { error: "Invalid HighFocusGoal ID" },
      { status: 400 }
    );
  }

  try {
    // Langkah 1: Cek dan hapus dari tabel StatusHighFocusGoal
    const statusHighFocusGoal = await prisma.statusHighFocusGoal.findFirst({
      where: {
        highFocusGoalId: id,
        periodName,
      },
    });

    if (statusHighFocusGoal) {
      await prisma.statusHighFocusGoal.delete({
        where: {
          id: statusHighFocusGoal.id,
        },
      });

      // Langkah 2: Cek apakah masih ada entri lain dengan highFocusGoalId yang sama di StatusHighFocusGoal
      const remainingStatus = await prisma.statusHighFocusGoal.findFirst({
        where: {
          highFocusGoalId: id,
        },
      });

      if (remainingStatus) {
        // Jika ada entri lain dengan highFocusGoalId yang sama, tidak perlu hapus dari HighFocusGoal
        console.log(
          '"StatusHighFocusGoal deleted successfully, but HighFocusGoal not deleted as there are remaining references."'
        );
      }
    }

    // Langkah 3: Jika tidak ada entri dengan highFocusGoalId di StatusHighFocusGoal, hapus dari HighFocusGoal
    const highFocusGoal = await prisma.highFocusGoal.findUnique({
      where: {
        id,
      },
    });

    if (highFocusGoal) {
      const res = await prisma.highFocusGoal.delete({
        where: {
          id,
        },
      });

      return NextResponse.json(res, { status: 204 });
    } else {
      return NextResponse.json(
        { error: "HighFocusGoal not found" },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error("Error deleting:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
