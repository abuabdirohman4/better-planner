import { describe, it, expect } from 'vitest';
import { eventsForDay, isGoogleIcalUrl, calendarName, googleCalendarSettingsUrl } from '../logic';

const ics = (body: string) => `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Google Inc//Google Calendar 70.9054//EN
${body}
END:VCALENDAR`;

describe('eventsForDay', () => {
  it('acara tunggal UTC jatuh di jam WIB-nya; acara seharian diabaikan', () => {
    const e = eventsForDay(ics(`BEGIN:VEVENT
UID:a
DTSTART:20261008T110000Z
DTEND:20261008T120000Z
SUMMARY:Pengajian
END:VEVENT
BEGIN:VEVENT
UID:b
DTSTART;VALUE=DATE:20261008
DTEND;VALUE=DATE:20261009
SUMMARY:Libur
END:VEVENT
BEGIN:VEVENT
UID:c
DTSTART:20261009T110000Z
DTEND:20261009T120000Z
SUMMARY:Besok
END:VEVENT`), '2026-10-08');
    expect(e).toEqual([{ hour: 18, title: 'Pengajian', start: '2026-10-08T11:00:00.000Z' }]);
  });

  it('acara berulang mingguan muncul di harinya, EXDATE & pengecualian dihormati', () => {
    const body = `BEGIN:VEVENT
UID:w
DTSTART:20260904T130000Z
DTEND:20260904T140000Z
RRULE:FREQ=WEEKLY
EXDATE:20261002T130000Z
SUMMARY:Kajian Jumat
END:VEVENT
BEGIN:VEVENT
UID:w
RECURRENCE-ID:20261009T130000Z
DTSTART:20261009T120000Z
DTEND:20261009T130000Z
SUMMARY:Kajian Jumat (maju)
END:VEVENT`;
    expect(eventsForDay(ics(body), '2026-09-25')).toEqual([{ hour: 20, title: 'Kajian Jumat', start: '2026-09-25T13:00:00.000Z' }]);
    expect(eventsForDay(ics(body), '2026-10-02')).toEqual([]);
    expect(eventsForDay(ics(body), '2026-10-09')).toEqual([{ hour: 19, title: 'Kajian Jumat (maju)', start: '2026-10-09T12:00:00.000Z' }]);
  });

  it('jam lokal ber-TZID dikonversi benar', () => {
    const e = eventsForDay(ics(`BEGIN:VTIMEZONE
TZID:Asia/Jakarta
BEGIN:STANDARD
TZOFFSETFROM:+0700
TZOFFSETTO:+0700
TZNAME:WIB
DTSTART:19700101T000000
END:STANDARD
END:VTIMEZONE
BEGIN:VEVENT
UID:t
DTSTART;TZID=Asia/Jakarta:20261008T140000
DTEND;TZID=Asia/Jakarta:20261008T150000
SUMMARY:Keluar keluarga
END:VEVENT`), '2026-10-08');
    expect(e.map((x) => [x.hour, x.title])).toEqual([[14, 'Keluar keluarga']]);
  });
});

describe('isGoogleIcalUrl', () => {
  it('hanya alamat iCal Google Calendar https', () => {
    expect(isGoogleIcalUrl('https://calendar.google.com/calendar/ical/abc%40gmail.com/private-123/basic.ics')).toBe(true);
    expect(isGoogleIcalUrl('http://calendar.google.com/calendar/ical/x/basic.ics')).toBe(false);
    expect(isGoogleIcalUrl('https://evil.com/calendar.google.com/calendar/ical/x/basic.ics')).toBe(false);
    expect(isGoogleIcalUrl('https://localhost/calendar/ical/x')).toBe(false);
  });
});

describe('calendarName', () => {
  it('ambil X-WR-CALNAME, cadangan kalau tidak ada', () => {
    expect(calendarName(ics('X-WR-CALNAME:Family'))).toBe('Family');
    expect(calendarName(ics(''))).toBe('Google Calendar');
  });
});

describe('googleCalendarSettingsUrl', () => {
  it('halaman setelan kalender utama = email dalam base64 tanpa padding', () => {
    expect(googleCalendarSettingsUrl('abuabdirohman4@gmail.com')).toBe(
      'https://calendar.google.com/calendar/r/settings/calendar/YWJ1YWJkaXJvaG1hbjRAZ21haWwuY29t',
    );
    expect(googleCalendarSettingsUrl('ab@x.co')).toBe('https://calendar.google.com/calendar/r/settings/calendar/YWJAeC5jbw');
  });
});
