-- app-mgsb: rencana Siklus Kerja per hari, [{ "minutes": 90|60|25, "item_id": uuid|null }]. NULL = bawaan 90 + 3x60.
alter table public.daily_plans add column if not exists cycle_plan jsonb null;
