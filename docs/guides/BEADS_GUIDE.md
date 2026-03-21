# Beads Issue Tracker Guide

## 📖 Apa itu Beads?

**Beads** adalah issue tracker berbasis git yang dirancang khusus untuk kolaborasi antara developer dan AI coding agents. Diciptakan oleh Steve Yegge, Beads menyimpan semua issues langsung di repository git Anda dalam format JSONL, membuat tracking issues menjadi bagian dari version control.

### Kenapa Menggunakan Beads?

- **Git-native**: Issues disimpan di `.beads/issues.jsonl` dan ter-track dalam git history
- **AI-friendly**: Dirancang untuk AI agents seperti Claude Code, Cursor, Windsurf
- **Lightweight**: CLI-based, tidak perlu web interface atau server
- **Offline-first**: Bekerja tanpa koneksi internet
- **Dependency tracking**: Support untuk blockers, epics, dan dependency relationships
- **Context preservation**: Notes dan history tersimpan untuk referensi jangka panjang

---

## 🚀 Setup Beads

### 1. Install Beads (via Homebrew)

```bash
brew install yegge/tap/bd
```

### 2. Initialize Beads di Project

```bash
cd /path/to/your/project
bd init --prefix sm  # 'sm' adalah prefix untuk issue IDs
```

Ini akan membuat:
- `.beads/` directory
- `.beads/issues.jsonl` - issue data (di-commit ke git)
- `.beads/beads.db` - SQLite cache (tidak di-commit)
- `AGENTS.md` - instruksi untuk AI agents

### 3. Setup Claude Code Integration

```bash
bd setup claude
```

Ini akan:
- Install hooks ke `~/.claude/settings.json`
- Enable auto-sync saat session start
- Enable auto-compact sebelum context window penuh

### 4. Update .gitignore

Tambahkan ke `.gitignore`:

```
# Beads issue tracker
.beads/beads.db
```

**Note**: `.beads/issues.jsonl` HARUS di-commit, hanya `.beads/beads.db` yang diabaikan.

### 5. Verify Setup

```bash
bd setup claude --check  # Verify Claude integration
bd status                # Check database status
```

---

## 📋 Core Commands

### Viewing Issues

```bash
# List semua issues
bd list

# List issues yang siap dikerjakan (no blockers)
bd ready

# Show detail issue
bd show sm-346

# Lihat status overview
bd status

# Search issues
bd search "keyword"

# Count issues
bd count --status open
```

### Creating Issues

```bash
# Buat issue baru
bd create "Issue title"

# Buat dengan description
bd create "Fix login bug" --description "Users can't login with Google OAuth"

# Buat dengan priority (1-5, 1 = highest)
bd create "Critical bug" --priority 1

# Quick capture (hanya output ID)
bd q "Quick task"

# Buat dari form interaktif
bd create-form
```

### Working on Issues

```bash
# Mulai bekerja di issue
bd start sm-346

# Stop bekerja
bd stop

# Update issue
bd update sm-346 --description "New description"
bd update sm-346 --priority 2
bd update sm-346 --title "New title"

# Tambah comment/note
bd comments add sm-346 "Fixed the timer event handler"
bd comments list sm-346

# Edit issue di $EDITOR
bd edit sm-346
```

### Closing Issues

```bash
# Close (mark done)
bd close sm-346

# Close multiple
bd close sm-346 sm-347 sm-348

# Reopen
bd reopen sm-346

# Delete (permanent)
bd delete sm-346
```

---

## 🏷️ Labels & Organization

### Labels

```bash
# Tambah label
bd label add sm-346 bug
bd label add sm-346 ui frontend

# Hapus label
bd label remove sm-346 ui

# List labels di issue
bd label list sm-346

# List semua labels di database
bd label list-all
```

### Common Label Conventions

- **Type**: `bug`, `feature`, `refactor`, `docs`, `test`
- **Area**: `ui`, `api`, `database`, `auth`, `performance`
- **Priority**: `critical`, `high`, `medium`, `low`
- **Status**: `blocked`, `wip`, `needs-review`, `ready`

