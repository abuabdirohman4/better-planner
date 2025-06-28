import { NextRequest, NextResponse } from "next/server";
import {
  fetchHighFocusGoals,
  fetchHighFocusGoal,
  createHighFocusGoal,
  updateHighFocusGoal,
  deleteHighFocusGoal,
  CreateHighFocusGoalData,
  UpdateHighFocusGoalData,
} from "./controller";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const periodName = searchParams.get("periodName");

    if (id) {
      const result = await fetchHighFocusGoal(parseInt(id));
      if (result.status === 404) {
        return NextResponse.json(
          { error: "High focus goal not found" },
          { status: 404 }
        );
      }
      return NextResponse.json(result.data, { status: result.status });
    }

    const result = await fetchHighFocusGoals({ periodName });
    return NextResponse.json(result.data, { status: result.status });
  } catch (error) {
    console.error("Error in GET /api/high-focus-goals:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateHighFocusGoalData = await request.json();
    const result = await createHighFocusGoal(body);

    if (result.status === 201) {
      return NextResponse.json(result.data, { status: 201 });
    }
    return NextResponse.json(
      { error: "Failed to create high focus goal" },
      { status: result.status }
    );
  } catch (error) {
    console.error("Error in POST /api/high-focus-goals:", error);
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
        { error: "High focus goal ID is required" },
        { status: 400 }
      );
    }

    const body: UpdateHighFocusGoalData = await request.json();
    const result = await updateHighFocusGoal(parseInt(id), body);

    if (result.status === 200) {
      return NextResponse.json(result.data, { status: 200 });
    }
    return NextResponse.json(
      { error: "Failed to update high focus goal" },
      { status: result.status }
    );
  } catch (error) {
    console.error("Error in PUT /api/high-focus-goals:", error);
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
        { error: "High focus goal ID is required" },
        { status: 400 }
      );
    }

    const result = await deleteHighFocusGoal(parseInt(id));
    return NextResponse.json(
      { message: result.message },
      { status: result.status }
    );
  } catch (error) {
    console.error("Error in DELETE /api/high-focus-goals:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
