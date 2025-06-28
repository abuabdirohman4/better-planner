import { NextRequest, NextResponse } from "next/server";
import { fetchClient, updateClient, deleteClient } from "../controller";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const clientId = parseInt(url.pathname.split("/").pop()!, 10);

  if (isNaN(clientId)) {
    return NextResponse.json({ error: "Invalid client ID" }, { status: 400 });
  }

  try {
    const res = await fetchClient(clientId);
    if (!res.data) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }
    return NextResponse.json(res.data, { status: 200 });
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
  const body = await req.json();

  if (isNaN(clientId)) {
    return NextResponse.json({ error: "Invalid client ID" }, { status: 400 });
  }

  try {
    const res = await updateClient(clientId, body);
    return NextResponse.json(res.data, { status: 200 });
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
    const res = await deleteClient(clientId);
    return NextResponse.json({ message: res.message }, { status: res.status });
  } catch (error) {
    console.error("Error deleting client:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
