"use client";

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import useSWR from "swr";
import { toast } from "sonner";

import Button from "@/components/ui/button/Button";
import Skeleton from "@/components/ui/skeleton/Skeleton";
import { CheckCircleIcon, ShootingStarIcon } from "@/lib/icons";
import { swrMutate } from "@/lib/swr";
import type { WeeklyGoal } from "@/types/weekly-sync";

import { getWeeklyRefuel, saveWeeklyRefuel, getWeeklyFocusSummary } from "../actions/weekly-refuel/actions";
import { formatDuration, CATEGORY_LABELS } from "../actions/weekly-refuel/logic";
import FocusWeekChart from "./FocusWeekChart";

interface Props {
  year: number;
  quarter: number;
  weekNumber: number;
  goals: WeeklyGoal[];
}

const cardCls = "rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] shadow-sm p-5 md:p-6";
const fieldCls = "w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none";

// Tinggi ikut isi, tanpa scroll di dalam (rows = tinggi minimum saat kosong).
function AutoTextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { value: string }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [props.value]);
  return <textarea ref={ref} {...props} className={`${props.className ?? ""} resize-none overflow-hidden`} />;
}

function SectionHeader({ icon, title, hint }: { icon: React.ReactNode; title: string; hint?: string }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-500 dark:bg-brand-500/15">{icon}</span>
      <div>
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h3>
        {hint && <p className="text-xs text-gray-500">{hint}</p>}
      </div>
    </div>
  );
}

