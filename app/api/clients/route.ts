import { prisma } from "@/configs/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await prisma.client.findMany({
      include: {
        Period: true,
        Vision: true,
        HighFocusGoal: true,
        SelfDevelopmentCurriculum: true,
        Task: true,
        ToDontList: true,
        BrainDump: true,
      },
    });
    return NextResponse.json(res, { status: 200 });
  } catch (error) {
    console.error("Error fetching clients:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { email, name, periodName } = await req.json();
    const res = await prisma.client.create({
      data: { email, name, periodName },
    });
    return NextResponse.json(res, { status: 201 });
  } catch (error) {
    console.error("Error creating client:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
