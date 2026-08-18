import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config({ path: '.env.test' });

/** userId written by tests/global-setup.ts */
export function getTestUserId(): string {
  const data = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'tests', '.test-env.json'), 'utf-8'));
  return data.userId;
}

/** Service-role client for seeding/cleanup (bypasses RLS). Never delete the test user. */
export function getServiceRoleClient(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

/** Delete rows by id from a table — no-op when list empty. Clears the array afterwards. */
export async function cleanupIds(table: string, ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  await getServiceRoleClient().from(table).delete().in('id', ids);
  ids.length = 0;
}
