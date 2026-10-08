-- Satu link iCal = satu kalender; user bisa menyambungkan beberapa (app-z0an). Isi: [{ "url": "...", "name": "..." }].
alter table public.user_profiles
  drop column ical_url,
  add column ical_calendars jsonb not null default '[]'::jsonb;
