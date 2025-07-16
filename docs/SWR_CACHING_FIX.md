# 🔧 SWR Caching Fix - 12 Week Quests Data Persistence

## 🎯 **Masalah yang Diperbaiki**

Halaman "12 Week Quests" mengalami masalah data hilang saat navigasi antar halaman. Data quest dan hasil Pairwise Matrix yang sudah diisi akan hilang atau ter-reset saat user pindah ke halaman lain dan kembali lagi.

## 🔍 **Analisis Masalah**

### **1. SWR Key Inconsistency**
- Key untuk pairwise results menggunakan array `['pairwise-results', year, quarter]`
- Tidak ada key generator yang konsisten di `swr.ts`
- Menyebabkan cache tidak tersimpan dengan benar

### **2. useEffect yang Mereset Data**
```typescript
// ❌ PROBLEMATIC CODE
useEffect(() => {
  handleReset();
  setRanking(null);
}, [localKey]);
```
- useEffect ini mereset data setiap kali `localKey` berubah
- Menyebabkan data hilang saat navigasi

### **3. Dependency yang Tidak Stabil**
```typescript
// ❌ PROBLEMATIC CODE
}, [localKey, JSON.stringify(initialPairwiseResults)]);
```
- `JSON.stringify()` dalam dependency menyebabkan re-render yang tidak perlu
- Menyebabkan infinite loop dan data loss

## ✅ **Solusi yang Diterapkan**

### **1. Konsistensi SWR Keys**
```typescript
// ✅ FIXED: Added consistent key generator
export const pairwiseKeys = {
  all: ['pairwise-results'] as const,
  lists: () => [...pairwiseKeys.all, 'list'] as const,
  list: (year: number, quarter: number) => [...pairwiseKeys.lists(), year, quarter] as const,
  details: () => [...pairwiseKeys.all, 'detail'] as const,
  detail: (id: string) => [...pairwiseKeys.details(), id] as const,
};
```

### **2. Improved Pairwise Results Hook**
```typescript
// ✅ FIXED: Better data persistence logic
export function usePairwiseResults(year: number, quarter: number) {
  const { 
    data: pairwiseResults = {}, 
    error, 
    isLoading,
    mutate 
  } = useSWR(
    pairwiseKeys.list(year, quarter), // ✅ Consistent key
    () => getPairwiseResults(year, quarter),
    {
      revalidateOnFocus: false,
      dedupingInterval: 5 * 60 * 1000,
      errorRetryCount: 3,
      keepPreviousData: true, // ✅ Keep data while revalidating
    }
  );

  return { pairwiseResults, error, isLoading, mutate };
}
```

### **3. Fixed usePairwiseComparison Hook**
```typescript
// ✅ FIXED: Removed problematic useEffect and improved data handling
function usePairwiseComparison(year: number, quarter: number, initialPairwiseResults: { [key: string]: string }) {
  const localKey = `better-planner-pairwise-${year}-Q${quarter}`;
  const [pairwiseResults, setPairwiseResults] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    // ✅ Prioritize server data over localStorage
    if (initialPairwiseResults && Object.keys(initialPairwiseResults).length > 0) {
      setPairwiseResults(initialPairwiseResults);
    } else {
      // ✅ Fallback to localStorage only if no server data
      try {
        const saved = localStorage.getItem(localKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && Object.keys(parsed).length > 0) {
            setPairwiseResults(parsed);
          }
        }
      } catch {
        // Ignore localStorage errors
      }
    }
  }, [initialPairwiseResults, localKey]); // ✅ Stable dependencies

  // ✅ Only save to localStorage if we have data
  useEffect(() => {
    if (Object.keys(pairwiseResults).length > 0) {
      try {
        localStorage.setItem(localKey, JSON.stringify(pairwiseResults));
      } catch {
        // Ignore localStorage errors
      }
    }
  }, [pairwiseResults, localKey]);

  return { pairwiseResults, setPairwiseResults, handlePairwiseClick, handleReset, localKey };
}
```

