import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config({ path: '.env.test' });

async function globalSetup() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const testEmail = process.env.TEST_USER_EMAIL;
  const testPassword = process.env.TEST_USER_PASSWORD;

  if (!supabaseUrl || !serviceRoleKey || !testEmail || !testPassword) {
    throw new Error(
      'Missing required env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, TEST_USER_EMAIL, TEST_USER_PASSWORD\n' +
      'Copy .env.test.example to .env.test and fill in values.'
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Upsert test user — check if exists, create if not (NEVER delete)
  const { data: listData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const existingUser = listData?.users.find((u) => u.email === testEmail);

  let userId: string;
  if (existingUser) {
    userId = existingUser.id;
    console.log(`[global-setup] Test user already exists: ${userId}`);
  } else {
    const { data: createData, error } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
    });
    if (error || !createData.user) {
      throw new Error(`Failed to create test user: ${error?.message}`);
    }
    userId = createData.user.id;
    console.log(`[global-setup] Created test user: ${userId}`);
  }

  // Ensure daily_plan exists for today in Jakarta timezone (Asia/Jakarta = UTC+7)
  // The app uses Asia/Jakarta for date display, so seed data must match
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date());
  const { data: dailyPlan, error: planError } = await supabase
    .from('daily_plans')
    .upsert({ user_id: userId, plan_date: today }, { onConflict: 'user_id,plan_date' })
    .select()
    .single();

  if (planError) {
    console.warn(`[global-setup] Could not upsert daily_plan: ${planError.message}`);
  }

  // Ensure a test daily quest task exists for today (for task toggle test)
  if (dailyPlan) {
    // 1. Upsert a test task (title with marker so we can identify it)
    const TEST_TASK_TITLE = '[E2E] Test Daily Quest';
    const { data: existingTask } = await supabase
      .from('tasks')
      .select('id')
      .eq('user_id', userId)
      .eq('title', TEST_TASK_TITLE)
      .eq('type', 'DAILY_QUEST')
      .maybeSingle();

    let taskId: string;
    if (existingTask) {
      taskId = existingTask.id;
      // Reset status to TODO for each test run
      await supabase.from('tasks').update({ status: 'TODO' }).eq('id', taskId);
    } else {
      const { data: newTask, error: taskError } = await supabase
        .from('tasks')
        .insert({ user_id: userId, title: TEST_TASK_TITLE, type: 'DAILY_QUEST', status: 'TODO', focus_duration: 25, milestone_id: null })
        .select('id')
        .single();
      if (taskError || !newTask) {
        console.warn(`[global-setup] Could not create test task: ${taskError?.message}`);
        taskId = '';
      } else {
        taskId = newTask.id;
      }
    }

    // 2. Ensure task is linked to today's daily_plan via daily_plan_items
    if (taskId) {
      const { data: existingItem } = await supabase
        .from('daily_plan_items')
        .select('id')
        .eq('daily_plan_id', dailyPlan.id)
        .eq('item_id', taskId)
        .maybeSingle();

      if (!existingItem) {
        await supabase.from('daily_plan_items').insert({
          daily_plan_id: dailyPlan.id,
          item_id: taskId,
          item_type: 'DAILY_QUEST',
          status: 'TODO',
        });
      }
      console.log(`[global-setup] Test task ready: ${taskId}`);
    }
  }

  // Write userId to .test-env.json so test helpers can use it
  const testEnvPath = path.join(process.cwd(), 'tests', '.test-env.json');
  fs.writeFileSync(testEnvPath, JSON.stringify({ userId }, null, 2));
  console.log(`[global-setup] Setup complete. userId: ${userId}`);
}

export default globalSetup;
