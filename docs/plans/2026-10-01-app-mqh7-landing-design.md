# app-mqh7 — Landing page baru Bahasa Indonesia (DESAIN)

Pasangan: `2026-10-01-app-mqh7-landing-implementation-plan.md`. Prompt executor: `docs/prompts/2026-10-01-app-mqh7-landing.md`.

Issue: `app-mqh7` (hub `~/Documents/applications`). Bergantung pada `app-5r0j` (sidebar 5 grup) — **hanya untuk screenshot**, bukan untuk kode landing.

Bahan riset: `~/Documents/second-brain/1.Projects/system/productivity/` → `superfocus/` (pola alur bertahap + ON TRACK/AT RISK), `acuan/` (susunan & bahasa untuk pasar Indonesia, banyak gambar produk asli), `life-os/` (dua pilar Arah + Jalan, hook "produktif di hal yang salah"). Yang ditiru **pola**, bukan aset, warna, atau kalimat.

## Keputusan (brainstorming Abu + Claude, 1 Okt 2026)

| # | Topik | Keputusan |
|---|---|---|
| K1 | Pembaca | Orang sibuk yang **belum kenal metode 12 minggu**. Istilah (HFG, Weekly/Daily Sync) dikenalkan pelan, bukan dianggap sudah dipahami |
| K2 | Bahasa | Indonesia saja sekarang. Versi Inggris menyusul → semua teks di **satu berkas** `copy.id.ts`, EN nanti cukup `copy.en.ts`. Tidak membangun sistem i18n sekarang |
| K3 | Hero | Masalah dulu: "Hari-harimu penuh. Target besarmu masih di tempat." (sengaja tidak menerjemahkan "Busy all day. Still no progress…" milik Superfocus) |
| K4 | Alur | **3 langkah × 3 kartu** (pola Superfocus): ARAH · JALAN · CEK. Tiap langkah 1 gambar besar + 3 kartu bergambar. Pembeda (ON TRACK/AT RISK, energi, Plan vs Actual, Best Week) masuk Langkah 3 — tidak ada seksi pembeda terpisah |
| K5 | CTA | Utama **"Coba gratis" → `/signup`**. Sekunder "Masuk" → `/signin` |
| K6 | Harga | Eksperimen, bisa dimatikan satu konstanta `SHOW_PRICING`. Dua kartu: Gratis (masa awal) + Pro "Harga diumumkan nanti" dengan tombol mati "Segera hadir". Tidak ada pembayaran |
| K7 | Bukti | Tanpa testimoni karangan. Seksi **metode Sync Planner + cerita pembuat** (kutipan ditulis Claude, disetujui Abu untuk direview nanti) |
| K8 | Nama | **Better Planner** di semua teks dan metadata (bukan "BePlan") |
| K9 | Gambar | Screenshot asli dari **akun demo berisi data contoh** (bukan akun Abu), diambil Claude dengan skill `/app-screenshot` setelah `app-5r0j` selesai |
| K10 | Visual | Pakai token brand yang sudah ada (`brand-500 #465fff`, font Outfit), latar terang, tanpa gradient berlapis. Oranye Acuan & hitam-putih Superfocus sengaja dihindari. Mode terang saja |

## Arsitektur

- `middleware.ts:31` **sudah** mengalihkan user login dari `/` ke `/dashboard`. Jadi `LandingPageClient.tsx` (cek auth di klien + spinner) mubazir, dan justru membuat crawler/OG hanya melihat spinner. **Dihapus.**
- `src/app/page.tsx` = server component: `metadata` + `<LandingPage />`.
- `src/components/landing/LandingPage.tsx` = satu server component berisi semua seksi (tanpa `"use client"`, tanpa state). Nav mobile tidak pakai hamburger: di < md cukup logo + Masuk + Coba gratis; link anchor hanya tampil ≥ md.
- `src/components/landing/copy.id.ts` = semua teks + path gambar + alt text. Satu-satunya sumber teks.
- FAQ memakai `<details>/<summary>` bawaan HTML (tanpa JS).
- Gambar: `next/image` dengan `src` string ke `/images/landing/*.jpg` dan `width`/`height` eksplisit dari ukuran baku (di bawah). Tidak memakai static import, supaya kode bisa dibangun sebelum gambar ada.
- Link CTA memakai `next/link` dengan kelas brand (komponen `Button` berupa `<button>`, tidak punya `href`). Tombol mati "Segera hadir" memakai `Button` `disabled` `variant="outline"`.
- **Dihapus** (hanya dipakai landing lama — sudah dicek dengan grep): `LandingPageClient.tsx`, `LandingPageContent.tsx`, `src/stores/languageStore.ts`, `src/components/ui/languages/LanguageToggle.tsx`.
- `src/app/layout.tsx:62` `lang="en"` → `lang="id"`.
- Metadata landing: `metadataBase: new URL('https://planner.abuabdirohman.com')`, `openGraph.locale: 'id_ID'`, `openGraph.images: '/images/landing/og.jpg'`.

