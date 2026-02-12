# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Better Planner is a productivity and task management web application built with Next.js 15, featuring a unique 13-week quarter planning system. The app helps users transform goals into achievements through strategic planning, daily execution tracking, and comprehensive analytics.

**Tech Stack:**
- Next.js 15 (App Router) + React 19 + TypeScript
- Tailwind CSS v4 for styling
- Supabase for database and authentication
- SWR for data fetching and caching
- Zustand for global state management
- @dnd-kit for drag-and-drop functionality
- Sonner for toast notifications
- Progressive Web App (PWA) enabled

## Development Commands

```bash
# Development
npm run dev              # Start dev server at http://localhost:3000
npm run build            # Production build
npm start               # Start production server

# Code Quality
npm run type-check      # TypeScript type checking
npm run format          # Format code with Prettier
npm run format:check    # Check code formatting
npm run fix:all         # Format and type check

# Utilities
npm run generate:pdf    # Generate PDF guide
```

## Architecture Overview

### Core Planning Concepts

**Quarter System (13-week cycles):**
- The app uses a 13-week quarter planning system (Q1, Q2, Q3, Q4)
- Users create quarterly goals and break them down into weekly and daily tasks
- Quarter planning components are in `src/app/(admin)/planning/`

**Quest System:**
- "Quests" are major goals/projects within quarters
- Daily Quests: Day-to-day tasks tracked in daily sync
- Work Quests: Professional/project tasks
- Side Quests: Personal development and side projects
- Quest management is in `src/app/(admin)/quests/`

### Application Structure

```
src/
├── app/                          # Next.js App Router
│   ├── (admin)/                  # Main authenticated pages
│   │   ├── dashboard/            # User dashboard and analytics
│   │   ├── execution/            # Daily task execution
│   │   ├── planning/             # Quarter planning features
│   │   ├── quests/               # Quest management (daily, work, side)
│   │   └── settings/             # User settings
│   ├── (full-width-pages)/       # Auth pages (login, signup)
│   ├── api/                      # API routes (if needed)
│   └── layout.tsx                # Root layout with providers
├── components/                   # Reusable UI components
│   ├── auth/                     # Authentication components
│   ├── common/                   # SWRProvider, PreloadProvider
│   ├── form/                     # Form components
│   ├── ui/                       # Basic UI components
│   └── tables/                   # Table components
├── lib/                          # Utilities and configurations
│   ├── supabase/                 # Supabase client setup
│   ├── dateUtils.ts              # Date manipulation
│   ├── errorUtils.ts             # Error handling
│   ├── quarterUtils.ts           # Quarter calculations
│   └── swr.ts                    # SWR configuration
├── stores/                       # Zustand stores
│   └── activityStore.ts          # Global state management
└── types/                        # TypeScript type definitions
```

### Activity Log Calendar View

**Location:** `src/app/(admin)/execution/daily-sync/ActivityLog/`

The ActivityLog component displays Pomodoro timer sessions and tracks user productivity throughout the day. It supports three view modes:
- **GROUPED**: Activities grouped by task/quest with session counts
- **TIMELINE**: Chronological list of all activities (newest first, toggleable)
- **CALENDAR**: Visual timeline with hourly blocks (Google Calendar style)

**Calendar View Features:**
- **Dynamic View**: Shows only hours with activities (discontinuous timeline) - default mode
- **24h View**: Full 24-hour grid display (00:00 - 23:59)
- Color-coded blocks by quest type (Main/Work/Side/Daily)
- Break activities displayed with distinct styling
- Overlap detection with automatic column layout
- Click blocks to view task details and journal entries

**Key Components:**
- `CalendarView.tsx` - Main calendar component with view toggle
- `components/CalendarBlock.tsx` - Individual activity block rendering
- `components/HourlyGrid.tsx` - Background timeline grid with hour labels
- `components/CalendarTaskDetail.tsx` - Modal for task details (what_done, what_think)

**Utilities (`/src/lib/calendarUtils.ts`):**
- `getVisibleHours(items)` - Calculate hours to display in dynamic view
- `calculateDiscontinuousStyle(start, end, hours)` - Position blocks in discontinuous timeline
- `processOverlaps(items)` - Handle overlapping activities with column assignment
- `generateTimeSlots()` - Generate 24-hour time slots array
- `calculateBlockStyle(start, duration)` - Calculate block position and height

