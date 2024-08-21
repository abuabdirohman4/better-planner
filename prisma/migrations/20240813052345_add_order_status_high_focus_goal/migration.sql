-- DropForeignKey
ALTER TABLE "StatusHighFocusGoal" DROP CONSTRAINT "StatusHighFocusGoal_periodName_fkey";

-- AlterTable
ALTER TABLE "StatusHighFocusGoal" ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "periodName" DROP NOT NULL,
ALTER COLUMN "point" SET DEFAULT 0,
ALTER COLUMN "priority" SET DEFAULT 0;

-- AddForeignKey
ALTER TABLE "StatusHighFocusGoal" ADD CONSTRAINT "StatusHighFocusGoal_periodName_fkey" FOREIGN KEY ("periodName") REFERENCES "Period"("name") ON DELETE SET NULL ON UPDATE CASCADE;
