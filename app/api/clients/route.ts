import { prisma } from "@/configs/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const clients = await prisma.client.findMany({
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
    return NextResponse.json(clients, { status: 200 });
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
    const newClient = await prisma.client.create({
      data: { email, name, periodName },
    });
    return NextResponse.json(newClient, { status: 201 });
  } catch (error) {
    console.error("Error creating client:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
