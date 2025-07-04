# 🔧 QuarterSelector Refactoring - DRY Implementation

## 🎯 **Tujuan Refactoring**

Menghilangkan duplikasi kode (DRY - Don't Repeat Yourself) dengan memindahkan semua logic quarter ke `quarterUtils.ts` dan menggunakan fungsi-fungsi tersebut di `QuarterSelector.tsx`.

## 📊 **Sebelum Refactoring (DRY Violation)**

### **Duplikasi Kode di `QuarterSelector.tsx`:**
```typescript
// ❌ Duplikasi - sama dengan quarterUtils.ts
function getWeekOfYear(date: Date) { ... }
function parseQParam(q: string | null) { ... }
function formatQParam(year: number, quarter: number) { ... }
function getPrevQuarter(year: number, quarter: number) { ... }
function getNextQuarter(year: number, quarter: number) { ... }
```

### **Masalah:**
- ❌ **Code Duplication**: Logic yang sama ada di 2 tempat
- ❌ **Maintenance Burden**: Perubahan harus dilakukan di 2 tempat
- ❌ **Inconsistency Risk**: Logic bisa berbeda antara file
- ❌ **Testing Overhead**: Harus test logic yang sama di 2 tempat

## ✅ **Sesudah Refactoring (DRY Compliant)**

### **Import dari `quarterUtils.ts`:**
```typescript
import { 
  parseQParam, 
  formatQParam, 
  getPrevQuarter, 
  getNextQuarter,
  getQuarterString 
} from "@/lib/quarterUtils";
```

### **Keuntungan:**
- ✅ **Single Source of Truth**: Logic hanya ada di `quarterUtils.ts`
- ✅ **Easy Maintenance**: Perubahan hanya di 1 tempat
- ✅ **Consistency**: Logic selalu sama di seluruh aplikasi
- ✅ **Better Testing**: Test logic di 1 tempat saja

## 🛠️ **Perubahan yang Dilakukan**

### **1. Menghapus Duplikasi di `QuarterSelector.tsx`**

#### **Dihapus:**
```typescript
// ❌ Dihapus - duplikasi
function getWeekOfYear(date: Date) { ... }
function parseQParam(q: string | null) { ... }
function formatQParam(year: number, quarter: number) { ... }
function getPrevQuarter(year: number, quarter: number) { ... }
function getNextQuarter(year: number, quarter: number) { ... }
```

#### **Ditambahkan:**
```typescript
// ✅ Ditambahkan - import dari quarterUtils
import { 
  parseQParam, 
  formatQParam, 
  getPrevQuarter, 
  getNextQuarter,
  getQuarterString 
} from "@/lib/quarterUtils";
```

### **2. Menggunakan Fungsi dari `quarterUtils.ts`**

#### **Sebelum:**
```typescript
// ❌ Manual string formatting
<span>{`Q${quarter} ${year}`}</span>
{`Q${opt.quarter} ${opt.year}`}
```

#### **Sesudah:**
```typescript
// ✅ Menggunakan fungsi dari utils
<span>{getQuarterString(year, quarter)}</span>
{getQuarterString(opt.year, opt.quarter)}
```

## 📁 **Struktur File Setelah Refactoring**

### **`src/lib/quarterUtils.ts` - Single Source of Truth**
```typescript
// ✅ Semua logic quarter ada di sini
export function getWeekOfYear(date: Date): number { ... }
export function parseQParam(q: string | null) { ... }
export function formatQParam(year: number, quarter: number) { ... }
export function getPrevQuarter(year: number, quarter: number) { ... }
export function getNextQuarter(year: number, quarter: number) { ... }
export function getQuarterString(year: number, quarter: number) { ... }
export function getQuarterInfo(year: number, quarter: number) { ... }
```

### **`src/components/common/QuarterSelector.tsx` - UI Only**
```typescript
// ✅ Hanya UI logic, semua business logic dari utils
import { parseQParam, formatQParam, ... } from "@/lib/quarterUtils";

const QuarterSelector: React.FC = () => {
  // UI logic only
  const [isOpen, setIsOpen] = useState(false);
  const handleDropdownToggle = () => { ... };
  
  // Business logic dari utils
  const { year, quarter } = parseQParam(qParam);
  const prev = getPrevQuarter(year, quarter);
  const next = getNextQuarter(year, quarter);
};
```

### **`src/hooks/useQuarter.ts` - Hook yang Menggunakan Utils**
```typescript
// ✅ Hook juga menggunakan utils
import { parseQParam, getQuarterInfo } from "@/lib/quarterUtils";

export function useQuarter(): QuarterData {
  const { year, quarter } = parseQParam(qParam);
  return getQuarterInfo(year, quarter);
}
```

## 🎯 **Arsitektur Setelah Refactoring**

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   QuarterSelector │    │   quarterUtils.ts │    │   useQuarter.ts  │
│   (UI Component) │    │   (Business Logic)│    │   (Hook)        │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       ▲                       │
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────┴─────────────┐
                    │    Single Source of Truth │
                    │    All Quarter Logic      │
                    └───────────────────────────┘
```

## ✅ **Keuntungan Refactoring**

### **1. Maintainability**
- Perubahan logic hanya di 1 tempat
- Bug fix otomatis berlaku di semua komponen
- Testing lebih mudah dan terpusat

### **2. Consistency**
- Logic quarter selalu sama di seluruh aplikasi
- Tidak ada risiko inkonsistensi antara komponen

### **3. Reusability**
- Fungsi utils bisa digunakan di komponen lain
- Mudah untuk menambah fitur baru

### **4. Performance**
- Logic tidak di-duplicate di setiap komponen
- Bundle size lebih kecil

### **5. Developer Experience**
- Code lebih mudah dibaca dan dipahami
- IDE autocomplete lebih baik
- TypeScript support lebih baik

## 🔍 **Testing Setelah Refactoring**

### **Unit Testing Utils:**
```typescript
// Test logic di quarterUtils.ts
describe('quarterUtils', () => {
  test('parseQParam should work correctly', () => {
    expect(parseQParam('2025-Q2')).toEqual({ year: 2025, quarter: 2 });
  });
  
  test('getQuarterString should format correctly', () => {
    expect(getQuarterString(2025, 2)).toBe('Q2 2025');
  });
});
```

### **Component Testing:**
```typescript
// Test UI logic di QuarterSelector
describe('QuarterSelector', () => {
  test('should render quarter string correctly', () => {
    render(<QuarterSelector />);
    expect(screen.getByText('Q2 2025')).toBeInTheDocument();
  });
});
```

## 📋 **Best Practices yang Diterapkan**

1. **Single Responsibility Principle**: Setiap file punya tanggung jawab yang jelas
2. **DRY Principle**: Tidak ada duplikasi kode
3. **Separation of Concerns**: UI logic terpisah dari business logic
4. **Dependency Injection**: Komponen menggunakan dependency dari luar
5. **Type Safety**: Full TypeScript support dengan proper imports

## 🚀 **Hasil Akhir**

Setelah refactoring:
- ✅ **Code lebih clean** dan mudah di-maintain
- ✅ **Logic terpusat** di `quarterUtils.ts`
- ✅ **Tidak ada duplikasi** kode
- ✅ **Testing lebih mudah** dan terpusat
- ✅ **Performance lebih baik** (bundle size lebih kecil)
- ✅ **Developer experience** lebih baik 