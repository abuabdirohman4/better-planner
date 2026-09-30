# Beads Workflow for Better Planner

Issue tracker BePlan = **beads (`bd`)**, tapi **repo ini tidak punya `.beads/` sendiri**. Semua issue tinggal di hub `~/Documents/applications/.beads`.

---

## 🧭 Model yang benar

- **Prefix**: `app-` (contoh `app-uq5a`). Prefix `bp-` adalah era beads per-repo (sebelum Sep 2026); sebagian issue lama ikut pindah dengan ID yang sama, sebagian hilang bersama beads lama.
- **Label `beplan` wajib**: judul diawali `[beplan] ...` dan field label `beplan`.
- **`bd` dijalankan dari hub**, bukan dari repo ini:

```bash
cd ~/Documents/applications
bd list --label=beplan --status=open
bd ready --label=beplan
bd show app-xxxx
bd create --title="[beplan] ..." --type=task --priority=2 --label=beplan
bd update app-xxxx --append-notes="..."
```

- Priority angka 0-4 (0 = kritis, 2 = sedang, 4 = backlog), bukan "high/medium/low".
- Tidak ada branch `beads-sync`, tidak ada `.beads/progress/`, tidak ada `bd sync` dari repo ini. Catatan progres masuk ke notes issue (`bd update --append-notes`).
- Jangan pakai `bd delete`.
- `bd` bisa exit 0 padahal gagal (mis. flag tidak dikenal). Setelah update penting, cek isinya dengan `bd show <id> --json`.

---

## 🔄 Alur satu fitur

1. Issue dibuat di hub (`[beplan] ...`).
2. Plan → `docs/plans/YYYY-MM-DD-app-xxxx-<topik>-design.md` + `-implementation-plan.md`; prompt executor → `docs/prompts/YYYY-MM-DD-app-xxxx-<topik>.md`.
3. Executor (Antigravity/AI lain) mengerjakan. **Executor DILARANG `bd close` atau mengubah status issue.**
4. Claude review + uji manual, lalu Abu menyetujui.
5. `bd close app-xxxx` (hanya atas persetujuan Abu) → perbarui `docs/products/roadmap.md` → pindahkan `plans/*app-xxxx*` dan `prompts/*app-xxxx*` ke `docs/archive/`.

Status kerjaan dilihat di beads atau dashboard second-brain (`~/Documents/second-brain/tools/dashboard/`), bukan di dokumen repo. Jangan buat `docs/dashboard.md`.

---

## 🔗 Commit dan GitHub Issue

- Commit: sebut ID issue, mis. `feat(timer): add pause (app-a3f2)`.
- GitHub Issue (kalau dibuat): judul `[app-xxxx] type: short description`, dibuat SETELAH issue beads ada.
- Claude tidak menjalankan operasi tulis git; Abu yang commit (lihat CLAUDE.md, Session Close Protocol).

---

## 🎯 Kapan pakai beads

Pakai untuk kerjaan lebih dari ±2 menit, fitur/bug, refactor, atau apa pun yang mungkin dilanjutkan di sesi lain. Lewati untuk typo satu baris atau pertanyaan cepat.

---

## 📖 Related

- [`architecture-patterns.md`](architecture-patterns.md), [`database-operations.md`](database-operations.md), [`testing-guidelines.md`](testing-guidelines.md), [`business-rules.md`](business-rules.md)
- Pintu masuk dokumen repo: [`../README.md`](../README.md)
