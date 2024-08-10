import { prisma } from "@/configs/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const clientId = parseInt(url.pathname.split("/").pop()!, 10);

  if (isNaN(clientId)) {
    return NextResponse.json({ error: "Invalid client ID" }, { status: 400 });
  }

  try {
    const res = await prisma.client.findUnique({
      where: { id: clientId },
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

    if (!res) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    return NextResponse.json(res, { status: 200 });
  } catch (error) {
    console.error("Error fetching client:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  const url = new URL(req.url);
  const clientId = parseInt(url.pathname.split("/").pop()!, 10);
  const { email, name, periodName } = await req.json();

  if (isNaN(clientId)) {
    return NextResponse.json({ error: "Invalid client ID" }, { status: 400 });
  }

  try {
    const res = await prisma.client.update({
      where: { id: clientId },
      data: { email, name, periodName },
    });

    return NextResponse.json(res, { status: 200 });
  } catch (error) {
    console.error("Error updating client:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const url = new URL(req.url);
  const clientId = parseInt(url.pathname.split("/").pop()!, 10);

  if (isNaN(clientId)) {
    return NextResponse.json({ error: "Invalid client ID" }, { status: 400 });
  }

  try {
    await prisma.client.delete({
      where: { id: clientId },
    });

    return NextResponse.json(
      { message: "Client deleted successfully" },
      { status: 204 }
    );
  } catch (error) {
    console.error("Error deleting client:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}


