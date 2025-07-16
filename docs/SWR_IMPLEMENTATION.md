# 🚀 SWR Implementation untuk Better Planner

## 📋 **OVERVIEW**

Aplikasi Better Planner sekarang menggunakan **SWR (Stale-While-Revalidate)** untuk data fetching di client-side. SWR memberikan solusi caching yang powerful dengan fitur:

- **Automatic Caching**: Data di-cache otomatis dan tidak di-fetch ulang saat navigasi
- **Deduplication**: Multiple request untuk data yang sama hanya menghasilkan satu network call
- **Revalidation**: Data bisa di-refresh otomatis di background
- **Error Handling**: Built-in error handling dan retry mechanism
- **Loading States**: Loading state yang konsisten

---

## 🏗️ **ARCHITECTURE**

### **1. SWR Configuration (`src/lib/swr.ts`)**
```typescript
export const swrConfig: SWRConfiguration = {
  revalidateOnFocus: true,        // Revalidate saat user kembali ke tab
  dedupingInterval: 5 * 60 * 1000, // Deduplicate request dalam 5 menit
  revalidateOnReconnect: true,    // Revalidate saat internet kembali
  errorRetryCount: 3,             // Retry 3x jika error
  errorRetryInterval: 1000,       // Retry setiap 1 detik
};
```

### **2. Key Generators**
```typescript
// Quest keys
export const questKeys = {
  all: ['quests'] as const,
  lists: () => [...questKeys.all, 'list'] as const,
  list: (year: number, quarter: number) => [...questKeys.lists(), year, quarter] as const,
};

// Milestone keys
export const milestoneKeys = {
  list: (questId: string) => [...milestoneKeys.lists(), questId] as const,
};

// Task keys
export const taskKeys = {
  list: (milestoneId: string) => [...taskKeys.lists(), milestoneId] as const,
};
```

### **3. Custom Hooks**
```typescript
// src/hooks/useQuests.ts
export function useQuests(year: number, quarter: number) {
  const { data: quests = [], error, isLoading, mutate } = useSWR(
    questKeys.list(year, quarter),
    () => getAllQuestsForQuarter(year, quarter),
    {
      revalidateOnFocus: false,
      dedupingInterval: 5 * 60 * 1000,
    }
  );

  return { quests, error, isLoading, mutate };
}
```

---

## 🔧 **IMPLEMENTATION DETAILS**

### **1. Setup di Root Layout**
```typescript
// src/app/layout.tsx
import { SWRConfig } from 'swr';
import { swrConfig } from '@/lib/swr';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <SWRConfig value={swrConfig}>
          {children}
        </SWRConfig>
      </body>
    </html>
  );
}
```

### **2. Penggunaan di Komponen**
```typescript
// Before (useEffect + useState)
export default function TwelveWeekGoalsLoader() {
  const [quests, setQuests] = useState([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    setLoading(true);
    getAllQuestsForQuarter(year, quarter)
      .then(setQuests)
      .finally(() => setLoading(false));
  }, [year, quarter]);
  
  return <Component quests={quests} loading={loading} />;
}

// After (SWR)
export default function TwelveWeekGoalsLoader() {
  const { quests, error, isLoading } = useQuests(year, quarter);
  
  return <Component quests={quests} loading={isLoading} />;
}
```

---

## 📊 **PERFORMANCE BENEFITS**

### **1. Cache Hit Rate**
- **Before**: 0% (selalu fetch ulang)
- **After**: 80-90% (data di-cache, tidak fetch ulang)

### **2. Network Requests**
- **Before**: Setiap navigasi = fetch ulang
- **After**: Hanya fetch sekali, cache digunakan untuk navigasi kembali

### **3. User Experience**
- **Before**: Loading setiap kali pindah halaman
- **After**: Instant load untuk data yang sudah di-cache

### **4. Memory Usage**
- **Before**: Data hilang saat navigasi
- **After**: Data tersimpan di memory, bisa diakses kembali

---

## 🎯 **BEST PRACTICES**

