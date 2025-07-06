-- ========= ENUM TYPES (Tipe Data Kustom) =========
CREATE TYPE quest_type AS ENUM ('PERSONAL', 'WORK');
CREATE TYPE task_type AS ENUM ('MAIN_QUEST', 'WORK', 'SIDE_QUEST', 'LEARNING');
CREATE TYPE task_status AS ENUM ('TODO', 'IN_PROGRESS', 'DONE');
CREATE TYPE habit_log_status AS ENUM ('COMPLETED', 'SKIPPED', 'MISSED');

-- ========= TABLES (Tabel-tabel Utama) =========

-- Tabel Visi (Jarang diubah, tapi penting sebagai fondasi)
CREATE TABLE "visions" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  "life_area" VARCHAR(255) NOT NULL,
  "vision_3_year" TEXT,
  "vision_5_year" TEXT,
  "vision_10_year" TEXT,
  "created_at" TIMESTAMPTZ DEFAULT now(),
  "updated_at" TIMESTAMPTZ DEFAULT now()
);

-- Tabel Quest (Menampung 12 Week, Main, dan AW Quest)
CREATE TABLE "quests" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  "title" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "type" quest_type NOT NULL, -- 'PERSONAL' atau 'WORK'
  "is_committed" BOOLEAN DEFAULT false, -- true jika ini adalah Main Quest yang dipilih
  "year" INTEGER NOT NULL,
  "quarter" INTEGER NOT NULL,
  "status" VARCHAR(50) DEFAULT 'Not Started',
  "created_at" TIMESTAMPTZ DEFAULT now(),
  "updated_at" TIMESTAMPTZ DEFAULT now()
);

-- Tabel Milestone (Goal Kecil untuk setiap Quest)
CREATE TABLE "milestones" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "quest_id" UUID NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
  "title" VARCHAR(255) NOT NULL,
  "display_order" INTEGER DEFAULT 0,
  "created_at" TIMESTAMPTZ DEFAULT now(),
  "updated_at" TIMESTAMPTZ DEFAULT now()
);

-- Tabel Tugas (Bank Tugas Utama)
CREATE TABLE "tasks" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  "quest_id" UUID REFERENCES quests(id) ON DELETE SET NULL, -- Bisa tidak terikat ke quest
  "milestone_id" UUID REFERENCES milestones(id) ON DELETE SET NULL,
  "parent_task_id" UUID REFERENCES tasks(id) ON DELETE CASCADE, -- Untuk subtask
  "title" TEXT NOT NULL,
  "type" task_type NOT NULL,
  "status" task_status DEFAULT 'TODO',
  "pomodoro_estimation" INTEGER DEFAULT 1,
  "due_date" DATE,
  "scheduled_date" DATE, -- Untuk weekly sync
  "display_order" INTEGER DEFAULT 0,
  "created_at" TIMESTAMPTZ DEFAULT now(),
  "updated_at" TIMESTAMPTZ DEFAULT now()
);

-- Tabel Weekly Goals (Fokus Mingguan)
CREATE TABLE "weekly_goals" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  "year" INTEGER NOT NULL,
  "week_number" INTEGER NOT NULL,
  "goal_slot" INTEGER NOT NULL, -- 1, 2, atau 3
  "created_at" TIMESTAMPTZ DEFAULT now(),
  "updated_at" TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, year, week_number, goal_slot)
);

-- Tabel Weekly Goal Items (Item-item dalam setiap Goal Slot)
CREATE TABLE "weekly_goal_items" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "weekly_goal_id" UUID NOT NULL REFERENCES weekly_goals(id) ON DELETE CASCADE,
  "item_id" UUID NOT NULL, -- ID dari quest, milestone, atau task
  "item_type" TEXT NOT NULL, -- 'QUEST', 'MILESTONE', atau 'TASK'
  "created_at" TIMESTAMPTZ DEFAULT now()
);

-- Tabel Weekly Focuses (Fokus Mingguan - Versi Hierarkis)
CREATE TABLE "weekly_focuses" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  "year" INTEGER NOT NULL,
  "week_number" INTEGER NOT NULL,
  "created_at" TIMESTAMPTZ DEFAULT now(),
  "updated_at" TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, year, week_number)
);

-- Tabel Weekly Focus Items (Item-item dalam Fokus Mingguan)
CREATE TABLE "weekly_focus_items" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "weekly_focus_id" UUID NOT NULL REFERENCES weekly_focuses(id) ON DELETE CASCADE,
  "item_id" UUID NOT NULL, -- ID dari quest, milestone, task, atau subtask
  "item_type" TEXT NOT NULL, -- 'QUEST', 'MILESTONE', 'TASK', atau 'SUBTASK'
  "created_at" TIMESTAMPTZ DEFAULT now()
);

-- Tabel untuk Self Development Curriculum
CREATE TABLE "curriculums" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    "quest_id" UUID REFERENCES quests(id) ON DELETE SET NULL, -- Terkait dengan quest/HFG
    "title" VARCHAR(255) NOT NULL,
    "source" VARCHAR(255),
    "type" VARCHAR(50), -- 'Book', 'Course', 'Article'
    "status" VARCHAR(50) DEFAULT 'Not Started',
    "created_at" TIMESTAMPTZ DEFAULT now()
);

-- Tabel untuk time-blocking di Weekly Sync
CREATE TABLE "time_logs" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    "task_id" UUID REFERENCES tasks(id) ON DELETE CASCADE,
    "start_time" TIMESTAMPTZ NOT NULL,
    "end_time" TIMESTAMPTZ NOT NULL,
    "notes" TEXT,
    "is_completed" BOOLEAN DEFAULT false
);

-- Tabel Definisi Kebiasaan
CREATE TABLE "habits" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    "name" VARCHAR(255) NOT NULL,
    "is_daily_quest" BOOLEAN DEFAULT false, -- Menandai jika ini rutinitas harian
    "created_at" TIMESTAMPTZ DEFAULT now()
);

-- Tabel Log Penyelesaian Kebiasaan
CREATE TABLE "habit_logs" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "habit_id" UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
    "log_date" DATE NOT NULL,
    "status" habit_log_status NOT NULL,
    UNIQUE(habit_id, log_date) -- Pastikan hanya ada satu log per hari per kebiasaan
);

-- Tabel untuk Brain Dump
CREATE TABLE "brain_dumps" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    "content" TEXT NOT NULL,
    "is_processed" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMPTZ DEFAULT now()
); 