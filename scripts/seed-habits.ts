/**
 * Seed script: inserts 18 default habits for a target user.
 *
 * Usage:
 *   SUPABASE_SERVICE_ROLE_KEY=<key> SEED_USER_ID=<user-uuid> npx ts-node scripts/seed-habits.ts
 *
 * Required env vars:
 *   NEXT_PUBLIC_SUPABASE_URL    - your Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY   - service role key (bypasses RLS)
 *   SEED_USER_ID                - UUID of the user to seed habits for
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TARGET_USER_ID = process.env.SEED_USER_ID;

if (!SUPABASE_URL) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL');
  process.exit(1);
}
if (!SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}
if (!TARGET_USER_ID) {
  console.error('Missing SEED_USER_ID');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

interface HabitSeedRow {
  user_id: string;
  name: string;
  category: string;
  frequency: string;
  monthly_goal: number;
  tracking_type: string;
  target_time: string | null;
  sort_order: number;
}

const habits: Omit<HabitSeedRow, 'user_id'>[] = [
  { name: 'Shalat Tahajud',          category: 'spiritual', frequency: 'flexible', monthly_goal: 20, tracking_type: 'positive', target_time: '04:00', sort_order: 1  },
  { name: 'Shalat Duha',             category: 'spiritual', frequency: 'flexible', monthly_goal: 20, tracking_type: 'positive', target_time: '06:30', sort_order: 2  },
  { name: 'Shalat Subuh On Time',    category: 'spiritual', frequency: 'daily',    monthly_goal: 30, tracking_type: 'positive', target_time: '04:30', sort_order: 3  },
  { name: 'Shalat Dzuhur On Time',   category: 'spiritual', frequency: 'daily',    monthly_goal: 30, tracking_type: 'positive', target_time: '12:00', sort_order: 4  },
  { name: 'Shalat Ashar On Time',    category: 'spiritual', frequency: 'daily',    monthly_goal: 30, tracking_type: 'positive', target_time: '15:00', sort_order: 5  },
  { name: 'Shalat Maghrib On Time',  category: 'spiritual', frequency: 'daily',    monthly_goal: 30, tracking_type: 'positive', target_time: '18:00', sort_order: 6  },
  { name: 'Shalat Isya On Time',     category: 'spiritual', frequency: 'daily',    monthly_goal: 30, tracking_type: 'positive', target_time: '19:00', sort_order: 7  },
  { name: 'Baca Al Qur\'an',         category: 'spiritual', frequency: 'flexible', monthly_goal: 20, tracking_type: 'positive', target_time: '06:00', sort_order: 8  },
  { name: 'Shalat Tasbih',           category: 'spiritual', frequency: 'flexible', monthly_goal: 3,  tracking_type: 'positive', target_time: '11:30', sort_order: 9  },
  { name: 'Tidur Jam 10',            category: 'kesehatan', frequency: 'flexible', monthly_goal: 25, tracking_type: 'positive', target_time: '22:00', sort_order: 10 },
  { name: 'Tidak Buka HP Bangun Tidur', category: 'kesehatan', frequency: 'flexible', monthly_goal: 20, tracking_type: 'negative', target_time: null,   sort_order: 11 },
  { name: 'Exercise / Olahraga',     category: 'kesehatan', frequency: 'flexible', monthly_goal: 20, tracking_type: 'positive', target_time: null,   sort_order: 12 },
  { name: 'Baca Buku/Kindle',        category: 'karir',     frequency: 'flexible', monthly_goal: 20, tracking_type: 'positive', target_time: null,   sort_order: 13 },
  { name: 'Habit Tracker',           category: 'karir',     frequency: 'daily',    monthly_goal: 30, tracking_type: 'positive', target_time: null,   sort_order: 14 },
  { name: 'Weekly Review',           category: 'karir',     frequency: 'weekly',   monthly_goal: 4,  tracking_type: 'positive', target_time: '19:00', sort_order: 15 },
  { name: 'Tidak Buka Twitter',      category: 'other',     frequency: 'flexible', monthly_goal: 25, tracking_type: 'negative', target_time: null,   sort_order: 16 },
  { name: 'Tidak Buka Youtube',      category: 'other',     frequency: 'flexible', monthly_goal: 25, tracking_type: 'negative', target_time: null,   sort_order: 17 },
  { name: 'Tidak Buka Instagram',    category: 'other',     frequency: 'flexible', monthly_goal: 25, tracking_type: 'negative', target_time: null,   sort_order: 18 },
];

async function seed() {
  console.log(`Seeding ${habits.length} habits for user ${TARGET_USER_ID}...`);

  const rows: HabitSeedRow[] = habits.map((h) => ({
    ...h,
    user_id: TARGET_USER_ID!,
  }));

  const { data, error } = await supabase.from('habits').insert(rows).select('id, name');

  if (error) {
    console.error('Seed failed:', error.message);
    process.exit(1);
  }

  console.log(`Successfully inserted ${data?.length ?? 0} habits:`);
  (data ?? []).forEach((row: { id: string; name: string }) => {
    console.log(`  - ${row.name} (${row.id})`);
  });
}

seed().catch((err: unknown) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
