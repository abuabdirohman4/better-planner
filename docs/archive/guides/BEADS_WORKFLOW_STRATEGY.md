# Beads Workflow Strategy: Cara Efektif Menggunakan Beads dengan Claude

## 🎯 Pertanyaan Utama

**"Apakah saya harus bikin banyak issue dulu baru minta Claude kerjakan semua? Atau bagaimana agar efektif pemakaiannya?"**

## ✅ Jawaban: Ada 3 Strategi Utama

### Strategi 1: **Planning-First Approach** (Recommended untuk Project Besar)

**Kapan digunakan:**
- Anda sudah tahu fitur/tasks yang perlu dikerjakan
- Sprint planning atau quarterly planning
- Refactoring besar atau feature complex
- Ketika Anda ingin overview lengkap sebelum mulai

**Workflow:**

```bash
# 1. Buat semua issues di awal (batch planning)
bd create "Fix Pomodoro timer bug" --priority 1
bd create "Add dark mode support" --priority 2
bd create "Optimize database queries" --priority 3
bd create "Update documentation" --priority 4
bd create "Add export to PDF feature" --priority 3

# 2. Organize dengan labels
bd label add bp-101 bug urgent
bd label add bp-102 feature ui
bd label add bp-103 performance backend
bd label add bp-104 docs
bd label add bp-105 feature export

# 3. Set dependencies jika ada
bd dep add bp-102 --blocked-by bp-103  # Dark mode needs DB optimization first

# 4. Lihat apa yang ready
bd ready

# 5. Minta Claude kerjakan satu per satu berdasarkan priority
"Hey Claude, please work on bp-101 (highest priority bug)"
# Claude selesai bp-101

"Claude, now work on bp-103"
# Claude selesai bp-103

"Claude, bp-102 should be unblocked now, please work on it"
# Dan seterusnya...
```

**Kelebihan:**
- ✅ Clear overview dari semua work
- ✅ Mudah track progress (berapa done vs pending)
- ✅ Bisa lihat dependencies dan blockers
- ✅ Good for team collaboration
- ✅ Historical record lengkap

**Kekurangan:**
- ⚠️ Butuh waktu di awal untuk planning
- ⚠️ Bisa berubah di tengah jalan (scope creep)

---

### Strategi 2: **Just-In-Time Approach** (Recommended untuk Development Agile)

**Kapan digunakan:**
- Anda tidak yakin apa saja yang perlu dikerjakan
- Exploratory development
- Bug hunting atau debugging
- Ketika requirements masih fluid

**Workflow:**

```bash
# 1. Mulai dengan satu issue saja
bd create "Investigate timer issues" --priority 1

# 2. Minta Claude investigasi
"Claude, investigate bp-101"

# 3. Claude menemukan 3 sub-issues, buat on-the-fly
bd create "Fix timer clickability bug" --priority 1
bd create "Add timer sound notification" --priority 3
bd create "Persist timer state on refresh" --priority 2

# 4. Link ke parent (jika perlu)
bd epic add bp-101 bp-102
bd epic add bp-101 bp-103
bd epic add bp-101 bp-104

# 5. Kerjakan satu per satu
"Claude, work on bp-102 first"
```

**Kelebihan:**
- ✅ Flexible, adapt sesuai findings
- ✅ Tidak overthink di awal
- ✅ Cocok untuk unknown territory
- ✅ Less upfront planning

**Kekurangan:**
- ⚠️ Bisa kehilangan big picture
- ⚠️ Sulit estimate total effort

---

### Strategi 3: **Hybrid Approach** (Best of Both Worlds)

**Kapan digunakan:**
- Most common use case
- Balance antara planning dan flexibility

**Workflow:**

