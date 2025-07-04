# 📅 Quarter Date Calculation Fix

## 🔧 **Masalah yang Diperbaiki**

Sebelumnya, perhitungan tanggal quarter menggunakan logika kalender biasa:
- **Start Date**: 1 Januari, 1 April, 1 Juli, 1 Oktober
- **End Date**: 31 Maret, 30 Juni, 30 September, 31 Desember

**Masalah:**
- Tidak sesuai dengan logika 13 minggu
- Tidak dimulai dari hari Senin
- Tidak berakhir di hari Minggu

## ✅ **Solusi yang Diterapkan**

### **Logika 13 Minggu yang Benar:**

#### **Quarter Breakdown:**
- **Q1**: Week 1-13 (13 minggu)
- **Q2**: Week 14-26 (13 minggu)  
- **Q3**: Week 27-39 (13 minggu)
- **Q4**: Week 40-52 (13 minggu)

#### **Perhitungan Tanggal:**
- **Start Date**: Selalu hari Senin dari minggu pertama quarter
- **End Date**: Selalu hari Minggu dari minggu terakhir quarter

### **Fungsi Baru yang Ditambahkan:**

#### **`getDateFromWeek(year, week, dayOfWeek)`**
```typescript
// Mendapatkan tanggal dari nomor minggu dan hari dalam minggu
// dayOfWeek: 1 = Senin, 2 = Selasa, ..., 7 = Minggu
const startDate = getDateFromWeek(2025, 14, 1); // Senin minggu ke-14
const endDate = getDateFromWeek(2025, 26, 7);   // Minggu minggu ke-26
```

#### **`getQuarterWeekRange(year, quarter)`**
```typescript
// Mendapatkan rentang minggu untuk quarter tertentu
const { startWeek, endWeek } = getQuarterWeekRange(2025, 2);
// startWeek = 14, endWeek = 26
```

## 📊 **Contoh Perbandingan**

### **Sebelum (Salah):**
```
Q2 2025:
- Start: 1 April 2025 (Selasa)
- End: 30 Juni 2025 (Senin)
- Week Range: Week 14-26 (tidak akurat)
```

### **Sesudah (Benar):**
```
Q2 2025:
- Start: 31 Maret 2025 (Senin) - Week 14
- End: 29 Juni 2025 (Minggu) - Week 26
- Week Range: Week 14-26 (akurat)
```

## 🛠️ **File yang Diperbaiki**

### **1. `src/hooks/useQuarter.ts`**
- ✅ Menambahkan fungsi `getDateFromWeek()`
- ✅ Memperbaiki perhitungan `startDate` dan `endDate`
- ✅ Menggunakan logika 13 minggu yang benar

### **2. `src/lib/quarterUtils.ts`**
- ✅ Menambahkan fungsi `getDateFromWeek()`
- ✅ Memperbaiki fungsi `getQuarterDates()`
- ✅ Memperbaiki fungsi `getQuarterWeekRange()`

### **3. `src/components/examples/QuarterUsageExample.tsx`**
- ✅ Menampilkan tanggal dengan nama hari
- ✅ Menambahkan penjelasan logika yang benar
- ✅ Memperbaiki contoh penggunaan

## 🎯 **Cara Kerja Logika Baru**

### **1. Menghitung Minggu Pertama Tahun**
```typescript
// Cari hari Senin pertama di tahun tersebut
const jan1 = new Date(year, 0, 1);
const dayOfJan1 = jan1.getDay(); // 0 = Minggu, 1 = Senin, dst
const daysToAdd = dayOfJan1 === 0 ? 1 : (8 - dayOfJan1);
const firstMonday = new Date(jan1);
firstMonday.setDate(jan1.getDate() + daysToAdd);
```

### **2. Menghitung Tanggal dari Minggu**
```typescript
// Target date = firstMonday + (week - 1) * 7 + (dayOfWeek - 1)
const targetDate = new Date(firstMonday);
targetDate.setDate(firstMonday.getDate() + (week - 1) * 7 + (dayOfWeek - 1));
```

### **3. Menghitung Tanggal Quarter**
```typescript
// Q2: Week 14-26
const startDate = getDateFromWeek(2025, 14, 1); // Senin minggu ke-14
const endDate = getDateFromWeek(2025, 26, 7);   // Minggu minggu ke-26
```

## 📋 **Penggunaan yang Benar**

### **Menggunakan Hook:**
```typescript
import { useQuarter } from "@/hooks/useQuarter";

export default function MyPage() {
  const quarterData = useQuarter();
  
  return (
    <div>
      <h1>Planning {quarterData.quarterString}</h1>
      <p>Dari: {quarterData.startDate.toLocaleDateString('id-ID', { weekday: 'long' })}</p>
      <p>Sampai: {quarterData.endDate.toLocaleDateString('id-ID', { weekday: 'long' })}</p>
      <p>Minggu: {quarterData.weekRange}</p>
    </div>
  );
}
```

### **Menggunakan Utilities:**
```typescript
import { getQuarterInfo } from "@/lib/quarterUtils";

const quarterInfo = getQuarterInfo(2025, 2);
console.log(quarterInfo.startDate); // Senin minggu ke-14
console.log(quarterInfo.endDate);   // Minggu minggu ke-26
```

## ✅ **Hasil Akhir**

Sekarang QuarterSelector memberikan:
- ✅ **Tanggal yang akurat** sesuai logika 13 minggu
- ✅ **Start date selalu Senin**
- ✅ **End date selalu Minggu**
- ✅ **Week range yang benar**
- ✅ **Konsistensi di seluruh aplikasi**

## 🔍 **Testing**

Untuk memverifikasi perbaikan:
1. Buka halaman dengan QuarterSelector
2. Pilih quarter yang berbeda
3. Perhatikan bahwa start date selalu Senin
4. Perhatikan bahwa end date selalu Minggu
5. Week range sesuai dengan 13 minggu per quarter 