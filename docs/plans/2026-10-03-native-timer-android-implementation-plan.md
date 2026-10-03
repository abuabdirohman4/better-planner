# Implementation Plan: Timer berjalan di notifikasi Android (Capacitor)

> Design: [`2026-10-03-native-timer-android-design.md`](./2026-10-03-native-timer-android-design.md). Status: **belum dieksekusi.**
> Estimasi: **berat** — ±8 file baru (proyek `android/` hasil generate tidak dihitung), ±400 baris → disarankan Antigravity.
> Tambah paket (`@capacitor/core`, `@capacitor/cli`, `@capacitor/android`, `@capacitor/local-notifications`, `@capacitor/browser`, `@capacitor/app`) **butuh persetujuan Abu dulu**.
> Executor DILARANG `bd close`.

## Prasyarat (manual, Abu)

- Android Studio + JDK 17 di laptop (build APK tidak bisa dari Vercel).
- Domain produksi untuk `server.url`.

## Task 0 — Spike login (WAJIB duluan, ±30 menit)

Risiko terbesar: Google OAuth di WebView ditolak.
1. `npx cap init "Better Planner" id.betterplanner.app --web-dir public` → `npx cap add android`.
2. `capacitor.config.ts`: `server: { url: 'https://<domain>', cleartext: false }`.
3. Jalankan di HP → coba login Google & email.
4. Kalau Google gagal (`disallowed_useragent`): buat OAuth lewat `@capacitor/browser` + deep link `id.betterplanner.app://callback` → `App.addListener('appUrlOpen')` → `supabase.auth.exchangeCodeForSession`. Tambah redirect URL itu di Supabase Auth.

**Checkpoint:** bisa login & buka `/execution/daily-sync` di app. Kalau tidak tercapai → berhenti, laporkan.

## Task 1 — Plugin native `TimerNotification`

File baru:
- `android/app/src/main/java/id/betterplanner/app/TimerNotificationPlugin.kt`
- `android/app/src/main/java/id/betterplanner/app/TimerActionReceiver.kt`
- daftarkan plugin di `MainActivity` (`registerPlugin(TimerNotificationPlugin::class.java)`), receiver di `AndroidManifest.xml`.

Method:
- `show({ title, body, endMs, paused, remainingSec, isBreak })`
  - Channel `timer_live`, importance LOW (tanpa bunyi).
  - Berjalan: `setOngoing(true)`, `setUsesChronometer(true)`, `setChronometerCountDown(true)`, `setWhen(endMs)`, `setOnlyAlertOnce(true)`.
  - Dijeda: `setUsesChronometer(false)`, body `sisa MM:SS`.
  - Actions: Pause/Lanjut + Stop → `PendingIntent.getBroadcast` ke `TimerActionReceiver` (flag `FLAG_IMMUTABLE`).
  - Tap body → buka `MainActivity`.
- `clear()` → `NotificationManagerCompat.cancel(TIMER_ID)`.
- Receiver → `plugin.notifyListeners("action", { action, at: System.currentTimeMillis() })`. Kalau WebView belum hidup: buka `MainActivity` dengan extra, kirim event setelah `load`.
- Manifest: `POST_NOTIFICATIONS`, `SCHEDULE_EXACT_ALARM` (atau `USE_EXACT_ALARM`).

**Checkpoint:** panggil `show` dari console WebView (`chrome://inspect`) → angka mundur di notif & lock screen.

## Task 2 — Bridge JS

File baru `src/lib/native/timerNotification.ts`:
```ts
import { Capacitor, registerPlugin } from '@capacitor/core';
export const isNativeApp = () => Capacitor.isNativePlatform();
export const TimerNotification = registerPlugin<{
  show(o: { title: string; body: string; endMs: number; paused: boolean; remainingSec: number; isBreak: boolean }): Promise<void>;
  clear(): Promise<void>;
  addListener(e: 'action', cb: (d: { action: 'pause' | 'resume' | 'stop'; at: number }) => void): Promise<{ remove(): void }>;
}>('TimerNotification');
```

## Task 3 — Cabang native di hook

File: `src/app/(admin)/execution/daily-sync/PomodoroTimer/hooks/useLiveTimerNotification.ts`
- Pisahkan perhitungan judul/body/endMs dari `showLiveNotification` jadi fungsi murni `buildTimerNotification(state)` → dipakai kedua jalur.
- `isNativeApp()` → `TimerNotification.show(...)` / `.clear()`; selain itu jalur web yang ada (tidak diubah).
- Listener `TimerNotification.addListener('action', …)` → `handleNotificationAction(action, at)` yang sudah ada.

```bash
grep -n "showLiveNotification\|clearLiveNotification\|handleNotificationAction" "src/app/(admin)/execution/daily-sync/PomodoroTimer/hooks/useLiveTimerNotification.ts"
```

## Task 4 — Notif selesai lokal

Di hook yang sama, jalur native saja:
- FOCUSING/BREAK → `LocalNotifications.schedule([{ id: 9001, title: 'Timer selesai 🎉' | 'Istirahat selesai ☕', at: new Date(endMs), channelId: 'timer_done' }])`.
- PAUSED / IDLE → `LocalNotifications.cancel({ notifications: [{ id: 9001 }] })`.
- Channel `timer_done` importance HIGH (bunyi).
- Push server untuk device native boleh dobel; di-skip kalau `isNativeApp()` (subscription Web Push tidak dibuat di WebView — cek `src/components/PWA/` / tempat `pushManager.subscribe`).

## Task 5 — Unit test (Vitest)

`buildTimerNotification` murni → test: FOCUSING (endMs = start + durasi), PAUSED (sisa), BREAK (durasi `BREAK_DURATIONS`), task tanpa `focus_duration` (default 25).

## Task 6 — Build & docs

- `npm run type-check`, `npx vitest run`.
- `npx cap sync android` → Android Studio → Build APK (debug dulu).
- Update `docs/claude/timer-notifications.md` (bagian native) + `docs/products/roadmap.md`.

## Uji manual (HP Android)

1. Start fokus 25 menit → kunci HP → angka mundur berjalan di lock screen.
2. Pause dari notif → angka berhenti, body "sisa MM:SS"; buka app → PAUSED dengan angka sama.
3. Lanjut → angka jalan lagi dari sisa.
4. Stop → notif hilang, activity log tercatat sekali (tidak dobel).
5. Biarkan habis dalam mode pesawat → notif "Timer selesai" tetap bunyi.
6. Break → notif istirahat mundur 5/10/15 menit.
7. Paksa tutup app saat timer jalan → notif chronometer tetap jalan; tap → app terbuka, timer pulih.