Ditolak: (B) mengisi ulang store i18n lama — tetap client-rendered dan menggandakan kerja; (C) situs marketing terpisah — bertentangan dengan keputusan `/` tetap landing publik.

## Susunan halaman

```
Nav → 1 Hero → 2 Masalah → 3 Cara kerja (Langkah 1 ARAH · 2 JALAN · 3 CEK)
→ 4 Sebelum/Sesudah → 5 Metode + pembuat → 6 Harga (SHOW_PRICING) → 7 Tanya jawab → 8 CTA akhir + footer
```

Tata letak (desktop → 390px):

```
HERO          teks tengah, CTA, lalu gambar lebar (desktop) / gambar HP (mobile, <picture> via 2 next/image + hidden)
MASALAH       2 kolom: teks kiri | kartu to-do HTML kanan   →  tumpuk, kartu di bawah
LANGKAH n     kartu besar: teks kiri | gambar besar kanan    →  tumpuk
              3 kartu kecil di bawahnya (judul, 1 kalimat, gambar 4:3)  →  1 kolom
SEBELUM/SES.  2 kartu berdampingan (kiri abu-abu, kanan bertepi brand)  →  tumpuk
METODE        3 poin sejajar + blok kutipan pembuat          →  tumpuk
HARGA         2 kartu                                         →  tumpuk
FAQ           judul kiri | daftar <details> kanan            →  tumpuk
CTA AKHIR     judul tengah + tombol
```

Anchor: `#cara-kerja`, `#harga`, `#tanya-jawab`. Kalau `SHOW_PRICING = false`, link nav "Harga" ikut hilang.

## Copy (sumber tunggal — executor menyalin persis ke `copy.id.ts`)

### Nav
Logo Better Planner · Cara kerja · Harga · Tanya jawab · **Masuk** · **[Coba gratis]**

### 1 · Hero
- Label kecil: *Perencana 12 minggu*
- H1: **Hari-harimu penuh. Target besarmu masih di tempat.**
- Sub: Better Planner membantumu memilih 3 tujuan terpenting, memecahnya jadi rencana 12 minggu, mingguan, dan harian — lalu memberi tahu mana yang mulai tertinggal.
- CTA: **[Coba gratis]** · Sudah punya akun? **Masuk**
- Catatan kecil: Gratis selama masa awal. Cukup daftar dengan email.
- Gambar: `hero-desktop.jpg` / `hero-mobile.jpg` — alt: "Halaman Daily Sync Better Planner: daftar tugas hari ini, timer fokus, dan jadwal harian"

### 2 · Masalah
- Label: *Terdengar familiar?*
- H2: **Bukan kurang rajin. Kurang arah.**
- Paragraf: Daftar tugasmu 40 baris. Kalender penuh rapat. Tiap malam kamu capek, tapi kalau ditanya "tujuan besarmu maju berapa minggu ini?" — jawabannya diam. Masalahnya jarang di kemauan. Kamu sibuk mengerjakan yang mendesak, sementara yang penting menunggu giliran yang tidak pernah datang.
- Kalimat tebal (bertepi kiri): **Tiga bulan lewat lagi, dan target yang sama masih ada di daftar.**
- Kartu to-do (HTML, bukan gambar), judul "Hari ini":
  - Balas 23 chat grup
  - Rapat mingguan
  - Rapikan folder laptop
  - Beli token listrik
  - Revisi slide presentasi
  - *(pudar)* Belajar untuk sertifikasi
  - *(pudar)* Riset usaha sampingan
  - *(paling pudar)* + 32 lagi

