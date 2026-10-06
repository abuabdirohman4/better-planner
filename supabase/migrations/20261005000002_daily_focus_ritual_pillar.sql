-- app-70vs: Daily Ritual pagi 4 pilar (SDC = Self Development Curriculum). null = bukan habit ritual.
-- (Kolom daily_plan_items.is_focus sempat ditambahkan lalu dibuang di hari yang sama: Daily Focus dikelompokkan menurut jenis.)
alter table public.habits
  add column if not exists ritual_pillar text null
  check (ritual_pillar in ('tubuh', 'pikiran', 'spiritual', 'sdc'));

alter table public.daily_plan_items drop column if exists is_focus;
