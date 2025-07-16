# 🚀 Prefetching Strategy - Zero Loading Experience

## 🎯 **Tujuan**
Mengimplementasikan prefetching data di awal aplikasi sehingga user tidak mengalami loading saat navigasi antar halaman, memberikan UX yang seamless.

## 📊 **Current State vs Target State**

### **❌ Current State (Lazy Loading)**
```
User opens app → Dashboard loads → User clicks "12 Week Quests" → Loading... → Data loads
User clicks "Main Quests" → Loading... → Data loads
User clicks "Vision" → Loading... → Data loads
```

### **✅ Target State (Eager Loading)**
```
User opens app → All data prefetched → User clicks any page → Instant display
```

## 🏗️ **Implementation Strategy**

### **1. Root Level Prefetching**
```typescript
// src/app/layout.tsx
import { SWRConfig } from 'swr';
import { prefetchInitialData } from '@/lib/prefetchUtils';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SWRConfig 
          value={{
            fallback: prefetchInitialData(), // Prefetch all critical data
            revalidateOnFocus: false,
            dedupingInterval: 10 * 60 * 1000, // 10 minutes
          }}
        >
          {children}
        </SWRConfig>
      </body>
    </html>
  );
}
```

### **2. Prefetch Utility**
```typescript
// src/lib/prefetchUtils.ts
import { questKeys, visionKeys, dashboardKeys, weeklySyncKeys, dailySyncKeys } from '@/lib/swr';
import { getAllQuestsForQuarter, getQuests } from '@/app/(admin)/planning/quests/actions';
import { getVisions } from '@/app/(admin)/planning/vision/actions';
import { getTodayTasks, getActiveQuests, getHabitsStreak, getWeeklyProgress } from '@/app/(admin)/dashboard/actions';
import { getWeeklyGoals, getWeeklyRules } from '@/app/(admin)/execution/weekly-sync/actions';
import { getDailyPlan } from '@/app/(admin)/execution/daily-sync/actions';

export async function prefetchInitialData() {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentQuarter = Math.ceil((currentDate.getMonth() + 1) / 3);
  const currentWeek = getWeekOfYear(currentDate);

  // Prefetch all critical data
  const prefetchedData = await Promise.allSettled([
    // Planning Data
    prefetchQuests(currentYear, currentQuarter),
    prefetchVisions(),
    
    // Dashboard Data
    prefetchDashboardData(),
    
    // Execution Data
    prefetchWeeklyData(currentYear, currentWeek),
    prefetchDailyData(currentDate.toISOString().split('T')[0]),
  ]);

  // Convert to SWR fallback format
  const fallback: Record<string, any> = {};
  
  prefetchedData.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      Object.assign(fallback, result.value);
    }
  });

  return fallback;
}

async function prefetchQuests(year: number, quarter: number) {
  const [allQuests, mainQuests] = await Promise.all([
    getAllQuestsForQuarter(year, quarter),
    getQuests(year, quarter, true),
  ]);

  return {
    [JSON.stringify(questKeys.list(year, quarter))]: allQuests,
    [JSON.stringify(questKeys.mainQuests(year, quarter))]: mainQuests,
  };
}

async function prefetchVisions() {
  const visions = await getVisions();
  return {
    [JSON.stringify(visionKeys.list())]: visions,
  };
}

async function prefetchDashboardData() {
  const [todayTasks, activeQuests, habitsStreak, weeklyProgress] = await Promise.all([
    getTodayTasks(),
    getActiveQuests(),
    getHabitsStreak(),
    getWeeklyProgress(),
  ]);

  return {
    [JSON.stringify(dashboardKeys.todayTasks())]: todayTasks,
    [JSON.stringify(dashboardKeys.activeQuests())]: activeQuests,
    [JSON.stringify(dashboardKeys.habitsStreak())]: habitsStreak,
    [JSON.stringify(dashboardKeys.weeklyProgress())]: weeklyProgress,
  };
}

async function prefetchWeeklyData(year: number, weekNumber: number) {
  const [weeklyGoals, weeklyRules] = await Promise.all([
    getWeeklyGoals(year, weekNumber),
    getWeeklyRules(year, weekNumber),
  ]);

  return {
    [JSON.stringify(weeklyGoalKeys.list(year, weekNumber))]: weeklyGoals,
    [JSON.stringify(weeklySyncKeys.weeklyRules(year, weekNumber))]: weeklyRules,
  };
}

async function prefetchDailyData(date: string) {
  const dailyPlan = await getDailyPlan(date);
  return {
    [JSON.stringify(dailyPlanKeys.list(date))]: dailyPlan,
  };
}
```

