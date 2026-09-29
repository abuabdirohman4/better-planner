CONTEXT:
Saya mengerjakan Better Planner - Next.js 15 productivity app (13-week quarter planning) dengan Supabase backend.

CRITICAL: Baca @CLAUDE.md untuk SEMUA coding rules, patterns, dan constraints.

TASK:
Eksekusi implementation plan di @docs/plans/2026-09-29-app-0j2t-tampilan-mingguan-jadwal-implementation-plan.md
(alasan keputusan ada di @docs/plans/2026-09-29-app-0j2t-tampilan-mingguan-jadwal-design.md — baca dulu)

ISSUE: app-0j2t / GH-#24
BRANCH: feat/app-0j2t-weekly-schedule-view

REQUIREMENTS:
1. Ikuti plan task-by-task secara berurutan
2. Terapkan TDD ketat: RED → GREEN → REFACTOR
3. Jalankan test setelah setiap task: npm run test:run
4. Jangan lanjut jika ada test FAIL
5. Setelah semua task: npm run type-check
6. Output per task: "✅ Task N complete: [ringkasan]"
7. JANGAN deviate dari plan tanpa approval user
8. JANGAN git commit/push — user yang commit. JANGAN bd close / ubah status beads — Claude menutup setelah review + uji manual

REFERENCE FILES:
- Plan: @docs/plans/2026-09-29-app-0j2t-tampilan-mingguan-jadwal-implementation-plan.md
- Design: @docs/plans/2026-09-29-app-0j2t-tampilan-mingguan-jadwal-design.md
- Rules: @CLAUDE.md
- Architecture: @docs/claude/architecture-patterns.md
- Timezone: @docs/claude/timezone-handling.md
- Grid yang dipakai ulang: @src/app/(admin)/planning/best-week/components/WeeklyGrid.tsx
- Halaman Best Week: @src/app/(admin)/planning/best-week/BestWeekClient.tsx
- Query task/milestone yang dipakai ulang: @src/app/(admin)/execution/daily-sync/DailyQuest/actions/weekly-tasks/queries.ts
- Helper WIB→UTC: @src/app/(admin)/execution/daily-sync/DailyQuest/actions/schedule/logic.ts

Mulai dari Task 1.
