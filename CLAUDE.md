# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## 🚨 CRITICAL: CLAUDE.md MAINTENANCE RULES (PREVENT BLOAT)

**NEVER append feature-specific documentation, long code snippets, or detailed business logic directly to this file.** This file is strictly a **Master Index** and must remain under 300 lines to optimize the AI context window. When instructed to document new knowledge, you MUST route it to the correct external file:

- ❌ **DON'T** add business rules here. ✅ **DO** update `docs/claude/business-rules.md`
- ❌ **DON'T** add testing/TDD examples here. ✅ **DO** update `docs/claude/testing-guidelines.md`
- ❌ **DON'T** add architecture edge cases here. ✅ **DO** update `docs/claude/architecture-patterns.md`
- ❌ **DON'T** add SQL/Supabase queries here. ✅ **DO** update `docs/claude/database-operations.md`
- ❌ **DON'T** add beads/git workflow details here. ✅ **DO** update `docs/claude/beads-workflow.md`

**How to update this file correctly:** If you must document a completely new domain, create a new file in `docs/claude/` and add exactly ONE pointer line here (e.g., *"For [Topic], READ `docs/claude/new-topic.md`"*). **Do not dump the content here.**

---

## 🚨 MANDATORY: Test-Driven Development (TDD)

**ALL new features, business logic, and permission systems SHOULD be developed using TDD when automated testing is set up.**

- **Zero bugs on first implementation** - Tests catch issues before production
- **Clear requirements** - Tests serve as executable specifications
- **Safe refactoring** - Change code with confidence
- **Better design** - TDD forces modular, testable code

**TDD Workflow**: RED (write failing tests) → GREEN (implement minimal code) → REFACTOR (clean up)

**REQUIRED for**: Business logic, permission systems, data transformations, complex algorithms, integration points, critical features.
**SKIP for**: Pure presentational UI, trivial getters/setters, config files, type definitions.

**Future Setup**: Vitest for unit tests, Playwright for E2E tests.

**📖 For detailed TDD examples, manual testing checklist, and SWR loading patterns, READ [`docs/claude/testing-guidelines.md`](docs/claude/testing-guidelines.md)**

---

## 🤖 Execution Mode Selection (MANDATORY)

**BEFORE implementing ANY feature/refactoring/task**, you MUST:
1. **Estimate token cost** — hitung jumlah file yang perlu dibaca + diubah
2. **Sebutkan estimasi ke user** — jelaskan apakah plan ini ringan atau berat
3. **Tanya user** mau pakai Claude langsung atau Antigravity

**Option A: Claude Code Direct** — ≤3 files changed, <200 lines, targeted bug fix, SQL + small edits
**Option B: Google Antigravity** — ≥4 files, >300 lines, wide refactoring, new feature with UI+actions+tests

**Token estimate (mandatory before executing):**
> "This plan is **lightweight** — only X files, ~Y lines of changes. Claude direct is efficient."
> "This plan is **heavy** — X files, Y+ lines. Antigravity recommended to avoid running out of tokens mid-way."

Plan format (Option B) — buat **DUA file** di `docs/plans/`:
  1. `YYYY-MM-DD-<topic>-design.md` — architecture decisions, clash resolution, what goes where
  2. `YYYY-MM-DD-<topic>-implementation-plan.md` — step-by-step tasks with exact file paths, grep commands, checkpoints

**📖 For decision guide, Antigravity prompt template, and review checklist, READ [`docs/claude/antigravity-workflow.md`](docs/claude/antigravity-workflow.md)**

---

## 🔧 Git Workflow & Commit Protocol

**CRITICAL**: Claude Code MUST NOT execute git operations that modify repository state.

**Allowed (Read-Only)**: `git status`, `git diff`, `git log`, `git show`, `git branch`

**NEVER execute**: `git add`, `git commit`, `git push`, `git pull`, `git merge`, `git rebase`, or anything that modifies `.git/` or working tree.

**After code changes**: Show `git status`/`git diff`, provide suggested commit message (with `Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>`), and inform user to run git commands manually.

