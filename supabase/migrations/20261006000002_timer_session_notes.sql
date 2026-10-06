-- app-mgsb: catatan siklus ditulis selama fokus; disalin ke activity_logs.what_done saat sesi selesai (klien atau cron).
alter table public.timer_sessions add column if not exists notes text null;
