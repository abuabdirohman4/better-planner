import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET() {
  const bulletPoints = await prisma.task.findMany();
  return NextResponse.json(bulletPoints, { status: 200 });
}

export async function POST(req: NextRequest) {
  try {
    // const { text, indent } = req.body;
    const body = await req.json();
    const { text, indent } = body;
    const userId = 1;
    const task = await prisma.task.create({
      data: {
        user: { connect: { id: userId } },
        text,
        indent,
      },
    });
    // const body = await req.json();
    // const { title, description, dueDate, parentId, index } = body;
    // const userId = 1;

    // Validasi data
    // if (typeof title !== "string" || !dueDate || !userId) {
    //   return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    // }

    // const task = await prisma.task.create({
    //   data: {
    //     title,
    //     description: description ?? null, // Berikan nilai default jika undefined
    //     dueDate: new Date(dueDate),
    //     user: { connect: { id: userId } },
    //     parent: parentId ? { connect: { id: parentId } } : undefined,
    //     index,
    //   },
    // });

    return NextResponse.json(task, { status: 200 });
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
