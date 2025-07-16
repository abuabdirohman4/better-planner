# 🔧 Main Quests Fix - Show Only Top 3 Committed Quests

## 🎯 **Masalah yang Diperbaiki**

Halaman "Main Quests" menampilkan 10 quest padahal seharusnya hanya menampilkan 3 quest teratas yang sudah di-commit berdasarkan priority score.

## 🔍 **Analisis Masalah**

### **1. Wrong Hook Usage**
```typescript
// ❌ PROBLEMATIC CODE
const { quests, isLoading } = useQuests(year, quarter);
```
- `useQuests` hook memanggil `getAllQuestsForQuarter` yang mengambil SEMUA quest
- Termasuk quest yang belum committed (is_committed = false)
- Tidak ada limit untuk jumlah quest yang ditampilkan

### **2. Server Action Confusion**
Ada dua fungsi yang berbeda di `actions.ts`:
- `getAllQuestsForQuarter()` - Mengambil semua quest (committed + uncommitted)
- `getQuests(year, quarter, isCommitted = true)` - Mengambil hanya 3 quest teratas yang committed

### **3. Missing SWR Key**
Tidak ada key generator untuk main quests di `swr.ts`

## ✅ **Solusi yang Diterapkan**

### **1. Added Main Quests Key Generator**
```typescript
// ✅ FIXED: Added mainQuests key generator
export const questKeys = {
  all: ['quests'] as const,
  lists: () => [...questKeys.all, 'list'] as const,
  list: (year: number, quarter: number) => [...questKeys.lists(), year, quarter] as const,
  mainQuests: (year: number, quarter: number) => [...questKeys.all, 'main-quests', year, quarter] as const,
  details: () => [...questKeys.all, 'detail'] as const,
  detail: (id: string) => [...questKeys.details(), id] as const,
};
```

### **2. Created useMainQuests Hook**
```typescript
// ✅ FIXED: New hook for committed quests only
export function useMainQuests(year: number, quarter: number) {
  const { 
    data: quests = [], 
    error, 
    isLoading,
    mutate 
  } = useSWR(
    questKeys.mainQuests(year, quarter),
    () => getQuests(year, quarter, true), // isCommitted = true
    {
      revalidateOnFocus: false,
      dedupingInterval: 5 * 60 * 1000, // 5 minutes
      errorRetryCount: 3,
      keepPreviousData: true,
    }
  );

  return {
    quests,
    error,
    isLoading,
    mutate,
  };
}
```

### **3. Updated MainQuestsClient Component**
```typescript
// ✅ FIXED: Use correct hook for main quests
export default function MainQuestsClient() {
  const { year, quarter } = useQuarter();
  const { quests, isLoading } = useMainQuests(year, quarter); // ✅ Use useMainQuests instead of useQuests
  const [activeTab, setActiveTab] = useState(0);

  // ... rest of component
}
```

### **4. Server Action Logic**
```typescript
// ✅ CORRECT: getQuests function with proper filtering
export async function getQuests(year: number, quarter: number, isCommitted: boolean = true) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from('quests')
    .select('id, title, motivation')
    .eq('user_id', user.id)
    .eq('year', year)
    .eq('quarter', quarter)
    .eq('is_committed', isCommitted) // ✅ Filter by committed status
    .order('priority_score', { ascending: false }) // ✅ Order by priority score
    .limit(3); // ✅ Limit to top 3
  if (error) return [];
  return data;
}
```

## 🚀 **Hasil Perbaikan**

### **Sebelum Perbaikan:**
- ❌ Menampilkan 10 quest (semua quest)
- ❌ Termasuk quest yang belum committed
- ❌ Tidak ada limit jumlah
- ❌ Tidak sesuai dengan business logic

### **Setelah Perbaikan:**
- ✅ Hanya menampilkan 3 quest teratas
- ✅ Hanya quest yang sudah committed (is_committed = true)
- ✅ Diurutkan berdasarkan priority_score (descending)
- ✅ Sesuai dengan business logic Main Quests

## 📊 **Business Logic**

### **Main Quests Requirements:**
1. **Top 3 Only** - Hanya 3 quest teratas yang ditampilkan
2. **Committed Status** - Hanya quest yang sudah di-commit
3. **Priority Order** - Diurutkan berdasarkan priority_score tertinggi
4. **Tab Navigation** - Setiap quest memiliki tab sendiri

### **Data Flow:**
1. User membuat quest di "12 Week Quests"
2. User melakukan pairwise comparison
3. User commit 3 quest teratas
4. 3 quest teratas muncul di "Main Quests"
5. User dapat mengelola milestones dan tasks untuk setiap quest

## 🔧 **Testing**

### **Test Cases:**
1. ✅ Akses halaman Main Quests
2. ✅ Verifikasi hanya 3 quest yang ditampilkan
3. ✅ Verifikasi quest yang ditampilkan sudah committed
4. ✅ Verifikasi urutan berdasarkan priority score
5. ✅ Test tab navigation antar quest

### **Expected Behavior:**
- Maksimal 3 quest ditampilkan
- Hanya quest dengan is_committed = true
- Urutan berdasarkan priority_score tertinggi
- Tab navigation berfungsi dengan baik

## 📝 **Hook Comparison**

### **useQuests Hook:**
```typescript
// Untuk 12 Week Quests - semua quest (committed + uncommitted)
export function useQuests(year: number, quarter: number) {
  // Calls getAllQuestsForQuarter()
  // Returns all quests without limit
}
```

### **useMainQuests Hook:**
```typescript
// Untuk Main Quests - hanya 3 quest teratas yang committed
export function useMainQuests(year: number, quarter: number) {
  // Calls getQuests(year, quarter, true)
  // Returns only committed quests with limit 3
}
```

## 🎯 **Key Differences**

| Aspect | useQuests | useMainQuests |
|--------|-----------|---------------|
| **Data Source** | `getAllQuestsForQuarter()` | `getQuests(year, quarter, true)` |
| **Filter** | All quests | Only committed quests |
| **Limit** | No limit | Limit 3 |
| **Order** | By label | By priority_score |
| **Usage** | 12 Week Quests page | Main Quests page |

---

**Status**: ✅ **FIXED**  
**Impact**: 🎯 **High** - Correct business logic implementation  
**Testing**: ✅ **Verified** - Only top 3 committed quests displayed 