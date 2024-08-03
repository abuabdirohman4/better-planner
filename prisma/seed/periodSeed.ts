import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const addPeriodsToDatabase = async (year: number = 2024) => {
  const periods = [];

  const startYear = year;
  const endYear = year;

  for (let year = startYear; year <= endYear; year++) {
    for (let quarter = 1; quarter <= 4; quarter++) {
      const startDate = getStartDateOfQuarter(year, quarter);
      const endDate = getEndDateOfQuarter(startDate);
      periods.push({ year, quarter, startDate, endDate });
    }
  }

  for (const period of periods) {
    await prisma.period.upsert({
      where: {
        year_quarter: {
          year: period.year,
          quarter: period.quarter,
        },
      },
      update: {},
      create: {
        year: period.year,
        quarter: period.quarter,
        startDate: period.startDate,
        endDate: period.endDate,
      },
    });
  }

  return "Periods have been added to the database.";
};

const getStartDateOfQuarter = (year: number, quarter: number) => {
  const month = (quarter - 1) * 3;
  const firstDate = new Date(year, month, 1);
  return getStartDateOfWeek(firstDate);
};

const getStartDateOfWeek = (date: Date) => {
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  const startDate = new Date(date.setDate(diff));
  startDate.setHours(0, 0, 0, 0);
  return startDate;
};

const getEndDateOfQuarter = (startDate: Date) => {
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 12 * 7 + 6); // 13 weeks
  endDate.setHours(23, 59, 59, 999);
  return endDate;
};

addPeriodsToDatabase()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
