import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { aggregatePerformance } from "@/lib/notifications/services/performanceAggregation";
import {
  getYesterday,
  getLastWeekStart,
  getLastMonthStart,
  getLastQuarterStart,
} from "@/lib/notifications/utils/periodUtils";

/**
 * Test endpoint for performance aggregation
 * POST /api/test/performance-aggregation
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { periodType } = body;

    if (!["daily", "weekly", "monthly", "quarterly"].includes(periodType)) {
      return NextResponse.json(
        { error: "Invalid period type" },
        { status: 400 }
      );
    }

    // Determine the date based on period type
    let date: Date;
    switch (periodType) {
      case "daily":
        date = getYesterday(); // Yesterday's data
        break;
      case "weekly":
        date = getLastWeekStart(); // Last week
        break;
      case "monthly":
        date = getLastMonthStart(); // Last month
        break;
      case "quarterly":
        date = getLastQuarterStart(); // Last quarter
        break;
      default:
        date = new Date();
    }

    // Aggregate performance data
    const metrics = await aggregatePerformance(user.id, periodType, date);

    return NextResponse.json({
      success: true,
      metrics,
      message: `Successfully aggregated ${periodType} performance data`,
    });
  } catch (error: any) {
    console.error("Performance aggregation test error:", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to aggregate performance",
        details: error.toString(),
      },
      { status: 500 }
    );
  }
}
