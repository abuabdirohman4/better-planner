-- Migration: Add daily_plans and daily_plan_items tables
-- This migration adds support for daily task planning

-- Tabel Daily Plans (Rencana Harian)
CREATE TABLE "daily_plans" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  "plan_date" DATE NOT NULL,
  "created_at" TIMESTAMPTZ DEFAULT now(),
  "updated_at" TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, plan_date)
);

-- Tabel Daily Plan Items (Item-item dalam Rencana Harian)
CREATE TABLE "daily_plan_items" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "daily_plan_id" UUID NOT NULL REFERENCES daily_plans(id) ON DELETE CASCADE,
  "item_id" UUID NOT NULL, -- ID dari quest, milestone, atau task
  "item_type" TEXT NOT NULL, -- 'QUEST', 'MILESTONE', 'TASK', atau 'SUBTASK'
  "status" task_status DEFAULT 'TODO',
  "created_at" TIMESTAMPTZ DEFAULT now(),
  "updated_at" TIMESTAMPTZ DEFAULT now()
);

-- Index untuk performa query
CREATE INDEX idx_daily_plans_user_date ON daily_plans(user_id, plan_date);
CREATE INDEX idx_daily_plan_items_plan ON daily_plan_items(daily_plan_id);
CREATE INDEX idx_daily_plan_items_item ON daily_plan_items(item_id);

-- Row Level Security (RLS) policies
ALTER TABLE daily_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_plan_items ENABLE ROW LEVEL SECURITY;

-- Policy untuk daily_plans
CREATE POLICY "Users can view their own daily plans" ON daily_plans
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own daily plans" ON daily_plans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily plans" ON daily_plans
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own daily plans" ON daily_plans
  FOR DELETE USING (auth.uid() = user_id);

-- Policy untuk daily_plan_items
CREATE POLICY "Users can view their own daily plan items" ON daily_plan_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM daily_plans 
      WHERE daily_plans.id = daily_plan_items.daily_plan_id 
      AND daily_plans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own daily plan items" ON daily_plan_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM daily_plans 
      WHERE daily_plans.id = daily_plan_items.daily_plan_id 
      AND daily_plans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own daily plan items" ON daily_plan_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM daily_plans 
      WHERE daily_plans.id = daily_plan_items.daily_plan_id 
      AND daily_plans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own daily plan items" ON daily_plan_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM daily_plans 
      WHERE daily_plans.id = daily_plan_items.daily_plan_id 
      AND daily_plans.user_id = auth.uid()
    )
  ); 