**Exception**: `bd sync` (beads issue tracker) is allowed.

**Executor (Antigravity/AI lain) DILARANG `bd close` / ubah status beads.** Issue ditutup Claude setelah review + uji manual. Dilanggar 2x pada 29 Sep 2026 (`app-taj8`, `app-ddl0`, `app-01z6`, `app-dwhq` ditutup sebelum direview). Aturan "Session Completion" di CLAUDE.md hub tidak berlaku untuk executor di repo ini.

**Commit Message Format (Conventional Commits):**
```
feat: add new feature
feat(scope): add feature with scope (app-a3f2)
fix: resolve bug (app-xyz1)
docs: update documentation
refactor: improve code structure
```

**GitHub Issue Title Format (MANDATORY):**
```
[app-xxxx] type: short description
```
- **Always prefix** with Beads issue ID in brackets: `[app-xxxx]`
- Create Beads issue FIRST → then create GH Issue with this prefix
- Example: `[app-uq5a] feat: bawa quest dari quarter lalu`

**📖 For complete Beads & Git integration guide, READ [`docs/claude/beads-workflow.md`](docs/claude/beads-workflow.md)**

**📖 For Google Antigravity execution templates and review checklists, READ [`docs/claude/antigravity-workflow.md`](docs/claude/antigravity-workflow.md)**

---

## 📚 Documentation Strategy

**Inline limit**: Keep CLAUDE.md under **300 lines**. Use "READ [`file.md`]" pointers for external docs.

**Inline when**: High-frequency (>50% tasks), short & critical (<50 lines), quick lookup, core conventions.
**External when**: Low-frequency (<20% tasks), long & detailed (>50 lines), specialized, reference material.

---

## 📋 Beads Issue Management

**Repo ini TIDAK punya `.beads/` sendiri.** Issue BePlan hidup di hub `~/Documents/applications`, prefix `app-`, label `beplan` (judul diawali `[beplan]`). Jalankan `bd` dari hub, bukan dari repo ini:

```bash
cd ~/Documents/applications
bd list --label=beplan --status=open
bd show app-xxxx
bd create --title="[beplan] ..." --type=task --priority=2 --label=beplan
```

- Executor (Antigravity/AI lain) **DILARANG** `bd close` / ubah status; Claude yang menutup setelah review + uji manual + persetujuan Abu.
- Jangan pakai `bd delete`. Status kerjaan dilihat di beads/dashboard second-brain, bukan di dokumen repo.
- Saat `bd close`, pindahkan `docs/plans/*<id>*` dan `docs/prompts/*<id>*` ke `docs/archive/`.

**📖 For alur lengkap beads (hub `applications`, prefix `app-`, alur plan → executor → review → close), READ [`docs/claude/beads-workflow.md`](docs/claude/beads-workflow.md)**

---

## 🚨 CRITICAL: MCP Connection Check

**BEFORE running ANY Supabase operations**, check MCP connection using `mcp__better-planner__list_tables`. If it fails, inform user: "MCP Supabase belum terkoneksi. Silakan aktifkan MCP di settings Claude Code." Do NOT ask to restart.

---

## 📚 Project Overview

**Better Planner** is a productivity and task management web application built with Next.js 15, featuring a unique 13-week quarter planning system. The app helps users transform goals into achievements through strategic planning, daily execution tracking, and comprehensive analytics.

**Tech Stack:**
- Next.js 15 (App Router) + React 19 + TypeScript
- Tailwind CSS v4 for styling
- Supabase for database and authentication
- SWR for data fetching and caching
- Zustand for global state management
- @dnd-kit for drag-and-drop functionality
- Sonner for toast notifications
- Progressive Web App (PWA) enabled

**Core Features:**
- 13-week Quarter Planning System (Q1-Q4)
- Quest Management (Daily/Work/Side quests)
- Pomodoro Timer with Activity Tracking
- Daily Sync for task execution
- Activity Plan (Time Blocking)
- Calendar View for activity logs

