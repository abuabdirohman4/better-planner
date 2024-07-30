import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET() {
  const bulletPoints = await prisma.task.findMany({
    orderBy: { order: "asc" },
  });
  return NextResponse.json(bulletPoints, { status: 200 });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text, indent } = body;
    const userId = 1;

    const lastTask = await prisma.task.findFirst({
      orderBy: { order: "desc" },
    });

    const newOrder = lastTask ? lastTask.order + 1 : 0;

    const task = await prisma.task.create({
      data: {
        user: { connect: { id: userId } },
        text,
        indent,
        order: newOrder,
      },
    });

    return NextResponse.json(task, { status: 200 });
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