```bash
# 1. Buat high-level epics/themes dulu
bd create "Q1 2026: Performance Improvements" --type epic --priority 2
bd create "Q1 2026: User Experience Enhancements" --type epic --priority 2
bd create "Q1 2026: Bug Fixes" --type epic --priority 1

# 2. Buat beberapa concrete tasks yang sudah jelas
bd create "Fix Pomodoro timer clickability" --priority 1
bd create "Add loading states to all forms" --priority 3
bd create "Optimize quest list rendering" --priority 2

# 3. Link ke epics
bd epic add bp-100 bp-103  # Timer fix -> Bug Fixes epic
bd epic add bp-101 bp-104  # Loading states -> UX epic
bd epic add bp-100 bp-105  # Quest optimization -> Performance epic

# 4. Kerjakan berdasarkan priority
bd ready
"Claude, work on bp-103 (P1 bug)"

# 5. Discover more issues during work, add them
# Claude menemukan bug lain saat fixing timer
bd create "Timer doesn't pause on window blur" --priority 2
bd epic add bp-100 bp-106
bd label add bp-106 bug timer

# 6. Continue iteratively
```

**Kelebihan:**
- ✅ Balance planning dan flexibility
- ✅ Clear themes/epics untuk context
- ✅ Bisa adjust sesuai findings
- ✅ Good visibility dan tracking

**Kekurangan:**
- ⚠️ Perlu maintain epics + tasks

---

## 🔥 Best Practices: Bekerja dengan Claude

### 1. **Satu Issue, Satu Focus** (Recommended!)

```bash
# GOOD ✅
bd ready
# Output: bp-346 [P1] Fix timer bug
"Claude, please work on bp-346"
# Claude focus, selesai, commit, close

# AVOID ❌
"Claude, please work on bp-101, bp-102, bp-103, bp-104, and bp-105 at once"
# Claude might get confused, lose context, or miss things
```

**Why?**
- Claude bekerja lebih baik dengan clear, focused task
- Easier to track progress
- Better commit history (one issue = one/few commits)
- Kalau ada error, lebih mudah rollback

---

### 2. **Use Priority untuk Guide Claude**

```bash
# Anda buat issues dengan priority
bd create "Critical login bug" --priority 1
bd create "Add profile picture" --priority 3
bd create "Fix typo in footer" --priority 5

# Claude bisa auto-pick yang paling penting
bd ready  # Shows P1 first
"Claude, work on the highest priority issue"
```

---

### 3. **Gunakan Dependencies untuk Complex Work**

```bash
# Contoh: Feature "Export Reports"
bd create "Design export data structure" --priority 2
# ID: bp-200

bd create "Implement PDF generation" --priority 2
# ID: bp-201

bd create "Add export UI button" --priority 2
# ID: bp-202

# Set dependencies
bd dep add bp-201 --blocked-by bp-200  # Can't generate PDF without data structure
bd dep add bp-202 --blocked-by bp-201  # Can't add UI without PDF generation

# bd ready akan show hanya bp-200 (yang tidak blocked)
bd ready
"Claude, work on bp-200"

# Setelah bp-200 done, bp-201 automatically unblocked
bd close bp-200
bd ready  # Now shows bp-201
"Claude, work on bp-201"
```

---

### 4. **Batch Create untuk Related Work**

```bash
# Ketika Anda tahu ada beberapa related tasks
bd create "Fix timer clickability bug" --priority 1 && \
bd create "Fix timer sound not playing" --priority 1 && \
bd create "Fix timer reset on refresh" --priority 2

# Label semuanya
bd label add bp-301 bug timer
bd label add bp-302 bug timer
bd label add bp-303 bug timer

# Minta Claude kerjakan satu per satu
bd list --label bug --priority 1
"Claude, work through all P1 timer bugs: bp-301, then bp-302"
```

---

### 5. **Gunakan Comments untuk Context**

```bash
# Anda buat issue dengan context
bd create "Optimize dashboard loading time" --priority 2 \
  --description "Dashboard takes 5+ seconds to load. Users complaining. Target: under 2 seconds."

# Tambah investigation notes
bd comments add bp-400 "Profiled with Chrome DevTools - main bottleneck is fetching all quests at once"
bd comments add bp-400 "Consider: pagination, lazy loading, or caching"

# Minta Claude dengan full context
"Claude, work on bp-400. Check the comments for investigation findings."
```

---

## 📊 Workflow Comparison Table