---

## 🔗 Dependencies & Relationships

### Blockers

```bash
# Set dependency (sm-347 blocks sm-346)
bd dep add sm-346 --blocked-by sm-347

# Remove blocker
bd dep remove sm-346 --blocked-by sm-347

# List blocked issues
bd blocked
```

### Epics (Parent-Child Relationships)

```bash
# Create epic
bd create "Authentication System" --type epic

# Link child to epic
bd epic add sm-parent sm-child1
bd epic add sm-parent sm-child2

# Remove from epic
bd epic remove sm-parent sm-child1

# List epic structure
bd show sm-parent
```

### Duplicates & Supersedes

```bash
# Mark as duplicate
bd duplicate sm-346 sm-123  # sm-346 is duplicate of sm-123

# Mark as superseded
bd supersede sm-old sm-new  # sm-old superseded by sm-new
```

---

## 📊 Priorities & States

### Priority Levels

- **P1**: Critical/Urgent - Drop everything
- **P2**: High - Next sprint/iteration
- **P3**: Medium - Backlog, soon
- **P4**: Low - Nice to have
- **P5**: Lowest - Future consideration

```bash
bd update sm-346 --priority 1
```

### Status States

- `open` - Not started
- `in_progress` - Currently working
- `blocked` - Waiting on something
- `closed` - Completed/resolved

States can be set via operational state:

```bash
bd set-state sm-346 in_progress
bd set-state sm-346 blocked
```

---

## 🔄 Git Integration

### Commit Message Convention

Referensi issue ID di commit messages:

```bash
git commit -m "feat(auth): implement Google OAuth (sm-346)"
git commit -m "fix(timer): make task clickable after completion (sm-123)"
git commit -m "refactor: simplify database queries (sm-456)"
```

### Sync with Git

```bash
# Manual sync
bd sync

# Check sync status
bd info
```

### Hooks

Beads dapat install git hooks untuk auto-sync:

```bash
bd hooks install   # Install git hooks
bd hooks status    # Check hook status
```

---

## 💼 Workflow Examples

### Daily Developer Workflow

```bash
# Morning - check what's ready
bd ready

# Start working on highest priority
bd start sm-346

# During work - add notes
bd comments add sm-346 "Implemented timer state management"
bd comments add sm-346 "Added click handler for completed tasks"

# Commit with reference
git add .
git commit -m "fix(timer): restore clickability after completion (sm-346)"

# Mark done
bd close sm-346

# Check status
bd status
```

### Bug Fix Workflow

```bash
# Create bug issue
bd create "Button not clickable on mobile" \
  --description "On iOS Safari, submit button doesn't respond to taps" \
  --priority 1

# Get the issue ID (e.g., sm-789)
bd list

# Add labels
bd label add sm-789 bug mobile ui

# Start work
bd start sm-789

# Add investigation notes
bd comments add sm-789 "Issue caused by touch-action CSS property"
bd comments add sm-789 "Fixed by adding touch-action: manipulation"

# Commit
git commit -m "fix(mobile): restore button touch interaction on iOS (sm-789)"

# Close
bd close sm-789
```

### Feature Development Workflow

```bash
# Create epic
bd create "User Profile Management" --priority 2
# Assume ID: sm-100

# Create child issues
bd create "Profile edit UI" --priority 2
# Assume ID: sm-101
bd create "Avatar upload" --priority 3
# Assume ID: sm-102
bd create "Profile API endpoints" --priority 2
# Assume ID: sm-103

# Link to epic
bd epic add sm-100 sm-101
bd epic add sm-100 sm-102
bd epic add sm-100 sm-103

# Set dependencies (API must be done before UI)
bd dep add sm-101 --blocked-by sm-103

# Check what's ready
bd ready

# Start with API
bd start sm-103
# ... work and commit ...
bd close sm-103

# Now UI is unblocked
bd start sm-101
# ... work and commit ...
bd close sm-101
```

### AI Agent Collaboration Workflow