**📖 For complete application structure, component organization, and architecture patterns, READ [`docs/claude/architecture-patterns.md`](docs/claude/architecture-patterns.md)**

---

## 🔧 Development Commands

```bash
npm run dev              # Dev server at localhost:5100
npm run build            # Production build
npm run type-check       # TypeScript check (no emit)
npm run format           # Format with Prettier
npm run fix:all          # Format + type-check
npm run generate:pdf     # Generate PDF guide
```

---

## 🏗️ Architecture Quick Reference

**App Structure**: `(admin)` for protected pages, `(full-width-pages)` for auth. Features: dashboard, execution, planning, quests, settings.

**Key Patterns**: Server Actions (`"use server"`), SWR Hooks (caching), Supabase Clients (`server`/`client`), RLS Policies (user isolation).

**Metadata**: server page → in `page.tsx`; client page → sibling server `layout.tsx`; always typed `Metadata`. READ [`docs/claude/architecture-patterns.md`](docs/claude/architecture-patterns.md) → "Metadata Standard".

**📖 For detailed patterns, data fetching strategies, and component guidelines, READ [`docs/claude/architecture-patterns.md`](docs/claude/architecture-patterns.md)**

---

## ⚠️ CRITICAL: Timezone & Date Handling

**ALWAYS store timestamps in UTC, display in local timezone (WIB/Asia/Jakarta).**

### Core Principles

1. **Database Storage: UTC Only**
   - All `TIMESTAMPTZ` columns store UTC
   - Supabase automatically converts to UTC when storing

2. **Display to User: Local Timezone (WIB)**
   - Convert UTC to WIB when displaying
   - Use `toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })`

3. **User Input: Convert to UTC Before Saving**
   - User inputs local time (WIB)
   - Convert to UTC before storing in database

**📖 For complete timezone guide with code examples, common pitfalls, and testing checklist, READ [`docs/claude/timezone-handling.md`](docs/claude/timezone-handling.md)**

---

## ⚠️ Important Business Rules

**Quarter System**: 13-week cycles (Q1-Q4), weekly breakdown, daily task propagation.

**Quest Types**: Daily (recurring tasks), Work (professional projects), Side (personal development).

**Pomodoro Timer**: 25-min focus sessions, 5-min short breaks, 15-min long breaks.

**Daily Sync**: Morning planning → Execution → Evening review with journaling.

**Activity Plan**: Time blocking with multiple schedules per task, conflict detection.

**📖 YOU MUST READ [`docs/claude/business-rules.md`](docs/claude/business-rules.md)** before implementing features related to Quarters, Quests, Timer, or Activity Plan.

---

## 🔒 Database Operations

**CASCADE Delete Chain**: `daily_plans` → `daily_plan_items` → `task_schedules`

**Fix Pattern**: Backup → Delete → Insert → Restore (see `dailyPlanActions.ts:24-120`)

**RLS Policies**: All user data isolated via `user_id` foreign key constraint.

