# 🎯 QuarterSelector Usage Guide

## 📋 **Daftar Isi**
1. [Cara Paling Mudah](#cara-paling-mudah)
2. [Menggunakan Hook useQuarter](#menggunakan-hook-usequarter)
3. [Menggunakan Utility Functions](#menggunakan-utility-functions)
4. [Contoh Implementasi](#contoh-implementasi)
5. [Customization](#customization)

---

## 🚀 **Cara Paling Mudah**

### **A. QuarterSelector Otomatis di Header**
`QuarterSelector` sudah terintegrasi di `AppHeader` dan akan otomatis muncul di halaman yang relevan.

**Yang perlu Anda lakukan:**
1. Pastikan halaman Anda **TIDAK** ada di daftar hidden paths
2. QuarterSelector akan otomatis muncul di header
3. User bisa mengubah quarter melalui UI di header

### **B. Menambahkan Halaman ke Daftar "Tidak Hidden"**

Jika halaman Anda saat ini disembunyikan, edit file `src/components/common/QuarterSelector.tsx`:

```typescript
// Helper: check if QuarterSelector should be hidden based on current pathname
function shouldHideQuarterSelector(pathname: string): boolean {
  const hiddenPaths = [
    '/planning/vision',
    '/settings',
    '/profile',
    // Hapus atau comment out path halaman Anda jika ingin QuarterSelector muncul
    // '/your-page-path',
  ];
  
  return hiddenPaths.some(path => pathname.startsWith(path));
}
```

---

## 🎣 **Menggunakan Hook useQuarter**

### **Import Hook**
```typescript
import { useQuarter } from "@/hooks/useQuarter";
```

### **Penggunaan Dasar**
```typescript
"use client";
import { useQuarter } from "@/hooks/useQuarter";

export default function MyPage() {
  const quarterData = useQuarter();
  
  return (
    <div>
      <h1>Planning untuk {quarterData.quarterString}</h1>
      <p>Rentang minggu: {quarterData.weekRange}</p>
      <p>Tanggal mulai: {quarterData.startDate.toLocaleDateString()}</p>
      <p>Tanggal selesai: {quarterData.endDate.toLocaleDateString()}</p>
      {quarterData.isCurrentQuarter && (
        <p className="text-green-600">Ini adalah quarter saat ini!</p>
      )}
    </div>
  );
}
```

### **Data yang Tersedia**
```typescript
interface QuarterData {
  year: number;           // 2025
  quarter: number;        // 2
  quarterString: string;  // "Q2 2025"
  startDate: Date;        // 2025-04-01
  endDate: Date;          // 2025-06-30
  isCurrentQuarter: boolean; // true/false
  weekRange: string;      // "Week 14-26"
}
```

---

## 🛠️ **Menggunakan Utility Functions**

### **Import Utilities**
```typescript
import { 
  parseQParam, 
  formatQParam, 
  getQuarterInfo,
  getQuarterDates,
  isCurrentQuarter 
} from "@/lib/quarterUtils";
```

### **Contoh Penggunaan**

#### **1. Parse Quarter dari URL**
```typescript
const { year, quarter } = parseQParam("2025-Q2");
console.log(year);   // 2025
console.log(quarter); // 2
```

#### **2. Format Quarter ke URL**
```typescript
const quarterParam = formatQParam(2025, 2);
console.log(quarterParam); // "2025-Q2"
```

#### **3. Dapatkan Info Lengkap Quarter**
```typescript
const quarterInfo = getQuarterInfo(2025, 2);
console.log(quarterInfo);
// {
//   year: 2025,
//   quarter: 2,
//   quarterString: "Q2 2025",
//   startDate: Date,
//   endDate: Date,
//   weekRange: "Week 14-26",
//   isCurrentQuarter: false
// }
```

#### **4. Cek Quarter Saat Ini**
```typescript
const isCurrent = isCurrentQuarter(2025, 2);
console.log(isCurrent); // true/false
```

---

## 📝 **Contoh Implementasi**

### **Contoh 1: Halaman Planning dengan Quarter Filter**
```typescript
"use client";
import { useQuarter } from "@/hooks/useQuarter";
import { getQuarterInfo } from "@/lib/quarterUtils";

export default function PlanningPage() {
  const quarterData = useQuarter();
  
  // Fetch data berdasarkan quarter
  const fetchPlanningData = async () => {
    const response = await fetch(`/api/planning?quarter=${quarterData.quarter}&year=${quarterData.year}`);
    return response.json();
  };
  
  return (
    <div className="p-6">
      <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <h1 className="text-2xl font-bold text-blue-900 dark:text-blue-100">
          Planning {quarterData.quarterString}
        </h1>
        <p className="text-blue-700 dark:text-blue-300">
          {quarterData.weekRange} • {quarterData.startDate.toLocaleDateString()} - {quarterData.endDate.toLocaleDateString()}
        </p>
      </div>
      
      {/* Konten planning Anda di sini */}
    </div>
  );
}
```

### **Contoh 2: Component dengan Quarter Navigation**
```typescript
"use client";
import { useQuarter } from "@/hooks/useQuarter";
import { getPrevQuarter, getNextQuarter, formatQParam } from "@/lib/quarterUtils";
import { useRouter, useSearchParams } from "next/navigation";

export default function QuarterNavigation() {
  const quarterData = useQuarter();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const navigateToQuarter = (year: number, quarter: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("q", formatQParam(year, quarter));
    router.push(`?${params.toString()}`);
  };
  
  const goToPrevQuarter = () => {
    const prev = getPrevQuarter(quarterData.year, quarterData.quarter);
    navigateToQuarter(prev.year, prev.quarter);
  };
  
  const goToNextQuarter = () => {
    const next = getNextQuarter(quarterData.year, quarterData.quarter);
    navigateToQuarter(next.year, next.quarter);
  };
  
  return (
    <div className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
      <button 
        onClick={goToPrevQuarter}
        className="px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
      >
        ← Sebelumnya
      </button>
      
      <div className="text-center">
        <h2 className="text-xl font-bold">{quarterData.quarterString}</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {quarterData.weekRange}
        </p>
      </div>
      
      <button 
        onClick={goToNextQuarter}
        className="px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
      >
        Berikutnya →
      </button>
    </div>
  );
}
```

### **Contoh 3: Server Component dengan Quarter Data**
```typescript
import { parseQParam } from "@/lib/quarterUtils";

interface PageProps {
  searchParams: { q?: string };
}

export default function ServerPage({ searchParams }: PageProps) {
  const { year, quarter } = parseQParam(searchParams.q || null);
  const quarterInfo = getQuarterInfo(year, quarter);
  
  return (
    <div>
      <h1>Server-side Quarter: {quarterInfo.quarterString}</h1>
      <p>Week Range: {quarterInfo.weekRange}</p>
    </div>
  );
}
```

---

## 🎨 **Customization**

### **A. Menambahkan QuarterSelector Manual**
Jika Anda ingin QuarterSelector di tempat lain (bukan di header):

```typescript
import QuarterSelector from "@/components/common/QuarterSelector";

export default function MyPage() {
  return (
    <div>
      <div className="mb-4">
        <QuarterSelector />
      </div>
      {/* Konten halaman Anda */}
    </div>
  );
}
```

### **B. Custom Quarter Display**
```typescript
import { useQuarter } from "@/hooks/useQuarter";

export default function CustomQuarterDisplay() {
  const quarterData = useQuarter();
  
  return (
    <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg">
      <span className="text-2xl font-bold">{quarterData.quarter}</span>
      <div className="text-left">
        <div className="text-sm opacity-90">Quarter</div>
        <div className="font-semibold">{quarterData.year}</div>
      </div>
    </div>
  );
}
```

### **C. Quarter-based Conditional Rendering**
```typescript
import { useQuarter } from "@/hooks/useQuarter";

export default function ConditionalContent() {
  const quarterData = useQuarter();
  
  return (
    <div>
      {quarterData.isCurrentQuarter ? (
        <div className="bg-green-100 dark:bg-green-900/20 p-4 rounded">
          <h3>Quarter Saat Ini</h3>
          <p>Ini adalah quarter yang sedang berjalan.</p>
        </div>
      ) : (
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded">
          <h3>Quarter Lain</h3>
          <p>Ini adalah quarter yang sudah lewat atau akan datang.</p>
        </div>
      )}
    </div>
  );
}
```

---

## 🔧 **Troubleshooting**

### **QuarterSelector Tidak Muncul**
1. Cek apakah path halaman Anda ada di `hiddenPaths`
2. Pastikan halaman menggunakan layout yang include `AppHeader`
3. Cek console untuk error

### **Quarter Data Tidak Update**
1. Pastikan menggunakan `"use client"` directive
2. Cek apakah URL parameter `q` berubah
3. Pastikan tidak ada caching issue

### **TypeScript Errors**
1. Pastikan semua imports benar
2. Cek apakah interface `QuarterData` ter-import
3. Jalankan `npx tsc --noEmit` untuk cek errors

---

## 📚 **Referensi File**

- **Component**: `src/components/common/QuarterSelector.tsx`
- **Hook**: `src/hooks/useQuarter.ts`
- **Utilities**: `src/lib/quarterUtils.ts`
- **Example**: `src/components/examples/QuarterUsageExample.tsx`
- **Header Integration**: `src/layout/AppHeader.tsx` 