**Data Structure:**
Activities are fetched from `activity_logs` table with fields:
- `start_time`, `end_time` (ISO 8601 timestamps)
- `duration_minutes` (calculated duration)
- `type`: 'FOCUS' | 'SHORT_BREAK' | 'LONG_BREAK' | 'BREAK'
- Links to `task_id`, `milestone_id`, `quest_id`
- Journal entries: `what_done`, `what_think`

**Usage Pattern:**
```typescript
// In daily-sync page
<ActivityLog date="2025-01-15" refreshKey={timestamp} />
```

### Activity Plan - Time Blocking

**Location:** `src/app/(admin)/execution/daily-sync/DailyQuest/`

Activity Plan memungkinkan users untuk schedule tasks di waktu spesifik (time blocking). Terintegrasi dengan ActivityLog melalui segmented control toggle.

**Core Features:**
- **Multiple Schedules**: Task bisa di-schedule berkali-kali (split time blocks)
  - Example: Task A → 2 sessions jam 10:00, 1 session jam 14:00
- **Segmented Control**: Toggle "Plan | Actual" di ActivityLog header
- **Schedule Management**: Modal untuk add/edit/delete schedule blocks per task
- **Visual Calendar**: Simplified blocks (icon + title only), waktu & duration dari position & height
- **Conflict Detection**: Visual warning (yellow border) untuk overlapping schedules

**Database Structure:**
```sql
-- task_schedules table
CREATE TABLE task_schedules (
  id UUID PRIMARY KEY,
  daily_plan_item_id UUID REFERENCES daily_plan_items(id) ON DELETE CASCADE,
  scheduled_start_time TIMESTAMPTZ NOT NULL,
  scheduled_end_time TIMESTAMPTZ NOT NULL,
  duration_minutes INT NOT NULL,
  session_count INT NOT NULL,  -- Sessions allocated to this block
  ...
);
```

**⚠️ CRITICAL: CASCADE Delete Chain**
```
daily_plans (DELETE)
    ↓ ON DELETE CASCADE
daily_plan_items (AUTO DELETE)
    ↓ ON DELETE CASCADE
task_schedules (AUTO DELETE) ← Schedules hilang!
```

**Operations yang Trigger Cascade:**
1. `setDailyPlan()` - Delete & re-insert daily_plan_items by type (❌ causes data loss - NOW FIXED with backup/restore)
2. `removeDailyPlanItem()` - Delete single task from daily plan (✅ expected behavior)

**Fix Implemented (bp-7wn):**
- `setDailyPlan()` now backs up task_schedules before delete, then restores with new daily_plan_item_id
- Pattern: Backup → Delete (CASCADE) → Insert new items → Restore schedules with new IDs
- See `dailyPlanActions.ts:24-120` for implementation

**Best Practice:**
- When updating daily_plan_items with delete-and-reinsert pattern, **backup schedules first** then restore with new IDs
- See `docs/activity-plan-feature.md` for complete implementation guide

**Key Files:**
- `actions/scheduleActions.ts` - CRUD operations for schedules
- `components/ScheduleManagementModal.tsx` - Schedule list & management UI
- `components/ScheduleBlockForm.tsx` - Add/edit individual blocks
- `hooks/useTaskSchedules.ts` - Fetch schedules per task
- `utils/scheduleUtils.ts` - Validation & conflict detection

**Usage:**
```typescript
// Create schedule
await createSchedule(taskId, startTime, endTime, durationMins, sessionCount);

// Get schedules for task
const schedules = await getTaskSchedules(taskId);

// Get all scheduled tasks for date
const tasks = await getScheduledTasksByDate('2026-02-12');
```

### Key Patterns

**Server Actions (Primary Data Pattern):**
```typescript
// actions/example.ts
"use server";

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getData() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('table_name')
    .select('*')
    .eq('user_id', user.id);

  if (error) throw error;
  return data || [];
}

// Always revalidate paths after mutations
export async function createData(formData: FormData) {
  // ... mutation logic
  revalidatePath('/path-to-revalidate');
}
```

**SWR for Client-Side Data:**
```typescript
import useSWR from 'swr';
import { getData } from '@/actions/example';

export function useData() {
  const { data, error, isLoading, mutate } = useSWR(
    'data-key',
    getData,
    {
      revalidateOnFocus: false,
      dedupingInterval: 2 * 60 * 1000, // 2 minutes
    }
  );
  return { data, error, isLoading, mutate };
}
```