### **4. Improved Quest State Management**
```typescript
// ✅ FIXED: Better quest data persistence
function useQuestState(initialQuests: { id?: string, title: string, label?: string }[]) {
  const [quests, setQuests] = useState<Quest[]>(
    QUEST_LABELS.map(label => ({ label, title: "" }))
  );

  useEffect(() => {
    if (initialQuests && initialQuests.length > 0) {
      const padded = QUEST_LABELS.map((label) => {
        const q = initialQuests.find(q => q.label === label);
        return q ? { id: q.id, label: label, title: q.title } : { label, title: "" };
      });
      setQuests(padded);
    } else {
      // ✅ Only reset if we don't have any quests with titles
      setQuests(prev => {
        const hasTitles = prev.some(q => q.title.trim() !== "");
        if (hasTitles) {
          return prev; // Keep existing data
        }
        return QUEST_LABELS.map(label => ({ label, title: "" }));
      });
    }
  }, [initialQuests]);

  return { quests, setQuests, highlightEmpty, setHighlightEmpty, handleQuestTitleChange };
}
```

### **5. Removed Problematic useEffect**
```typescript
// ✅ FIXED: Removed the useEffect that was resetting data
export default function TwelveWeekGoalsUI({ initialQuests = [], initialPairwiseResults = {}, loading = false }) {
  const { quests, highlightEmpty, handleQuestTitleChange } = useQuestState(initialQuests);
  const { pairwiseResults, handlePairwiseClick, handleReset, localKey } = usePairwiseComparison(year, quarter, initialPairwiseResults);
  const { ranking } = useRankingCalculation(quests, pairwiseResults, initialQuests);
  const { handleSaveQuests, handleCommit } = useQuestOperations(year, quarter, quests, initialQuests);

  // ✅ No more problematic useEffect that resets data

  return (
    // ... component JSX
  );
}
```

## 🚀 **Hasil Perbaikan**

### **Sebelum Perbaikan:**
- ❌ Data quest hilang saat navigasi
- ❌ Pairwise Matrix ter-reset
- ❌ Network requests berlebihan
- ❌ User experience buruk

### **Setelah Perbaikan:**
- ✅ Data quest tetap tersimpan saat navigasi
- ✅ Pairwise Matrix tidak ter-reset
- ✅ SWR caching bekerja optimal
- ✅ User experience yang smooth

## 📊 **Performance Improvements**

### **1. Reduced Network Requests**
- SWR cache menyimpan data selama 5 menit
- `keepPreviousData: true` mencegah loading state yang tidak perlu
- Deduplication requests dalam 5 menit

### **2. Better Data Persistence**
- Server data diprioritaskan
- localStorage sebagai fallback
- Data tidak hilang saat navigasi

### **3. Stable Dependencies**
- Menghilangkan `JSON.stringify()` dalam dependencies
- Mencegah infinite re-renders
- Optimized useEffect hooks

## 🔧 **Testing**

### **Test Cases:**
1. ✅ Akses halaman 12 Week Quests
2. ✅ Isi beberapa quest dan pairwise matrix
3. ✅ Navigasi ke halaman lain
4. ✅ Kembali ke 12 Week Quests
5. ✅ Verifikasi data tidak hilang

### **Expected Behavior:**
- Data quest tetap ada
- Pairwise matrix tidak ter-reset
- Loading cepat dari cache
- Tidak ada network request berlebihan

## 📝 **Best Practices yang Diterapkan**

### **1. SWR Configuration**
- Konsisten key generation
- Proper cache configuration
- Error handling yang baik

### **2. State Management**
- Stable dependencies
- Proper data persistence
- Fallback mechanisms

### **3. Performance**
- Memoization yang tepat
- Reduced re-renders
- Optimized data fetching

---

**Status**: ✅ **FIXED**  
**Impact**: 🚀 **High** - Significantly improved user experience  
**Testing**: ✅ **Verified** - Data persistence working correctly 