# Better Planner — AI Context Document

> Dokumen ini dirancang untuk onboarding AI secara cepat agar dapat memahami konsep, fitur, dan alur aplikasi Better Planner dengan akurat.

**Terakhir diupdate:** 2026-04-14  
**Versi app:** v0.x (dalam pengembangan aktif)

---

## 1. Apa itu Better Planner?

Better Planner adalah aplikasi web produktivitas yang membantu pengguna mengeksekusi tujuan jangka panjang melalui sistem perencanaan 13-minggu (quarter). Bukan sekadar to-do list — ini adalah sistem terintegrasi dari **visi → perencanaan → eksekusi harian**.

**Filosofi dasar:**
- Tahun 12 bulan terlalu panjang → gunakan siklus 13 minggu (quarter) agar ada urgensi
- Tujuan besar dipecah hierarkis: Quest → Milestone → Task → Subtask
- Kerja terfokus lewat Pomodoro Timer + daily planning
- Pisahkan target pribadi (Main Quest) dari pekerjaan kantor (Work Quest)

**Inspirasi dari:**
- LifeOS (Ali Abdaal) — konsep penamaan Quest, sistem hierarkis
- Mindfulday (Muhammad Azammuddin) — Pomodoro 25 menit, Activity Log, Target Focus
- Sync Planner — konsep 12-week planning, Daily Sync, One Minute Journal

**Tech stack:** Next.js 15 (App Router), React 19, TypeScript, Supabase, SWR, Zustand, Tailwind CSS v4, PWA

---

## 2. Terminologi Kunci

| Istilah di App | Artinya | Padanan Umum |
|---|---|---|
| **Main Quest** | Tujuan pribadi prioritas tertinggi (top 3 dari 12 Week Quests) | OKR / High Focus Goal |
| **12 Week Quest** | 10 tujuan yang ingin dicapai dalam 12 minggu, di-ranking via Pairwise Comparison | Quarterly Goals |
| **Work Quest** | Quest pekerjaan/kantor, dipisah dari Main Quest | Professional projects |
| **Side Quest** | Tugas tambahan di luar Main & Work Quest | Backlog tasks |
| **Daily Quest** | Tugas harian berulang (recurring) | Daily habits/tasks |
| **Milestone** | Tonggak pencapaian dalam sebuah Quest | Epic / Phase |
| **Task** | Tugas konkret dalam Milestone | Story / Task |
| **Subtask** | Langkah kecil dalam Task | Sub-item |
| **Daily Sync** | Halaman eksekusi harian — semua tools ada di sini | Daily planner |
| **Weekly Sync** | Perencanaan mingguan: 3 Weekly Goals dari Main Quest | Weekly review |
| **12 Week Sync** | Review reflektif di akhir quarter | Quarterly review |
| **Target Focus** | Progress bar total sesi fokus (target vs aktual) | Daily focus tracker |
| **Activity Log** | Log otomatis semua sesi Pomodoro yang diselesaikan | Time log |
| **Brain Dump** | Area catatan bebas untuk menangkap ide yang muncul | Capture / inbox |
| **One Minute Journal** | Jurnal singkat setelah setiap sesi Pomodoro selesai | Session reflection |
| **Best Week** | Template minggu ideal — alokasi waktu per kategori aktivitas | Ideal week |
| **Quarter** | Siklus 13 minggu (Q1-Q4 per tahun) | Quarter |

---

## 3. Sistem Quarter (13 Minggu)

```
Q1: Minggu 1–13
Q2: Minggu 14–26
Q3: Minggu 27–39
Q4: Minggu 40–52
```

Setiap quarter dimulai dari setup 12 Week Quests → commit top 3 sebagai Main Quests → eksekusi harian & mingguan → review di 12 Week Sync.

---

## 4. Hierarki Perencanaan

```
Vision (3-5 tahun & 10 tahun, per area kehidupan)
  └── 12 Week Quest (10 tujuan per quarter, di-ranking Pairwise)
        └── Main Quest (top 3 dari 12 Week Quest)
              └── Milestone
                    └── Task
                          └── Subtask
```