```bash
# Human creates issue
bd create "Add dark mode support" --priority 3
# ID: sm-500

# Human asks Claude to work on it
# "Hey Claude, please work on issue sm-500"

# Claude starts
bd start sm-500

# Claude adds notes during work
bd comments add sm-500 "Added ThemeProvider context"
bd comments add sm-500 "Implemented dark mode toggle in settings"
bd comments add sm-500 "Updated all components to support theme switching"

# Claude commits
git commit -m "feat(ui): implement dark mode support (sm-500)"

# Claude marks done
bd close sm-500

# Human reviews
bd show sm-500  # Check notes and history
```

---

## 🎯 Advanced Features

### Formulas (Work Templates)

Create reusable templates for common workflows:

```bash
# List available formulas
bd formula list

# Use a formula
bd formula run <formula-name>
```

### Molecules (Structured Epics)

Advanced epic management with state tracking:

```bash
bd mol create "Migration Project"
bd mol show <mol-id>
```

### Swarms

Organize related work across multiple issues:

```bash
bd swarm create "Q1 Performance Improvements"
bd swarm add <swarm-id> sm-101 sm-102 sm-103
```

### Export & Import

```bash
# Export to JSONL
bd export > issues.jsonl

# Export to Obsidian format
bd export --format obsidian

# Import from JSONL
bd import issues.jsonl
```

### Integration with External Tools

```bash
# Jira integration
bd jira sync

# Linear integration
bd linear import
```

---

## 🛠️ Maintenance & Troubleshooting

### Doctor Command

```bash
bd doctor         # Check for issues
bd doctor --fix   # Auto-fix common issues
```

### Database Operations

```bash
# Show database info
bd info

# Check for orphaned issues
bd orphans

# Find duplicates
bd duplicates

# Repair database
bd repair
```

### Version Management

```bash
# Check version
bd version

# Check for updates
bd upgrade check

# Upgrade bd
bd upgrade
```

### Sync Issues

```bash
# Force sync
bd sync --force

# Check sync status
bd info | grep sync
```

---

## 📚 Best Practices

### For Developers

1. **Write descriptive titles**: Make it clear what the issue is about
2. **Add descriptions**: Explain why the issue exists and what needs to be done
3. **Use labels consistently**: Establish label conventions for your team
4. **Reference in commits**: Always include issue ID in commit messages
5. **Update status**: Keep issues current - mark blocked, in_progress, or done
6. **Add notes**: Document decisions, approaches, and blockers
7. **Check ready daily**: Start your day with `bd ready`

### For AI Agents (Claude, Cursor, etc.)

1. **Check ready first**: Run `bd ready` at session start
2. **Start explicitly**: Use `bd start <id>` before working
3. **Write detailed notes**: Document all changes, decisions, and progress
4. **Update frequently**: Keep status and notes current
5. **Reference in commits**: Include issue ID in all commits
6. **Create proactively**: When discovering new work, create issues immediately
7. **Use for work >2 mins**: Track anything non-trivial

### Issue Description Template

```markdown
## Problem
[What's wrong or what needs to be built]

## Context
[Why this matters, background info]

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

## Technical Notes
[Implementation details, considerations]

## Related Issues
- Blocks: sm-xxx
- Blocked by: sm-yyy
- Related: sm-zzz
```

---

## 🔍 Quick Reference

### Most Used Commands

```bash
bd ready                          # Show ready work
bd list                           # List all issues
bd show <id>                      # Show details
bd create "title"                 # Create issue
bd start <id>                     # Start work
bd comments add <id> "note"       # Add note
bd close <id>                     # Mark done
bd status                         # Project status
bd label add <id> <label>         # Add label
bd dep add <id> --blocked-by <id> # Add blocker
```

### Filtering & Search

```bash
bd list --status open             # Only open issues
bd list --priority 1              # P1 issues only
bd list --label bug               # Issues with 'bug' label
bd search "authentication"        # Text search
bd count --status closed          # Count closed issues
```

### Useful Aliases

Add to your `.bashrc` or `.zshrc`:

