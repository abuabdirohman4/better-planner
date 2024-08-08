"use client";
import InputSelect from "@/components/Input/InputSelect";
import { Period, ReactSelect, Week } from "@/types";
import { SESSIONKEY } from "@/utils/constants";
import { getSession, setSession } from "@/utils/session";
import { format, subDays } from "date-fns";
import { id } from "date-fns/locale";
import Image from "next/image";
import { useEffect, useState } from "react";
import { fetchPeriod } from "./api/period/controller";
import { fetchWeek } from "./api/week/controller";

export default function Home() {
  const date = new Date();
  const year = date.getFullYear();
  const [title, setTitle] = useState("");
  const [periodOptions, setPeriodOptions] = useState<ReactSelect[]>([]);
  const [periodActive, setPeriodActive] = useState<string>();
  const [isLoading, setIsLoading] = useState(true);

  const fetchDataWeeks = async (periodActive: string) => {
    if (periodActive) {
      const res = await fetchWeek({ periodName: periodActive });
      if (res.status === 200) {
        setSession(SESSIONKEY.weeksActive, res.data);
        setSession(
          SESSIONKEY.weekActive,
          res.data?.find((item: Week) => item.week == 1) // default select week 1
        );
        const today = new Date();
        for (const week of res.data) {
          const startDate = new Date(week.startDate);
          const endDate = new Date(week.endDate);

          if (today >= startDate && today <= endDate) {
            setSession(SESSIONKEY.weekActive, week);
          }
        }
      }
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetchPeriod({ year: year });
      if (res.status === 200) {
        // set active period & title
        const periodActive = getSession(SESSIONKEY.periodActive);
        if (periodActive) {
          setPeriodActive(periodActive);
          setTitle(periodActive);
        }

        // set period option
        const formatLabel = (period: Period) => {
          const start = format(period.startDate, "d MMMM yyyy", {
            locale: id,
          });
          const end = format(subDays(period.endDate, 7), "d MMMM yyyy", {
            locale: id,
          });
          return `${period.name} (${start} - ${end})`;
        };
        const options = res.data.map((period: Period) => ({
          value: period.name,
          label: formatLabel(period),
        }));
        setPeriodOptions(options);

        // set current period
        const today = new Date();
        for (const period of res.data) {
          const startDate = new Date(period.startDate);
          const endDate = new Date(period.endDate);

          if (today >= startDate && today <= endDate) {
            if (!periodActive) {
              setSession(SESSIONKEY.periodActive, period.name);
              setPeriodActive(period.name);
              setTitle(period.name);
            }
          }
        }

        // set weeks
        fetchDataWeeks(periodActive);

        setIsLoading(false);
      }
    };
    fetchData();
  }, [year]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <main className="container mx-auto p-4">
      {/* HEADER */}
      <div className="text-center mb-4">
        <h1 className="text-2xl font-bold text-black">Period {title}</h1>
        <div className="flex justify-center mt-2">
          <Image
            width={0}
            height={0}
            src="/title.svg"
            alt="title"
            className="w-40 h-auto"
            priority
          />
        </div>
      </div>
      <div className="w-1/3">
        <InputSelect
          label="Select Period"
          name=""
          options={periodOptions}
          defaultValue={periodOptions.find(
            (option) => option.value === periodActive
          )}
          onChange={(selected: any) => {
            fetchDataWeeks(selected.value);
            setSession(SESSIONKEY.periodActive, selected.value);
            setTitle(selected.value);
          }}
        />
      </div>
    </main>
  );
}
