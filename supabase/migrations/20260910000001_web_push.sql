-- Web Push: device subscriptions + dedupe log. Minute scheduler (pg_cron → pg_net → /api/cron/push-due)
-- is created manually per environment — see docs/claude/database-operations.md "Web Push cron".

create extension if not exists pg_cron;
create extension if not exists pg_net;

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now()
);
create index if not exists push_subscriptions_user_id_idx on public.push_subscriptions(user_id);
alter table public.push_subscriptions enable row level security;
create policy "push_subscriptions_own" on public.push_subscriptions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- One row per delivered event; unique(kind, ref_key) makes the cron idempotent.
-- No RLS policy on purpose: only the service role touches it.
create table if not exists public.push_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null,
  ref_key text not null,
  sent_at timestamptz not null default now(),
  unique (kind, ref_key)
);
alter table public.push_log enable row level security;
