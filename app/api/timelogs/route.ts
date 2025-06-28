import { NextRequest, NextResponse } from "next/server";
import { googleSheetsService, SHEET_NAMES } from "@/configs/googleSheets";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { taskId, startTime, endTime } = body;
    const timeLog = await googleSheetsService.create(SHEET_NAMES.TIME_LOGS, {
      taskId,
      startTime,
      endTime,
    });
    return NextResponse.json(timeLog, { status: 200 });
  } catch (error) {
    console.error("Error creating timelogs:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
