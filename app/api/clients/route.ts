import { NextRequest, NextResponse } from "next/server";
import {
  fetchClients,
  fetchClient,
  createClient,
  updateClient,
  deleteClient,
  CreateClientData,
  UpdateClientData,
} from "./controller";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (id) {
      const result = await fetchClient(parseInt(id));
      if (result.status === 404) {
        return NextResponse.json(
          { error: "Client not found" },
          { status: 404 }
        );
      }
      return NextResponse.json(result.data, { status: result.status });
    }

    const result = await fetchClients();
    return NextResponse.json(result.data, { status: result.status });
  } catch (error) {
    console.error("Error in GET /api/clients:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateClientData = await request.json();
    const result = await createClient(body);

    if (result.status === 201) {
      return NextResponse.json(result.data, { status: 201 });
    }
    return NextResponse.json(
      { error: "Failed to create client" },
      { status: result.status }
    );
  } catch (error) {
    console.error("Error in POST /api/clients:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Client ID is required" },
        { status: 400 }
      );
    }

    const body: UpdateClientData = await request.json();
    const result = await updateClient(parseInt(id), body);

    if (result.status === 200) {
      return NextResponse.json(result.data, { status: 200 });
    }
    return NextResponse.json(
      { error: "Failed to update client" },
      { status: result.status }
    );
  } catch (error) {
    console.error("Error in PUT /api/clients:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Client ID is required" },
        { status: 400 }
      );
    }

    const result = await deleteClient(parseInt(id));
    return NextResponse.json(
      { message: result.message },
      { status: result.status }
    );
  } catch (error) {
    console.error("Error in DELETE /api/clients:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
