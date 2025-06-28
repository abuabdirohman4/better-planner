import { NextRequest, NextResponse } from "next/server";
import { googleSheetsService, SHEET_NAMES } from "@/configs/googleSheets";

export async function GET({ params }: { params: { id: string } }) {
  const taskId = parseInt(params.id, 10);
  if (isNaN(taskId)) {
    return NextResponse.json({ error: "Invalid task ID" }, { status: 400 });
  }
  try {
    const task = await googleSheetsService.getById(SHEET_NAMES.TASKS, taskId);
    return NextResponse.json(task, { status: 200 });
  } catch (error) {
    console.error("Error fetch task:", error);
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
    const { text, indent, order } = body;
    const updatedTask = await googleSheetsService.update(
      SHEET_NAMES.TASKS,
      taskId,
      {
        text,
        indent,
        order,
      }
    );
    return NextResponse.json(updatedTask, { status: 200 });
  } catch (error) {
    console.error("Error updating task:", error);
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
    const task = await googleSheetsService.getById(SHEET_NAMES.TASKS, taskId);
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }
    await googleSheetsService.delete(SHEET_NAMES.TASKS, taskId);
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
