CONTEXT:
Saya mengerjakan Better Planner - Next.js 15 productivity app (13-week quarter planning) dengan Supabase backend.

CRITICAL: Baca @CLAUDE.md untuk SEMUA coding rules, patterns, dan constraints.

TASK:
Eksekusi implementation plan di @docs/plans/2026-09-29-app-5r0j-sidebar-5-grup-tab-implementation-plan.md
Alasan desain (baca dulu): @docs/plans/2026-09-29-app-5r0j-sidebar-5-grup-tab-design.md

ISSUE: app-5r0j / GH-#23
BRANCH: feat/app-5r0j-sidebar-groups-tabs

REQUIREMENTS:
1. Ikuti plan task-by-task secara berurutan
2. Terapkan TDD ketat: RED → GREEN → REFACTOR
3. Jalankan test setelah setiap task: npm run test:run
4. Jangan lanjut jika ada test FAIL
5. Setelah semua task: npm run type-check
6. Output per task: "✅ Task N complete: [ringkasan]"
7. JANGAN deviate dari plan tanpa approval user
8. JANGAN git commit/push — user yang commit. JANGAN bd close / ubah status beads — Claude menutup setelah review + uji manual
9. BERHENTI di CHECKPOINT 1 (akhir Fase 1) dan tunggu user sebelum Fase 2
10. JANGAN pindah/rename folder rute di src/app/(admin) — URL lama harus tetap sama

REFERENCE FILES:
- Plan: @docs/plans/2026-09-29-app-5r0j-sidebar-5-grup-tab-implementation-plan.md
- Desain: @docs/plans/2026-09-29-app-5r0j-sidebar-5-grup-tab-design.md
- Rules: @CLAUDE.md
- Architecture: @docs/claude/architecture-patterns.md
- Sidebar lama: @src/components/layouts/AppSidebar.tsx
- Bottom nav: @src/components/layouts/BottomNavigation.tsx
- Header: @src/components/layouts/AppHeader.tsx
- Contoh tab: @src/app/(admin)/habits/HabitsTabLayout.tsx

Mulai dari Task 1.
