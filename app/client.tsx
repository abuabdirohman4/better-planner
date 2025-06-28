"use client";

import { fetchWeeks } from "@/app/api/weeks/controller";
import InputSelect from "@/components/Input/InputSelect";
import { ReactSelect, Week } from "@/types";
import { SESSIONKEY } from "@/utils/constants";
import { getSession, setSession } from "@/utils/session";
import { updateClientAPI } from "@/utils/apiClient";
import Image from "next/image";
import { useEffect, useState } from "react";

interface HomeClientProps {
  periodOptions: ReactSelect[];
  initialPeriodActive: { name: string; startDate?: Date; endDate?: Date };
}

export default function HomeClient({
  periodOptions,
  initialPeriodActive,
}: HomeClientProps) {
  const [title, setTitle] = useState<string>(initialPeriodActive.name);

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
    const updateRes = await updateClientAPI(1, { periodName });
    updateRes.status === 200 &&
      console.log("update client", updateRes.status, updateRes.statusText);
  };

  useEffect(() => {
    const sessionPeriodActive = getSession(SESSIONKEY.periodActive);
    if (sessionPeriodActive) {
      setTitle(sessionPeriodActive.name);
    } else {
      setSession(SESSIONKEY.periodActive, initialPeriodActive);
      fetchDataWeeks(initialPeriodActive.name);
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
            (option) => option.value === initialPeriodActive.name
          )}
          onChange={(selected: any) => {
            fetchDataWeeks(selected.value);
            const periodActive = periodOptions.find(
              (option) => option.value === selected.value
            );
            if (periodActive) {
              setSession(SESSIONKEY.periodActive, {
                name: periodActive.value,
                startDate: periodActive.data.startDate,
                endDate: periodActive.data.endDate,
              });
            }
            setTitle(selected.value);
            updateDataClient(selected.value);
          }}
        />
      </div>
      <p>Create Sync Planner In This Period</p>
      <button>Create</button>
    </>
  );
}
