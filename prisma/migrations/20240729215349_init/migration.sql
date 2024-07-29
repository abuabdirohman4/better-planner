/*
  Warnings:

  - You are about to drop the column `completed` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the column `dueDate` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the column `indentLevel` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the column `index` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the column `parentId` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the `TimeLog` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `indent` to the `Task` table without a default value. This is not possible if the table is not empty.
  - Added the required column `text` to the `Task` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_parentId_fkey";

-- DropForeignKey
ALTER TABLE "TimeLog" DROP CONSTRAINT "TimeLog_taskId_fkey";

-- AlterTable
ALTER TABLE "Task" DROP COLUMN "completed",
DROP COLUMN "description",
DROP COLUMN "dueDate",
DROP COLUMN "indentLevel",
DROP COLUMN "index",
DROP COLUMN "parentId",
DROP COLUMN "title",
ADD COLUMN     "indent" INTEGER NOT NULL,
ADD COLUMN     "text" TEXT NOT NULL;

-- DropTable
DROP TABLE "TimeLog";
