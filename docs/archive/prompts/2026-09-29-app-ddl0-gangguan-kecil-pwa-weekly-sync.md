CONTEXT:
Saya mengerjakan Better Planner - Next.js 15 productivity app (13-week quarter planning) dengan Supabase backend.

CRITICAL: Baca @CLAUDE.md untuk SEMUA coding rules, patterns, dan constraints.

TASK:
Eksekusi implementation plan di @docs/plans/2026-09-29-app-ddl0-gangguan-kecil-pwa-weekly-sync.md

ISSUE: app-ddl0 / GH-#20
BRANCH: fix/app-ddl0-pwa-banner-weekly-empty

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
- Plan: @docs/plans/2026-09-29-app-ddl0-gangguan-kecil-pwa-weekly-sync.md
- Rules: @CLAUDE.md
- Architecture: @docs/claude/architecture-patterns.md
- PWA: @src/components/PWA/index.tsx
- Weekly Sync table: @src/app/(admin)/execution/weekly-sync/WeeklySyncTable/WeeklySyncTable.tsx

Mulai dari Task 1.
