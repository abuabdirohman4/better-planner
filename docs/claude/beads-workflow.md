# Beads Workflow for Better Planner

This document covers Beads (git-backed issue tracker) workflow, best practices, and Better Planner-specific patterns.

---

## 📋 What is Beads?

**Beads** is a git-backed issue tracker designed for AI coding agents. It helps maintain context, track progress, and coordinate work between developers and AI assistants.

**Issue Prefix**: `bp-` (Better Planner, e.g., `bp-a3f2dd`)

---

## 🔧 Core Beads Commands

### View and Manage Issues

```bash
bd list                    # List all issues
bd list --status=open      # All open issues
bd list --status=in_progress # Your active work
bd ready                   # Show issues ready to work on (no blockers)
bd show <issue-id>         # View issue details with dependencies
bd stats                   # Project statistics (open/closed/blocked counts)
bd blocked                 # Show all blocked issues
```

### Create and Update Issues

```bash
bd create --title="..." --type=task|bug|feature --priority=2
# Priority: 0-4 or P0-P4 (0=critical, 2=medium, 4=backlog)
# NOT "high"/"medium"/"low"

bd update <id> --status=in_progress  # Claim work
bd update <id> --assignee=username   # Assign to someone
bd close <id>                        # Mark complete
bd close <id1> <id2> ...             # Close multiple issues at once (more efficient)
bd close <id> --reason="explanation" # Close with reason
bd reopen <id>                       # Reopen closed issue
```

**Tip**: When creating multiple issues/tasks/epics, use parallel subagents for efficiency.

### Dependencies & Blocking

```bash
bd dep add <issue> <depends-on>  # Add dependency (issue depends on depends-on)
bd blocked                       # Show all blocked issues
bd show <id>                     # See what's blocking/blocked by this issue
```

**Dependency Direction**:
- `bd dep add bp-123 bp-456` means "bp-123 depends on bp-456"
- bp-123 is BLOCKED BY bp-456
- bp-456 BLOCKS bp-123

### Sync & Collaboration

```bash
bd sync               # Sync with git remote (run at session end)
bd sync --status      # Check sync status without syncing
bd doctor             # Check for issues (sync problems, missing hooks)
```

---

## 🔄 Beads Sync Branch

**CRITICAL**: Beads uses a dedicated sync branch to avoid conflicts with your working branch.

### How it Works

- **Master**: Normal working branch - checkout/merge/commit normally
- **beads-sync**: Dedicated branch for beads data (managed via git worktree)
- **Feature branches**: Work normally, beads doesn't interfere

### What This Means

✅ **You CAN:**
- Checkout any branch freely (`git checkout feature/xyz`)
- Commit to master/feature branches normally
- Merge branches without beads conflicts
- Create/delete branches as usual

❌ **You CANNOT:**
- Manually checkout `beads-sync` branch
- Modify `.beads/*.jsonl` files directly
- Change `sync-branch` config in `.beads/config.yaml`

### When to Run `bd sync`

**Always run at session end:**
```bash
# Your workflow
bd update bp-a3f2dd --status=in_progress  # Start work
# ... write code ...
bd close bp-a3f2dd                         # Mark done

# End of session
bd sync                                    # Push beads changes to remote
```

**Auto-sync via hooks**: Beads hooks (`pre-commit`, `post-commit`) auto-sync on git operations, but manual `bd sync` at session end ensures everything is pushed.

---

## 🎯 When to Use Beads

### Always Use Beads For:

- Any work that takes longer than 2 minutes
- Feature development or bug fixes
- Refactoring tasks
- Documentation updates
- Any task that requires tracking or context across sessions

### Skip Beads For:

- Simple typo fixes (1-line change)
- Quick documentation updates (< 5 lines)
- Immediate user requests (show status, explain code)

**Rule of thumb**: If you think "I might need to continue this later", use Beads.

---

## 🚀 Common Workflows

### Starting Work

