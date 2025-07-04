# Business Requirements Document (BRD): Aplikasi "Better Planner"

**Versi:** 1.0
**Tanggal:** 28 Juni 2025

---

### 1. Latar Belakang & Masalah

Sistem perencanaan personal yang ada saat ini berada di Google Sheets. Meskipun komprehensif, platform ini memiliki keterbatasan: kurang mobile-friendly, interaksi data manual, tidak ada automasi, dan UX yang tidak intuitif untuk aplikasi. Proyek "Better Planner" bertujuan untuk mengatasi masalah ini dengan menciptakan sebuah aplikasi web khusus.

### 2. Tujuan Proyek (Goals & Objectives)

Membangun aplikasi web yang mengubah sistem perencanaan yang ada menjadi pengalaman digital yang intuitif, terautomasi, dan dapat diakses di mana saja.
- **Tujuan Utama:**
    1. Menyediakan antarmuka yang bersih untuk merencanakan dan melacak tujuan (Pribadi & Profesional), tugas, kebiasaan, dan jadwal.
    2. Mengotomatiskan hubungan antar data.
    3. Memberikan visualisasi data dan laporan kemajuan otomatis (termasuk dengan bantuan AI).
    4. Menciptakan pengalaman pengguna yang mulus di desktop maupun mobile.

### 3. Target Pengguna

Individu yang proaktif dan berorientasi pada tujuan yang membutuhkan alat terstruktur untuk mengelola produktivitas pribadi dan profesional secara holistik.

### 4. Lingkup & Fitur Utama (Features Scope)

- **F-01: Dashboard Utama:** Ringkasan harian (prioritas, jadwal, progres kebiasaan) dan mingguan (progres quest).
- **F-02: Manajemen Quest (Tujuan):** CRUD untuk Visi, 12 Week Quest, dan Main Quest (Pribadi & Profesional - AW). Termasuk selektor kuartal.
- **F-03: Bank Tugas & Perencanaan Mingguan (`Weekly Sync`):** Pusat untuk semua tugas (Main, AW, Side Quest) dan antarmuka untuk menjadwalkannya dalam slot waktu mingguan.
- **F-04: Eksekusi Harian (`Daily Sync`):** Kokpit produktivitas dengan daftar tugas harian terpisah, Timer Pomodoro (0-25 menit), Brain Dump, dan Log Aktivitas Otomatis.
- **F-05: Pelacakan Kebiasaan (`Habit Tracker`):** Modul untuk mendefinisikan dan melacak konsistensi kebiasaan harian.
- **F-06: Review & Laporan AI:** Laporan mingguan dan kuartalan yang dihasilkan AI untuk memberikan penilaian, identifikasi pola, dan rekomendasi.
- **F-07: Pengaturan:** Manajemen data master (kategori, status, prioritas, dll).
- **F-08: Fitur Strategis Tambahan:** "To Don't List" mingguan dan template "Best Week".

### 5. Kebutuhan Non-Fungsional

- **Performa:** Cepat dan responsif.
- **Keamanan:** Autentikasi pengguna yang aman, data terisolasi per pengguna.
- **Usabilitas:** Desain yang bersih, modern, dan responsif (mobile-first).
- **Skalabilitas:** Arsitektur database yang dapat tumbuh bersama data pengguna. 