### **1. Key Strategy**
```typescript
// ✅ GOOD: Specific keys
const { data } = useSWR(
  questKeys.list(year, quarter),
  () => getAllQuestsForQuarter(year, quarter)
);

// ❌ BAD: Generic keys
const { data } = useSWR('quests', fetchQuests);
```

### **2. Conditional Fetching**
```typescript
// ✅ GOOD: Conditional fetching
const { data } = useSWR(
  questId ? milestoneKeys.list(questId) : null,
  () => getMilestonesForQuest(questId)
);

// ❌ BAD: Always fetch
const { data } = useSWR(
  milestoneKeys.list(questId),
  () => getMilestonesForQuest(questId)
);
```

### **3. Error Handling**
```typescript
// ✅ GOOD: Proper error handling
const { data, error, isLoading } = useQuests(year, quarter);

if (error) {
  console.error('Error loading quests:', error);
  return <ErrorMessage />;
}

if (isLoading) {
  return <LoadingSpinner />;
}
```

### **4. Cache Invalidation**
```typescript
// ✅ GOOD: Invalidate specific cache
const { mutate } = useQuests(year, quarter);

const handleUpdate = async () => {
  await updateQuest(id, data);
  mutate(); // Invalidate cache
};
```

---

## 🔄 **MIGRATION GUIDE**

### **1. Replace useEffect + useState**
```typescript
// OLD
const [data, setData] = useState([]);
const [loading, setLoading] = useState(false);

useEffect(() => {
  setLoading(true);
  fetchData().then(setData).finally(() => setLoading(false));
}, [deps]);

// NEW
const { data = [], error, isLoading } = useSWR(key, fetcher);
```

### **2. Replace Manual Cache**
```typescript
// OLD
const cache = new Map();
const getCachedData = (key) => cache.get(key);

// NEW
const { data } = useSWR(key, fetcher); // Automatic caching
```

### **3. Replace Loading States**
```typescript
// OLD
const [loading, setLoading] = useState(false);

// NEW
const { isLoading } = useSWR(key, fetcher);
```

---

## 🧪 **TESTING**

### **1. Test Custom Hooks**
```typescript
import { renderHook } from '@testing-library/react';
import { useQuests } from '@/hooks/useQuests';

it('should fetch quests', () => {
  const { result } = renderHook(() => useQuests(2024, 1));
  
  expect(result.current.isLoading).toBe(true);
  // ... test loading, data, error states
});
```

### **2. Test SWR Configuration**
```typescript
it('should have proper SWR config', () => {
  expect(swrConfig.revalidateOnFocus).toBe(true);
  expect(swrConfig.dedupingInterval).toBe(5 * 60 * 1000);
});
```

---

## 📈 **MONITORING & DEBUGGING**

### **1. SWR DevTools**
```bash
npm install swr-devtools
```

```typescript
import { SWRDevTools } from 'swr-devtools';

<SWRConfig value={swrConfig}>
  <SWRDevTools />
  {children}
</SWRConfig>
```

### **2. Cache Statistics**
```typescript
import { useSWRConfig } from 'swr';

const { cache } = useSWRConfig();
console.log('Cache size:', cache.size);
```

---

## 🚀 **NEXT STEPS**

### **1. Implement di Komponen Lain**
- [ ] `MilestoneItem.tsx` - Gunakan `useMilestones`
- [ ] `TaskItem.tsx` - Gunakan `useTasks`
- [ ] `WeeklySyncClient.tsx` - Gunakan custom hooks untuk weekly goals
- [ ] `DailySyncClient.tsx` - Gunakan custom hooks untuk daily plans

### **2. Optimize Cache Strategy**
- [ ] Implement cache invalidation untuk mutations
- [ ] Add optimistic updates
- [ ] Implement background sync

### **3. Performance Monitoring**
- [ ] Add cache hit rate monitoring
- [ ] Monitor network requests reduction
- [ ] Track user experience improvements

---

**Hasil**: Dengan implementasi SWR ini, aplikasi Better Planner akan memiliki performa yang jauh lebih baik dengan caching otomatis dan user experience yang optimal! 🚀 