---
description: Beads issue tracker workflow for Better Planner project. Use this when working with tasks, bugs, features, or any tracked work.
---

# Beads Issue Tracker Workflow

## 🚨 CRITICAL: Session Close Protocol

**BEFORE saying "done" or "complete", you MUST run this checklist:**

```bash
git status              # Check what changed
git add <files>         # Stage code changes
bd sync                 # Sync beads to git
git commit -m "..."     # Commit with issue ID (bp-xxxxx)
bd sync                 # Sync again after commit
git push                # Push to remote
```

**NEVER skip this. Work is not done until pushed.**

---

## Quick Command Reference

### View Work
```bash
bd ready                           # Show issues ready to work on
bd list --status=open              # List open issues
bd list --status=in_progress       # List in-progress issues
bd show <issue-id>                 # View issue details
bd stats                           # Project statistics
bd blocked                         # Show blocked issues
```

### Create & Update
```bash
bd create --title="..." --type=task --priority=2        # Create issue
bd update <issue-id> --status=in_progress               # Start work
bd update <issue-id> --status=open                      # Reopen
bd comments add <issue-id> "Progress note"              # Add comment
bd close <issue-id>                                     # Complete issue
bd close <id1> <id2> <id3>                              # Close multiple
```

### Dependencies
```bash
bd dep add <issue-A> <issue-B>     # A depends on B (B blocks A)
bd blocked                         # Show all blocked issues
```

### Sync
```bash
bd sync                            # Sync to git
bd sync --status                   # Check sync status
```

---

## Issue Format

- **Issue ID:** `bp-xxxxx` (e.g., bp-a3f2dd, bp-1f6)
- **Priority:** 0 (critical), 1 (high), 2 (medium), 3 (low), 4 (backlog)
- **Status:** open, in_progress, blocked, closed
- **Type:** bug, feature, task, epic, chore

---

## Standard Workflows

### Starting Work
```bash
# 1. Check ready work
bd ready

# 2. View details
bd show bp-xxxxx

# 3. Mark as in-progress
bd update bp-xxxxx --status=in_progress

# 4. Do the work...
```

### Completing Work
```bash
# 1. Add progress notes
bd comments add bp-xxxxx "Implemented feature X"
bd comments add bp-xxxxx "Added unit tests"

# 2. Close issue
bd close bp-xxxxx

# 3. Follow Session Close Protocol
git status
git add .
bd sync
git commit -m "feat: description (bp-xxxxx)"
bd sync
git push
```

### Creating Issues During Work
```bash
# When discovering new work
bd create --title="Fix CORS issue" --type=bug --priority=1

# If it blocks current work
bd dep add bp-current bp-newblocker
```

---

## Best Practices

1. **Always check for ready work first:** Run `bd ready` at session start
2. **Create issues proactively:** When discovering work, create issues immediately
3. **Add detailed comments:** Document progress and decisions with `bd comments add`
4. **Update status regularly:** Mark in-progress or completed appropriately
5. **Reference in commits:** Always include Beads issue ID (bp-xxxxx) in commit messages
6. **Close completed work:** Use `bd close` when done
7. **Sync regularly:** Run `bd sync` after closing issues and before ending session
8. **Never skip close protocol:** Always follow the 6-step checklist

---

## When to Use Beads

**ALWAYS create Beads issues for:**
- Work that takes longer than 2-5 minutes
- Feature development or enhancements
- Bug fixes
- Refactoring tasks
- Documentation updates
- Any task requiring tracking across sessions

---

## Commit Message Format

Always use Conventional Commits with Beads issue ID:

```bash
feat: add user authentication (bp-xxxxx)
feat(auth): implement Google OAuth (bp-xxxxx)
fix: resolve login redirect bug (bp-xxxxx)
fix(timer): fix timer reset issue (bp-xxxxx)
refactor: improve code structure (bp-xxxxx)
docs: update README (bp-xxxxx)
chore: update dependencies (bp-xxxxx)
```

**Types:** feat, fix, refactor, docs, chore, perf, test, style

---

## Example Complete Session

```bash
# Start
bd ready
bd show bp-a3f2dd
bd update bp-a3f2dd --status=in_progress

# Work
# ... write code ...

# Document
bd comments add bp-a3f2dd "Implemented email validation with Zod"
bd comments add bp-a3f2dd "Added unit tests"

# Complete
bd close bp-a3f2dd

# Landing the plane
git status
git add .
bd sync
git commit -m "feat(auth): add email validation (bp-a3f2dd)"
bd sync
git push
```

---

## Remember

- **Issue IDs format:** `bp-xxxxx`
- **Priority:** Use 0-4 (NOT "high"/"medium"/"low")
- **Always sync before ending session**
- **When in doubt, create an issue** - Better to over-track than lose context