### 3 · Cara kerja (intro)
- Label: *Cara kerjanya*
- H2: **Tiga langkah, diulang tiap kuartal**
- Sub: Tentukan arah sekali di awal. Jalankan tiap minggu dan tiap hari. Cek, lalu sesuaikan. Semuanya di satu tempat, jadi kamu tidak perlu menyambungkannya sendiri.

### Langkah 1 · ARAH
- Tag: *Langkah 1 · Arah*
- H3: **Pilih 3 tujuan untuk 12 minggu ke depan**
- Isi: Mulai dari visimu, tulis semua yang ingin dicapai kuartal ini, lalu adu satu lawan satu sampai ketemu tiga yang paling penting. Tiga, bukan sepuluh — supaya tenagamu tidak terbagi rata ke semua hal.
- Gambar besar: `l1-main-quests.jpg` — alt: "Tiga tujuan kuartal berjajar, masing-masing dengan milestone dan langkahnya"
- Kartu:
  1. **Visi** — Tulis mau jadi apa 3–10 tahun lagi. Ini jadi patokan saat memilih tujuan. · `l1-vision.jpg` · alt "Halaman visi"
  2. **Pilih yang terpenting** — Semua ide tujuan diadu berpasangan. Hasilnya urutan prioritas yang jelas, bukan tebakan. · `l1-pairwise.jpg` · alt "Matriks perbandingan berpasangan untuk mengurutkan tujuan"
  3. **Jatah jam per tujuan** — Tiap tujuan dipecah jadi milestone dan diberi jatah jam per minggu. · `l1-jatah-jam.jpg` · alt "Tujuan dengan jatah jam per minggu"

### Langkah 2 · JALAN
- Tag: *Langkah 2 · Jalan*
- H3: **Ubah tujuan jadi jadwal minggu ini dan hari ini**
- Isi: Tiap awal minggu, pilih langkah dari tiga tujuan tadi — plus daftar hal yang sengaja tidak kamu kerjakan minggu ini. Tiap pagi, tarik yang mau dikerjakan hari ini, pasang di jam, lalu mulai timer fokus. Semua sesi tercatat sendiri.
- Gambar besar: `l2-weekly-sync.jpg` — alt: "Weekly Sync: rencana minggu ini yang diambil dari tiga tujuan"
- Kartu:
  1. **Rencana harian** — Tiap pagi, tarik tugas dari rencana minggu ini ke hari ini, lengkap dengan jamnya. · `l2-daily-plan.jpg` · alt "Daftar tugas hari ini di Daily Sync"
  2. **Timer fokus** — Sesi 25 menit yang tetap jalan walau tab ditutup, lengkap dengan notifikasi. · `l2-timer.jpg` · alt "Timer fokus yang sedang berjalan"
  3. **Rencana vs kenyataan** — Kalender harian menampilkan jadwal yang direncanakan dan yang benar-benar terjadi, berdampingan. · `l2-plan-actual.jpg` · alt "Kalender harian mode Plan dan Actual berdampingan"

### Langkah 3 · CEK
- Tag: *Langkah 3 · Cek*
- H3: **Tahu tujuan mana yang tertinggal, sebelum terlambat**
- Isi: Tiap tujuan diberi status ON TRACK atau AT RISK, dihitung dari jam fokus yang benar-benar kamu habiskan minggu ini dibanding jatahnya. Kamu tahu harus menambah jam di mana — bukan baru sadar di minggu ke-11.
- Gambar besar: `l3-hfg-status.jpg` — alt: "Status mingguan tiga tujuan: jam fokus dibanding jatah, ON TRACK dan AT RISK"
- Kartu:
  1. **Tanda energi** — Tiap sesi diberi tanda +, =, atau −. Lama-lama kelihatan kerja mana yang menguras dan mana yang mengisi. · `l3-energi.jpg` · alt "Ringkasan energi minggu ini"
  2. **Minggu ideal** — Bandingkan jadwal nyata minggu ini dengan template minggu idealmu. · `l3-best-week.jpg` · alt "Jadwal minggu ini di atas grid minggu ideal"
  3. **Evaluasi 12 minggu** — Di akhir kuartal, tinjau pencapaian dan refleksi, lalu mulai kuartal baru dengan bahan yang lengkap. · `l3-12-week-sync.jpg` · alt "Halaman evaluasi akhir kuartal"