```bash
# Check what's ready to work on
bd ready

# View issue details
bd show bp-a3f2dd

# Claim the issue
bd update bp-a3f2dd --status=in_progress
```

### During Work - Add Notes

```bash
# Document progress
bd comments add bp-a3f2dd "Implemented Activity Plan feature with time blocking"
bd comments add bp-a3f2dd "Added schedule backup/restore pattern to prevent CASCADE data loss"
bd comments add bp-a3f2dd "Tested timezone handling for WIB → UTC conversion"
```

### Discovering Blockers

```bash
# Found a blocker during work
bd create --title="Fix timezone conversion in schedule creation" --priority=1

# Mark original issue as blocked
bd dep add bp-a3f2dd bp-xyz123  # bp-a3f2dd depends on bp-xyz123
```

### Completing Work

```bash
# Close single issue
bd close bp-a3f2dd

# Close multiple related issues at once (more efficient)
bd close bp-a3f2dd bp-xyz123 bp-abc789

# Sync to remote
bd sync
```

### Git Commit with Beads Reference

```bash
# After bd close, commit your code changes
git add .
git commit -m "feat(activity-plan): implement time blocking with schedule management (bp-a3f2dd)"
git push
```

---

## 📊 Issue Organization

### Epics for Large Features

Use epics to group related issues:

```bash
# Create epic
bd create --title="Activity Plan Feature" --type=epic

# Add child issues
bd epic add bp-parent bp-child1
bd epic add bp-parent bp-child2

# View epic hierarchy
bd show bp-parent
```

### Priorities

Set priority levels (0-4, where 0 is highest):

```bash
bd create --title="Critical bug: Timer not stopping" --priority=0  # P0 - Critical
bd create --title="Add dark mode" --priority=2                     # P2 - Medium
bd create --title="Refactor old code" --priority=4                 # P4 - Backlog
```

**Better Planner Priority Scale:**
- **P0**: Critical bugs (data loss, app crash, timer broken)
- **P1**: Important features (user-requested, blocking work)
- **P2**: Medium priority (nice-to-have, minor bugs)
- **P3**: Low priority (refactoring, optimization)
- **P4**: Backlog (ideas, future work)

### Labels

Organize with labels:

```bash
bd label add bp-a3f2dd feature
bd label add bp-a3f2dd activity-plan
bd label add bp-a3f2dd database
```

---

## 📝 Progress Documentation

### Progress Files Location

Create progress files in `.beads/progress/{issue-id}.md`:

```bash
# Example: .beads/progress/bp-a3f2dd.md
```

### Progress File Template

```markdown
# bp-a3f2dd: Activity Plan Feature

## Status: In Progress

## Summary
Implementing time blocking feature for Activity Plan with schedule management.

## Progress Log

### 2026-02-13
- ✅ Created task_schedules table with CASCADE foreign key
- ✅ Implemented schedule CRUD actions
- ⚠️ Discovered CASCADE delete issue with setDailyPlan()
- 🔄 Implementing backup/restore pattern

### 2026-02-12
- ✅ Designed UI for schedule management modal
- ✅ Added conflict detection for overlapping schedules

## Blockers
- None currently

## Next Steps
1. Complete backup/restore implementation
2. Test timezone handling for schedules
3. Add documentation
```

### When to Update Progress Files

- **Start of work**: Create file with initial plan
- **During work**: Add progress entries (use timestamps)
- **Blockers found**: Document blocker and dependency
- **End of work**: Summarize completion and next steps

---

## 🚨 Critical Rules

### NEVER Do These

❌ **Don't manually edit `.beads/*.jsonl` files**
- These are managed by Beads CLI
- Direct edits will be overwritten or cause corruption

❌ **Don't change `sync-branch` config**
- Keep `sync-branch: beads-sync` in `.beads/config.yaml`
- Changing this breaks the sync workflow

❌ **Don't use `bd delete`**
- Use `bd close` instead
- Delete is for cleanup only (duplicate issues, mistakes)

