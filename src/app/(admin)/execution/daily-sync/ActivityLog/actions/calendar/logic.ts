import ICAL from 'ical.js';
import { hourWIB } from '../hourly-notes/logic';

export interface CalendarEvent {
  hour: number;
  title: string;
  start: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Hanya alamat rahasia iCal Google Calendar (https) — server tidak mengambil URL sembarang. */
export function isGoogleIcalUrl(url: string): boolean {
  try {
    const u = new URL(url.trim());
    return u.protocol === 'https:' && u.hostname === 'calendar.google.com' && u.pathname.startsWith('/calendar/ical/');
  } catch {
    return false;
  }
}

/** Nama kalender dari isi iCal (X-WR-CALNAME). */
export function calendarName(ics: string): string {
  const name = new ICAL.Component(ICAL.parse(ics)).getFirstPropertyValue('x-wr-calname');
  return typeof name === 'string' && name.trim() ? name.trim() : 'Google Calendar';
}

/** Halaman setelan kalender utama Google (ID kalender utama = alamat email). */
export function googleCalendarSettingsUrl(email: string): string {
  const id = btoa(email).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `https://calendar.google.com/calendar/r/settings/calendar/${id}`;
}

/** Acara berjam yang mulai pada tanggal WIB itu (acara berulang diurai); acara seharian diabaikan. */
export function eventsForDay(ics: string, date: string): CalendarEvent[] {
  const root = new ICAL.Component(ICAL.parse(ics));
  for (const tz of root.getAllSubcomponents('vtimezone')) ICAL.TimezoneService.register(tz);

  const dayStart = new Date(`${date}T00:00:00+07:00`).getTime();
  const dayEnd = dayStart + DAY_MS;
  const out: CalendarEvent[] = [];
  const push = (start: ICAL.Time, title: string, status: unknown) => {
    if (start.isDate || status === 'CANCELLED') return;
    const t = start.toJSDate().getTime();
    if (t < dayStart || t >= dayEnd) return;
    const iso = new Date(t).toISOString();
    out.push({ hour: hourWIB(iso), title: title || '(tanpa judul)', start: iso });
  };

  const events = root.getAllSubcomponents('vevent').map((v) => new ICAL.Event(v));
  const masters = new Map<string, ICAL.Event>();
  for (const e of events) if (!e.isRecurrenceException()) masters.set(e.uid, e);
  for (const e of events) {
    if (!e.isRecurrenceException()) continue;
    const master = masters.get(e.uid);
    if (master) master.relateException(e);
    else push(e.startDate, e.summary, e.component.getFirstPropertyValue('status'));
  }

  for (const e of masters.values()) {
    if (!e.isRecurring()) {
      push(e.startDate, e.summary, e.component.getFirstPropertyValue('status'));
      continue;
    }
    // ponytail: iterasi dari awal seri; seri harian bertahun-tahun = ribuan langkah, masih ringan.
    const it = e.iterator();
    for (let next = it.next(); next; next = it.next()) {
      if (next.toJSDate().getTime() >= dayEnd) break;
      const occ = e.getOccurrenceDetails(next);
      push(occ.startDate, occ.item.summary, occ.item.component.getFirstPropertyValue('status'));
    }
  }
  return out.sort((a, b) => a.start.localeCompare(b.start));
}
