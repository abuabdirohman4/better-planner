import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET({ params }: { params: { id: string } }) {
  const taskId = parseInt(params.id, 10);

  if (isNaN(taskId)) {
    return NextResponse.json({ error: "Invalid task ID" }, { status: 400 });
  }

  try {
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    return NextResponse.json(task, { status: 200 });
  } catch (error) {
    console.error("Error fetch task:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const taskId = parseInt(params.id, 10);

  if (isNaN(taskId)) {
    return NextResponse.json({ error: "Invalid task ID" }, { status: 400 });
  }

  try {
    // Cek apakah task ada
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Hapus semua entri terkait di tabel TimeLog
    await prisma.timeLog.deleteMany({
      where: { taskId },
    });

    await prisma.task.delete({
      where: { id: taskId },
    });

    return NextResponse.json(
      { message: "Task deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting task:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const taskId = parseInt(params.id, 10);

  if (isNaN(taskId)) {
    return NextResponse.json({ error: "Invalid task ID" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const { title, description, dueDate, completed, index, indentLevel } = body;

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        title,
        description: description ?? null,
        dueDate: new Date(dueDate),
        completed,
        index,
        indentLevel,
      },
    });

    return NextResponse.json(updatedTask, { status: 200 });
  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
