CONTEXT:
Saya mengerjakan Better Planner - Next.js 15 productivity app (13-week quarter planning) dengan Supabase backend.

CRITICAL: Baca @CLAUDE.md untuk SEMUA coding rules, patterns, dan constraints.

TASK:
Eksekusi implementation plan di @docs/plans/2026-09-29-app-yv8t-default-quarter-berjalan.md

ISSUE: app-yv8t / GH-#19
BRANCH: fix/app-yv8t-default-quarter

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
- Plan: @docs/plans/2026-09-29-app-yv8t-default-quarter-berjalan.md
- Rules: @CLAUDE.md
- Architecture: @docs/claude/architecture-patterns.md
- Business rules (quarter): @docs/claude/business-rules.md
- Quarter utils: @src/lib/quarterUtils.ts
- Quarter store: @src/stores/quarterStore.ts
- Test yang sudah ada: @src/lib/__tests__/quarterUtils.createdAt.test.ts

Mulai dari Task 1.
