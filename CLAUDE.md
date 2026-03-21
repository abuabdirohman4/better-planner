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

**BEFORE implementing ANY feature/refactoring/task**, you MUST ask user:

> "Apakah Anda ingin saya yang langsung mengerjakan kode ini, atau menggunakan Google Antigravity untuk eksekusi?"

**Option A: Claude Code Direct** - Immediate execution (1-3 files, <200 lines)
**Option B: Google Antigravity** - Create design doc + plan in `docs/plans/`, user executes, Claude reviews (better for 3+ files refactoring)

---

## 🔧 Git Workflow & Commit Protocol

**CRITICAL**: Claude Code MUST NOT execute git operations that modify repository state.

**Allowed (Read-Only)**: `git status`, `git diff`, `git log`, `git show`, `git branch`

**NEVER execute**: `git add`, `git commit`, `git push`, `git pull`, `git merge`, `git rebase`, or anything that modifies `.git/` or working tree.

**After code changes**: Show `git status`/`git diff`, provide suggested commit message (with `Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>`), and inform user to run git commands manually.

**Exception**: `bd sync` (beads issue tracker) is allowed.

**Commit Message Format (Conventional Commits):**
```
feat: add new feature
feat(scope): add feature with scope (bp-a3f2dd)
fix: resolve bug (bp-xyz123)
docs: update documentation
refactor: improve code structure
```

**📖 For complete Beads & Git integration guide, READ [`docs/claude/beads-workflow.md`](docs/claude/beads-workflow.md)**

**📖 For Google Antigravity execution templates and review checklists, READ [`docs/claude/antigravity-workflow.md`](docs/claude/antigravity-workflow.md)**

---

## 📚 Documentation Strategy

**Inline limit**: Keep CLAUDE.md under **300 lines**. Use "READ [`file.md`]" pointers for external docs.

**Inline when**: High-frequency (>50% tasks), short & critical (<50 lines), quick lookup, core conventions.
**External when**: Low-frequency (<20% tasks), long & detailed (>50 lines), specialized, reference material.

---

## 📋 Beads Issue Management

**Beads Sync Branch:** `beads-sync` (NOT master)
- Master is normal working branch - checkout anytime without conflicts
- Beads syncs to dedicated `beads-sync` branch automatically via worktree
- Work on feature branches normally, beads operates independently

**Key Commands:**
- `bd ready` - Find ready tasks (no blockers)
- `bd close <id>` - Close issue (never use `bd delete`)
- `bd sync` - Sync to remote (commits to beads-sync, not your branch)

**Critical Rules:**
- Never manually edit `.beads/*.jsonl` files
- Never change `sync-branch` config in `.beads/config.yaml`
- Progress files go in `.beads/progress/{issue-id}.md`

**📖 For complete Beads workflow including JSONL structure, Git hooks, tombstone prevention, and progress documentation format, READ [`docs/claude/beads-workflow.md`](docs/claude/beads-workflow.md)**

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
npm run dev              # Dev server at localhost:3000
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

**Legacy Documentation** (migrate content to `docs/claude/` when updating):
- `docs/activity-plan-feature.md` - Activity Plan implementation guide
- `docs/BEADS_GUIDE.md` - Old beads guide
- `docs/BEADS_WORKFLOW_STRATEGY.md` - Old beads strategy

---

## 🚨 SESSION CLOSE PROTOCOL 🚨

**CRITICAL**: Before saying "done" or "complete", you MUST run this checklist:

```
[ ] 1. git status              (check what changed)
[ ] 2. git add <files>         (stage code changes)
[ ] 3. bd sync                 (commit beads changes)
[ ] 4. git commit -m "..."     (commit code)
[ ] 5. bd sync                 (commit any new beads changes)
[ ] 6. git push                (push to remote)
```

**NEVER skip this.** Work is not done until pushed.
