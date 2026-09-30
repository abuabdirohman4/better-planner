CONTEXT:
Saya mengerjakan Better Planner - Next.js 15 productivity app (13-week quarter planning) dengan Supabase backend.

CRITICAL: Baca @CLAUDE.md untuk SEMUA coding rules, patterns, dan constraints.

TASK:
Eksekusi implementation plan di @docs/plans/2026-09-29-app-01z6-tanda-energi-jurnal.md

ISSUE: app-01z6 / GH-#22
BRANCH: feat/app-01z6-energy-journal

REQUIREMENTS:
1. Ikuti plan task-by-task secara berurutan
2. Terapkan TDD ketat: RED → GREEN → REFACTOR
3. Jalankan test setelah setiap task: npm run test:run
4. Jangan lanjut jika ada test FAIL
5. Setelah semua task: npm run type-check
6. Output per task: "✅ Task N complete: [ringkasan]"
7. JANGAN deviate dari plan tanpa approval user
8. JANGAN git commit/push — user yang commit. JANGAN bd close / ubah status beads — Claude menutup setelah review + uji manual
9. Task 0 hanya membuat FILE migrasi — JANGAN menjalankannya ke database

REFERENCE FILES:
- Plan: @docs/plans/2026-09-29-app-01z6-tanda-energi-jurnal.md
- Rules: @CLAUDE.md
- Architecture: @docs/claude/architecture-patterns.md
- Modal: @src/app/(admin)/execution/daily-sync/Journal/OneMinuteJournalModal.tsx
- Hook simpan: @src/app/(admin)/execution/daily-sync/Journal/hooks/useJournal.ts
- Contoh migrasi: @supabase/migrations/20260917000004_habit_deadline_time.sql

Mulai dari Task 0.
