import { prisma } from "@/configs/prisma";
import { NextRequest, NextResponse } from "next/server";
import { addWeeksToDatabase } from "@/prisma/seed/weekSeed";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const periodName = searchParams.get("periodName");
    const week = searchParams.get("week");

    const where: Record<string, any> = {};
    if (periodName) where.periodName = periodName;
    if (week) where.week = parseInt(week, 10);

    const res = await prisma.week.findMany({
      where,
    });

    return NextResponse.json(res, { status: 200 });
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
    const res = await addWeeksToDatabase();
    return NextResponse.json(res, { status: 200 });
  } catch (error) {
    console.error("Error creating week:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
