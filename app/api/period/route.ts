import { prisma } from "@/configs/prisma";
import { NextRequest, NextResponse } from "next/server";
import { addPeriodsToDatabase } from "@/prisma/seed/periodSeed";
import { validateField } from "../helper";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const year = searchParams.get("year");
    const quarter = searchParams.get("quarter");

    const where: Record<string, any> = {};
    if (year) where.year = parseInt(year, 10);
    if (quarter) where.quarter = parseInt(quarter, 10);

    const res = await prisma.period.findMany({
      where,
    });

    return NextResponse.json(res, { status: 200 });
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
    const { year } = body;

    validateField(year);

    const res = await addPeriodsToDatabase(parseInt(year, 10));

    return NextResponse.json(res, { status: 200 });
  } catch (error) {
    console.error("Error creating period:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