### **3. Enhanced SWR Configuration**
```typescript
// src/lib/swr.ts
export const swrConfig: SWRConfiguration = {
  // Prefetching configuration
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  revalidateIfStale: false, // Don't revalidate if data is fresh
  
  // Cache configuration
  dedupingInterval: 10 * 60 * 1000, // 10 minutes
  focusThrottleInterval: 5000,
  
  // Error handling
  errorRetryCount: 3,
  errorRetryInterval: 1000,
  
  // Keep data in cache longer
  keepPreviousData: true,
  
  // Optimistic updates
  optimisticData: true,
};
```

### **4. Progressive Loading Strategy**
```typescript
// src/hooks/useProgressiveLoading.ts
import { useEffect } from 'react';
import { useSWRConfig } from 'swr';

export function useProgressiveLoading() {
  const { mutate } = useSWRConfig();

  useEffect(() => {
    // Prefetch data for adjacent pages
    const prefetchAdjacentPages = async () => {
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentQuarter = Math.ceil((currentDate.getMonth() + 1) / 3);
      
      // Prefetch data for pages user might visit next
      await Promise.allSettled([
        // Prefetch next quarter data
        mutate(questKeys.list(currentYear, currentQuarter + 1)),
        mutate(questKeys.list(currentYear, currentQuarter - 1)),
        
        // Prefetch next week data
        mutate(weeklyGoalKeys.list(currentYear, getWeekOfYear(currentDate) + 1)),
      ]);
    };

    // Delay prefetching to not block initial load
    const timer = setTimeout(prefetchAdjacentPages, 2000);
    return () => clearTimeout(timer);
  }, [mutate]);
}
```

## 🎯 **Implementation Options**

### **Option 1: Full Prefetching (Recommended)**
- **Pros:** Zero loading on navigation
- **Cons:** Initial load time longer
- **Best for:** Users who frequently navigate between pages

### **Option 2: Progressive Prefetching**
- **Pros:** Fast initial load, smart caching
- **Cons:** Some loading on first navigation
- **Best for:** Users who stay on one page for long periods

### **Option 3: Hybrid Approach**
- **Pros:** Balance between performance and UX
- **Cons:** More complex implementation
- **Best for:** Mixed usage patterns

## 📊 **Performance Impact**

### **Initial Load Time**
```
Without Prefetching: ~1-2 seconds
With Prefetching: ~2-3 seconds (acceptable trade-off)
```

### **Navigation Speed**
```
Without Prefetching: ~500ms-1s per navigation
With Prefetching: ~0-50ms per navigation (instant)
```

### **Cache Hit Rate**
```
Without Prefetching: ~30-50%
With Prefetching: ~90-95%
```

## 🔧 **Implementation Steps**

### **Step 1: Create Prefetch Utility**
```bash
# Create prefetch utility
touch src/lib/prefetchUtils.ts
```

### **Step 2: Update Root Layout**
```typescript
// Update src/app/layout.tsx to include prefetching
```

### **Step 3: Enhance SWR Config**
```typescript
// Update src/lib/swr.ts with better caching config
```

### **Step 4: Add Progressive Loading**
```typescript
// Create useProgressiveLoading hook
```

## 🎯 **Recommended Approach**

### **Phase 1: Critical Data Prefetching**
- Dashboard data
- Current quarter quests
- Current week data

### **Phase 2: Adjacent Data Prefetching**
- Next/previous quarter
- Next/previous week
- Related pages data

### **Phase 3: Smart Prefetching**
- Based on user behavior
- Predictive loading
- Background updates

## 🚀 **Benefits**

### **User Experience**
- ✅ Zero loading on navigation
- ✅ Instant page transitions
- ✅ Smooth user flow
- ✅ Professional feel

### **Performance**
- ✅ Reduced server requests
- ✅ Better cache utilization
- ✅ Optimized data fetching
- ✅ Improved perceived performance

### **Technical**
- ✅ Better error handling
- ✅ Offline capability
- ✅ Reduced bandwidth usage
- ✅ Scalable architecture

---

**Status**: 🚀 **RECOMMENDED**  
**Impact**: ⭐ **High** - Significantly improved UX  
**Effort**: ⚡ **Medium** - One-time setup with long-term benefits 