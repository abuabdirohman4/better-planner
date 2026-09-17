-- Cron run trail: one row per cron execution so a silent failure is visible after the fact.
-- No user_id (a run is not owned by anyone) and no RLS policy on purpose:
-- only the service role writes/reads it, same pattern as push_log.

create table if not exists public.cron_runs (
  id uuid primary key default gen_random_uuid(),
  job text not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null check (status in ('success', 'partial', 'failed')),
  detail jsonb,
  error text
);

create index if not exists cron_runs_job_started_at_idx on public.cron_runs(job, started_at desc);

alter table public.cron_runs enable row level security;
