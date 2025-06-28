import { fetchPeriods } from "@/app/api/periods/controller";
import { Client, Period, PeriodActive,  } from "@/types";
import { format, subDays } from "date-fns";
import { id } from "date-fns/locale";
import { fetchClient } from "./api/clients/controller";
import HomeClient from "./client";

async function fetchData(year: number) {
  // periodOptions
  const periodRes = await fetchPeriods({ year });
  console.log("periodRes", periodRes);
  const periods: Period[] = periodRes.status === 200 ? periodRes.data : [];
  const formatLabel = (period: Period) => {
    const start = format(period.startDate, "d MMMM yyyy", { locale: id });
    const end = format(subDays(period.endDate, 7), "d MMMM yyyy", {
      locale: id,
    });
    return `${period.name} (${start} - ${end})`;
  };
  const periodOptions = periods.map((period) => ({
    value: period.name,
    label: formatLabel(period),
    data: {
      startDate: period.startDate,
      endDate: period.endDate,
    },
  }));

  // periodActive
  const clientRes = await fetchClient(1);
  const client: Client = clientRes.status === 200 ? clientRes.data : [];
  let periodActive: PeriodActive = {
    name: "",
  };
  const today = new Date();
  for (const period of periods) {
    const startDate = new Date(period.startDate);
    const endDate = new Date(period.endDate);

    if (client.periodName && client.periodName === period.name) {
      periodActive = {
        name: period.name,
        startDate: period.startDate,
        endDate: period.endDate,
      };
    } else if (today >= startDate && today <= endDate) {
      periodActive = {
        name: period.name,
        startDate: startDate,
        endDate: endDate,
      };
    }
  }

  return {
    periodOptions,
    periodActive,
  };
}

export default async function Home() {
  const date = new Date();
  const year = date.getFullYear();
  console.log("year", year);
  const { periodOptions, periodActive } = await fetchData(year);

  return (
    <main className="container mx-auto p-4">
      <HomeClient
        periodOptions={periodOptions}
        initialPeriodActive={periodActive}
      />
    </main>
  );
}