**Work Quest** dan **Side Quest** berdiri sendiri — tidak masuk hierarki Main Quest.

```
Work Quest
  └── Project
        └── Task
              └── Subtask

Side Quest (flat list)
Daily Quest (flat list, recurring)
```

---

## 5. Fitur yang Sudah Live (Status April 2026)

### EXECUTION
| Fitur | Route | Deskripsi |
|---|---|---|
| **Dashboard** | `/dashboard` | Ringkasan Quarter: Weekly Progress Chart, navigasi cepat |
| **Daily Sync** | `/execution/daily-sync` | Kokpit harian: Pomodoro Timer, Daily Plan Items (3 section), Target Focus, Brain Dump, Activity Log, One Minute Journal |
| **Weekly Sync** | `/execution/weekly-sync` | 3 Weekly Goals dari Main Quest, progress tracking |
| **Habit Tracker** | `/habits/today`, `/habits/monthly` | Tracking kebiasaan harian/bulanan, streak, multi-completion support |

### PLANNING
| Fitur | Route | Deskripsi |
|---|---|---|
| **Vision** | `/planning/vision` | Visi hidup 3-5 tahun & 10 tahun per area kehidupan |
| **12 Week Quests** | `/planning/12-week-quests` | Input 10 tujuan → Pairwise Comparison → commit top 3 jadi Main Quest |
| **Main Quests** | `/planning/main-quests` | Kelola Quest → Milestone → Task → Subtask, progress tracking otomatis |
| **Best Week** | `/planning/best-week` | Template minggu ideal dengan weekly grid interaktif |
| **12 Week Sync** | `/planning/12-week-sync` | Quarterly review: refleksi, skor, lessons learned |

### QUESTS
| Fitur | Route | Deskripsi |
|---|---|---|
| **Work Quests** | `/quests/work-quests` | Project → Task → Subtask untuk pekerjaan kantor |
| **Daily Quests** | `/quests/daily-quests` | Tugas harian berulang |
| **Side Quests** | `/quests/side-quests` | Tugas tambahan/backlog |

### SETTINGS
| Fitur | Route | Deskripsi |
|---|---|---|
| **Notifications** | `/settings/notifications` | Pengaturan email notification |

---

## 6. Fitur yang Belum Live (Direncanakan)

| Fitur | Status |
|---|---|
| **Self Development Curriculum** | Dikomentari di sidebar, belum ada halaman |
| **Reports / Analytics** | Dikomentari di sidebar, belum ada halaman |
| **Profile Settings** | Ada code tapi tidak aktif di sidebar |

---

## 7. Alur Kerja Utama

### Setup Awal (Sekali per Quarter)
1. Isi **Vision** (Planning → Vision)
2. Input 10 tujuan di **12 Week Quests** → lakukan Pairwise Comparison → commit top 3
3. Pecah tiap Main Quest menjadi Milestone → Task → Subtask
4. Setup **Work Quests** jika ada proyek kantor

### Alur Harian
1. Buka **Daily Sync**
2. Tambahkan items ke 3 section: Main Quest / Work Quest / Side Quest
3. Set target sesi & focus duration (25 / 60 / 90 menit) per item
4. Jalankan **Pomodoro Timer** → setelah selesai isi **One Minute Journal**
5. Catat ide di **Brain Dump**
6. Review **Target Focus** (total sesi target vs aktual) di akhir hari

### Alur Mingguan
1. Buka **Weekly Sync** → tentukan 3 Weekly Goals dari Main Quest
2. Pilih items (Quest / Milestone / Task / Subtask) untuk tiap goal
3. Track progress harian, review di akhir minggu

### Alur Quarterly
1. Buka **12 Week Sync** → isi refleksi (pencapaian, pelajaran, perbaikan)
2. Mulai quarter baru: input 12 Week Quests baru → Pairwise → commit

---

## 8. Daily Sync — Detail Komponen

Daily Sync adalah halaman paling kompleks dan paling sering digunakan. Komponen di dalamnya:

### 8a. Daily Plan Items (3 Section Terpisah)
Berbeda dari planner biasa yang mencampur semua tugas, Better Planner memisah:
- **Main Quest Section** — items dari Quest/Milestone/Task/Subtask pribadi
- **Work Quest Section** — items dari Work Quest (kantor)
- **Side Quest Section** — items dari Side Quest

Setiap item punya:
- **Status**: TODO → IN_PROGRESS → DONE
- **Target Sesi**: berapa sesi Pomodoro yang ditargetkan hari ini
- **Focus Duration**: 25 / 60 / 90 menit per sesi
- Mode: Quest mode (ada timer) atau Checklist mode (tanpa timer, focus duration = 0)

### 8b. Pomodoro Timer
- Durasi: 25, 60, atau 90 menit (dipilih per task)
- Kontrol: Play / Pause / Resume / Complete
- Break otomatis: Short Break (5 menit) atau Long Break (15 menit)
- Timer persistence: tetap jalan di background (PWA), disimpan saat refresh
- Setelah selesai → One Minute Journal muncul otomatis

### 8c. Target Focus
- Progress bar: total sesi aktual vs target (dari semua section)
- Menampilkan berapa jam fokus yang diselesaikan hari ini

### 8d. Activity Log
- Log otomatis setiap sesi Pomodoro yang selesai
- 3 mode tampilan: GROUPED (per task), TIMELINE (kronologis), CALENDAR (grid jam)
- Mencatat: waktu mulai/selesai, durasi, task yang dikerjakan, isi One Minute Journal

### 8e. One Minute Journal
- Muncul setelah setiap sesi Pomodoro selesai
- 2 pertanyaan: "Apa yang telah diselesaikan?" + "Yang masih dipikirkan?"
- Shortcut: Cmd+Enter (Mac) / Ctrl+Enter (Windows/Linux)

### 8f. Brain Dump
- Rich text editor, auto-save
- Untuk menangkap semua ide agar tidak mengganggu fokus
- Collapsible card

---

## 9. Habit Tracker — Detail

Habit Tracker adalah modul terpisah dari Quest system:

- **Habit frequency**: daily, weekly, flexible
- **Habit category**: spiritual, kesehatan, karir, keuangan, relasi, petualangan, kontribusi, other
- **Tracking type**: positive (kebiasaan yang ingin dibangun) atau negative (kebiasaan yang ingin dihilangkan)
- **Multi-completion**: habit bisa diselesaikan lebih dari 1x per hari (ada daily target)
- **Streak tracking**: current streak & best streak
- **View**: today view (checklist harian) & monthly view (kalender habit)

---

## 10. Perbedaan Utama dari Aplikasi Lain

| Aspek | App Biasa | Better Planner |
|---|---|---|
| Daily tasks | Satu list campur aduk | 3 section terpisah (Main/Work/Side) |
| Pomodoro | Fixed 25 menit | Pilih 25 / 60 / 90 menit per task |
| Goal tracking | Flat list | Hierarkis Quest → Milestone → Task → Subtask |
| Timer output | Hanya hitungan | One Minute Journal + Activity Log otomatis |
| Planning horizon | Harian atau tahunan | 13-minggu (quarter) + breakdown mingguan & harian |
| Kerja vs pribadi | Dicampur | Dipisah (Main Quest = pribadi, Work Quest = kantor) |

---

## 11. Konteks Teknis Singkat (untuk developer AI)

- **Framework**: Next.js 15 App Router, semua halaman protected ada di `src/app/(admin)/`
- **Auth**: Supabase Auth dengan Google OAuth
- **Data**: Server Actions + SWR untuk caching client-side
- **State global**: Zustand (ActivityStore, TimerContext)
- **RLS**: Semua data diisolasi per `user_id` di Supabase
- **Styling**: Tailwind CSS v4, mobile-first
- **Testing**: Vitest (unit), Playwright (E2E — in progress)
- **Timezone**: Semua store UTC, display dalam WIB (Asia/Jakarta)
