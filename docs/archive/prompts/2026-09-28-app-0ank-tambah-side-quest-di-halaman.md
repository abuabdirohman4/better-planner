CONTEXT:
Saya mengerjakan Better Planner - Next.js 15 productivity app (13-week quarter planning) dengan Supabase backend.

CRITICAL: Baca @CLAUDE.md untuk SEMUA coding rules, patterns, dan constraints.

TASK:
Eksekusi implementation plan di @docs/plans/2026-09-28-app-0ank-tambah-side-quest-di-halaman.md

ISSUE: app-0ank / GH-#16
BRANCH: feat/app-0ank-side-quest-add

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
- Plan: @docs/plans/2026-09-28-app-0ank-tambah-side-quest-di-halaman.md
- Rules: @CLAUDE.md
- Architecture: @docs/claude/architecture-patterns.md
- Quarter utils: @src/lib/quarterUtils.ts
- Contoh add form: @src/app/(admin)/quests/daily-quests/components/DailyQuestList.tsx

Mulai dari Task 1.
