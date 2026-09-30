CONTEXT:
Saya mengerjakan Better Planner - Next.js 15 productivity app (13-week quarter planning) dengan Supabase backend.

CRITICAL: Baca @CLAUDE.md untuk SEMUA coding rules, patterns, dan constraints.

TASK:
Eksekusi implementation plan di @docs/plans/2026-09-29-app-dwhq-jatah-jam-hfg-implementation-plan.md
Keputusan desain & alasannya ada di @docs/plans/2026-09-29-app-dwhq-jatah-jam-hfg-design.md — baca dulu, jangan ubah rumus tanpa approval.

ISSUE: app-dwhq / GH-#25
BRANCH: feat/app-dwhq-hfg-weekly-target

REQUIREMENTS:
1. Ikuti plan task-by-task secara berurutan
2. Terapkan TDD ketat: RED → GREEN → REFACTOR
3. Jalankan test setelah setiap task: npm run test:run
4. Jangan lanjut jika ada test FAIL
5. Setelah semua task: npm run type-check
6. Output per task: "✅ Task N complete: [ringkasan]"
7. JANGAN deviate dari plan tanpa approval user
8. JANGAN git commit/push — user yang commit. JANGAN bd close / ubah status beads — Claude menutup setelah review + uji manual
9. Task 0: TULIS file migrasi saja, JANGAN terapkan ke database — Abu yang menerapkan

REFERENCE FILES:
- Plan: @docs/plans/2026-09-29-app-dwhq-jatah-jam-hfg-implementation-plan.md
- Design: @docs/plans/2026-09-29-app-dwhq-jatah-jam-hfg-design.md
- Rules: @CLAUDE.md
- Architecture: @docs/claude/architecture-patterns.md
- Contoh pola action/logic/queries: @src/app/(admin)/dashboard/actions/weekly-progress/actions.ts
- Supabase mock: @src/test-utils/supabase-mock.ts
- Kartu quest: @src/app/(admin)/planning/main-quests/Quest.tsx

Mulai dari Task 0.