❌ **Don't checkout `beads-sync` branch manually**
- This branch is managed via git worktree
- Checkout may cause sync issues

### ALWAYS Do These

✅ **Run `bd sync` at session end**
- Ensures beads changes are pushed to remote
- Prevents sync conflicts

✅ **Use `bd close` for completed issues**
- Marks issue as done
- Preserves issue history

✅ **Document progress in comments**
- Future sessions can pick up where you left off
- Helps Claude understand context after compaction

✅ **Reference issue IDs in commit messages**
- Links code changes to beads issues
- Example: `feat(timer): add pause feature (bp-a3f2dd)`

---

## 🔍 Troubleshooting

### Sync Conflicts

If `bd sync` fails with conflicts:

```bash
# Check sync status
bd sync --status

# Run doctor to diagnose
bd doctor

# If needed, force sync (use carefully!)
git -C .beads/sync pull --rebase
bd sync
```

### Missing Worktree

If beads-sync worktree is missing:

```bash
# Re-initialize beads
bd init

# This will recreate the worktree
```

### Orphaned Issues

If issues show as orphaned (no parent epic):

```bash
# List all orphaned issues
bd list --orphaned

# Add to epic if needed
bd epic add bp-parent bp-orphaned-child
```

---

## 📚 Better Planner-Specific Patterns

### Feature Implementation

1. **Create epic** for large feature
2. **Break down** into subtasks (database, UI, actions, testing)
3. **Add dependencies** (database → actions → UI)
4. **Work sequentially** using `bd ready` to find next task

Example:
```bash
# Epic
bd create --title="Calendar View for Activity Log" --type=epic --priority=1

# Subtasks
bd create --title="Design calendar block layout algorithm" --priority=1
bd create --title="Implement overlap detection" --priority=1
bd create --title="Add 24h/dynamic view toggle" --priority=2
bd create --title="Test timezone edge cases" --priority=1

# Dependencies
bd epic add bp-epic bp-task1
bd epic add bp-epic bp-task2
bd dep add bp-task2 bp-task1  # task2 depends on task1
```

### Bug Fixes

1. **Create bug issue** with clear title
2. **Add priority** based on severity
3. **Document reproduction** in comments
4. **Link to related issues** if applicable

Example:
```bash
bd create --title="Bug: Page blinks on daily sync revalidation" --type=bug --priority=1
bd comments add bp-bug "Reproduction: Open daily sync page, add task, page flashes skeleton"
bd comments add bp-bug "Root cause: SWR isLoading=true on background revalidation"
```

### Documentation Updates

1. **Create task** for documentation
2. **Reference related feature** issue
3. **Mark as low priority** unless blocking

Example:
```bash
bd create --title="Document CASCADE delete pattern in database-operations.md" --priority=3
bd dep add bp-doc bp-feature  # Documentation depends on feature completion
```

---

## 🎯 Session Close Protocol

**CRITICAL**: Before saying "done" or "complete", run this checklist:

```bash
# 1. Check what changed
git status

# 2. Stage code changes (NOT beads files)
git add src/app/...  # Specific files, not git add .

# 3. Commit beads changes
bd sync

# 4. Commit code changes
git commit -m "feat(scope): description (bp-issue-id)"

# 5. Sync beads again (captures commit reference)
bd sync

# 6. Push to remote
git push
```

**NEVER skip this.** Work is not done until pushed.

---

## 📖 Related Documentation

- **Architecture Patterns**: [`architecture-patterns.md`](architecture-patterns.md)
- **Database Operations**: [`database-operations.md`](database-operations.md)
- **Testing Guidelines**: [`testing-guidelines.md`](testing-guidelines.md)
- **Business Rules**: [`business-rules.md`](business-rules.md)

---

## 🔗 External Resources

- **Beads Official Docs**: https://github.com/beyondessential/beads
- **Beads CLI Reference**: `bd --help`
- **Better Planner Beads Guide**: `docs/BEADS_GUIDE.md` (legacy, migrate to this file)
