# QuarterSelector Component Documentation

## Overview

The `QuarterSelector` component is a contextual time navigation tool that intelligently adapts its behavior based on the current page. It provides quarter-based navigation for planning and reporting pages while automatically hiding itself on irrelevant pages for a cleaner user experience.

## Features

### 🎯 Contextual Intelligence
- **Smart Hiding**: Automatically hides on pages where quarter selection is not relevant
- **Path-based Logic**: Uses `usePathname()` to determine current page context
- **Clean UX**: Completely removes the component from irrelevant pages

### 📅 Quarter Navigation
- **13-Week Logic**: Calculates current quarter based on 13-week periods
- **URL Integration**: Manages state through URL search parameters (`?q=2025-Q2`)
- **16 Quarter Options**: Provides 4 years of quarter options (2 past, current, 1 future)

### 🎨 Visual Feedback
- **Complete Hiding**: Component doesn't render at all on irrelevant pages
- **Hover Effects**: Interactive feedback for enabled state
- **Accessibility**: Proper ARIA labels and keyboard navigation

## Hidden Pages

The component automatically hides on the following pages:

### Planning & Vision
- `/planning/vision` - Vision setting page

### Settings & Profile
- `/settings` - Application settings
- `/profile` - User profile page

### Authentication (Commented out - can be enabled if needed)
- `/auth/signin` - Sign in page
- `/auth/signup` - Sign up page
- `/auth/callback` - Auth callback

### UI Examples & Demos (Commented out - can be enabled if needed)
- `/alerts`, `/avatars`, `/badge`, `/buttons`
- `/images`, `/modals`, `/videos`
- `/form-elements`, `/basic-tables`
- `/bar-chart`, `/line-chart`

### Other Pages (Commented out - can be enabled if needed)
- `/error-404` - Error pages
- `/blank` - Blank page
- `/calendar` - Calendar view

## Technical Implementation

### Key Functions

#### `shouldHideQuarterSelector(pathname: string): boolean`
Determines if the component should be hidden based on current pathname.

#### `parseQParam(q: string | null): { year: number; quarter: number }`
Parses URL parameter and calculates current quarter using 13-week logic.

#### `generateQuarterOptions(current: { year: number; quarter: number })`
Generates 16 quarter options spanning 4 years.

### State Management
- Uses Next.js `useSearchParams()` and `useRouter()` for URL-based state
- Maintains quarter selection in URL for bookmarking and sharing
- Handles edge cases with proper fallbacks

### Rendering Logic
- Returns `null` when component should be hidden
- No conditional styling needed since component doesn't render
- Cleaner DOM structure on irrelevant pages

### Styling
- Integrates with existing design system components
- Uses Tailwind CSS for responsive design
- Supports both light and dark themes
- No disabled state styling needed

## Usage

The component is automatically included in the `AppHeader` and will:

1. **Check current page** on every render
2. **Hide/show** based on page relevance
3. **Display current quarter** from URL or calculate default
4. **Handle navigation** through arrow buttons and dropdown
5. **Update URL** when quarter changes

## Example URL States

```
/planning/main-quests?q=2025-Q2    # Q2 2025 selected
/planning/main-quests?q=2024-Q4    # Q4 2024 selected
/planning/main-quests              # Current quarter (calculated)
/planning/vision                   # Component hidden (not rendered)
```

## Accessibility

- **ARIA Labels**: Proper labeling for screen readers
- **Keyboard Navigation**: Full keyboard support
- **Focus Management**: Proper focus handling for dropdown
- **No Hidden Elements**: Component doesn't exist in DOM when hidden

## Benefits of Hidden vs Disabled

### Hidden Approach (Current)
- ✅ **Cleaner UI**: No visual clutter on irrelevant pages
- ✅ **Better UX**: Users don't see non-functional elements
- ✅ **Simpler Code**: No conditional styling logic
- ✅ **Performance**: Component doesn't render at all

### Disabled Approach (Previous)
- ❌ **Visual Noise**: Shows disabled elements that can't be used
- ❌ **User Confusion**: Users might try to interact with disabled elements
- ❌ **Complex Styling**: Need to handle disabled state styling
- ❌ **Accessibility Issues**: Screen readers still announce disabled elements

## Future Enhancements

Potential improvements could include:
- Customizable hidden page list
- Quarter range selection
- Integration with calendar views
- Export/import quarter preferences
- Dynamic page list based on user preferences 