**Supabase Client Setup:**
- Server components: Use `createClient()` from `@/lib/supabase/server`
- Client components: Use `createClient()` from `@/lib/supabase/client`
- Always check authentication before database operations
- RLS policies enforce user-level data isolation

**Component Patterns:**
- Functional components with React hooks
- TypeScript interfaces for all props
- Loading states with `<Spinner />` component
- Error states with user-friendly messages
- Toast notifications via `toast.success()`, `toast.error()` from Sonner

## Database Schema

### Core Tables

**Projects/Quests:**
- `id`: UUID primary key
- `title`: String (1-100 chars)
- `description`: Text (optional)
- `status`: "planning" | "active" | "completed" | "on-hold"
- `priority`: "low" | "medium" | "high" | "urgent"
- `quarter`: "Q1" | "Q2" | "Q3" | "Q4"
- `user_id`: Foreign key to auth.users
- `created_at`, `updated_at`: Timestamps

**Tasks:**
- `id`: UUID primary key
- `project_id`: Foreign key to projects
- `title`: String (1-100 chars)
- `status`: "todo" | "in-progress" | "completed"
- `priority`: "low" | "medium" | "high" | "urgent"
- `due_date`: Optional date
- `completed_at`: Timestamp when completed

**Data Validation:**
- Dates: ISO 8601 format (YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS.sssZ)
- Colors: Hex format (#1496F6)
- All IDs: UUID v4 format
- User data is isolated via Row Level Security (RLS)

## Coding Standards

**Naming Conventions:**
- Components: PascalCase (`Button`, `SessionProvider`)
- Files: kebab-case for pages, PascalCase for components
- Variables: camelCase (`isLoading`, `rememberMe`)
- Constants: UPPER_SNAKE_CASE (`LOCALKEY`, `API_BASE_URL`)

**Import Pattern:**
- Use absolute imports with `@/` prefix
- Example: `import { useAuth } from '@/hooks/useAuth'`

**Form Handling:**
```typescript
const [form, setForm] = useState({ field1: "", field2: "" });
const handleChange = (e: ChangeEvent<HTMLInputElement>) =>
  setForm({ ...form, [e.target.name]: e.target.value });
```

**Error Handling:**
- Centralized error handling with `handleApiError()` from `@/lib/errorUtils`
- Always check user authentication in server actions
- Display user-friendly error messages with toast notifications
- Implement proper loading states for async operations

**Package & Component Management:**
- **DO NOT** install new packages (npm/yarn) without explicit user confirmation.
- **ALWAYS** prefer using existing UI components (`src/components/ui`, `src/components/common`) over creating new ones or installing new libraries.
- **DO NOT** replace existing components with raw HTML (e.g., replacing `Label` with `<label>`). If a component needs to be removed (e.g. Radix), replace it with a custom component implementation, not raw HTML.
- If a required component is missing, ask the user for direction before proceeding.

## Task Management with Beads

This project uses **Beads** - a git-backed issue tracker designed for AI coding agents. Beads helps maintain context, track progress, and coordinate work between developers and AI assistants.

**Issue Prefix:** `bp-` (Better Planner, e.g., `bp-a3f2dd`)

### Core Beads Commands

```bash
# View and manage issues
bd list                    # List all issues
bd ready                   # Show issues ready to work on
bd show <issue-id>         # View issue details
bd status                  # Show project status

# Create and update issues
bd add "Issue title"       # Create new issue
bd note <issue-id> "note"  # Add note to issue
bd done <issue-id>         # Mark issue as done
bd block <issue-id>        # Mark issue as blocked

# Work on issues
bd start <issue-id>        # Start working on an issue
bd stop                    # Stop working on current issue

# Dependencies and relationships
bd blocks <issue-id> <blocked-id>  # Set dependency
bd epic <issue-id> <child-id>      # Link to epic

# Sync and maintenance
bd sync                    # Sync with git
bd doctor                  # Check for issues
```

### Workflow for AI Agents (Claude)

**When to use Beads:**
- Any work that takes longer than 2 minutes
- Feature development or bug fixes
- Refactoring tasks
- Documentation updates
- Any task that requires tracking or context

**Best Practices:**
1. **Check ready issues first:** Run `bd ready` at session start
2. **Start issues explicitly:** Use `bd start <issue-id>` before working
3. **Write detailed notes:** Document progress, decisions, and blockers
4. **Update status regularly:** Mark issues done or blocked as appropriate
5. **Reference in commits:** Include issue ID in commit messages
6. **Create issues proactively:** When discovering new work, create issues immediately

**Integration with Git:**
- Beads integrates with git via hooks
- Issue data is stored in `.beads/issues.jsonl` (committed)
- SQLite cache in `.beads/beads.db` (not committed)
- Issue IDs can be referenced in commit messages

### Example Workflow

```bash
# Start your session
bd ready                          # Check what's ready to work on

# Start working on an issue
bd start bp-a3f2dd               # Start the issue

# During work - add notes
bd comments add bp-a3f2dd "Implemented user authentication with Supabase"
bd comments add bp-a3f2dd "Added RLS policies for user data isolation"

# If you discover a blocker
bd create "Fix CORS issue with Supabase"
bd dep add bp-a3f2dd --blocked-by bp-xyz123  # Mark first issue blocked by new one

# When done
bd close bp-a3f2dd               # Mark as complete
git commit -m "feat(auth): implement user authentication (bp-a3f2dd)"
```

### Issue Organization

**Epics:** Use for large features or initiatives
```bash
bd create "School Management System" --type epic
bd epic add bp-parent bp-child1
bd epic add bp-parent bp-child2
```

**Priorities:** Set priority levels (1-5, where 1 is highest)
```bash
bd create "Critical bug fix" --priority 1
bd create "Nice-to-have feature" --priority 4
```

**Labels:** Organize with labels
```bash
bd label add bp-a3f2dd authentication
bd label add bp-a3f2dd security
```

## Git Workflow

**Branch Naming:**
- Features: `feature/descriptive-name` or `feature/bp-<hash>`
- Bug fixes: `bugfix/issue-description` or `bugfix/bp-<hash>`
- Chore: `chore/task-description`
- Docs: `docs/what-changed`

**Commit Messages (Conventional Commits):**
```
feat: add new feature
feat(scope): add feature with scope (bp-a3f2dd)
fix: resolve bug (bp-xyz123)
fix(auth): fix authentication issue
docs: update documentation
refactor: improve code structure
perf: optimize performance
chore: maintenance tasks
```

**Main Branch:** `master` (production-ready code)

## Environment Variables

Required environment variables (see `.env.example`):
```bash
NEXT_PUBLIC_SUPABASE_URL=          # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=     # Supabase anonymous key
GOOGLE_CLIENT_SECRET=              # Google OAuth secret
NEXT_PUBLIC_ENABLE_TIMER_DEV=true  # Enable timer in dev mode
```

## Important Notes

**Authentication:**
- All authenticated pages are under `(admin)` route group
- Check user session before data operations
- Use `createClient()` from appropriate Supabase module (server/client)

**State Management:**
- Local state: `useState` for component-specific data
- Server state: SWR for data fetching with caching
- Global state: Zustand stores (e.g., `activityStore`)
- Context: `ThemeContext`, `SidebarContext`, `TimerContext`

**Styling:**
- Tailwind CSS v4 is used throughout
- Primary color: `bg-primary`, `text-primary`
- Mobile-first responsive design
- Common button pattern: `<Button color="bg-primary" className="w-full" />`

**Performance:**
- Use `useMemo` for expensive calculations
- Use `useCallback` for event handlers in lists
- SWR handles caching and deduplication automatically
- Lazy load non-critical components

**Testing:**
- Manual testing checklist includes: user interactions, error states, loading states, responsive design, drag-and-drop, quarter planning, authentication, real-time updates

**PWA:**
- App is configured as a Progressive Web App
- Users can install on any device
- Service worker configured via next-pwa

## Documentation References

For detailed information, see:
- `.cursor/rules/project-overview.mdc` - Complete project specifications
- `.cursor/rules/coding-standards.mdc` - Detailed coding standards
- `.cursor/rules/component-patterns.mdc` - UI component patterns
- `.cursor/rules/database-schema.mdc` - Database schema details
- `.cursor/rules/api-integration.mdc` - API and Supabase integration
- `docs/database-schema.md` - Complete database documentation
