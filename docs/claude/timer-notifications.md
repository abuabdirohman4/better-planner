# Timer Notification (PWA)

> Diperbarui 2026-10-03. Versi lama dokumen ini ("live count up tiap detik dari service worker") **tidak pernah bisa jalan**: browser mematikan `setInterval` di service worker ±30 detik setelah idle, dan handler `TIMER_*` di `sw-custom.js` sudah lama dihapus.

## Batasan web

- Notifikasi web **tidak bisa berdetak tiap detik**. Tidak ada padanan chronometer Android / Live Activity iOS untuk PWA.
- Notifikasi tetap bisa di-swipe user (bukan "ongoing" sungguhan).
- Timer yang angkanya berjalan di notif hanya bisa lewat app native. Lihat plan [`../plans/2026-10-03-native-timer-android-design.md`](../plans/2026-10-03-native-timer-android-design.md).

## Cara kerja sekarang (opsi A)

| Bagian | File | Tugas |
|---|---|---|
| Hook | `src/app/(admin)/execution/daily-sync/PomodoroTimer/hooks/useLiveTimerNotification.ts` | Tampilkan / perbarui / tutup notif via `registration.showNotification` saat state timer berubah (bukan tiap detik) |
| Pemanggil | `src/app/(admin)/execution/daily-sync/page.tsx` | Dipanggil **sekali** di samping `useGlobalTimer()`. Jangan pindah ke `PomodoroTimer` — komponen itu dirender 2× (mobile + desktop) |
| Service worker | `public/sw-custom.js` → `notificationclick` | Tombol `pause`/`resume`/`stop` diteruskan ke halaman sebagai `{ type: 'TIMER_ACTION', action, at }`. App tertutup penuh → buka `/execution/daily-sync` |
| Push selesai | `src/lib/notifications/services/pushDue.ts` | Cron kirim "Timer selesai 🎉" dengan **tag `timer` yang sama** → otomatis menggantikan notif sticky |

Isi notif:
- FOCUSING: `🎯 <judul task>` · `Selesai HH:MM WIB` · tombol Pause, Stop
- BREAK: `☕ Istirahat` · `Selesai HH:MM WIB` · tombol Stop
- PAUSED: `⏸️ Timer dijeda` · `<judul> · sisa MM:SS` · tombol Lanjut, Stop
- IDLE: notif ditutup (hanya yang `data.kind === 'timer-live'`; push "Timer selesai" dibiarkan)

`at` = waktu tap. Halaman di background bisa menerima pesan terlambat, jadi `secondsElapsed` dipatok ke waktu tap sebelum `pauseTimer()` / `stopTimer()`.

Syarat: izin notifikasi sudah `granted` (hook tidak meminta izin sendiri — izin diminta di `/settings/notifications`).

## Uji manual (Android, PWA terpasang)

1. Start timer → kunci HP → notif `🎯 … Selesai HH:MM WIB` ada, tanpa bunyi.
2. Tap **Pause** dari notif → buka app → timer PAUSED, angka sesuai saat tap.
3. Tap **Lanjut** → notif kembali ke "Selesai HH:MM" (jam bergeser sesuai lama jeda).
4. Tap **Stop** → notif hilang, activity log tercatat.
5. Biarkan selesai dengan app tertutup → notif berganti jadi "Timer selesai 🎉" (push).
6. Break → notif `☕ Istirahat`.
