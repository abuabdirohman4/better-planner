-- Refuel Sync: satu isian pemulihan per minggu (jam tidur akhir pekan, aktivitas pemulihan, pencapaian).
create table public.weekly_refuels (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  year int not null,
  quarter int not null,
  week_number int not null,
  sleep_hours numeric(3,1) null check (sleep_hours >= 0 and sleep_hours <= 24),
  activities text null,
  achievements text null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, year, quarter, week_number)
);

alter table public.weekly_refuels enable row level security;
create policy "weekly_refuels_select_own" on public.weekly_refuels for select using (auth.uid() = user_id);
create policy "weekly_refuels_insert_own" on public.weekly_refuels for insert with check (auth.uid() = user_id);
create policy "weekly_refuels_update_own" on public.weekly_refuels for update using (auth.uid() = user_id);
create policy "weekly_refuels_delete_own" on public.weekly_refuels for delete using (auth.uid() = user_id);
