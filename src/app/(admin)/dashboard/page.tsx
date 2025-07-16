import type { Metadata } from "next";

import { signOut } from '@/app/(full-width-pages)/(auth)/actions'
import { createClient } from '@/lib/supabase/server'

import DashboardClient from './DashboardClient';

export const metadata: Metadata = {
  title: "Dashboard | Better Planner",
  description: "Dashboard untuk aplikasi Better Planner",
};

export default async function Dashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div>
      <div className="flex justify-end mb-6">
        <form action={signOut}>
          <button
            type="submit"
            className="inline-flex items-center justify-center font-medium gap-2 rounded-lg transition px-4 py-2 text-sm bg-red-500 text-white shadow-theme-xs hover:bg-red-600"
          >
            Sign Out
          </button>
        </form>
      </div>
      
      <DashboardClient userEmail={user?.email} />
    </div>
  );
}
