-- CreateTable
CREATE TABLE "Client" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "periodName" TEXT NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Period" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "quarter" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Period_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VisionCategory" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "VisionCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vision" (
    "id" SERIAL NOT NULL,
    "clientId" INTEGER NOT NULL,
    "name" TEXT,
    "category" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HighFocusGoal" (
    "id" SERIAL NOT NULL,
    "clientId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "motivation" TEXT NOT NULL,

    CONSTRAINT "HighFocusGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StatusHighFocusGoal" (
    "id" SERIAL NOT NULL,
    "highFocusGoalId" INTEGER NOT NULL,
    "periodName" TEXT NOT NULL,
    "point" INTEGER NOT NULL,
    "priority" INTEGER NOT NULL,

    CONSTRAINT "StatusHighFocusGoal_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
CREATE TABLE "Task" (
    "id" SERIAL NOT NULL,
    "clientId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "indent" INTEGER NOT NULL DEFAULT 0,
    "order" INTEGER NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "isMilestone" BOOLEAN NOT NULL DEFAULT false,
    "milestoneId" INTEGER,
    "isHighFocusGoal" BOOLEAN NOT NULL DEFAULT false,
    "highFocusGoalId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimeLog" (
    "id" SERIAL NOT NULL,
    "taskId" INTEGER NOT NULL,
    "journal" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "duration" TIMESTAMP(3),

    CONSTRAINT "TimeLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ToDontList" (
    "id" SERIAL NOT NULL,
    "clientId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "weekId" INTEGER NOT NULL,

    CONSTRAINT "ToDontList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrainDump" (
    "id" SERIAL NOT NULL,
    "clientId" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "day" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrainDump_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Day" (
    "id" SERIAL NOT NULL,
    "taskId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Day_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Week" (
    "id" SERIAL NOT NULL,
    "periodName" TEXT NOT NULL,
    "week" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Week_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskWeek" (
    "id" SERIAL NOT NULL,
    "taskId" INTEGER NOT NULL,
    "weekId" INTEGER NOT NULL,

    CONSTRAINT "TaskWeek_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Client_email_key" ON "Client"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Period_name_key" ON "Period"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Period_year_quarter_key" ON "Period"("year", "quarter");

-- CreateIndex
CREATE UNIQUE INDEX "Week_periodName_week_key" ON "Week"("periodName", "week");

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_periodName_fkey" FOREIGN KEY ("periodName") REFERENCES "Period"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vision" ADD CONSTRAINT "Vision_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vision" ADD CONSTRAINT "Vision_category_fkey" FOREIGN KEY ("category") REFERENCES "VisionCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HighFocusGoal" ADD CONSTRAINT "HighFocusGoal_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatusHighFocusGoal" ADD CONSTRAINT "StatusHighFocusGoal_highFocusGoalId_fkey" FOREIGN KEY ("highFocusGoalId") REFERENCES "HighFocusGoal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatusHighFocusGoal" ADD CONSTRAINT "StatusHighFocusGoal_periodName_fkey" FOREIGN KEY ("periodName") REFERENCES "Period"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SelfDevelopmentCurriculum" ADD CONSTRAINT "SelfDevelopmentCurriculum_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SelfDevelopmentCurriculum" ADD CONSTRAINT "SelfDevelopmentCurriculum_highFocusGoalId_fkey" FOREIGN KEY ("highFocusGoalId") REFERENCES "HighFocusGoal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Knowledge" ADD CONSTRAINT "Knowledge_SelfDevelopmentCurriculumId_fkey" FOREIGN KEY ("SelfDevelopmentCurriculumId") REFERENCES "SelfDevelopmentCurriculum"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_highFocusGoalId_fkey" FOREIGN KEY ("highFocusGoalId") REFERENCES "HighFocusGoal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeLog" ADD CONSTRAINT "TimeLog_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ToDontList" ADD CONSTRAINT "ToDontList_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ToDontList" ADD CONSTRAINT "ToDontList_weekId_fkey" FOREIGN KEY ("weekId") REFERENCES "Week"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrainDump" ADD CONSTRAINT "BrainDump_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Day" ADD CONSTRAINT "Day_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Week" ADD CONSTRAINT "Week_periodName_fkey" FOREIGN KEY ("periodName") REFERENCES "Period"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskWeek" ADD CONSTRAINT "TaskWeek_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskWeek" ADD CONSTRAINT "TaskWeek_weekId_fkey" FOREIGN KEY ("weekId") REFERENCES "Week"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
