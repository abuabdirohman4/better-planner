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

## Git Workflow

**Branch Naming:**
- Features: `feature/descriptive-name`
- Bug fixes: `bugfix/issue-description`
- Chore: `chore/task-description`
- Docs: `docs/what-changed`

**Commit Messages (Conventional Commits):**
```
feat: add new feature
feat(scope): add feature with scope
fix: resolve bug
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
