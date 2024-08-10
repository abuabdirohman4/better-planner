/*
  Warnings:

  - You are about to drop the column `isHighFocusGoal` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the column `isMilestone` on the `Task` table. All the data in the column will be lost.
  - Made the column `endTime` on table `TimeLog` required. This step will fail if there are existing NULL values in that column.
  - Made the column `duration` on table `TimeLog` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "SelfDevelopmentCurriculum" ADD COLUMN     "completed" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "order" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "StatusHighFocusGoal" ADD COLUMN     "completed" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Task" DROP COLUMN "isHighFocusGoal",
DROP COLUMN "isMilestone";

-- AlterTable
ALTER TABLE "TimeLog" ALTER COLUMN "endTime" SET NOT NULL,
ALTER COLUMN "duration" SET NOT NULL;

-- CreateTable
CREATE TABLE "TaskDay" (
    "id" SERIAL NOT NULL,
    "taskId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaskDay_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TaskDay" ADD CONSTRAINT "TaskDay_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
