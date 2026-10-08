-- Timeline Harian per user (app-z0an): rentang jam bawaan dan alamat rahasia iCal Google Calendar.
alter table public.user_profiles
  add column timeline_start_hour smallint not null default 4 check (timeline_start_hour between 0 and 23),
  add column timeline_end_hour smallint not null default 22 check (timeline_end_hour between 0 and 23),
  add column ical_url text null,
  add constraint user_profiles_timeline_range check (timeline_start_hour <= timeline_end_hour);
