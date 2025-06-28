import { NextRequest, NextResponse } from "next/server";
import { fetchPeriods, createPeriod } from "./controller";
import { validateField } from "../helper";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const name = searchParams.get("name");
    const year = searchParams.get("year");
    const quarter = searchParams.get("quarter");
    const params: any = {};
    if (name) params.name = name;
    if (year) params.year = parseInt(year, 10);
    if (quarter) params.quarter = parseInt(quarter, 10);
    const res = await fetchPeriods(params);
    return NextResponse.json(res.data, { status: res.status });
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
    validateField(body.year);
    const res = await createPeriod(body);
    return NextResponse.json(res, { status: res.status });
  } catch (error) {
    console.error("Error creating period:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
