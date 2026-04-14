# Google Antigravity Execution Workflow

This document provides templates and guidelines for executing implementation plans using Google Antigravity.

---

## When to Use Antigravity vs Direct Execution

This choice directly affects **Claude Sonnet token efficiency**. The wrong choice either wastes tokens (reading unnecessary context) or risks running out mid-implementation.

### Use Direct Execution (Claude Code) when:
- **Few files** (1-3 files, <200 lines of changes)
- **Targeted bug fix** — root cause is clear, exact lines known
- **Lightweight plan** — e.g. SQL migration + 2 small edits in store/action
- **Real-time iteration needed** — quick back-and-forth, on-the-fly adjustments
- **Token estimate: low** — Claude can finish in one session without hitting context limits

> 💡 **How to estimate:** Count files that need to be read + modified. Each large file re-read costs tokens. If plan has ≤5 tasks and total code changes <300 lines, choose Claude direct.

### Use Google Antigravity when:
- **Many files** (4+ files, >300 lines of changes)
- **Wide refactoring** — type migration, new architecture, many import updates
- **Complex feature** with multiple new components
- **Long multi-step plan** — more than 6-7 tasks
- **Risk of running out of tokens mid-way** — better to finish in Antigravity than stop mid-implementation
- **Token estimate: high** — context window may fill before completion

> 💡 **How to estimate:** Count new files to create + files needed for context. If plan requires reading 8+ large files or creating 5+ new files, choose Antigravity.

### Quick Decision Table

| Condition | Choice |
|-----------|--------|
| 1-3 files changed, small edits | ✅ Claude direct |
| Bug fix with clear root cause | ✅ Claude direct |
| SQL migration + 2-3 small edits | ✅ Claude direct |
| 4+ files changed or created | 🚀 Antigravity |
| Refactoring with 10+ import updates | 🚀 Antigravity |
| New feature with UI + actions + tests | 🚀 Antigravity |
| Unsure? | Ask Claude to estimate first |

**Claude must always state a token estimate before executing any plan**, so the user can make an informed decision.

---

## Workflow Overview

```
Planning Phase (Claude Code)
    ↓
  Create design doc + implementation plan
    ↓
Execution Phase (User → Google Antigravity)
    ↓
  Execute plan task-by-task
    ↓
Review Phase (User → Claude Code)
    ↓
  Verify results, fix issues if any
```

---

## Phase 1: Planning (Claude Code)

Claude Code will create:
1. **Design document**: `docs/plans/YYYY-MM-DD-<topic>-design.md`
2. **Implementation plan**: `docs/plans/YYYY-MM-DD-<topic>-implementation-plan.md`

---

## Phase 2: Execution (Google Antigravity)

### Prompt Template for Antigravity

Copy this template and replace placeholders:

```
CONTEXT:
I'm working on Better Planner - a Next.js 15 productivity and task management app with Supabase backend, featuring a 13-week quarter planning system.

CRITICAL: Read @CLAUDE.md in the repository for ALL coding rules, patterns, and constraints.

TASK:
Execute the implementation plan at @docs/plans/YYYY-MM-DD-<topic>-implementation-plan.md

REQUIREMENTS:
1. Follow the plan task-by-task sequentially
2. Verify each step before proceeding (run commands shown in plan)
3. Adhere to patterns in @CLAUDE.md (3-layer architecture, type management, TDD)
4. DO NOT deviate from the plan without explicit approval
5. After each major phase, output: "Phase N complete, proceeding to Phase N+1"

REFERENCE FILES:
- Design: @docs/plans/YYYY-MM-DD-<topic>-design.md
- Plan: @docs/plans/YYYY-MM-DD-<topic>-implementation-plan.md
- Rules: @CLAUDE.md
- Patterns: @docs/claude/architecture-patterns.md

Begin with Task 1 from the implementation plan.
```

### Example Usage

```
CONTEXT:
I'm working on Better Planner - a Next.js 15 productivity and task management app with Supabase backend, featuring a 13-week quarter planning system.

CRITICAL: Read @CLAUDE.md in the repository for ALL coding rules, patterns, and constraints.

TASK:
Execute the implementation plan at @docs/plans/2026-03-20-refactor-actions-implementation-plan.md

REQUIREMENTS:
1. Follow the plan task-by-task sequentially
2. Verify each step before proceeding (run commands shown in plan)
3. Adhere to patterns in @CLAUDE.md (3-layer architecture, type management, TDD)
4. DO NOT deviate from the plan without explicit approval
5. After each major phase, output: "Phase N complete, proceeding to Phase N+1"

REFERENCE FILES:
- Design: @docs/plans/2026-03-20-refactor-actions-design.md
- Plan: @docs/plans/2026-03-20-refactor-actions-implementation-plan.md
- Rules: @CLAUDE.md
- Patterns: @docs/claude/architecture-patterns.md

Begin with Task 1 from the implementation plan.
```

---

## Phase 3: Review (Claude Code)

### Prompt Template for Review

After Antigravity completes execution, return to Claude Code session and use this prompt:

```
Google Antigravity sudah selesai mengeksekusi plan di @docs/plans/YYYY-MM-DD-<topic>-implementation-plan.md

Tolong review hasilnya menggunakan review checklist di design document (@docs/plans/YYYY-MM-DD-<topic>-design.md).

Fokus pada:
1. File structure - apakah semua file yang diharapkan ada?
2. Type completeness - apakah ada types yang terlewat?
3. Import updates - apakah semua imports sudah benar?
4. Build verification - jalankan npm run type-check dan npm run build
5. Documentation - apakah docs sudah di-update?

Jika ada masalah, berikan feedback spesifik untuk diperbaiki.
```

---

## Review Checklist

Claude Code will verify:

✅ **File Structure**
- All expected files created/modified
- No unexpected deletions
- Proper directory organization

✅ **Type Completeness**
- All types migrated
- No duplicates remaining
- Proper type hierarchy (Base → Extended → Full)

✅ **Import Updates**
- All imports updated to centralized types
- No broken imports
- No unused imports

✅ **Build Verification**
- `npm run type-check` passes
- `npm run build` succeeds (or only pre-existing errors)
- No new type errors introduced

✅ **Documentation**
- CLAUDE.md updated (if needed)
- Architecture patterns documented
- Type README updated

---

## Common Issues & Solutions

### Issue: Type errors after migration

**Solution**: Check if Base types are needed (for queries without timestamps/optional fields)

### Issue: Antigravity skipped some files

**Solution**: Provide specific file paths in the plan, use explicit instructions

### Issue: Build fails with new errors

**Solution**: Run `npm run type-check` first to isolate type errors from build errors

### Issue: Imports not updated

**Solution**: Search for inline type definitions using grep/rg, update manually

---

## Tips for Success

1. **Be explicit in plans** - Provide exact file paths, exact code snippets
2. **Verify incrementally** - Check each phase output before proceeding
3. **Use checkpoints** - Break large plans into phases with verification steps
4. **Document assumptions** - Note what Antigravity should expect (existing files, etc.)
5. **Review thoroughly** - Always run full review checklist after execution

---

## Template Files Location

- Design template: See existing files in `docs/plans/*-design.md`
- Plan template: See existing files in `docs/plans/*-implementation-plan.md`
- Review checklist: Embedded in design documents
