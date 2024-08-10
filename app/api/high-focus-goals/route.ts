import { prisma } from "@/configs/prisma";
import { NextRequest, NextResponse } from "next/server";
import { validateFields } from "../helper";

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

export async function POST(req: NextRequest) {
  try {
    const { clientId, name, motivation, periodName, point, priority } =
      await req.json();

    validateFields([clientId, name, motivation, periodName, point, priority]);

    const res = await prisma.highFocusGoal.create({
      data: {
        clientId,
        name,
        motivation,
        StatusHighFocusGoal: {
          create: {
            periodName,
            point,
            priority,
          },
        },
      },
    });

    return NextResponse.json(res, { status: 201 });
  } catch (error) {
    console.error("Error creating high focus goal:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