### 4 · Sebelum / Sesudah
- H2: **Yang berubah**
- Kartu kiri — *Tanpa sistem*: Daftar tugas yang tidak pernah habis, kalender yang tidak pernah bertanya apakah ini penting, dan evaluasi yang baru terjadi setelah kuartal lewat.
- Kartu kanan — *Dengan Better Planner*: Tiga tujuan yang jelas, jam yang disisihkan untuk masing-masing, dan peringatan tiap minggu saat salah satunya mulai tertinggal.

### 5 · Metode + pembuat
- Label: *Dasarnya*
- H2: **Dibangun di atas metode Sync Planner**
- Sub: Bukan metode baru. Metode yang sudah dipakai banyak orang, dibuat gampang dijalankan tiap hari.
- Tiga poin:
  1. **12 minggu, bukan setahun** — Setahun terlalu jauh untuk terasa mendesak. Dua belas minggu cukup panjang untuk hasil besar, dan cukup pendek untuk tetap fokus.
  2. **3 tujuan terpenting** — Prinsip *Highest First*: kerjakan yang paling penting dulu, sisanya menunggu giliran.
  3. **Sinkron tiap minggu dan hari** — Weekly Sync dan Daily Sync menjaga rencana besar tetap nyambung dengan yang kamu kerjakan hari ini.
- Kutipan: "Sistem 12 minggu ini awalnya saya jalankan di Google Sheets. Lama-lama sheet-nya makin berat: susah dibuka di HP, semua hubungan antar data diisi manual, dan saya baru sadar sebuah target tertinggal ketika kuartalnya hampir habis. Better Planner saya bangun untuk menutup celah itu, dan sampai sekarang saya pakai tiap hari untuk merencanakan dan mencatat kerja."
- Atribusi: **Abu Abdirohman** — pembuat Better Planner (avatar = inisial "AA" dalam lingkaran brand, bukan foto)

### 6 · Harga (hanya jika `SHOW_PRICING`)
- H2: **Mulai gratis**
- Kartu Gratis: nama "Gratis" · harga "Rp0" · keterangan "Semua fitur, selama masa awal" · daftar: 3 tujuan & rencana 12 minggu · Weekly Sync & Daily Sync · Timer fokus + catatan otomatis · Habit tracker · Bisa dipasang di HP · tombol **[Coba gratis]** → `/signup`
- Kartu Pro: nama "Pro" · lencana "Segera" · harga "Diumumkan nanti" · keterangan "Untuk yang ingin lebih dari dasar" · tanpa daftar fitur · tombol mati **[Segera hadir]**

### 7 · Tanya jawab
1. **Apa bedanya dengan to-do list biasa?** — To-do list mencatat semua hal. Better Planner dimulai dari 3 tujuan terpenting, lalu hanya menurunkan pekerjaan yang mendukung tujuan itu ke minggu dan harimu.
2. **Belum pernah pakai metode 12 minggu, bisa?** — Bisa. Urutannya dipandu: visi, pilih tujuan, pecah jadi milestone, lalu rencana mingguan. Cukup disusun sekali di awal kuartal.
3. **Bisa dipakai di HP?** — Bisa. Better Planner jalan di browser dan bisa dipasang ke layar utama HP seperti aplikasi. Timer tetap mengirim notifikasi.
4. **Data saya aman?** — Data tiap akun terpisah dan hanya bisa dibuka pemiliknya.
5. **Tersambung ke Google Calendar?** — Belum. Jadwal dibuat di dalam Better Planner.
6. **Aplikasinya berbahasa Indonesia?** — Halaman ini iya. Di dalam aplikasi, beberapa istilah masih bahasa Inggris (Daily Sync, Weekly Sync) karena mengikuti nama metodenya.
7. **Berapa biayanya?** — Gratis selama masa awal.

### 8 · CTA akhir + footer
- H2: **Kuartal ini, pastikan yang penting benar-benar bergerak.**
- **[Coba gratis]**
- Footer: © 2026 Better Planner · Masuk · Daftar. (Link mati footer lama — Help Center, Community, Roadmap, Updates — tidak dibawa.)

### Metadata
- title: `Better Planner — Rencana 12 Minggu untuk 3 Tujuan Terpentingmu`
- description: `Pilih 3 tujuan terpenting, pecah jadi rencana 12 minggu, mingguan, dan harian, lalu lihat mana yang mulai tertinggal. Gratis selama masa awal.`
- keywords: `perencanaan 12 minggu, planner, target, produktivitas, sync planner, pomodoro, habit tracker`
- openGraph: sama + `type: 'website'`, `locale: 'id_ID'`, `images: '/images/landing/og.jpg'`; twitter `summary_large_image`.

