# Panduan Singkat Better Planner

## 📄 File Panduan

File panduan lengkap tersedia di: `PANDUAN-SINGKAT-BETTER-PLANNER.md`

## 📖 Cara Membaca Panduan

Panduan ini mencakup:

1. **Pengenalan Better Planner** - Apa itu Better Planner dan mengapa penting
2. **Konsep Dasar & Filosofi** - 10 konsep utama yang menjadi fondasi Better Planner
3. **Fitur Utama & Cara Penggunaan** - Penjelasan detail setiap fitur
4. **Alur Kerja & Best Practices** - Cara menggunakan Better Planner secara efektif
5. **Tips & Strategi Produktivitas** - Tips untuk meningkatkan produktivitas
6. **FAQ & Troubleshooting** - Pertanyaan umum dan solusi masalah

## 🔄 Generate PDF

### Opsi 1: Menggunakan Script (Recommended)

```bash
npm run generate:pdf
```

Script akan mencoba menggunakan `pandoc` terlebih dahulu, jika tidak tersedia akan menggunakan `markdown-pdf`.

### Opsi 2: Install Tools Manual

**Menggunakan Pandoc (Recommended untuk formatting yang lebih baik):**

```bash
# macOS
brew install pandoc

# Linux
sudo apt-get install pandoc

# Windows
# Download dari https://pandoc.org/installing.html
```

Kemudian jalankan:
```bash
pandoc docs/PANDUAN-SINGKAT-BETTER-PLANNER.md -o docs/PANDUAN-SINGKAT-BETTER-PLANNER.pdf --pdf-engine=xelatex -V geometry:margin=2cm -V fontsize=11pt
```

**Menggunakan markdown-pdf:**

```bash
npm install -g markdown-pdf
markdown-pdf docs/PANDUAN-SINGKAT-BETTER-PLANNER.md -o docs/PANDUAN-SINGKAT-BETTER-PLANNER.pdf
```

### Opsi 3: Online Tools

Jika Anda tidak ingin menginstall tools, Anda dapat menggunakan online tools:

1. **Markdown to PDF**: https://www.markdowntopdf.com/
   - Upload file markdown
   - Download PDF

2. **Dillinger**: https://dillinger.io/
   - Buka file markdown
   - Export as PDF

3. **StackEdit**: https://stackedit.io/
   - Buka file markdown
   - Export as PDF

4. **VS Code Extension**:
   - Install extension "Markdown PDF"
   - Buka file markdown
   - Klik kanan > "Markdown PDF: Export (pdf)"

## 📝 Struktur Panduan

Panduan ini mengikuti struktur yang mirip dengan Sync Planner guide, dengan penjelasan yang lebih detail dan disesuaikan dengan fitur Better Planner:

- **26 bagian utama** yang mencakup semua konsep dan fitur
- **Penjelasan detail** untuk setiap konsep dan fitur
- **Tips praktis** untuk penggunaan yang efektif
- **Best practices** berdasarkan pengalaman dan penelitian

## 🎯 Target Pembaca

Panduan ini ditujukan untuk:

- **Pengguna baru** yang ingin memahami Better Planner
- **Pengguna yang ingin mendalami** konsep dan filosofi di balik Better Planner
- **Tim yang ingin** memahami sistem perencanaan Better Planner
- **Siapa pun yang ingin** meningkatkan produktivitas dan mencapai tujuan

## 📚 Konsep Utama

Panduan mencakup 10 konsep utama:

1. **Visi Jangka Panjang** - Gambaran hidup terbaik 5-10 tahun ke depan
2. **Visi Jangka Menengah** - Gambaran hidup 3 tahun ke depan
3. **Goal 12 Minggu** - Sistem perencanaan 12 minggu
4. **Highest First** - Prioritas sejati yang memberikan dampak terbesar
5. **Perencanaan yang Rinci** - High Focus Goal dengan milestone dan tugas
6. **Self Development Curriculum** - Rencana pembelajaran yang disengaja
7. **Akuntabilitas** - Tanggung jawab atas tindakan dan hasil
8. **Willpower yang Terbatas** - Manajemen energi mental
9. **Ritual Malam** - Pemulihan energi dan persiapan untuk besok
10. **Mastering Transition** - Menguasai transisi antara aktivitas

## 🚀 Fitur Utama

Panduan menjelaskan 16 fitur utama:

1. Kalender Bulanan
2. Best Week
3. Tujuan Mingguan
4. To Don't List
5. Daily Focus
6. Work Cycle (90/15 dan 60/10)
7. One Minute Journal
8. Tugas Lain
9. Daily Routine
10. Brain Dump
11. Weekly Sync
12. Daily Sync
13. Habit Tracker
14. Refuel Sync
15. Siklus Minggu Berikutnya
16. Review 12 Minggu

## 💡 Tips Penggunaan

- **Baca secara bertahap**: Jangan terburu-buru, baca dan pahami setiap konsep
- **Praktikkan langsung**: Setelah membaca, langsung praktikkan dalam Better Planner
- **Review berkala**: Kembali ke panduan ini untuk refresh pengetahuan
- **Sesuaikan dengan kebutuhan**: Better Planner adalah alat, sesuaikan dengan kebutuhan Anda

## 📞 Bantuan

Jika Anda memiliki pertanyaan atau membutuhkan bantuan:

- **Website**: https://planner.abuabdirohman.com
- **Support**: support@betterplanner.com
- **Documentation**: Lihat folder `docs/` untuk dokumentasi lainnya

---

**Selamat menggunakan Better Planner dan mencapai tujuan Anda!** 🚀

