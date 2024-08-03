/*
  Warnings:

  - A unique constraint covering the columns `[year,quarter]` on the table `Period` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[year,week]` on the table `Week` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Period_year_quarter_key" ON "Period"("year", "quarter");

-- CreateIndex
CREATE UNIQUE INDEX "Week_year_week_key" ON "Week"("year", "week");