## Screenshot (diambil Claude, bukan executor)

Semua dari **akun demo**, lokal `localhost:5100`, skill `/app-screenshot` (Playwright headless + storageState akun demo). Diambil **setelah `app-5r0j` masuk main** (sidebar baru). Ukuran baku supaya `width/height` di kode tetap:

| Berkas | Route | Isi yang harus terlihat | Ukuran |
|---|---|---|---|
| `hero-desktop.jpg` | `/execution/daily-sync` | halaman penuh + sidebar 5 grup, timer, daftar quest, kalender | 1440×900 viewport |
| `hero-mobile.jpg` | `/execution/daily-sync` | tampilan HP + bottom nav | 390×844 viewport |
| `l1-main-quests.jpg` | `/planning/main-quests` | mode grid 3 HFG berjajar | 1440×900 viewport |
| `l1-vision.jpg` | `/planning/vision` | kartu visi terisi | crop 800×600 |
| `l1-pairwise.jpg` | `/planning/12-week-quests` | matriks pairwise terisi | crop 800×600 |
| `l1-jatah-jam.jpg` | `/planning/main-quests` | kepala HFG + jatah jam/minggu | crop 800×600 |
| `l2-weekly-sync.jpg` | `/execution/weekly-sync` | rencana minggu berisi item 3 HFG + To Don't | 1440×900 viewport |
| `l2-daily-plan.jpg` | `/execution/daily-sync` | daftar quest hari ini | crop 800×600 |
| `l2-timer.jpg` | `/execution/daily-sync` | timer sedang berjalan | crop 800×600 |
| `l2-plan-actual.jpg` | `/execution/daily-sync` | kalender mode Both | crop 800×600 |
| `l3-hfg-status.jpg` | `/dashboard` | kartu jatah jam HFG: minimal 1 ON TRACK + 1 AT RISK | 1440×900 (crop area kartu, rasio 16:10) |
| `l3-energi.jpg` | `/dashboard` | kartu "Energi minggu ini" | crop 800×600 |
| `l3-best-week.jpg` | `/planning/best-week` | toggle "Minggu ini" | crop 800×600 |
| `l3-12-week-sync.jpg` | `/planning/12-week-sync` | pencapaian/refleksi terisi | crop 800×600 |
| `og.jpg` | dari `hero-desktop.jpg` | crop tengah | 1200×630 |

Crop kartu yang tidak pas 4:3 diberi latar/padding, bukan ditarik.

### Akun demo (dikerjakan Claude via MCP `better-planner`, bukan executor)

Persona: karyawan swasta, ingin naik kelas karier + sehat + keuangan rapi. Kuartal: **Q4 2026** (minggu berjalan).
- Visi: 1 paragraf pendek (karier data analyst, keluarga, sehat).
- 12 Week Quests: 6–8 ide, pairwise terisi, 3 teratas jadi HFG:
  1. Lulus sertifikasi data analyst — jatah 6 jam/minggu
  2. Dana darurat Rp10 juta — jatah 2 jam/minggu
  3. Lari 10K tanpa berhenti — jatah 3 jam/minggu
- Tiap HFG 3 milestone + beberapa langkah; weekly goal minggu ini terisi; To Don't List 2–3 baris.
- Daily plan hari pemotretan + `task_schedules` + `activity_logs` beberapa hari minggu ini dengan tanda energi campur, diatur supaya HFG 1 **ON TRACK** dan HFG 3 **AT RISK**.
- Best Week template sederhana; 12 Week Sync terisi (pencapaian + refleksi) untuk kuartal demo.
- Habit: 3–4 (Olahraga pagi, Baca 20 menit, Tidur sebelum 23.00).
- Tanpa data pribadi Abu. Email demo + password disimpan di `.env.local` (bukan di repo).

## Pengujian

- Landing murni presentasi → tanpa unit test (aturan TDD: skip untuk UI presentasional).
- Satu E2E `tests/e2e/landing.spec.ts` (sesi dibersihkan): H1 Indonesia tampil; "Coba gratis" → `/signup`; "Masuk" → `/signin`; `html[lang="id"]`; di viewport 390×844 `document.documentElement.scrollWidth <= 390` (tanpa scroll samping); `og:locale` = `id_ID`.
- `npm run type-check` + `npm run build` hijau.