function Bar({ pct }: { pct: number }) {
  return (
    <div className="h-2 flex-1 overflow-hidden rounded-full bg-brand-50 dark:bg-white/10">
      <div className="h-full rounded-full bg-gradient-to-r from-brand-600 to-brand-400 transition-[width] duration-700" style={{ width: `${Math.round(pct)}%` }} />
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}

export default function RefuelSyncCard({ year, quarter, weekNumber, goals }: Props) {
  const swrKey = ["weekly-refuel", year, quarter, weekNumber];
  const { data: res, isLoading } = useSWR(swrKey, () => getWeeklyRefuel(year, quarter, weekNumber), {
    revalidateOnFocus: false,
  });

  const focusKey = ["weekly-focus-summary", year, quarter, weekNumber];
  const { data: focusRes, isLoading: focusLoading } = useSWR(focusKey, () => getWeeklyFocusSummary(year, quarter, weekNumber), {
    revalidateOnFocus: false,
  });
  const focus = focusRes?.data;

  const [breakdown, setBreakdown] = useState<'jenis' | 'tugas'>('jenis'); // sengaja tanpa localStorage
  const [showAll, setShowAll] = useState(false);
  const [activities, setActivities] = useState("");
  const [achievements, setAchievements] = useState("");
  const [saving, setSaving] = useState(false);

  // Isi form dari data server tiap ganti minggu / data baru datang.
  useEffect(() => {
    const d = res?.data;
    setActivities(d?.activities ?? "");
    setAchievements(d?.achievements ?? "");
  }, [res]);

  const shown = focus ? (showAll ? focus.tasks : focus.tasks.slice(0, 10)) : [];
  const half = Math.ceil(shown.length / 2);
  const doneTitles = goals.flatMap((g) => g.items.filter((i) => i.status === "DONE").map((i) => i.title));

  const handleSave = async () => {
    setSaving(true);
    const r = await saveWeeklyRefuel(year, quarter, weekNumber, { activities, achievements });
    setSaving(false);
    if (r.success) {
      toast.success(r.message ?? "Tersimpan");
      swrMutate(swrKey);
    } else {
      toast.error(r.message ?? "Gagal menyimpan");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full !rounded-2xl" />
        <Skeleton className="h-52 w-full !rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {res && !res.success && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {res.message ?? "Refuel Sync belum bisa dimuat"}. Kamu tetap bisa mengisi, tapi simpan mungkin gagal sampai data siap.
        </div>
      )}

      <section className={cardCls}>
        <SectionHeader icon={<CheckCircleIcon className="h-6 w-6" />} title="Pencapaian Minggu ini" hint="Diisi hari Minggu, mengisi tangki pencapaian." />
        {focusLoading ? (
          <Skeleton className="mb-4 h-48 w-full !rounded-xl" />
        ) : focus ? (
          <div className="mb-5 space-y-5">
            <div className="grid grid-cols-3 gap-3 text-center">
              <Stat value={formatDuration(focus.totalMinutes)} label="total fokus" />
              <Stat value={String(focus.sessions)} label="sesi" />
              <Stat value={String(focus.distinctTasks)} label="tugas dikerjakan" />
            </div>
            <div>
              <FocusWeekChart days={focus.days} />
              {focus.best && (
                <p className="mt-1 text-center text-xs text-gray-500">Terbaik: {focus.best.name}, {formatDuration(focus.best.minutes)}</p>
              )}
            </div>
            <div>
              <div className="mb-2 flex gap-1">
                {([['jenis', 'Per jenis'], ['tugas', 'Per tugas']] as const).map(([k, l]) => (
                  <button
                    key={k}
                    onClick={() => { setBreakdown(k); setShowAll(false); }}
                    className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                      breakdown === k
                        ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400'
                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
              {breakdown === 'jenis' ? (
                <ul className="space-y-2">
                  {focus.categories.map((c) => (
                    <li key={c.key} className="flex items-center gap-3 text-sm">
                      <span className="w-24 shrink-0 text-gray-700 dark:text-gray-300">{c.label}</span>
                      <Bar pct={focus.totalMinutes ? (c.minutes / focus.totalMinutes) * 100 : 0} />
                      <span className="w-16 shrink-0 text-right tabular-nums text-gray-500">{formatDuration(c.minutes)}</span>
                    </li>
                  ))}
                </ul>
              ) : focus.tasks.length === 0 ? (
                <p className="text-sm text-gray-500">Belum ada tugas yang dikerjakan.</p>
              ) : (
                <>
                  <div className="grid gap-x-8 md:grid-cols-2">
                    {[shown.slice(0, half), shown.slice(half)].map((col, ci) => (
                      <ol key={ci} start={ci === 0 ? 1 : half + 1} className="space-y-2">
                        {col.map((t, i) => (
                          <li key={t.id} className="flex items-start gap-2 text-sm">
                            <span className="w-5 shrink-0 text-right tabular-nums text-xs leading-5 text-gray-400">{(ci === 0 ? 0 : half) + i + 1}</span>
                            <div className="min-w-0 flex-1">
                              <p className="line-clamp-2 text-gray-800 dark:text-gray-200">{t.title}</p>
                              <p className="mt-0.5 flex items-center gap-2 text-xs text-gray-500">
                                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] dark:bg-white/10">{CATEGORY_LABELS[t.category]}</span>
                                <span className="tabular-nums">{formatDuration(t.minutes)} · {t.sessions} sesi</span>
                              </p>
                            </div>
                          </li>
                        ))}
                      </ol>
                    ))}
                  </div>
                  {focus.tasks.length > 10 && (
                    <button onClick={() => setShowAll(!showAll)} className="mt-3 text-sm text-brand-500 hover:underline">
                      {showAll ? 'Ringkas' : `Tampilkan semua (${focus.tasks.length})`}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        ) : focusRes && !focusRes.success ? (
          <p className="mb-4 text-sm text-amber-700">{focusRes.message ?? "Ringkasan fokus belum bisa dimuat"}.</p>
        ) : null}
        <div className="mb-4 rounded-lg bg-gray-50 p-3 dark:bg-white/[0.03]">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Goal selesai ({doneTitles.length})</p>
          {doneTitles.length === 0 ? (
            <p className="text-sm text-gray-500">Belum ada goal yang selesai minggu ini.</p>
          ) : (
            <ul className="space-y-1">
              {doneTitles.map((t, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-green-600 dark:text-green-400">
                  <CheckCircleIcon className="h-6 w-6 shrink-0 -my-0.5" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <AutoTextarea
          rows={4}
          value={achievements}
          onChange={(e) => setAchievements(e.target.value)}
          placeholder="Pencapaian lain di luar goal"
          className={fieldCls}
        />
      </section>

      <section className={cardCls}>
        <SectionHeader
          icon={<ShootingStarIcon className="h-6 w-6" />}
          title="Aktivitas untuk memulihkan Energi, Perhatian, Mental dan Spiritual"
          hint="Mis. baca buku, nonton bareng keluarga, piknik, ibadah."
        />
        <AutoTextarea
          rows={5}
          value={activities}
          onChange={(e) => setActivities(e.target.value)}
          placeholder="Satu aktivitas per baris"
          className={fieldCls}
        />
      </section>

      <div className="flex justify-end">
        <Button onClick={handleSave} loading={saving} loadingText="Menyimpan...">Simpan</Button>
      </div>
    </div>
  );
}
