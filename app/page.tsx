import { fetchPeriod } from "@/app/api/period/controller";
import { Client, Period } from "@/types";
import { format, subDays } from "date-fns";
import { id } from "date-fns/locale";
import HomeClient from "./client";
import { fetchClient, fetchClients } from "./api/clients/controller";

async function fetchData(year: number) {
  // periodOptions
  const periodRes = await fetchPeriod({ year });
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
  }));

  // periodActive
  const clientRes = await fetchClient(1);
  const client: Client = clientRes.status === 200 ? clientRes.data : [];
  let periodActive = "";
  if (client.periodName) {
    periodActive = client.periodName;
  } else {
    const today = new Date();
    for (const period of periods) {
      const startDate = new Date(period.startDate);
      const endDate = new Date(period.endDate);
      if (today >= startDate && today <= endDate) {
        periodActive = period.name;
        break;
      }
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
