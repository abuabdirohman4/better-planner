# Claude Documentation Index

This directory contains detailed documentation for Claude Code when working with Better Planner.

---

## 📚 Documentation Files

### 🏗️ [`architecture-patterns.md`](architecture-patterns.md)
**Application structure, component organization, and development patterns**

Topics:
- App Router structure (`(admin)`, `(full-width-pages)`)
- Activity Log Calendar View (GROUPED/TIMELINE/CALENDAR)
- Activity Plan - Time Blocking
- Quest System Architecture (Daily/Work/Side)
- Server Actions & SWR patterns
- Component organization & naming conventions
- Database schema overview

### 🗄️ [`database-operations.md`](database-operations.md)
**Database-specific operations, patterns, and constraints**

Topics:
- CASCADE Delete Chain (critical!)
- Backup/restore pattern for schedule preservation
- Data validation rules (ISO 8601, UUID, hex colors)
- Supabase client patterns (server vs client)
- Revalidation patterns (after mutations)
- Common query patterns (date ranges, joins)
- Row Level Security (RLS) policies
- Performance tips (batch operations, pagination)

### 🧪 [`testing-guidelines.md`](testing-guidelines.md)
**Testing practices, patterns, and common pitfalls**

Topics:
- Manual testing checklist
- SWR loading state patterns (avoiding "blink" issues)
- Stable SWR keys
- Skeleton loading gates
- Composition of loading states
- Timezone testing checklist (5 critical tests)
- Performance testing metrics
- Future TDD setup (Vitest, Playwright)

### ⏰ [`timezone-handling.md`](timezone-handling.md)
**Complete guide to timezone handling (UTC storage, WIB display)**

Topics:
- Core principles (UTC storage, WIB display, conversion)
- Why UTC storage? (benefits & trade-offs)
- Common pitfalls (`.toISOString()` without context)
- Code examples (correct conversion patterns)
- Date range queries (UTC-aware filtering)
- Testing checklist (storage, display, query, edge cases)
- Debugging tips

### 📋 [`beads-workflow.md`](beads-workflow.md)
**Beads (git-backed issue tracker) workflow for Better Planner**

Topics:
- Core commands (`bd ready`, `bd create`, `bd close`, `bd sync`)
- Beads sync branch (`beads-sync` vs `master`)
- When to use Beads (vs simple tasks)
- Common workflows (starting work, adding notes, blockers, completing)
- Issue organization (epics, priorities, labels)
- Progress documentation (`.beads/progress/{issue-id}.md`)
- Critical rules (what to never do)
- Session close protocol

### 🎯 [`business-rules.md`](business-rules.md)
**Better Planner-specific business logic and domain rules**

Topics:
- Quarter System (13-week cycles, Q1-Q4)
- Quest types (Daily/Work/Side)
- Pomodoro Timer & Activity Tracking
- Daily Sync flow (morning → execution → review)
- Activity Plan (time blocking, conflict detection)
- Form handling patterns
- Data fetching strategy (Server Actions vs SWR)
- UI/UX guidelines
- Critical constraints (dates, CASCADE, state)

---

## 🔗 Navigation

### From CLAUDE.md
CLAUDE.md (master index, 295 lines) points to all these files with "READ [`docs/claude/...`]" directives.

### Between External Docs
Each external doc has "Related Documentation" section at the bottom linking to other relevant docs.

---

## 📊 Size Comparison

| File | Lines | Purpose |
|------|-------|---------|
| `CLAUDE.md` | 295 | Master index (< 300 line limit) ✅ |
| `architecture-patterns.md` | ~450 | App structure & patterns |
| `database-operations.md` | ~380 | Database ops & constraints |
| `testing-guidelines.md` | ~420 | Testing practices |
| `timezone-handling.md` | ~494 | Timezone guide |
| `beads-workflow.md` | ~410 | Beads workflow |
| `business-rules.md` | ~370 | Domain rules |
| **Total External** | **~2525** | Detailed documentation |

**Before refactoring**: CLAUDE.md was 686 lines (bloated, hard to maintain)
**After refactoring**: CLAUDE.md is 295 lines + 2525 lines in external docs (organized, maintainable)

---

## ✅ Benefits of This Structure

1. **Faster Context Loading**: Claude Code loads < 300 lines from CLAUDE.md initially
2. **On-Demand Detail**: Only reads external docs when needed for specific topics
3. **Easier Maintenance**: Update specific topic without touching CLAUDE.md
4. **Prevents Bloat**: Strict 300-line limit forces external documentation
5. **Better Organization**: Related content grouped by topic (architecture, database, testing, etc.)
6. **Cross-References**: Easy to navigate between related topics

---

## 🔄 Maintenance Guidelines

### When to Update External Docs

- New feature adds significant complexity → Update relevant doc (e.g., `architecture-patterns.md`)
- Database change affects queries → Update `database-operations.md`
- Testing pattern discovered → Update `testing-guidelines.md`
- Business rule change → Update `business-rules.md`

### When to Update CLAUDE.md

- Add **one-line pointer** to new external doc (if created)
- Update core tech stack (Next.js version, major library change)
- Change development commands
- Update critical rules (git workflow, MCP check, session close)

### NEVER Do This

❌ Don't add code examples to CLAUDE.md (put in external docs)
❌ Don't add detailed explanations to CLAUDE.md (summarize with pointer)
❌ Don't duplicate content (one source of truth per topic)

---

## 📖 How Claude Uses These Docs

1. **Session Start**: Claude reads CLAUDE.md (295 lines, fast)
2. **Task Understanding**: Claude sees pointer to relevant doc
3. **Deep Dive**: Claude reads specific external doc (e.g., `database-operations.md`)
4. **Implementation**: Claude follows patterns from external doc
5. **Cross-Reference**: Claude navigates to related docs as needed

**Example Flow:**
```
User: "Add timezone handling to schedule creation"
  ↓
Claude reads CLAUDE.md → sees timezone section
  ↓
CLAUDE.md points to docs/claude/timezone-handling.md
  ↓
Claude reads timezone-handling.md (complete guide)
  ↓
Claude implements correct UTC conversion pattern
```

---

## 🎯 Quick Reference

Need to know...
- **How to structure components?** → `architecture-patterns.md`
- **How to handle CASCADE deletes?** → `database-operations.md`
- **How to avoid SWR blink issues?** → `testing-guidelines.md`
- **How to convert WIB to UTC?** → `timezone-handling.md`
- **How to use Beads?** → `beads-workflow.md`
- **What are the quarter rules?** → `business-rules.md`

---

## 📅 Created

**Date**: 2026-03-15
**Migration**: From monolithic CLAUDE.md (686 lines) → Master index + external docs
**Model**: School Management pattern (strict 300-line limit)