| Aspect | Planning-First | Just-In-Time | Hybrid |
|--------|---------------|--------------|--------|
| **Upfront Planning** | High (30-60 min) | Low (5 min) | Medium (15-30 min) |
| **Flexibility** | Low | High | Medium-High |
| **Big Picture View** | Excellent | Poor | Good |
| **Best for Team** | ✅ Yes | ❌ No | ✅ Yes |
| **Best for Solo** | ⚠️ Can be overkill | ✅ Yes | ✅ Yes |
| **Sprint Planning** | ✅✅ Ideal | ❌ Not suitable | ⚠️ Okay |
| **Bug Hunting** | ❌ Not flexible | ✅✅ Ideal | ✅ Good |
| **Claude Usage** | Sequential (one by one) | Dynamic (create as you go) | Mix of both |

---

## 🎬 Real-World Example: Better Planner Development

### Scenario 1: "Saya punya 1 jam, ingin fix bugs"

```bash
# Quick approach
bd create "Fix Pomodoro timer bug" --priority 1
"Claude, work on bp-346"
# Done in 20 mins

bd create "Fix daily quest archiving" --priority 1
"Claude, work on bp-347"
# Done in 15 mins

bd create "Fix mobile navbar overlap" --priority 2
"Claude, work on bp-348"
# Done in 25 mins

# Result: 3 bugs fixed, 3 issues tracked, clean history
```

---

### Scenario 2: "Saya plan sprint 2 minggu ke depan"

```bash
# Planning session (30 mins)
bd create "Sprint 1 - Jan 2026" --type epic

# Week 1 tasks
bd create "Redesign dashboard layout" --priority 2
bd create "Add quest filtering" --priority 2
bd create "Improve mobile responsiveness" --priority 3

# Week 2 tasks
bd create "Implement data export" --priority 3
bd create "Add notification system" --priority 2
bd create "Write user documentation" --priority 4

# Link to epic
bd epic add bp-400 bp-401
bd epic add bp-400 bp-402
# ... etc

# Label by week
bd label add bp-401 week1
bd label add bp-402 week1
bd label add bp-403 week1
bd label add bp-404 week2
bd label add bp-405 week2
bd label add bp-406 week2

# Execute
# Week 1 Day 1:
bd list --label week1 --priority 2
"Claude, work on bp-401"

# Week 1 Day 2:
"Claude, work on bp-402"

# ... and so on
```

---

### Scenario 3: "Saya tidak tahu apa yang rusak, perlu investigate"

```bash
# Start broad
bd create "Investigate performance issues" --priority 1
"Claude, profile the app and identify bottlenecks"

# Claude finds 3 issues, create them
bd create "Dashboard queries are N+1" --priority 1
bd create "Quest list re-renders too often" --priority 2
bd create "Images not optimized" --priority 3

bd epic add bp-500 bp-501
bd epic add bp-500 bp-502
bd epic add bp-500 bp-503

# Work on them
"Claude, fix bp-501 first (highest impact)"
bd close bp-501

"Claude, now bp-502"
bd close bp-502

# bp-503 defer for later
bd update bp-503 --priority 5
```

---

## 💡 Tips untuk Maksimalkan Efektivitas

### Tip 1: Start Small, Grow Organically

```bash
# Jangan overwhelm diri dengan 50 issues sekaligus
# Start dengan 3-5 issues paling penting

bd create "Fix critical bug X" --priority 1
bd create "Add feature Y" --priority 2
bd create "Improve Z performance" --priority 3

# Setelah 3-5 ini done, baru tambah lagi
```

### Tip 2: Review Weekly

```bash
# Setiap akhir minggu
bd list --status closed  # What did I accomplish?
bd list --status open    # What's still pending?
bd blocked               # What's blocking progress?

# Adjust priorities
bd update bp-xxx --priority 1  # Escalate this
bd update bp-yyy --priority 5  # De-prioritize this
```

### Tip 3: Use Epics untuk Themes

```bash
# Better than flat list
bd create "Performance" --type epic
bd create "User Experience" --type epic
bd create "Bug Fixes" --type epic

# Semua issues masuk ke salah satu epic
# Lebih organized, easier to see themes
```

