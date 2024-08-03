import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const addWeeksToDatabase = async () => {
  const periods = await prisma.period.findMany();
  const weeks = [];

  for (const period of periods) {
    let currentDate = new Date(period.startDate);
    for (let weekNumber = 1; weekNumber <= 13; weekNumber++) {
      const startDate = getStartDateOfWeek(currentDate);
      const endDate = getEndDateOfWeek(startDate);

      weeks.push({
        year: period.year,
        quarter: period.quarter,
        week: weekNumber,
        startDate,
        endDate,
      });

      currentDate.setDate(currentDate.getDate() + 7); // Move to the next week
    }
  }

  for (const week of weeks) {
    await prisma.week.upsert({
      where: {
        year_quarter_week: {
          year: week.year,
          quarter: week.quarter,
          week: week.week,
        },
      },
      update: {
        startDate: week.startDate,
        endDate: week.endDate,
      },
      create: {
        year: week.year,
        quarter: week.quarter,
        week: week.week,
        startDate: week.startDate,
        endDate: week.endDate,
      },
    });
  }

  return "Weeks have been added to the database.";
};

const getStartDateOfWeek = (date: Date): Date => {
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  const startDate = new Date(date.setDate(diff));
  startDate.setHours(0, 0, 0, 0);
  return startDate;
};

const getEndDateOfWeek = (startDate: Date): Date => {
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6); // Set to the end of the week (Sunday)
  endDate.setHours(23, 59, 59, 999);
  return endDate;
};

addWeeksToDatabase()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
