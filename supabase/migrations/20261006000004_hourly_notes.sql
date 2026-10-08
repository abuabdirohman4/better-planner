-- Timeline harian (app-6god): satu catatan teks bebas per jam, seperti timeline buku Sync Planner.
create table public.hourly_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  date date not null,
  hour smallint not null check (hour between 0 and 23),
  content text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, date, hour)
);

alter table public.hourly_notes enable row level security;
create policy "hourly_notes_select_own" on public.hourly_notes for select using (auth.uid() = user_id);
create policy "hourly_notes_insert_own" on public.hourly_notes for insert with check (auth.uid() = user_id);
create policy "hourly_notes_update_own" on public.hourly_notes for update using (auth.uid() = user_id);
create policy "hourly_notes_delete_own" on public.hourly_notes for delete using (auth.uid() = user_id);
