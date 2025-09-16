import type { Metadata } from "next";

import SmartLoader from '@/components/common/SmartLoader';
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
    <SmartLoader pageName="Dashboard">
      <DashboardClient userEmail={user?.email} />
    </SmartLoader>
  );
}
