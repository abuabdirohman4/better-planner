"use client";

import React, { useEffect, useState } from "react";
import useSWR from "swr";
import { toast } from "sonner";

import Button from "@/components/ui/button/Button";
import Skeleton from "@/components/ui/skeleton/Skeleton";
import { CheckCircleIcon, ShootingStarIcon } from "@/lib/icons";
import { swrMutate } from "@/lib/swr";
import type { WeeklyGoal } from "@/types/weekly-sync";

import { getWeeklyRefuel, saveWeeklyRefuel } from "../actions/weekly-refuel/actions";

interface Props {
  year: number;
  quarter: number;
  weekNumber: number;
  goals: WeeklyGoal[];
}

const cardCls = "rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] shadow-sm p-5 md:p-6";
const fieldCls = "w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none";

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

export default function RefuelSyncCard({ year, quarter, weekNumber, goals }: Props) {
  const swrKey = ["weekly-refuel", year, quarter, weekNumber];
  const { data: res, isLoading } = useSWR(swrKey, () => getWeeklyRefuel(year, quarter, weekNumber), {
    revalidateOnFocus: false,
  });

  const [activities, setActivities] = useState("");
  const [achievements, setAchievements] = useState("");
  const [saving, setSaving] = useState(false);

  // Isi form dari data server tiap ganti minggu / data baru datang.
  useEffect(() => {
    const d = res?.data;
    setActivities(d?.activities ?? "");
    setAchievements(d?.achievements ?? "");
  }, [res]);

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
        <textarea
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
        <textarea
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
