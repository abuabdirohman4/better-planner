/*
  Warnings:

  - You are about to drop the `SDC` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "SDC" DROP CONSTRAINT "SDC_clientId_fkey";

-- DropForeignKey
ALTER TABLE "SDC" DROP CONSTRAINT "SDC_highFocusGoalId_fkey";

-- DropTable
DROP TABLE "SDC";

-- CreateTable
CREATE TABLE "SelfDevelopmentCurriculum" (
    "id" SERIAL NOT NULL,
    "clientId" INTEGER NOT NULL,
    "skill" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "highFocusGoalId" INTEGER NOT NULL,

    CONSTRAINT "SelfDevelopmentCurriculum_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Knowledge" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "SelfDevelopmentCurriculumId" INTEGER NOT NULL,

    CONSTRAINT "Knowledge_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SelfDevelopmentCurriculum" ADD CONSTRAINT "SelfDevelopmentCurriculum_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SelfDevelopmentCurriculum" ADD CONSTRAINT "SelfDevelopmentCurriculum_highFocusGoalId_fkey" FOREIGN KEY ("highFocusGoalId") REFERENCES "HighFocusGoal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Knowledge" ADD CONSTRAINT "Knowledge_SelfDevelopmentCurriculumId_fkey" FOREIGN KEY ("SelfDevelopmentCurriculumId") REFERENCES "SelfDevelopmentCurriculum"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