## Checklist review (Claude)

- [ ] Tidak ada `"use client"` di berkas landing; tidak ada teks Indonesia di luar `copy.id.ts` (kecuali `aria-label` generik)
- [ ] 4 berkas lama terhapus, tidak ada import yatim (`grep -rn "languageStore\|LanguageToggle\|LandingPageClient\|LandingPageContent" src tests`)
- [ ] Copy persis sama dengan §Copy di atas
- [ ] `SHOW_PRICING = false` → seksi harga + link nav "Harga" hilang
- [ ] 390px: tanpa scroll samping, gambar tidak pecah, tombol ≥ 44px tinggi
- [ ] Logged-in user yang buka `/` tetap dialihkan ke `/dashboard` (middleware)
- [ ] Tidak ada aset/kalimat Superfocus atau Acuan

## Revisi 1 (feedback Abu, 1 Okt 2026) — menimpa §Copy & tata letak di atas

- Menu header pindah ke kanan (logo kiri; Cara kerja · Harga · FAQ · Masuk · tombol). Tombol utama di nav, hero, dan penutup jadi **"Mulai Sekarang"** (kartu harga Gratis tetap "Coba gratis").
- Klik menu header menggulir halus (`scroll-behavior: smooth`, hanya di landing, hormati reduced-motion) dan berhenti 5rem di bawah header sticky.
- Hero: latar gradasi biru tipis (`brand-50 → brand-25 → putih`), label jadi pil bertitik, kalimat kedua judul bergradasi biru, tombol gradasi biru + panah, tombol kedua "Lihat cara kerja" → `#cara-kerja`, baris centang (Gratis selama masa awal · Cukup daftar dengan email · Bisa dipasang di HP) menggantikan "Sudah punya akun? Masuk" + catatan kecil. Screenshot desktop dibingkai jendela browser (`planner.abuabdirohman.com`).
- "Tanya jawab" → **FAQ** (anchor `#faq`): label "FAQ" + judul "Pertanyaan yang sering muncul", tiap pertanyaan kartu putih membulat, ikon + di kotak biru muda yang berputar jadi × bergradasi saat dibuka.
- Warna tetap biru brand (bukan oranye Acuan) — yang ditiru pola tampilannya.
- `SplashScreen` (root layout) dilewati di `/`: sebelumnya landing tertahan 1,5 detik di balik splash dan HTML server hanya berisi splash.

## Revisi 2 (feedback Abu, 1 Okt 2026)

- Menu "Masuk" dihapus dari header (desktop & HP). "Masuk"/"Daftar" pindah ke kolom **Akun** di footer.
- Judul hero dua bagian seperti Acuan: masalah (hitam) "Hari-harimu penuh, target besarmu masih di tempat." + janji (gradasi biru) "Mulai dari 3 yang terpenting."; ukuran `md:text-5xl`, lebar `max-w-2xl`. Subjudul berpotongan tebal: "Better Planner menyambungkan **visi, 3 tujuan 12 minggu, rencana mingguan, jadwal harian, dan timer fokus** dalam satu alur. **Tiap minggu kamu tahu tujuan mana yang mulai tertinggal** — bukan sekadar daftar tugas yang terus memanjang." Label pil: "Perencana 12 minggu · metode Sync Planner".
- Klik logo → `#top`, menggulir halus ke atas.
- Satu gradasi biru tipis untuk seluruh halaman (brand-50 → brand-25 → putih, berulang); latar per seksi dihapus, kartu tetap putih.
- Penutup + footer gelap (`gray-950`) seperti Acuan: cahaya biru di atas judul, subjudul "Dua belas minggu cukup untuk satu perubahan besar. Mulai dengan memilih tiga tujuanmu hari ini.", tombol gradasi; footer = garis aksen + logo terang + tagline + kolom Produk (Cara kerja, Harga, FAQ) & Akun (Masuk, Daftar) + baris hak cipta & domain.

## Revisi 3 (Abu, 1 Okt 2026)

