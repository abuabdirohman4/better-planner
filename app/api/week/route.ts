import { prisma } from "@/utils/prisma";
import { NextRequest, NextResponse } from "next/server";
import { addWeeksToDatabase } from "@/prisma/seed/weekSeed";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const year = searchParams.get("year");
    const quarter = searchParams.get("quarter");
    const week = searchParams.get("week");

    const where: Record<string, any> = {};
    if (year) where.year = parseInt(year, 10);
    if (quarter) where.quarter = parseInt(quarter, 10);
    if (week) where.week = parseInt(week, 10);

    const res = await prisma.week.findMany({
      where,
    });

    return NextResponse.json(res, { status: 200 });
  } catch (error) {
    console.error("Error fetching data:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const res = await addWeeksToDatabase();
    return NextResponse.json(res, { status: 200 });
  } catch (error) {
    console.error("Error creating data:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