**Data Validation**: ISO 8601 dates, UUID v4 IDs, hex colors (#1496F6).

**📖 For CASCADE delete handling, RLS patterns, query examples, and performance tips, READ [`docs/claude/database-operations.md`](docs/claude/database-operations.md)**

---

## 🧪 Testing & Quality Assurance

**Manual Testing**: User interactions, error states, loading states, responsive design, drag-and-drop, quarter planning, authentication, real-time updates.

**SWR Loading Patterns**: Avoid "blink" issues with stable keys, initial-load-only skeletons, separate critical vs non-critical loading.

**Timezone Testing**: Storage test (WIB → UTC), display test (UTC → WIB), query test (date range), edge cases (midnight, noon, end of day), cross-day events.

**📖 For complete testing checklist, SWR patterns, and timezone test cases, READ [`docs/claude/testing-guidelines.md`](docs/claude/testing-guidelines.md)**

---

## 🎨 Coding Standards

**Naming Conventions:**
- Components: PascalCase (`Button`, `ActivityLog`)
- Files: kebab-case for pages, PascalCase for components
- Variables: camelCase (`isLoading`, `rememberMe`)
- Constants: UPPER_SNAKE_CASE (`LOCALKEY`, `API_BASE_URL`)

**Import Pattern:**
- Use absolute imports with `@/` prefix
- Example: `import { useAuth } from '@/hooks/useAuth'`

**Component Management:**
- **DO NOT** install new packages without user confirmation
- **ALWAYS** prefer existing UI components (`src/components/ui`, `src/components/common`)
- **DO NOT** replace existing components with raw HTML
- **BEFORE** writing any UI element (button, input, modal, spinner, badge), check `src/components/ui/` first — if it exists, use it
- **Key reusable components**: `Button` (`src/components/ui/button/Button.tsx`), `Modal` (`src/components/ui/modal/`), `Spinner` (`src/components/ui/spinner/`), `Skeleton` (`src/components/ui/skeleton/`)
- **If a new reusable UI element is needed** (will be used in 2+ places), ask user before creating it as a shared component in `src/components/ui/` or `src/components/common/`

**Error Handling:**
- Centralized error handling with `handleApiError()` from `@/lib/errorUtils`
- Always check authentication before database operations
- Display user-friendly error messages with toast notifications

---

## 🌍 Environment & Configuration

**Required** `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
GOOGLE_CLIENT_SECRET=your-google-oauth-secret
NEXT_PUBLIC_ENABLE_TIMER_DEV=true  # Enable timer in dev mode
```

**Path Alias**: `@/*` maps to `src/*` — always use `@/` imports.

---

## 📖 Additional Documentation

**Product Docs** (visi, status fitur, arah pengembangan):
- **Roadmap** (hidup): [`docs/products/roadmap.md`](docs/products/roadmap.md) — status F-01…F-08, next up, link ke plan files + beads. **READ di awal sesi** biar tahu konteks fitur mana sudah jadi sebelum nulis kode. **UPDATE tiap `bd close`** — checkbox + status tabel.
- **BRD** (beku): [`docs/products/BRD.md`](docs/products/BRD.md) — visi, scope, non-functional requirements.

All detailed documentation is in `docs/claude/`:

- **Testing Guidelines**: [`docs/claude/testing-guidelines.md`](docs/claude/testing-guidelines.md)
- **Business Rules**: [`docs/claude/business-rules.md`](docs/claude/business-rules.md)
- **Database Operations**: [`docs/claude/database-operations.md`](docs/claude/database-operations.md)
- **Architecture Patterns**: [`docs/claude/architecture-patterns.md`](docs/claude/architecture-patterns.md)
- **Beads Workflow**: [`docs/claude/beads-workflow.md`](docs/claude/beads-workflow.md)
- **Timezone Handling**: [`docs/claude/timezone-handling.md`](docs/claude/timezone-handling.md)
- **Antigravity Workflow**: [`docs/claude/antigravity-workflow.md`](docs/claude/antigravity-workflow.md)
- **Superpowers Workflow**: [`docs/claude/superpowers-workflow.md`](docs/claude/superpowers-workflow.md)
- **Release Workflow**: [`docs/claude/release-workflow.md`](docs/claude/release-workflow.md)
- **Type Management**: [`docs/claude/type-management.md`](docs/claude/type-management.md)
- **E2E Testing Patterns**: [`docs/claude/e2e-testing-patterns.md`](docs/claude/e2e-testing-patterns.md)
- **Timer Notifications**: [`docs/claude/timer-notifications.md`](docs/claude/timer-notifications.md)

**Pintu masuk dokumen**: [`docs/README.md`](docs/README.md). **Arsip** (plan/prompt/panduan lama, ERD awal): `docs/archive/` — hanya untuk menelusuri keputusan lama.

---

## 🚨 SESSION CLOSE PROTOCOL 🚨

**CRITICAL**: Before saying "done" or "complete", show `git status` + `git diff`, provide commit message, inform user to commit manually. Claude Code MUST NOT run git write operations.

**📖 For complete session close checklist, READ [`docs/claude/beads-workflow.md`](docs/claude/beads-workflow.md)**
