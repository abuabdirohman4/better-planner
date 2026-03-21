# PANDUAN LENGKAP BETTER PLANNER

**Versi:** 1.0  
**Tanggal:** 2025

---

## DAFTAR ISI

1. [Pengenalan Better Planner](#pengenalan)
2. [Sistem Penamaan Better Planner](#sistem-penamaan)
3. [Planning Section](#planning-section)
4. [Execution Section](#execution-section)
5. [Quests Section](#quests-section)
6. [Catatan Fitur yang Belum Dibuat](#catatan-fitur)
7. [Alur Kerja Better Planner](#alur-kerja)

---

## PENGENALAN BETTER PLANNER {#pengenalan}

### Apa itu Better Planner?

Better Planner adalah aplikasi perencanaan dan produktivitas komprehensif yang dirancang untuk membantu Anda mengubah impian menjadi kenyataan. Dibangun dengan teknologi terdepan (Next.js 15, React 19, Supabase) dan dirancang untuk performa optimal, Better Planner bukan sekadar aplikasi manajemen tugas—ini adalah mitra strategis Anda dalam mencapai tujuan hidup.

### Konsep Dasar Better Planner

Better Planner mengadopsi dan mengadaptasi konsep-konsep produktivitas dari:

1. **LifeOS (Ali Abdaal)**
   - Sistem penamaan: Main Quest, 12 Week Quest, Side Quest
   - Konsep High Focus Goal dan Goal 12 Minggu
   - Filosofi perencanaan strategis

2. **Mindfulday (Muhammad Azammuddin)**
   - Konsep Total Fokus Harian
   - Activity Log otomatis
   - Pomodoro Timer 25 menit
   - Target Focus (komponen progress bar)

3. **Sync Planner**
   - Konsep dasar perencanaan 12 minggu
   - Work Cycle dan One Minute Journal
   - Brain Dump dan Daily Routine

### Perbedaan dengan Sync Planner

Better Planner mengambil inspirasi dari Sync Planner tetapi dengan beberapa perbedaan penting:

| Aspek | Sync Planner | Better Planner |
|-------|-------------|----------------|
| **Daily Focus** | Maksimal 3, dicampur (HFG + kerja kantor) | Dipisah per section (Main/Work/Side), bisa banyak |
| **Pomodoro Timer** | 1 sesi 90 menit, lalu 3 sesi 60 menit | Bisa pilih 25, 60, atau 90 menit per sesi |
| **Target Focus** | 3 fokus harian (manual) | Komponen progress bar (otomatis tracking) |
| **Work Quest** | Dicampur dengan Main Quest | Dipisahkan menjadi section terpisah |
| **Platform** | Planner fisik (buku) | Aplikasi web (PWA) |

### Sistem Quarter (13 Minggu)

Better Planner menggunakan sistem perencanaan berbasis quarter (13 minggu) yang selaras dengan ritme produktivitas alami. Setiap tahun dibagi menjadi 4 quarter:

- **Q1**: Minggu 1-13
- **Q2**: Minggu 14-26
- **Q3**: Minggu 27-39
- **Q4**: Minggu 40-52

Sistem ini membantu Anda:
- Fokus pada periode yang lebih pendek dan dapat dikelola
- Menjaga momentum dengan siklus yang lebih pendek
- Melakukan review dan penyesuaian lebih sering

---

## SISTEM PENAMAAN BETTER PLANNER {#sistem-penamaan}

Better Planner menggunakan sistem penamaan yang diadaptasi dari LifeOS (Ali Abdaal) dan Sync Planner:

### Penamaan Utama

| Better Planner | Sync Planner | Keterangan |
|----------------|--------------|------------|
| **Main Quest** | High Focus Goal (HFG) | Tujuan utama yang menjadi prioritas tertinggi |
| **12 Week Quest** | Goal 12 Minggu | Tujuan yang ingin dicapai dalam 12 minggu |
| **Side Quest** | Tugas Lain | Tugas tambahan di luar Main Quest |
| **Work Quest** | - | Quest kerja kantoran (dipisahkan dari Main Quest) |

### Konsep Penting

**Main Quest (High Focus Goal)**
- Tujuan pribadi yang menjadi prioritas tertinggi
- Dipilih dari top 3 hasil 12 Week Quests
- Struktur hierarkis: Quest → Milestone → Task → SubTask
- **Bukan** quest kerja kantoran

**12 Week Quest (Goal 12 Minggu)**
- 10 tujuan yang ingin dicapai dalam 12 minggu
- Dipilih menggunakan Pairwise Comparison
- Top 3 akan menjadi Main Quest

**Work Quest**
- Quest yang berkaitan dengan pekerjaan/kantor
- Dipisahkan dari Main Quest untuk memisahkan target pribadi dan profesional
- Dikelola di section terpisah

**Side Quest**
- Tugas tambahan di luar Main Quest dan Work Quest
- Tugas yang tidak terkait langsung dengan tujuan utama
- Dikelola di section terpisah

---

## PLANNING SECTION {#planning-section}

### 1. Vision (Visi)

**Apa itu Vision?**

Vision adalah gambaran hidup terbaik Anda dalam jangka panjang (3, 5, dan 10 tahun). Vision berfungsi sebagai kompas yang mengarahkan setiap keputusan dan tindakan Anda.

**Struktur Vision di Better Planner:**

Vision di Better Planner diorganisir berdasarkan **Area Kehidupan**:
- Karier/Bisnis
- Kesehatan & Kebugaran
- Relasi
- Kontribusi
- Petualangan
- Keuangan
- Spiritual

**Cara Mengisi:**

1. Buka halaman **Planning → Vision**
2. Untuk setiap Area Kehidupan, isi:
   - **Visi 3-5 Tahun**: Apa yang ingin dicapai dalam 3-5 tahun ke depan
   - **Visi 10 Tahun**: Apa yang ingin dicapai dalam 10 tahun ke depan
3. Klik **Simpan Perubahan** untuk menyimpan

**Tips:**

- Tuliskan visi yang spesifik dan dapat divisualisasikan
- Pastikan visi bisnis/karier selaras dengan visi pribadi
- Review dan update visi secara berkala (setiap 6-12 bulan)

---

### 2. 12 Week Quests

**Apa itu 12 Week Quests?**

12 Week Quests adalah sistem perencanaan yang mengubah mindset dari tahun 12 bulan menjadi tahun 12 minggu. Ini membantu Anda fokus pada periode yang lebih pendek dan dapat dikelola.

**Cara Menggunakan:**

1. **Input 10 Tujuan**
   - Buka halaman **Planning → 12 Week Quests**
   - Pilih Quarter yang ingin direncanakan
   - Input 10 tujuan yang ingin dicapai dalam 12 minggu ke depan
   - Setiap tujuan harus spesifik dan dapat diukur

2. **Pairwise Comparison**
   - Setelah input 10 tujuan, klik **Save** untuk menyimpan
   - Sistem akan menampilkan **Pairwise Matrix**
   - Bandingkan setiap pasangan tujuan (A vs B)
   - Klik **A** jika tujuan A lebih penting, atau **B** jika tujuan B lebih penting
   - Sistem akan menghitung ranking otomatis berdasarkan perbandingan

3. **Commit Top 3 sebagai Main Quest**
   - Setelah selesai melakukan Pairwise Comparison, sistem akan menampilkan ranking
   - **Top 3** quest akan otomatis menjadi **Main Quest**
   - Klik **Commit** untuk finalisasi
   - Anda akan diarahkan ke halaman **Main Quests**

**Fitur Tambahan:**

- **Quest History**: Lihat quest dari quarter sebelumnya
- **Import Quest**: Import quest dari quarter sebelumnya jika relevan

**Tips:**

- Pastikan setiap tujuan dapat dicapai dalam 12 minggu
- Lakukan Pairwise Comparison dengan jujur dan objektif
- Review ranking sebelum commit

---

### 3. Main Quests

**Apa itu Main Quests?**

Main Quests adalah top 3 tujuan dari 12 Week Quests yang menjadi prioritas tertinggi. Main Quests adalah target **pribadi** (bukan kerja kantoran).

**Struktur Hierarkis:**

Main Quests menggunakan struktur hierarkis untuk memecah tujuan besar menjadi langkah-langkah kecil:

```
Quest (Tujuan Utama)
  └── Milestone (Tonggak Pencapaian)
      └── Task (Tugas)
          └── SubTask (Sub-tugas)
```

**Cara Menggunakan:**

1. **Membuat Quest**
   - Quest otomatis dibuat dari top 3 hasil 12 Week Quests
   - Atau buat quest baru secara manual

2. **Membuat Milestone**
   - Klik **Add Milestone** pada quest
   - Tuliskan milestone yang ingin dicapai
   - Milestone harus spesifik dan dapat diukur
   - Setiap quest biasanya memiliki 3-5 milestone

3. **Membuat Task**
   - Klik **Add Task** pada milestone
   - Tuliskan tugas yang diperlukan untuk mencapai milestone
   - Setiap task dapat diselesaikan dalam 1-3 hari
   - Urutkan task berdasarkan prioritas dan dependensi

4. **Membuat SubTask**
   - Klik **Add SubTask** pada task
   - Pecah task besar menjadi sub-tugas yang lebih kecil
   - SubTask membantu memulai dan mempertahankan momentum

**Progress Tracking:**

- Setiap level (Quest, Milestone, Task, SubTask) memiliki progress tracking
- Progress dihitung otomatis berdasarkan status (TODO, IN_PROGRESS, DONE)
- Progress Quest = rata-rata progress semua Milestone
- Progress Milestone = rata-rata progress semua Task

**Fitur Tambahan:**

- **Quest Continuity**: Fitur untuk melanjutkan quest dari quarter sebelumnya (sudah diimplementasi tapi belum aktif)

**Tips:**

- Mulai dengan milestone besar, kemudian detailkan ke tugas-tugas kecil
- Review dan update Main Quests setiap minggu
- Pastikan setiap task memiliki deadline yang jelas

---

## EXECUTION SECTION {#execution-section}

### 1. Dashboard (Home)

**Apa itu Dashboard?**

Dashboard adalah halaman utama yang menampilkan ringkasan dan grafik pencapaian Anda.

**Fitur Dashboard:**

1. **Quarter Selector**
   - Pilih quarter yang ingin dilihat (Q1, Q2, Q3, Q4)
   - Otomatis menampilkan data untuk quarter yang dipilih

2. **Weekly Progress Chart**
   - Grafik pencapaian tiap minggu dalam quarter
   - Menampilkan progress percentage untuk setiap minggu
   - Tersedia dalam 2 format: Line Chart dan Bar Chart
   - Progress dihitung berdasarkan Weekly Goals

3. **Card Navigasi**
   - Quick access ke halaman utama:
     - Vision
     - 12 Week Quests
     - Main Quests
     - Weekly Sync
     - Daily Sync
     - Work Quests
     - Side Quests

**Cara Menggunakan:**

- Dashboard otomatis menampilkan data untuk quarter saat ini
- Gunakan Quarter Selector untuk melihat data quarter lain
- Klik card untuk navigasi cepat ke halaman terkait

---

### 2. Daily Sync

**Apa itu Daily Sync?**

Daily Sync adalah kokpit produktivitas harian yang membantu Anda mengeksekusi rencana dengan fokus. Daily Sync terdiri dari beberapa komponen yang bekerja bersama.

#### 2.1 Target Focus (Komponen Progress Bar)

**Apa itu Target Focus?**

Target Focus adalah komponen progress bar yang menampilkan **Total Focus Time** (target vs actual). Komponen ini adalah referensi dari **Mindfulday (Muhammad Azammuddin)**.

**Cara Kerja:**

- **Target Sesi**: Total target sesi yang ditetapkan untuk hari ini
- **Actual Sesi**: Total sesi yang benar-benar diselesaikan
- **Progress Bar**: Visualisasi progress dengan warna yang berbeda

**Tracking:**

Target Focus tracking untuk **semua section**:
- Main Quest Section
- Work Quest Section
- Side Quest Section

**Menampilkan:**

- Total focus time (target vs actual)
- Target sesi dan realita yang dibuat di setiap section
- Progress percentage

**Tips:**

- Target Focus membantu Anda melihat apakah target harian tercapai
- Gunakan sebagai motivasi untuk menyelesaikan sesi fokus
- Review di akhir hari untuk evaluasi

---

#### 2.2 Daily Plan Items

**Apa itu Daily Plan Items?**

Daily Plan Items adalah daftar tugas harian yang dipisah menjadi 3 section terpisah. Ini adalah perbedaan utama dengan Sync Planner.

**Perbedaan dengan Sync Planner:**

| Aspek | Sync Planner | Better Planner |
|-------|--------------|----------------|
| **Daily Focus** | Maksimal 3 items | Bisa banyak items |
| **Struktur** | Dicampur dalam satu list | Dipisah menjadi 3 section |
| **Sumber** | HFG atau kerja kantor (dicampur) | Main Quest, Work Quest, Side Quest (terpisah) |

**3 Section di Better Planner:**

1. **Main Quest Section**
   - Items dari Main Quest (target pribadi)
   - Bisa menambahkan banyak items
   - Tidak terbatas 3 items
   - Items berasal dari Quest → Milestone → Task → SubTask

2. **Work Quest Section**
   - Items dari Work Quest (kerja kantoran)
   - Dipisahkan dari Main Quest
   - Bisa menambahkan banyak items
   - Tidak terbatas 3 items

3. **Side Quest Section**
   - Items dari Side Quest (tugas tambahan)
   - Bisa menambahkan banyak items
   - Tidak terbatas 3 items

**Cara Menggunakan:**

1. **Menambahkan Items ke Daily Plan**
   - Klik **Add Quest** pada section yang diinginkan
   - Pilih items dari quest yang tersedia
   - Set items akan ditambahkan ke Daily Plan

2. **Mengatur Target Sesi**
   - Setiap item memiliki **Target Sesi** (berapa sesi yang ingin diselesaikan hari ini)
   - Klik angka target untuk mengubah
   - Target digunakan untuk menghitung Total Focus Time

3. **Mengatur Focus Duration**
   - Setiap item memiliki **Focus Duration** (25, 60, atau 90 menit)
   - Klik durasi untuk mengubah
   - Durasi menentukan panjang sesi Pomodoro Timer

4. **Mengubah Status**
   - Setiap item memiliki status: TODO, IN_PROGRESS, DONE
   - Klik status untuk mengubah
   - Status digunakan untuk tracking progress

5. **Fitur Tambahan**
   - **Convert to Checklist**: Ubah item menjadi checklist mode (focus duration = 0)
   - **Convert to Quest**: Ubah item menjadi quest mode (dengan focus duration)
   - **Remove**: Hapus item dari Daily Plan

**Tips:**

- Fokus pada Main Quest Section untuk target pribadi
- Gunakan Work Quest Section untuk tugas kantor
- Gunakan Side Quest Section untuk tugas tambahan
- Atur target sesi yang realistis untuk setiap item

---

#### 2.3 Pomodoro Timer

**Apa itu Pomodoro Timer?**

Pomodoro Timer adalah timer fokus yang membantu Anda bekerja dengan fokus penuh pada satu tugas dalam periode waktu tertentu.

**Perbedaan dengan Sync Planner:**

| Aspek | Sync Planner | Better Planner |
|-------|--------------|----------------|
| **Durasi** | 1 sesi 90 menit, lalu 3 sesi 60 menit | Bisa pilih 25, 60, atau 90 menit per sesi |
| **Fleksibilitas** | Fixed duration | Flexible per task |

**Durasi di Better Planner:**

- **25 menit**: Referensi dari Mindfulday (Muhammad Azammuddin)
- **60 menit**: Durasi standar untuk deep work
- **90 menit**: Durasi untuk sesi fokus yang lebih panjang

**Cara Menggunakan:**

1. **Memilih Task**
   - Pilih task dari Daily Plan Items
   - Task harus memiliki focus duration (25, 60, atau 90 menit)
   - Task dengan checklist mode (focus duration = 0) tidak bisa menggunakan timer

2. **Memulai Timer**
   - Klik tombol **Play** pada Pomodoro Timer
   - Timer akan mulai menghitung mundur
   - Fokus sepenuhnya pada task yang dipilih

3. **Mengontrol Timer**
   - **Pause**: Jeda timer sementara
   - **Resume**: Lanjutkan timer yang dijeda
   - **Stop**: Hentikan timer (tidak menyimpan sesi)

4. **Menyelesaikan Timer**
   - Timer akan otomatis selesai ketika mencapai target duration
   - Atau klik **Complete** untuk menyelesaikan manual
   - Setelah selesai, One Minute Journal akan muncul otomatis

**Fitur Tambahan:**

- **Break Timer**: Otomatis menawarkan break setelah sesi fokus
  - Short Break: 5 menit
  - Long Break: 15 menit
- **Sound Settings**: Pilih suara untuk timer (focus sound, completion sound)
- **Background Timer**: Timer tetap berjalan di background (PWA)
- **Timer Persistence**: Timer disimpan dan bisa dilanjutkan setelah refresh

**Tips:**

- Gunakan 25 menit untuk task yang memerlukan fokus tinggi
- Gunakan 60 menit untuk deep work
- Gunakan 90 menit untuk sesi fokus yang lebih panjang
- Ambil break setelah setiap sesi untuk memulihkan energi

---

#### 2.4 One Minute Journal

**Apa itu One Minute Journal?**

One Minute Journal adalah jurnal singkat yang diisi setelah setiap sesi Pomodoro Timer selesai. Ini membantu "Mastering Transition" dan menghilangkan "Residual Attention" dari tugas sebelumnya.

**Cara Mengisi:**

Setelah timer selesai, modal One Minute Journal akan muncul otomatis. Jawab 2 pertanyaan:

1. **Apa yang telah saya selesaikan?**
   - Tuliskan secara singkat apa yang telah diselesaikan
   - Tuliskan progress yang dibuat
   - Tuliskan hasil yang dicapai

2. **Yang masih dipikirkan:**
   - Tuliskan apa yang masih dipikirkan atau perlu ditindaklanjuti
   - Gunakan untuk membersihkan pikiran

**Tips:**

- Isi dengan singkat—tidak perlu panjang
- Fokus pada transisi, bukan dokumentasi detail
- Gunakan untuk membersihkan pikiran sebelum beralih ke task berikutnya
- Shortcut: Cmd+Enter (Mac) atau Ctrl+Enter (Windows/Linux) untuk save cepat

---

#### 2.5 Brain Dump

**Apa itu Brain Dump?**

Brain Dump adalah bagian untuk mencatat semua pikiran yang muncul sepanjang hari, yang mungkin berupa ide atau tindakan di masa depan.

**Mengapa Penting?**

- **Menyimpan Ide**: Mencegah ide berharga hilang
- **Membersihkan Pikiran**: Membebaskan energi mental untuk fokus
- **Organisasi**: Menyimpan ide untuk digunakan di masa depan

**Cara Menggunakan:**

1. **Tuliskan Segera**
   - Ketika ide muncul, tuliskan segera di Brain Dump
   - Jangan biarkan ide hilang atau mengacaukan pikiran

2. **Review Secara Berkala**
   - Review Brain Dump setiap minggu
   - Identifikasi ide yang dapat ditindaklanjuti
   - Pindahkan ke rencana atau tugas jika relevan

3. **Bersihkan Secara Berkala**
   - Hapus ide yang sudah tidak relevan
   - Arsipkan ide yang mungkin berguna di masa depan
   - Fokus pada ide yang dapat ditindaklanjuti

**Fitur:**

- Rich text editor untuk formatting
- Auto-save (Cmd+Enter atau Ctrl+Enter)
- Collapsible card untuk menghemat ruang

**Tips:**

- Tuliskan semua ide, tidak peduli seberapa kecil
- Review Brain Dump setiap minggu
- Gunakan untuk mengisi Weekly Sync atau perencanaan

---

#### 2.6 Activity Log

**Apa itu Activity Log?**

Activity Log adalah log aktivitas otomatis yang mencatat semua sesi fokus dan break yang dilakukan. Konsep ini berasal dari **Mindfulday (Muhammad Azammuddin)**.

**Cara Kerja:**

Activity Log otomatis mencatat:
- **Focus Sessions**: Setiap sesi Pomodoro Timer yang diselesaikan
- **Break Sessions**: Setiap break yang diambil
- **Journal Entries**: One Minute Journal yang diisi

**Informasi yang Dicatat:**

- Waktu mulai dan selesai
- Durasi sesi
- Task yang dikerjakan
- Journal entries (apa yang diselesaikan, yang masih dipikirkan)

**Cara Menggunakan:**

- Activity Log otomatis ter-update setelah setiap sesi
- Klik item untuk melihat detail
- Review di akhir hari untuk evaluasi

**Tips:**

- Gunakan Activity Log untuk melihat pola produktivitas
- Review di akhir hari untuk evaluasi
- Gunakan untuk meningkatkan produktivitas keesokan hari

---

#### 2.7 Total Fokus Harian

**Apa itu Total Fokus Harian?**

Total Fokus Harian adalah konsep dari **Mindfulday (Muhammad Azammuddin)** yang menampilkan total waktu fokus yang dihabiskan dalam sehari.

**Cara Kerja:**

- Dihitung dari semua sesi fokus yang diselesaikan
- Ditampilkan di Target Focus component
- Membantu tracking produktivitas harian

**Tips:**

- Set target yang realistis
- Review di akhir hari
- Gunakan untuk meningkatkan produktivitas

---

### 3. Weekly Sync

**Apa itu Weekly Sync?**

Weekly Sync adalah perencanaan mingguan yang membantu Anda mengalokasikan waktu dengan efektif untuk mencapai tujuan mingguan.

**Fitur Weekly Sync:**

1. **Weekly Goals (3 Slot Tujuan Mingguan)**
   - 3 slot untuk tujuan mingguan
   - Setiap slot dapat diisi dengan items dari Main Quests
   - Progress tracking untuk setiap goal

2. **Modal Pemilihan Items**
   - Klik slot goal untuk membuka modal
   - Pilih items dari Main Quests (hierarchical: Quest → Milestone → Task → SubTask)
   - Items yang dipilih akan ditampilkan di goal slot

3. **Progress Tracking**
   - Progress dihitung otomatis berdasarkan status items
   - Ditampilkan dalam progress bar
   - Progress percentage untuk setiap goal

4. **Week Selector**
   - Pilih minggu yang ingin direncanakan
   - Navigasi ke minggu sebelumnya/selanjutnya
   - Otomatis menampilkan minggu saat ini

**Cara Menggunakan:**

1. **Menentukan Weekly Goals**
   - Review Main Quests dan identifikasi apa yang dapat dicapai dalam 1 minggu
   - Pilih 3 tujuan utama untuk minggu ini

2. **Memilih Items untuk Setiap Goal**
   - Klik slot goal (Goal 1, Goal 2, atau Goal 3)
   - Modal akan terbuka dengan hierarchical data dari Main Quests
   - Pilih items yang relevan (Quest, Milestone, Task, atau SubTask)
   - Klik **Save** untuk menyimpan

3. **Tracking Progress**
   - Progress otomatis ter-update ketika items di Daily Sync diselesaikan
   - Review progress setiap hari
   - Sesuaikan jika diperlukan

**Tips:**

- Fokus pada tujuan yang paling penting
- Pastikan setiap goal dapat dicapai dalam 1 minggu
- Review progress setiap hari untuk memastikan tetap on track

---

## QUESTS SECTION {#quests-section}

### 1. Work Quests

**Apa itu Work Quests?**

Work Quests adalah quest yang berkaitan dengan **pekerjaan/kantor**. Work Quests dipisahkan dari Main Quest untuk memisahkan target pribadi dan profesional.

**Struktur Work Quests:**

Work Quests menggunakan struktur **Project → Task**:
- **Project**: Proyek atau pekerjaan utama
- **Task**: Tugas-tugas dalam proyek

**Cara Menggunakan:**

1. **Membuat Project**
   - Klik **Add Project**
   - Isi nama project
   - Klik **Save**

2. **Menambahkan Task**
   - Klik **Add Task** pada project
   - Isi nama dan deskripsi task
   - Klik **Save**

3. **Mengelola Task**
   - Edit task: Klik task untuk edit
   - Toggle status: Klik checkbox untuk menandai selesai
   - Delete task: Hapus task yang tidak diperlukan

**Perbedaan dengan Main Quest:**

| Aspek | Main Quest | Work Quest |
|-------|------------|------------|
| **Tujuan** | Target pribadi | Kerja kantoran |
| **Struktur** | Quest → Milestone → Task → SubTask | Project → Task |
| **Sumber** | Dari 12 Week Quests (top 3) | Dibuat manual |
| **Tracking** | Progress tracking hierarkis | Status tracking sederhana |

**Tips:**

- Gunakan Work Quests untuk mengelola tugas kantor
- Pisahkan dengan jelas dari Main Quest
- Review secara berkala untuk memastikan tetap on track

---

### 2. Side Quests

**Apa itu Side Quests?**

Side Quests adalah quest tambahan di luar Main Quest dan Work Quest. Side Quests adalah tugas yang tidak terkait langsung dengan tujuan utama.

**Cara Menggunakan:**

1. **Membuat Side Quest**
   - Buka halaman **Quests → Side Quests**
   - Klik **Add Side Quest**
   - Isi nama dan deskripsi
   - Klik **Save**

2. **Mengelola Side Quest**
   - Edit: Klik quest untuk edit
   - Toggle status: Klik checkbox untuk menandai selesai
   - Delete: Hapus quest yang tidak diperlukan

**Tips:**

- Gunakan Side Quests untuk tugas tambahan
- Jangan biarkan Side Quests mengganggu Main Quest
- Review secara berkala

---

## CATATAN FITUR YANG BELUM DIBUAT {#catatan-fitur}

Berikut adalah fitur-fitur yang direncanakan tetapi belum dibuat:

### 1. To Don't List

**Status**: Belum dibuat (ada di kode tapi dikomentari)

**Deskripsi**: Daftar aktivitas yang tidak berkontribusi pada kesuksesan dan harus dihindari.

**Rencana**: Fitur ini direncanakan untuk Weekly Sync, akan membantu mengidentifikasi dan menghindari aktivitas yang tidak produktif.

---

### 2. Self Development Curriculum

**Status**: Belum dibuat (dikomentari di sidebar)

**Deskripsi**: Rencana pembelajaran yang disengaja untuk mengembangkan skill, kebiasaan, dan pengetahuan yang diperlukan untuk mencapai tujuan.

**Rencana**: Fitur ini akan membantu mengorganisir sumber pembelajaran (buku, kursus, artikel) yang relevan dengan Main Quest.

---

### 3. Best Week

**Status**: Belum dibuat (dikomentari di sidebar)

**Deskripsi**: Template untuk merencanakan minggu yang produktif dengan mengkategorikan aktivitas berdasarkan nilai (High Lifetime Value, High Rupiah Value, Low Rupiah Value, Zero Rupiah Value).

**Rencana**: Fitur ini akan membantu merencanakan minggu ideal dengan mengalokasikan waktu untuk aktivitas yang paling bernilai.

---

### 4. Habit Tracker

**Status**: Belum dibuat (dikomentari di sidebar)

**Deskripsi**: Modul untuk mendefinisikan dan melacak konsistensi kebiasaan harian.

**Rencana**: Fitur ini akan membantu membangun kebiasaan positif dan menghilangkan kebiasaan negatif dengan tracking streak dan progress.

---

### 5. Reports

**Status**: Belum dibuat (dikomentari di sidebar)

**Deskripsi**: Laporan dan analitik untuk melihat pola produktivitas, progress, dan insights.

**Rencana**: Fitur ini akan menyediakan visualisasi data dan laporan otomatis (termasuk dengan bantuan AI) untuk memberikan penilaian, identifikasi pola, dan rekomendasi.

---

### 6. Settings/Profile

**Status**: Belum dibuat (dikomentari di sidebar)

**Deskripsi**: Pengaturan aplikasi dan profil pengguna.

**Rencana**: Fitur ini akan menyediakan manajemen data master (kategori, status, prioritas, dll) dan pengaturan aplikasi.

---

### 7. Weekly Tasks (Time-Blocking)

**Status**: Dibatalkan, tidak akan dibuat

**Deskripsi**: Fitur untuk menjadwalkan tugas dalam slot waktu mingguan.

**Catatan**: Fitur ini awalnya direncanakan tetapi dibatalkan. Weekly Sync saat ini fokus pada Weekly Goals tanpa time-blocking.

---

## ALUR KERJA BETTER PLANNER {#alur-kerja}

### 1. Setup Awal (Sekali)

**Langkah-langkah:**

1. **Isi Vision**
   - Buka **Planning → Vision**
   - Isi visi 3-5 tahun dan 10 tahun untuk setiap Area Kehidupan
   - Klik **Simpan Perubahan**

2. **Tentukan 12 Week Quests**
   - Buka **Planning → 12 Week Quests**
   - Pilih Quarter yang ingin direncanakan
   - Input 10 tujuan untuk 12 minggu
   - Lakukan Pairwise Comparison
   - Commit top 3 sebagai Main Quest

3. **Buat Main Quests**
   - Setelah commit, Anda akan diarahkan ke **Main Quests**
   - Buat Milestone untuk setiap Quest
   - Buat Task untuk setiap Milestone
   - Buat SubTask jika diperlukan

4. **Setup Work Quests (Opsional)**
   - Buka **Quests → Work Quests**
   - Buat Project untuk pekerjaan kantor
   - Tambahkan Task ke setiap Project

---

### 2. Alur Harian (Daily Sync)

**Langkah-langkah:**

1. **Mulai Hari dengan Daily Sync**
   - Buka **Execution → Daily Sync**
   - Pilih tanggal yang ingin direncanakan

2. **Tambahkan Items ke Daily Plan**
   - **Main Quest Section**: Tambahkan items dari Main Quest
   - **Work Quest Section**: Tambahkan items dari Work Quest
   - **Side Quest Section**: Tambahkan items dari Side Quest
   - Atur target sesi dan focus duration untuk setiap item

3. **Gunakan Pomodoro Timer**
   - Pilih task dari Daily Plan
   - Klik **Play** untuk memulai timer
   - Fokus sepenuhnya pada task
   - Setelah selesai, isi One Minute Journal

4. **Gunakan Brain Dump**
   - Tuliskan ide atau pikiran yang muncul
   - Jangan biarkan mengganggu fokus

5. **Review di Akhir Hari**
   - Review Target Focus (progress harian)
   - Review Activity Log
   - Review apa yang telah diselesaikan
   - Gunakan untuk memperbaiki perencanaan besok

---

### 3. Alur Mingguan (Weekly Sync)

**Langkah-langkah:**

1. **Review Main Quests**
   - Buka **Planning → Main Quests**
   - Review kemajuan milestone dan task
   - Identifikasi apa yang dapat dicapai dalam 1 minggu

2. **Tentukan Weekly Goals**
   - Buka **Execution → Weekly Sync**
   - Pilih minggu yang ingin direncanakan
   - Tentukan 3 tujuan utama untuk minggu ini

3. **Pilih Items untuk Setiap Goal**
   - Klik slot goal (Goal 1, Goal 2, atau Goal 3)
   - Pilih items dari Main Quests (Quest, Milestone, Task, atau SubTask)
   - Klik **Save**

4. **Tracking Progress**
   - Progress otomatis ter-update ketika items di Daily Sync diselesaikan
   - Review progress setiap hari
   - Sesuaikan jika diperlukan

5. **Review di Akhir Minggu**
   - Review kemajuan Weekly Goals
   - Skor setiap goal pada skala 1-10
   - Buat catatan tentang apa yang berhasil dan tidak
   - Gunakan untuk memperbaiki strategi

---

### 4. Alur Quarterly (Review dan Planning Ulang)

**Langkah-langkah:**

1. **Review 12 Minggu**
   - Review semua Main Quests
   - Identifikasi apa yang telah dicapai
   - Identifikasi apa yang tidak dicapai dan alasan

2. **Refleksikan Pengalaman**
   - Tuliskan 3 pencapaian terbesar
   - Tuliskan 3 pelajaran terpenting
   - Tuliskan 3 hal yang dapat diperbaiki

3. **Siapkan Quarter Berikutnya**
   - Review Vision
   - Tentukan 10 tujuan baru untuk 12 minggu berikutnya
   - Lakukan Pairwise Comparison
   - Commit top 3 sebagai Main Quest baru

4. **Gunakan Pengalaman untuk Perbaikan**
   - Gunakan pelajaran dari quarter sebelumnya
   - Perbaiki strategi dan proses
   - Terapkan best practices yang telah dipelajari

---

## KESIMPULAN

Better Planner adalah alat yang powerful untuk mengubah impian menjadi kenyataan. Dengan mengikuti konsep dan prinsip yang dijelaskan dalam panduan ini, Anda dapat:

- **Merencanakan dengan Strategis**: Vision, 12 Week Quests, dan Main Quests membantu Anda merencanakan dengan strategis
- **Mengeksekusi dengan Fokus**: Daily Sync dengan 3 section terpisah, Pomodoro Timer, dan Target Focus membantu Anda mengeksekusi dengan fokus
- **Meningkatkan Produktivitas**: Weekly Sync, Activity Log, dan Brain Dump membantu Anda meningkatkan produktivitas
- **Mencapai Tujuan**: Dengan perencanaan yang strategis dan eksekusi yang fokus, Anda dapat mencapai tujuan Anda

**Ingat**: Better Planner adalah alat, bukan aturan yang kaku. Sesuaikan dengan kebutuhan dan situasi Anda. Perbaiki dan tingkatkan berdasarkan pengalaman. Konsistensi lebih penting daripada kesempurnaan.

**Selamat menggunakan Better Planner dan mencapai tujuan Anda!** 🚀

---

**Versi:** 1.0  
**Terakhir Diupdate:** 2025  
**Kontak:** [Website](https://planner.abuabdirohman.com)

---

*Dibuat dengan ❤️ untuk orang-orang yang menolak untuk puas dengan hasil rata-rata*


