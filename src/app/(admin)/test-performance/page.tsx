"use client";

import { useState } from "react";
import { PerformanceMetrics } from "@/lib/notifications/services/performanceAggregation";

export default function TestPerformancePage() {
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [periodType, setPeriodType] = useState<"daily" | "weekly" | "monthly" | "quarterly">("daily");

  const testAggregation = async () => {
    setLoading(true);
    setError(null);
    setMetrics(null);

    try {
      const response = await fetch("/api/test/performance-aggregation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ periodType }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to aggregate performance");
      }

      setMetrics(data.metrics);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatMinutes = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getDiff = (current: number, previous: number) => {
    const diff = current - previous;
    const percentage = previous > 0 ? ((diff / previous) * 100).toFixed(1) : "N/A";
    return { diff, percentage };
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Performance Aggregation Test</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Test Aggregation Service</h2>

        <div className="flex gap-4 mb-4">
          <select
            value={periodType}
            onChange={(e) => setPeriodType(e.target.value as any)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly (4 weeks)</option>
            <option value="quarterly">Quarterly (13 weeks)</option>
          </select>

          <button
            onClick={testAggregation}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? "Loading..." : "Test Aggregation"}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
      </div>

      {metrics && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Performance Report</h2>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Period Type</p>
              <p className="text-2xl font-bold capitalize">{metrics.periodType}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Period Range</p>
              <p className="text-lg font-semibold">
                {metrics.periodStart} → {metrics.periodEnd}
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Focus Time */}
            <div className="border-b pb-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold">Focus Time</h3>
                <span className="text-3xl font-bold text-blue-600">
                  {formatMinutes(metrics.totalFocusMinutes)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-600">Previous period:</span>
                <span>{formatMinutes(metrics.previousFocusMinutes)}</span>
                {(() => {
                  const { diff, percentage } = getDiff(
                    metrics.totalFocusMinutes,
                    metrics.previousFocusMinutes
                  );
                  const isPositive = diff > 0;
                  return (
                    <span className={isPositive ? "text-green-600" : "text-red-600"}>
                      {isPositive ? "+" : ""}
                      {diff} min ({percentage}%)
                      {isPositive ? " ↑" : " ↓"}
                    </span>
                  );
                })()}
              </div>
            </div>

            {/* Break Time */}
            <div className="border-b pb-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold">Break Time</h3>
                <span className="text-3xl font-bold text-purple-600">
                  {formatMinutes(metrics.totalBreakMinutes)}
                </span>
              </div>
            </div>

            {/* Sessions */}
            <div className="border-b pb-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold">Total Sessions</h3>
                <span className="text-3xl font-bold text-indigo-600">
                  {metrics.totalSessions}
                </span>
              </div>
            </div>

            {/* Task Completion */}
            <div className="border-b pb-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold">Task Completion</h3>
                <div className="text-right">
                  <p className="text-3xl font-bold text-green-600">
                    {metrics.completionRate.toFixed(1)}%
                  </p>
                  <p className="text-sm text-gray-600">
                    {metrics.tasksCompleted} / {metrics.tasksTotal} tasks
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-600">Previous period:</span>
                <span>{metrics.previousCompletionRate.toFixed(1)}%</span>
                {(() => {
                  const diff = metrics.completionRate - metrics.previousCompletionRate;
                  const isPositive = diff > 0;
                  return (
                    <span className={isPositive ? "text-green-600" : "text-red-600"}>
                      {isPositive ? "+" : ""}
                      {diff.toFixed(1)}%
                      {isPositive ? " ↑" : " ↓"}
                    </span>
                  );
                })()}
              </div>
            </div>

            {/* Weekly Goals (if applicable) */}
            {metrics.weeklyGoalsTotal !== undefined && (
              <div className="border-b pb-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-semibold">Weekly Goals</h3>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-orange-600">
                      {metrics.weeklyGoalsCompleted || 0} / {metrics.weeklyGoalsTotal}
                    </p>
                    <p className="text-sm text-gray-600">
                      {metrics.weeklyGoalsTotal > 0
                        ? (
                            ((metrics.weeklyGoalsCompleted || 0) / metrics.weeklyGoalsTotal) *
                            100
                          ).toFixed(1)
                        : 0}
                      % completed
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Summary Card */}
          <div className="mt-6 bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">Summary</h3>
            <p className="text-gray-700 leading-relaxed">
              {metrics.periodType === "daily" && (
                <>
                  Today you focused for {formatMinutes(metrics.totalFocusMinutes)} across{" "}
                  {metrics.totalSessions} sessions, and completed {metrics.tasksCompleted} out of{" "}
                  {metrics.tasksTotal} tasks ({metrics.completionRate.toFixed(1)}%).
                </>
              )}
              {metrics.periodType === "weekly" && (
                <>
                  This week you focused for {formatMinutes(metrics.totalFocusMinutes)} across{" "}
                  {metrics.totalSessions} sessions, completed {metrics.tasksCompleted} tasks, and
                  achieved {metrics.weeklyGoalsCompleted || 0} out of {metrics.weeklyGoalsTotal}{" "}
                  weekly goals.
                </>
              )}
              {metrics.periodType === "monthly" && (
                <>
                  This month (4 weeks) you focused for {formatMinutes(metrics.totalFocusMinutes)}{" "}
                  across {metrics.totalSessions} sessions, and completed {metrics.tasksCompleted}{" "}
                  out of {metrics.tasksTotal} tasks ({metrics.completionRate.toFixed(1)}%).
                </>
              )}
              {metrics.periodType === "quarterly" && (
                <>
                  This quarter (13 weeks) you focused for{" "}
                  {formatMinutes(metrics.totalFocusMinutes)} across {metrics.totalSessions}{" "}
                  sessions, completed {metrics.tasksCompleted} tasks, and created{" "}
                  {metrics.weeklyGoalsTotal} weekly goals.
                </>
              )}
            </p>
          </div>

          {/* Raw JSON */}
          <details className="mt-6">
            <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
              View Raw JSON
            </summary>
            <pre className="mt-2 p-4 bg-gray-100 rounded text-xs overflow-auto">
              {JSON.stringify(metrics, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}
