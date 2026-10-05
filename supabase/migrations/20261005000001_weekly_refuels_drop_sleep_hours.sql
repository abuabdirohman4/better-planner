-- Sync Planner 4 tidak lagi memakai jam tidur di Refuel Sync (keputusan Abu 5 Okt 2026).
alter table public.weekly_refuels drop column sleep_hours;
