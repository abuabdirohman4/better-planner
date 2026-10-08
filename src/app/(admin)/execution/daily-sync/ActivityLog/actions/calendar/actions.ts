"use server";

import { revalidateTag } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { DEFAULT_FIRST_HOUR, DEFAULT_LAST_HOUR, validateHour } from '../hourly-notes/logic';
import { calendarName, eventsForDay, googleCalendarSettingsUrl, isGoogleIcalUrl, type CalendarEvent } from './logic';
import { queryTimelineProfile, saveTimelineProfile } from './queries';

const MAX_CALENDARS = 10;

export interface TimelineData {
  startHour: number;
  endHour: number;
  /** Nama kalender tersambung, urut sesuai simpanan (indeks dipakai untuk memutus). URL tidak dikirim. */
  calendars: string[];
  events: CalendarEvent[];
  calendarError?: boolean;
  /** Link ke setelan kalender utama Google user ini. */
  googleSettingsUrl: string | null;
}

async function getUserClient() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');
  return { supabase, user };
}

const icalTag = (userId: string) => `ical-${userId}`;

// ponytail: cache Next 15 menit per URL; tombol refresh (fresh) melewati cache dan membuangnya.
async function fetchIcs(url: string, userId: string, fresh = false): Promise<string> {
  const res = fresh
    ? await fetch(url, { cache: 'no-store' })
    : await fetch(url, { next: { revalidate: 900, tags: [icalTag(userId)] } });
  if (!res.ok) throw new Error(`iCal ${res.status}`);
  return res.text();
}

/** Setelan timeline + acara semua kalender tersambung pada tanggal itu. */
/** `fresh` = ambil langsung dari Google (tombol refresh) dan buang cache 15 menit user ini. */
export async function getTimelineData(date: string, fresh = false): Promise<TimelineData> {
  const { supabase, user } = await getUserClient();
  if (fresh) revalidateTag(icalTag(user.id));
  const p = await queryTimelineProfile(supabase, user.id);
  const cals = p?.ical_calendars ?? [];
  const results = await Promise.allSettled(cals.map(async (c) => eventsForDay(await fetchIcs(c.url, user.id, fresh), date)));
  const failed = results.filter((r) => r.status === 'rejected');
  if (failed.length) console.error('Gagal membaca Google Calendar:', failed);
  return {
    startHour: p?.timeline_start_hour ?? DEFAULT_FIRST_HOUR,
    endHour: p?.timeline_end_hour ?? DEFAULT_LAST_HOUR,
    calendars: cals.map((c) => c.name),
    events: results
      .flatMap((r) => (r.status === 'fulfilled' ? r.value : []))
      .sort((a, b) => a.start.localeCompare(b.start)),
    calendarError: failed.length > 0,
    googleSettingsUrl: user.email ? googleCalendarSettingsUrl(user.email) : null,
  };
}

export async function saveTimelineHours(startHour: number, endHour: number): Promise<void> {
  validateHour(startHour);
  validateHour(endHour);
  if (startHour > endHour) throw new Error('Jam mulai harus sebelum jam selesai');
  const { supabase, user } = await getUserClient();
  await saveTimelineProfile(supabase, user.id, { timeline_start_hour: startHour, timeline_end_hour: endHour });
}

/** Tambah satu kalender setelah link-nya dicoba dibaca; nama diambil dari isi iCal. */
export async function addIcalCalendar(url: string): Promise<{ error: string | null; name?: string }> {
  const clean = url.trim();
  if (!isGoogleIcalUrl(clean)) return { error: 'Link harus alamat iCal Google Calendar (https://calendar.google.com/calendar/ical/…)' };
  const { supabase, user } = await getUserClient();
  const cals = (await queryTimelineProfile(supabase, user.id))?.ical_calendars ?? [];
  if (cals.some((c) => c.url === clean)) return { error: 'Kalender ini sudah tersambung' };
  if (cals.length >= MAX_CALENDARS) return { error: `Maksimal ${MAX_CALENDARS} kalender` };
  let name: string;
  try {
    const ics = await fetchIcs(clean, user.id, true);
    eventsForDay(ics, date10());
    name = calendarName(ics);
  } catch {
    return { error: 'Link tidak bisa dibaca. Pastikan itu "Secret address in iCal format".' };
  }
  await saveTimelineProfile(supabase, user.id, { ical_calendars: [...cals, { url: clean, name }] });
  return { error: null, name };
}

export async function removeIcalCalendar(index: number): Promise<void> {
  const { supabase, user } = await getUserClient();
  const cals = (await queryTimelineProfile(supabase, user.id))?.ical_calendars ?? [];
  await saveTimelineProfile(supabase, user.id, { ical_calendars: cals.filter((_, i) => i !== index) });
}

const date10 = () => new Date().toISOString().slice(0, 10);
