"use client";

import { fetchWeeks } from "@/app/api/weeks/controller";
import InputSelect from "@/components/Input/InputSelect";
import { ReactSelect, Week } from "@/types";
import { SESSIONKEY } from "@/utils/constants";
import { getSession, setSession } from "@/utils/session";
import Image from "next/image";
import { useEffect, useState } from "react";
import { updateClient } from "./api/clients/controller";

interface HomeClientProps {
  periodOptions: ReactSelect[];
  initialPeriodActive: string;
}

export default function HomeClient({
  periodOptions,
  initialPeriodActive,
}: HomeClientProps) {
  const [title, setTitle] = useState<string>(initialPeriodActive);

  const fetchDataWeeks = async (periodActive: string) => {
    if (periodActive) {
      const res = await fetchWeeks({ periodName: periodActive });
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

  const updateDataClient = async (periodName: string) => {
    const updateRes = await updateClient(1, { periodName });
    updateRes.status === 200 &&
      console.log("update client", updateRes.status, updateRes.statusText);
  };

  useEffect(() => {
    const sessionPeriodActive = getSession(SESSIONKEY.periodActive);
    if (sessionPeriodActive) {
      setTitle(sessionPeriodActive);
    } else {
      setSession(SESSIONKEY.periodActive, initialPeriodActive);
      fetchDataWeeks(initialPeriodActive);
    }
  }, [initialPeriodActive]);

  return (
    <>
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
      <div className="w-1/2">
        <InputSelect
          label="Select Period"
          name=""
          options={periodOptions}
          defaultValue={periodOptions.find(
            (option) => option.value === initialPeriodActive
          )}
          onChange={(selected: any) => {
            fetchDataWeeks(selected.value);
            setSession(SESSIONKEY.periodActive, selected.value);
            setTitle(selected.value);
            updateDataClient(selected.value);
          }}
        />
      </div>
    </>
  );
}
