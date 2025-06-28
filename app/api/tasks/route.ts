import { NextRequest, NextResponse } from "next/server";
import { googleSheetsService, SHEET_NAMES } from "@/configs/googleSheets";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const periodName = searchParams.get("periodName");
    const highFocusGoalId = searchParams.get("highFocusGoalId");
    const milestoneId = searchParams.get("milestoneId");
    let tasks = await googleSheetsService.getAll(SHEET_NAMES.TASKS);
    if (highFocusGoalId) {
      tasks = tasks.filter(
        (t: any) => String(t.highFocusGoalId) === String(highFocusGoalId)
      );
    }
    if (milestoneId) {
      tasks = tasks.filter(
        (t: any) => String(t.milestoneId) === String(milestoneId)
      );
    }
    // periodName filter is not directly supported, needs join logic if required
    return NextResponse.json(tasks, { status: 200 });
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
    const task = await googleSheetsService.create(SHEET_NAMES.TASKS, {
      name,
      indent,
      order,
      completed,
      isMilestone,
      milestoneId,
      isHighFocusGoal,
      highFocusGoalId,
      clientId,
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
