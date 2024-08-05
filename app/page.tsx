"use client";
import InputSelect from "@/components/Input/InputSelect";
import { Period, ReactSelect } from "@/types";
import { format, subDays } from "date-fns";
import { id } from "date-fns/locale";
import { useEffect, useState } from "react";
import { fetchPeriod } from "./api/period/controller";
import { getSession, setSession } from "@/utils/session";
import { SESSIONKEY } from "@/utils/constants";

export default function Home() {
  const date = new Date();
  const year = date.getFullYear();
  const [title, setTitle] = useState("");
  const [periodOptions, setPeriodOptions] = useState<ReactSelect[]>([]);
  const [periodActive, setPeriodActive] = useState<number>();

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetchPeriod({ year: year });

      if (res.status === 200) {
        // set active period & title
        const periodName = getSession(SESSIONKEY.periodName);
        if (periodName) {
          setPeriodActive(periodName);
          setTitle(periodName);
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
      }
    };
    fetchData();
  }, [year]);

  return (
    <div className="min-h-screen bg-gray-100">
      <main className="p-4">
        <h1 className="text-4xl mb-8">Period {title}</h1>
        <div className="w-1/3">
          <InputSelect
            label="Select Period"
            name=""
            options={periodOptions}
            defaultValue={periodOptions.find(
              (option) => option.value === periodActive
            )}
            onChange={(selected: any) => {
              setSession(SESSIONKEY.periodName, selected.value);
              setTitle(selected.value);
            }}
          />
        </div>
      </main>
    </div>
  );
}