- Label pil: "Perencana 12 minggu" → **"Perencanaan 12 minggu"**.
- Kata **"tujuan" diganti "goal"** di seluruh copy (termasuk metadata; "tujuanmu" → "goal-mu"). `copy.id.ts` jadi acuan teks terbaru.
- Judul penutup: "12 Minggu ini, pastikan yang terpenting yang kamu kerjakan."

## Revisi 4 (Abu, 1 Okt 2026) — bedah Acuan, seksi baru

Susunan: Hero → **Strip angka gelap** (Web App · 12 Minggu · 3 Goal · Rp0) → **Callout "bukan spreadsheet / buku planner"** (✕/✓ chip) → **Masalah 4 kartu** → **Solusi 8 kartu** (`#fitur`, ikon + label) → Cara kerja 3 langkah (Langkah 3 **Evaluasi**, bukan Cek) → **Nyaman dipakai** (PWA, notifikasi, terang/gelap, data sama di HP & laptop; gambar HP) → **Tabel perbandingan** (Better Planner vs buku planner vs Google Sheets vs aplikasi to-do, 8 baris + 5 chip) → Metode + pembuat → Harga → FAQ → Penutup → Footer. Seksi lama "Masalah (paragraf + kartu to-do)" dan "Sebelum/Sesudah" dihapus. Menu + footer dapat link "Fitur". Chip hero pertama: 🌐 "Aplikasi web, bukan Google Sheets".

Kutipan pembuat memuat riwayat nyata Abu: buku Sync Planner (~16 buku) → Google Sheets → Better Planner.

Sengaja TIDAK diklaim (tidak benar untuk kita): offline 100%, data hanya di perangkat, dua bahasa, sekali bayar, jumlah modul. Teks lengkap: `copy.id.ts`.

## Revisi 5 (Abu, 1 Okt 2026)

- Harga: satu kartu di tengah ala Acuan, **gratis saja** (kartu Pro dihapus): label "Harga", judul "Gratis selama masa awal. Semua fitur terbuka.", pil "Akses masa awal", "Rp0" + lencana "Gratis", 6 butir fitur nyata, kotak "Masa awal" (masih dikembangkan aktif, masukan menentukan fitur), tombol "Mulai Sekarang", catatan "Tanpa kartu kredit".
- Strip angka & callout diperkecil (angka satu baris di ±970px, strip ±140px; judul callout `md:text-2xl`).
- Callout ditulis ulang: "Bukan spreadsheet, bukan buku planner. Ini aplikasi yang bekerja untukmu." / "Banyak orang menjalankan metode 12 minggu di spreadsheet atau buku…" / chip "Ya, aplikasi yang langsung memberi tahu goal mana yang tertinggal". "Pasang (di HP)" → "install" di semua tempat; strip angka: "Bisa di-install di HP".

## Revisi 6 (Abu, 1 Okt 2026)

- **ON TRACK / AT RISK (jam per goal) dan tanda energi tidak ditampilkan di landing** — fitur baru, masih diuji. Penggantinya fitur lama: progres mingguan per goal (cincin Weekly Sync) + grafik 12 minggu dashboard. Langkah 3 = gambar besar 12 Week Sync (`l3-evaluasi.jpg`), kartu: Progres per goal (`l3-goal-progress.jpg`), Minggu ideal, Grafik 12 minggu (`l3-weekly-progress.jpg`). Kartu Langkah 1 "Jatah jam" → "Milestone per goal" (`l1-milestone.jpg`). Gambar lama `l3-hfg-status`, `l3-energi`, `l1-jatah-jam`, `l3-12-week-sync` dihapus.
- Ikon jadi **emoji** (pola Acuan): Masalah 🤹🚨🧩⌛ di kotak merah muda; Solusi 🧭🎯🗓️⏱️📈⚖️✅📝 di kotak bergradasi warna-warni; Nyaman dipakai 📱🔔🌗🔄; chip perbandingan ⚡📱🔔🔄🎁; callout & chip hero 🌐.
- Tabel perbandingan: kolom "Aplikasi to-do" dihapus, urutan **Better Planner | Google Sheets | Buku planner**, sel dipendekkan (satu baris), ✓ hijau / ✕ merah, judul "Bukan sekadar spreadsheet atau buku planner".
- "Kuartal" diganti "12 minggu" di seluruh copy (mis. "Tiga langkah, diulang tiap 12 minggu"; "di akhir kuartal" → "di minggu terakhir"/"di akhir 12 minggu").
