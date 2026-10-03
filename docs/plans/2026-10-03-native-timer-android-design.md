# Design: Timer berjalan di notifikasi Android (opsi B — app native)

> Status: **plan saja, belum dieksekusi.** Beads: belum dibuat (buat dari hub `applications`, label `beplan`).
> Konteks: opsi A (notif statis "Selesai HH:MM" + push selesai) sudah jalan di PWA — lihat [`../claude/timer-notifications.md`](../claude/timer-notifications.md). Opsi B menambah angka yang **benar-benar berdetak** di notif & lock screen.

## Masalah

PWA tidak bisa menampilkan hitungan waktu berjalan di notifikasi. Android native bisa, murah: `NotificationCompat.Builder.setUsesChronometer(true)` + `setChronometerCountDown(true)` + `setWhen(endMs)` — angka digambar oleh sistem, **tanpa** service yang hidup terus dan tanpa update tiap detik.

## Keputusan

| Pertanyaan | Pilihan | Alasan |
|---|---|---|
| Pembungkus | **Capacitor** (Android saja) | Bisa tambah plugin native kecil + bridge JS↔native. TWA (Bubblewrap) tidak punya bridge yang praktis ke kode native |
| Isi WebView | **Remote URL** (`server.url` = domain produksi) | Next.js tetap di Vercel, tanpa static export. Deploy web = app langsung ikut update, tanpa rilis ulang APK |
| Notif berdetak | **Plugin native sendiri** `TimerNotification` (±100 baris Kotlin) | Plugin komunitas tidak ada yang mendukung chronometer countdown |
| Foreground service | **Tidak** | Chronometer cukup dengan notif `setOngoing(true)`. Menghindari izin `FOREGROUND_SERVICE_*` & review Play Store |
| Notif selesai | `@capacitor/local-notifications` dijadwalkan di `endMs` | Web Push **tidak jalan** di WebView Capacitor. Lokal = tetap bunyi walau offline |
| Tombol Pause/Stop | Action di notif → `PendingIntent` → event ke JS (`notifyListeners`) | Store Zustand tetap sumber kebenaran, logika timer tidak diduplikasi di Kotlin |
| Distribusi | APK sideload dulu (pemakaian pribadi), Play Store nanti | Play Store butuh akun developer $25 + review |

## Arsitektur

```
timerStore (Zustand)  ──state berubah──►  useLiveTimerNotification
                                              │
                         Capacitor.isNativePlatform()?
                          ├─ ya  → TimerNotification.show({title, endMs, paused, remainingSec})
                          │        LocalNotifications.schedule({at: endMs})  (batal saat pause/stop)
                          └─ tidak → registration.showNotification (opsi A, tetap)
Tap tombol notif (native) ─► TimerNotificationPlugin.notifyListeners('action', {action, at})
                          ─► handleNotificationAction()  (fungsi yang sama dengan opsi A)
```

Satu hook, dua jalur. Cabang PWA tidak berubah.

## Yang sengaja tidak dikerjakan

- iOS (Live Activity butuh Swift + ActivityKit + akun Apple $99/th) — terpisah kalau perlu.
- Android 16 "Live Updates" (`ProgressStyle` promoted) — bisa ditambah belakangan di plugin yang sama.
- Push server ke app native (FCM) — notif selesai cukup lokal.

## Risiko

- **Login Google OAuth di WebView** diblokir Google (`disallowed_useragent`). Mitigasi: buka OAuth di Custom Tab (`@capacitor/browser`) + deep link balik ke app, atau login email/password. Wajib dicek paling awal.
- Exact alarm Android 12+: `LocalNotifications` perlu izin `SCHEDULE_EXACT_ALARM` / `USE_EXACT_ALARM`; tanpa itu notif selesai bisa telat beberapa menit.
- Izin notifikasi Android 13+ (`POST_NOTIFICATIONS`) diminta saat pertama start timer.
- Cookie sesi Supabase di WebView terpisah dari Chrome → login ulang sekali di app.
