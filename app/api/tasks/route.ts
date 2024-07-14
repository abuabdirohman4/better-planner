import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET() {
  // const tasks = await prisma.task.findMany();
  const tasks = await prisma.task.findMany({
    where: { parentId: null },
    include: { children: true },
  });
  return NextResponse.json(tasks, { status: 200 });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, description, dueDate, parentId } = body;
    const userId = 1;

    // Validasi data
    if (typeof title !== "string" || !dueDate || !userId) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    const task = await prisma.task.create({
      data: {
        title,
        description: description ?? null, // Berikan nilai default jika undefined
        dueDate: new Date(dueDate),
        user: { connect: { id: userId } },
        parent: parentId ? { connect: { id: parentId } } : undefined,
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
