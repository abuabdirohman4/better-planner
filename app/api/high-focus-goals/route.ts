import { prisma } from "@/configs/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const periodName = searchParams.get("periodName");

    const where: Record<string, any> = {};
    const include: Record<string, any> = {};

    if (periodName) {
      where.StatusHighFocusGoal = {
        some: {
          Period: {
            name: periodName,
          },
        },
      };

      include.StatusHighFocusGoal = true;
    }

    const res = await prisma.highFocusGoal.findMany({
      where,
      include,
    });
    return NextResponse.json(res, { status: 200 });
  } catch (error) {
    console.error("Error fetching high focus goal:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}