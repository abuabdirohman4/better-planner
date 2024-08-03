import { prisma } from "@/utils/prisma";
import { NextRequest, NextResponse } from "next/server";
import { addPeriodsToDatabase } from "@/prisma/seed/periodSeed";
import { validateFields } from "../helper";

export async function GET(req: NextRequest) {
  if (!req) {
    try {
      const res = await prisma.period.findMany();
      return NextResponse.json(res, { status: 200 });
    } catch (error) {
      console.error("Error fetch data:", error);
      return NextResponse.json(
        { error: "Internal Server Error" },
        { status: 500 }
      );
    }
  } else {
    const { searchParams } = new URL(req.url);
    const year = parseInt(searchParams.get("year") || "", 10);
    const quarter = parseInt(searchParams.get("quarter") || "", 10);

    validateFields([year, quarter]);

    try {
      const res = await prisma.period.findUnique({
        where: {
          year_quarter: {
            year,
            quarter,
          },
        },
      });
      return NextResponse.json(res, { status: 200 });
    } catch (error) {
      console.error("Error fetch data:", error);
      return NextResponse.json(
        { error: "Internal Server Error" },
        { status: 500 }
      );
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { year } = body;

    if (!year) {
      return NextResponse.json(
        { error: `Missing year field` },
        { status: 400 }
      );
    }

    const res = await addPeriodsToDatabase(parseInt(year, 10));

    return NextResponse.json(res, { status: 200 });
  } catch (error) {
    console.error("Error creating data:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
