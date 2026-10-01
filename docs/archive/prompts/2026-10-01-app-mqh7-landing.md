⛔ DILARANG: bd close / ubah status beads, git commit/push, install paket. Claude yang menutup issue setelah review.

CONTEXT:
Saya mengerjakan Better Planner - Next.js 15 productivity app (13-week quarter planning) dengan Supabase backend.

CRITICAL: Baca @CLAUDE.md untuk SEMUA coding rules, patterns, dan constraints.

TASK:
Eksekusi implementation plan di @docs/plans/2026-10-01-app-mqh7-landing-implementation-plan.md
Desain + copy (sumber tunggal semua teks, baca dulu): @docs/plans/2026-10-01-app-mqh7-landing-design.md

ISSUE: app-mqh7
BRANCH: feat/app-mqh7-landing-id

REQUIREMENTS:
1. Ikuti plan task-by-task secara berurutan (Fase 1 saja — Fase 2 dikerjakan Claude)
2. Task 1 = E2E dulu (RED), baru kode (GREEN)
3. Salin teks PERSIS dari §Copy di berkas desain ke copy.id.ts — jangan menulis ulang atau "memperbaiki" kalimat
4. LandingPage.tsx = server component, TANPA "use client"
5. Path gambar /images/landing/*.jpg memang belum ada — jangan buat placeholder, jangan ganti path
6. Output per task: "✅ Task N complete: [ringkasan]"
7. JANGAN deviate dari plan tanpa approval user
8. JANGAN git commit/push — user yang commit. JANGAN bd close / ubah status beads
9. BERHENTI di CHECKPOINT akhir Fase 1 dan laporkan hasil type-check, E2E, build

REFERENCE FILES:
- Plan: @docs/plans/2026-10-01-app-mqh7-landing-implementation-plan.md
- Desain: @docs/plans/2026-10-01-app-mqh7-landing-design.md
- Rules: @CLAUDE.md
- Landing lama (akan dihapus): @src/components/landing/LandingPageContent.tsx
- Middleware (redirect user login dari /): @src/middleware.ts
- Button: @src/components/ui/button/Button.tsx
- Pola E2E: @tests/e2e/auth.spec.ts

Mulai dari Task 1.
