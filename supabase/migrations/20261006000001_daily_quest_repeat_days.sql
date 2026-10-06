-- app-fj81: Daily Quest berulang. repeat_days = hari jadwal (0=Min..6=Sab); NULL = tidak berulang (dipilih manual).
alter table public.tasks
  add column if not exists repeat_days smallint[] null;

alter table public.tasks
  add constraint tasks_repeat_days_valid
  check (repeat_days is null or repeat_days <@ array[0,1,2,3,4,5,6]::smallint[]);

-- Rutin terjadwal diisi sekali per rencana harian; yang dihapus Abu tidak muncul lagi hari itu.
alter table public.daily_plans
  add column if not exists routines_seeded_at timestamptz null;