### Tip 4: Archive Completed Work

```bash
# Setelah 1-2 bulan, export untuk archive
bd export --status closed > completed-jan-2026.jsonl

# Atau view stats
bd status
bd count --status closed
```

### Tip 5: Communicate dengan Claude via Comments

```bash
# Leave notes untuk Claude di issue
bd comments add bp-123 "IMPORTANT: Must maintain backward compatibility"
bd comments add bp-123 "Reference: see src/legacy/old-timer.ts for old implementation"

# Saat minta Claude work on it
"Claude, work on bp-123. Pay attention to the comments."
```

---

## 🚦 Decision Framework: Mana Strategi yang Cocok?

### Gunakan **Planning-First** jika:
- ☑️ Anda punya clear requirements
- ☑️ Project > 1 week
- ☑️ Team collaboration (lebih dari 1 orang)
- ☑️ Need to estimate effort/timeline
- ☑️ Quarterly/sprint planning

### Gunakan **Just-In-Time** jika:
- ☑️ Anda tidak yakin scope-nya
- ☑️ Exploratory atau prototype
- ☑️ Solo developer
- ☑️ Quick fixes atau bug hunting
- ☑️ Time-boxed work (1-2 jam)

### Gunakan **Hybrid** jika:
- ☑️ Normal day-to-day development
- ☑️ Balance structure dan flexibility
- ☑️ Medium projects (1-4 weeks)
- ☑️ Uncertain requirements tapi ada themes
- ☑️ **Most common case** ← Start here!

---

## 🎯 Recommended Workflow untuk Better Planner Project

Berdasarkan project Better Planner, saya recommend **Hybrid Approach**:

```bash
# 1. Buat 3 evergreen epics
bd create "Bug Fixes" --type epic --priority 1
bd create "Feature Enhancements" --type epic --priority 2
bd create "Technical Debt" --type epic --priority 3

# 2. Setiap kali ada work, create issue dan link ke epic
bd create "Fix Pomodoro timer clickability" --priority 1
bd epic add bp-100 bp-103
bd label add bp-103 bug timer urgent

# 3. Maintain 5-10 open issues maximum
bd list --status open  # Keep this manageable

# 4. Work dengan Claude one issue at a time
bd ready
"Claude, work on bp-103"

# 5. Review dan clean up weekly
bd status
bd list --status closed --updated-since "1 week ago"
```

---

## ✅ Action Items untuk Anda

**Immediate (Today):**
1. ✅ Prefix sudah diganti ke `bp-`
2. ✅ Sudah ada 1 issue (bp-346)
3. ⬜ Buat 2-3 issues lagi yang Anda tahu perlu dikerjakan
4. ⬜ Minta Claude work on highest priority

**This Week:**
1. ⬜ Gunakan Beads setiap kali ada task > 2 menit
2. ⬜ Tambah comments/notes saat work on issues
3. ⬜ Review progress: `bd status`

**This Month:**
1. ⬜ Setup epics untuk organize work
2. ⬜ Export dan review completed work
3. ⬜ Refine workflow based on experience

---

## 📚 Summary

**Apakah harus bikin banyak issue dulu?**
→ **Tidak harus!** Tergantung situasi. Untuk most cases, gunakan **Hybrid**: buat 3-5 issues yang jelas, work on them, discover more issues during work, add them on-the-fly.

**Cara paling efektif:**
→ **One issue at a time dengan Claude**, gunakan priority untuk guide, maintain manageable number of open issues (5-10), review weekly.

**Yang PENTING:**
1. ✅ **Write clear descriptions** - Claude butuh context
2. ✅ **Use priorities** - Guide apa yang dikerjakan dulu
3. ✅ **Add comments/notes** - Document decisions dan progress
4. ✅ **Work sequentially** - One issue, one focus
5. ✅ **Review regularly** - Weekly check-in

---

**Next Steps:**
Coba workflow ini dengan 2-3 issues berikutnya, lalu adjust based on apa yang works untuk Anda!

Mau saya buatkan 3-5 issues untuk Better Planner based on priority Anda? Atau mau langsung work on bp-346 (timer bug)?
