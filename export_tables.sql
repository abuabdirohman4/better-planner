-- Skrip untuk mengekspor semua tabel ke format CSV
-- Pastikan Anda sudah terhubung ke database yang benar di psql

\copy (SELECT * FROM "BrainDump") to '~/Documents/Offline/db-better-planner/BrainDump.csv' with csv header
\copy (SELECT * FROM "Day") to '~/Documents/Offline/db-better-planner/Day.csv' with csv header
\copy (SELECT * FROM "HighFocusGoal") to '~/Documents/Offline/db-better-planner/HighFocusGoal.csv' with csv header
\copy (SELECT * FROM "Knowledge") to '~/Documents/Offline/db-better-planner/Knowledge.csv' with csv header
\copy (SELECT * FROM "Period") to '~/Documents/Offline/db-better-planner/Period.csv' with csv header
\copy (SELECT * FROM "SelfDevelopmentCurriculum") to '~/Documents/Offline/db-better-planner/SelfDevelopmentCurriculum.csv' with csv header
\copy (SELECT * FROM "StatusHighFocusGoal") to '~/Documents/Offline/db-better-planner/StatusHighFocusGoal.csv' with csv header
\copy (SELECT * FROM "Task") to '~/Documents/Offline/db-better-planner/Task.csv' with csv header
\copy (SELECT * FROM "TaskDay") to '~/Documents/Offline/db-better-planner/TaskDay.csv' with csv header
\copy (SELECT * FROM "TaskWeek") to '~/Documents/Offline/db-better-planner/TaskWeek.csv' with csv header
\copy (SELECT * FROM "TimeLog") to '~/Documents/Offline/db-better-planner/TimeLog.csv' with csv header
\copy (SELECT * FROM "ToDontList") to '~/Documents/Offline/db-better-planner/ToDontList.csv' with csv header
\copy (SELECT * FROM "Vision") to '~/Documents/Offline/db-better-planner/Vision.csv' with csv header
\copy (SELECT * FROM "VisionCategory") to '~/Documents/Offline/db-better-planner/VisionCategory.csv' with csv header
\copy (SELECT * FROM "Week") to '~/Documents/Offline/db-better-planner/Week.csv' with csv header