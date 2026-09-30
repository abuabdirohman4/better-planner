CONTEXT:
Saya mengerjakan Better Planner - Next.js 15 productivity app dengan Supabase backend dan 13-week quarter planning system.

CRITICAL: Baca @CLAUDE.md untuk SEMUA coding rules, patterns, dan constraints.

TASK:
Eksekusi implementation plan di @docs/plans/2026-06-20-bp-kup-fix-weekly-goals-quarter.md

ISSUE: bp-kup / GH-#14
BRANCH: fix/bp-kup-weekly-goals-quarter

BACKGROUND:
Bug P1 — weekly_goals table pakai week_number 1-13 per quarter (relatif, bukan absolut).
Q1 week 5 dan Q2 week 5 sama-sama week_number=5, sehingga constraint UNIQUE(user_id, year, week_number, goal_slot) bentrok.
Akibat: app UPDATE row Q1 alih-alih INSERT row Q2 → data Q1 dihapus dan di-overwrite. Confirmed data loss.

ROOT CAUSE di 3+1 tempat:
1. DB constraint: UNIQUE tanpa quarter
2. queryExistingWeeklyGoal: fetch tanpa .eq('quarter')
3. queryWeeklyGoals (daily-sync): fetch tanpa .eq('quarter')
4. getTasksForWeek action: tidak ada quarter param

REQUIREMENTS:
1. Ikuti plan task-by-task secara berurutan
2. Terapkan TDD: tulis/update test dulu (RED) → implementasi (GREEN)
3. Jalankan test setelah setiap task
4. Jangan lanjut jika ada test FAIL
5. Setelah semua task: npm run type-check
6. Output per task: "✅ Task N complete: [ringkasan]"
7. JANGAN deviate dari plan tanpa approval user

DB MIGRATION NOTE:
- Gunakan MCP tool `mcp__better-planner__apply_migration` untuk apply SQL migration ke Supabase
- Juga update docs/products/ERD.sql baris UNIQUE constraint untuk weekly_goals

REFERENCE FILES:
- Plan: @docs/plans/2026-06-20-bp-kup-fix-weekly-goals-quarter.md
- Rules: @CLAUDE.md
- Architecture: @docs/claude/architecture-patterns.md
- quarterly logic: @src/lib/quarterUtils.ts
- weekly-goals queries: @src/app/(admin)/execution/weekly-sync/actions/weekly-goals/queries.ts
- weekly-goals actions: @src/app/(admin)/execution/weekly-sync/actions/weekly-goals/actions.ts
- daily-sync weekly-tasks queries: @src/app/(admin)/execution/daily-sync/DailyQuest/actions/weekly-tasks/queries.ts
- daily-sync weekly-tasks actions: @src/app/(admin)/execution/daily-sync/DailyQuest/actions/weekly-tasks/actions.ts

Mulai dari Task 1 (DB Migration).