```bash
alias bdr='bd ready'
alias bdl='bd list'
alias bds='bd status'
alias bdc='bd create'
alias bdcl='bd close'
alias bdsh='bd show'
```

---

## 📖 Additional Resources

- **Official Docs**: Check `AGENTS.md` in your project
- **Beads Repository**: [GitHub](https://github.com/yegge/beads) (if available)
- **Get Help**: `bd help` or `bd <command> --help`
- **Claude Code Integration**: See `CLAUDE.md` in your project

---

## 🎓 Example Project Setup

Here's the complete setup for Better Planner project:

```bash
# 1. Install
brew install yegge/tap/bd

# 2. Initialize with prefix 'sm'
cd ~/Documents/Project/prj-better-planner
bd init --prefix sm

# 3. Setup Claude integration
bd setup claude

# 4. Update .gitignore
echo ".beads/beads.db" >> .gitignore

# 5. Create first issue
bd create "Fix: Pomodoro timer task becomes unclickable after completion" \
  --priority 1 \
  --description "Bug: After timer completes, task in timer interface becomes unclickable"

# 6. Add labels
bd label add sm-346 bug ui pomodoro timer

# 7. Verify
bd setup claude --check
bd list
bd ready

# 8. Start working
bd start sm-346
```

---

## 💡 Tips & Tricks

### 1. Bulk Operations

```bash
# Close multiple issues
bd close sm-101 sm-102 sm-103

# Add same label to multiple issues
for id in sm-101 sm-102 sm-103; do
  bd label add $id urgent
done
```

### 2. Issue Templates

Create a shell function for common issue types:

```bash
function bd-bug() {
  bd create "$1" --priority 1 --description "$2"
  local id=$(bd list | head -1 | awk '{print $1}')
  bd label add $id bug
  echo "Created bug issue: $id"
}

# Usage:
bd-bug "Login fails" "Users can't login with email"
```

### 3. Daily Standup Report

```bash
# What did I work on yesterday?
bd list --status closed --updated-since yesterday

# What am I working on today?
bd list --status in_progress

# What's blocking me?
bd blocked
```

### 4. Sprint Planning

```bash
# Create sprint epic
bd create "Sprint 12 - Jan 2026" --type epic
# ID: sm-1200

# Add sprint issues
bd epic add sm-1200 sm-101
bd epic add sm-1200 sm-102
bd epic add sm-1200 sm-103

# View sprint
bd show sm-1200
```

### 5. Code Review Workflow

```bash
# Create review issue
bd create "Code review: Authentication refactor" --priority 2
bd label add sm-700 review

# Add review notes
bd comments add sm-700 "✓ Logic looks good"
bd comments add sm-700 "✗ Need more error handling"
bd comments add sm-700 "✓ Tests pass"

# Close when approved
bd close sm-700
```

---

## 🚨 Common Issues & Solutions

### Issue: "Database locked"

```bash
# Check for running processes
bd info

# Kill daemon if stuck
pkill -f "bd daemon"

# Restart
bd sync
```

### Issue: "Out of sync with git"

```bash
# Force sync
bd sync --force

# Or use doctor
bd doctor --fix
```

### Issue: "Can't find issue"

```bash
# Rebuild database from JSONL
rm .beads/beads.db
bd list  # This triggers rebuild
```

### Issue: "Claude hooks not working"

```bash
# Verify installation
bd setup claude --check

# Reinstall
bd setup claude

# Restart Claude Code
```

---

## 🎉 Conclusion

Beads adalah powerful tool untuk task tracking yang:
- ✅ Terintegrasi langsung dengan git
- ✅ Bekerja seamless dengan AI coding agents
- ✅ Lightweight dan cepat
- ✅ Offline-first
- ✅ Mendukung complex workflows

Mulai gunakan Beads hari ini dan rasakan perbedaannya dalam managing work dengan AI assistants!

---

**Version**: 1.0
**Last Updated**: January 8, 2026
**Project**: Better Planner
**Issue Prefix**: `sm-`
