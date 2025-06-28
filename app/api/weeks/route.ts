import { NextRequest, NextResponse } from "next/server";
import { fetchWeeks, createWeek } from "./controller";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const periodName = searchParams.get("periodName");
    const week = searchParams.get("week");
    const params: any = {};
    if (periodName) params.periodName = periodName;
    if (week) params.week = parseInt(week, 10);
    const res = await fetchWeeks(params);
    return NextResponse.json(res.data, { status: res.status });
  } catch (error) {
    console.error("Error fetching week:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const res = await createWeek();
    return NextResponse.json(res, { status: 200 });
  } catch (error) {
    console.error("Error creating week:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
