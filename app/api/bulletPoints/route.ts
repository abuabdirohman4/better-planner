import { NextRequest, NextResponse } from "next/server";
import { googleSheetsService, SHEET_NAMES } from "@/configs/googleSheets";

export async function GET() {
  const bulletPoints = await googleSheetsService.getAll(SHEET_NAMES.TASKS);
  return NextResponse.json(bulletPoints, { status: 200 });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text, indent } = body;
    const userId = 1;
    // Find last order
    const allTasks = await googleSheetsService.getAll(SHEET_NAMES.TASKS);
    const lastTask = allTasks.sort(
      (a, b) => (b.order ?? 0) - (a.order ?? 0)
    )[0];
    const newOrder = lastTask ? Number(lastTask.order) + 1 : 0;
    const task = await googleSheetsService.create(SHEET_NAMES.TASKS, {
      userId,
      text,
      indent,
      order: newOrder,
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
