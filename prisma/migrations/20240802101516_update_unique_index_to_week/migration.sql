/*
  Warnings:

  - A unique constraint covering the columns `[year,periodId,week]` on the table `Week` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Week_year_week_key";

-- CreateIndex
CREATE UNIQUE INDEX "Week_year_periodId_week_key" ON "Week"("year", "periodId", "week");
