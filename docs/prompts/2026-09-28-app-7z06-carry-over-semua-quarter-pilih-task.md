CONTEXT:
Saya mengerjakan Better Planner - Next.js 15 productivity app (13-week quarter planning) dengan Supabase backend.

CRITICAL: Baca @CLAUDE.md untuk SEMUA coding rules, patterns, dan constraints.

TASK:
Eksekusi implementation plan di @docs/plans/2026-09-28-app-7z06-carry-over-semua-quarter-pilih-task.md

ISSUE: app-7z06 / GH-#18
BRANCH: feat/app-7z06-carry-over-v2

REQUIREMENTS:
1. Ikuti plan task-by-task secara berurutan
2. Terapkan TDD ketat: RED → GREEN → REFACTOR
3. Jalankan test setelah setiap task: npm run test:run
4. Jangan lanjut jika ada test FAIL
5. Setelah semua task: npm run type-check
6. Output per task: "✅ Task N complete: [ringkasan]"
7. JANGAN deviate dari plan tanpa approval user
8. JANGAN git commit/push — user yang commit

REFERENCE FILES:
- Plan: @docs/plans/2026-09-28-app-7z06-carry-over-semua-quarter-pilih-task.md
- Rules: @CLAUDE.md
- Architecture: @docs/claude/architecture-patterns.md
- Quarter utils: @src/lib/quarterUtils.ts
- Kode yang diubah: @src/app/(admin)/quests/actions/carry-over/ dan @src/app/(admin)/quests/components/CarryOverModal.tsx
- Modal: @src/components/ui/modal/Modal.tsx

Mulai dari Task 1.
