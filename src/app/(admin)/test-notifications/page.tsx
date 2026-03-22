"use client";

import { useState } from "react";

type StepStatus = "idle" | "loading" | "success" | "error";

interface StepResult {
  status: StepStatus;
  response: Record<string, unknown> | null;
}

const STEPS = [
  {
    id: "aggregate",
    label: "Step 1: Aggregate Performance",
    description: "Agregasi data performance user ke tabel performance_summaries",
    endpoint: "/api/cron/aggregate-performance",
  },
  {
    id: "queue-daily",
    label: "Step 2: Queue Daily Emails",
    description: "Masukkan email harian ke antrian notification_queue",
    endpoint: "/api/cron/queue-daily-emails",
  },
  {
    id: "process",
    label: "Step 3: Process Queue (Kirim Email)",
    description: "Proses antrian, generate AI insight, render template, kirim via Resend",
    endpoint: "/api/cron/process-email-queue",
  },
];

export default function TestNotificationsPage() {
  const [results, setResults] = useState<Record<string, StepResult>>({});
  const [cronToken, setCronToken] = useState("");

  const runStep = async (endpoint: string, id: string) => {
    if (!cronToken) {
      alert("Isi CRON_SECRET_TOKEN dulu!");
      return;
    }

    setResults((prev) => ({
      ...prev,
      [id]: { status: "loading", response: null },
    }));

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { Authorization: `Bearer ${cronToken}` },
      });
      const data = await res.json();
      setResults((prev) => ({
        ...prev,
        [id]: { status: res.ok ? "success" : "error", response: data },
      }));
    } catch (err) {
      setResults((prev) => ({
        ...prev,
        [id]: {
          status: "error",
          response: { error: err instanceof Error ? err.message : "Unknown error" },
        },
      }));
    }
  };

  const runAll = async () => {
    for (const step of STEPS) {
      await runStep(step.endpoint, step.id);
      await new Promise((r) => setTimeout(r, 1000));
    }
  };

  const statusColor: Record<StepStatus, string> = {
    idle: "bg-gray-100 text-gray-500",
    loading: "bg-yellow-100 text-yellow-700",
    success: "bg-green-100 text-green-700",
    error: "bg-red-100 text-red-700",
  };

  const statusLabel: Record<StepStatus, string> = {
    idle: "Belum dijalankan",
    loading: "Loading...",
    success: "Sukses",
    error: "Error",
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Test Email Notification Pipeline</h1>
        <p className="text-sm text-gray-500 mt-1">
          Halaman ini hanya untuk testing — jalankan step berurutan
        </p>
      </div>

      {/* Token Input */}
      <div className="border rounded-lg p-4 space-y-2">
        <label className="block text-sm font-medium">
          CRON_SECRET_TOKEN
          <span className="text-red-500 ml-1">*</span>
        </label>
        <input
          type="password"
          value={cronToken}
          onChange={(e) => setCronToken(e.target.value)}
          placeholder="Paste token dari .env.local"
          className="w-full border rounded px-3 py-2 text-sm font-mono"
        />
        <p className="text-xs text-gray-400">
          Ambil dari .env.local → nilai CRON_SECRET_TOKEN
        </p>
      </div>

      {/* Run All Button */}
      <button
        onClick={runAll}
        disabled={!cronToken}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Jalankan Semua Step (1 → 2 → 3)
      </button>

      {/* Steps */}
      <div className="space-y-4">
        {STEPS.map((step) => {
          const result = results[step.id] ?? { status: "idle" as StepStatus, response: null };
          return (
            <div key={step.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-sm">{step.label}</h2>
                  <p className="text-xs text-gray-500 mt-0.5">{step.description}</p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ${statusColor[result.status]}`}
                >
                  {statusLabel[result.status]}
                </span>
              </div>

              <button
                onClick={() => runStep(step.endpoint, step.id)}
                disabled={!cronToken || result.status === "loading"}
                className="text-sm border border-gray-300 rounded px-3 py-1.5 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {result.status === "loading" ? "Loading..." : "Jalankan"}
              </button>

              {result.response && (
                <pre className="text-xs bg-gray-50 border rounded p-3 overflow-auto max-h-48">
                  {JSON.stringify(result.response, null, 2)}
                </pre>
              )}
            </div>
          );
        })}
      </div>

      {/* Links */}
      <div className="border rounded-lg p-4 space-y-2">
        <h2 className="font-semibold text-sm">Verifikasi di Supabase</h2>
        <div className="space-y-1 text-xs text-gray-600">
          <p>1. Tabel <code className="bg-gray-100 px-1 rounded">performance_summaries</code> — cek setelah Step 1</p>
          <p>2. Tabel <code className="bg-gray-100 px-1 rounded">notification_queue</code> — cek setelah Step 2</p>
          <p>3. Tabel <code className="bg-gray-100 px-1 rounded">notification_history</code> + inbox email — cek setelah Step 3</p>
        </div>
      </div>
    </div>
  );
}
