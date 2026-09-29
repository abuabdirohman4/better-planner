CONTEXT:
Saya mengerjakan Better Planner - Next.js 15 productivity app (13-week quarter planning) dengan Supabase backend.

CRITICAL: Baca @CLAUDE.md untuk SEMUA coding rules, patterns, dan constraints.

TASK:
Eksekusi implementation plan di @docs/plans/2026-09-29-app-taj8-batas-akhir-kuartal.md

ISSUE: app-taj8 / GH-#21
BRANCH: fix/app-taj8-quarter-end-date

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
- Plan: @docs/plans/2026-09-29-app-taj8-batas-akhir-kuartal.md
- Rules: @CLAUDE.md
- Architecture: @docs/claude/architecture-patterns.md
- Quarter utils: @src/lib/quarterUtils.ts
- Caller kuartal: lihat tabel di plan

Mulai dari Task 1.
