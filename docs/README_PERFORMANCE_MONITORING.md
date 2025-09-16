# 🚀 Performance Monitoring System - Better Planner

## 📋 **Overview**

Sistem monitoring performa yang komprehensif untuk Better Planner yang memungkinkan tracking kecepatan halaman, analisis cache SWR, dan optimasi performa secara real-time.

## 🎯 **Fitur Utama**

### **1. Real-time Performance Tracking**
- **Load Time Monitoring**: Mengukur waktu loading halaman secara akurat
- **Core Web Vitals**: FCP, LCP, FID, CLS tracking
- **Memory Usage**: Monitoring penggunaan memory JavaScript
- **Network Requests**: Tracking jumlah request dan efisiensi

### **2. SWR Cache Analysis**
- **Cache Hit Rate**: Mengukur efektivitas cache SWR
- **Cache Size**: Monitoring ukuran cache localStorage
- **Deduplication**: Tracking duplicate requests yang dicegah
- **Revalidation**: Monitoring background data updates

### **3. Performance Dashboard**
- **Visual Metrics**: Dashboard interaktif dengan grafik performa
- **Historical Data**: Analisis trend performa over time
- **Environment Comparison**: Bandingkan performa dev vs production
- **Page Comparison**: Analisis performa per halaman

### **4. Data Export & Analysis**
- **JSON Export**: Export data mentah untuk analisis mendalam
- **CSV Export**: Export untuk spreadsheet analysis
- **Performance Report**: Generate laporan otomatis
- **API Integration**: Simpan data ke server untuk analisis

## 🏗️ **Architecture**

### **Components Structure**
```
src/
├── components/common/
│   ├── PerformanceMonitor.tsx      # Main monitoring component
│   ├── PerformanceWrapper.tsx      # Wrapper for pages
│   └── PerformanceToggle.tsx       # Global toggle control
├── lib/
│   ├── performanceUtils.ts         # Core utilities
│   └── performanceAnalysis.ts      # Analysis functions
├── app/
│   ├── api/performance/            # API endpoints
│   └── (admin)/performance/        # Dashboard page
```

### **Data Flow**
```
Page Load → PerformanceWrapper → PerformanceMonitor → 
performanceUtils → localStorage + API → Dashboard Analysis
```

## 🔧 **Setup & Configuration**

### **1. Environment Variables**
```bash
# .env.local
NODE_ENV=development  # or production
```

### **2. Page Integration**
```tsx
// Wrap any page with PerformanceWrapper
import PerformanceWrapper from '@/components/common/PerformanceWrapper';

export default function MyPage() {
  return (
    <PerformanceWrapper 
      pageName="My Page" 
      autoSave={true} 
      autoSend={false}
    >
      {/* Your page content */}
    </PerformanceWrapper>
  );
}
```

### **3. Global Toggle**
```tsx
// Already integrated in layout.tsx
<PerformanceToggle />
```

## 📊 **Usage Guide**

### **1. Enable Performance Monitoring**
1. Klik tombol "Enable Performance Monitoring" di pojok kiri bawah
2. Pilih "Show Metrics" untuk melihat data real-time
3. Navigasi ke halaman yang ingin di-monitor

### **2. View Performance Dashboard**
1. Buka `/performance` di browser
2. Lihat summary metrics dan trends
3. Filter berdasarkan environment, page, atau time range
4. Export data untuk analisis lebih lanjut

### **3. Analyze Performance Data**
```typescript
import { getPerformanceMetrics, analyzePerformance } from '@/lib/performanceUtils';

// Get all metrics
const metrics = getPerformanceMetrics();

// Analyze performance
const analysis = analyzePerformance(metrics);
console.log(analysis.recommendations);
```

## 📈 **Metrics Tracked**

### **Core Performance Metrics**
- **Load Time**: Total waktu loading halaman (ms)
- **First Paint**: Waktu pertama konten ter-render
- **First Contentful Paint**: Waktu konten pertama muncul
- **Largest Contentful Paint**: Waktu elemen terbesar ter-render
- **First Input Delay**: Delay interaksi pertama
- **Cumulative Layout Shift**: Perubahan layout yang tidak diinginkan

### **SWR Cache Metrics**
- **Cache Hit Rate**: Persentase data yang diambil dari cache
- **Cache Size**: Jumlah item dalam cache
- **Deduplication**: Request yang dicegah karena duplikasi
- **Revalidation**: Background updates yang dilakukan

### **System Metrics**
- **Memory Usage**: Penggunaan memory JavaScript (MB)
- **Network Requests**: Jumlah HTTP requests
- **Environment**: Development vs Production
- **User Agent**: Browser dan device info

## 🎛️ **Configuration Options**

### **PerformanceWrapper Props**
```typescript
interface PerformanceWrapperProps {
  pageName: string;           // Nama halaman untuk tracking
  showMetrics?: boolean;      // Tampilkan metrics real-time
  autoSave?: boolean;         // Simpan otomatis ke localStorage
  autoSend?: boolean;         // Kirim otomatis ke server
}
```

### **PerformanceMonitor Props**
```typescript
interface PerformanceMonitorProps {
  pageName: string;
  showMetrics?: boolean;      // Tampilkan panel metrics
  autoSave?: boolean;         // Auto-save ke localStorage
  autoSend?: boolean;         // Auto-send ke server
}
```

## 📁 **Data Storage**

### **Local Storage**
```javascript
// Data tersimpan di localStorage dengan key:
'better-planner-performance'     // Array of PerformanceMetrics
'better-planner-performance-enabled'  // Boolean
'better-planner-performance-show'     // Boolean
'swr-cache'                      // SWR cache data
```

### **Server Storage**
```bash
# Data tersimpan di server dalam format:
data/performance/
├── performance-development-2024-01-15.json
├── performance-production-2024-01-15.json
└── performance-combined.json
```

## 🔍 **API Endpoints**

### **POST /api/performance**
```typescript
// Save performance metrics
POST /api/performance
Content-Type: application/json

{
  "pageName": "Dashboard",
  "loadTime": 1250,
  "cacheHitRate": 0.85,
  "networkRequests": 12,
  "swrCacheSize": 45,
  "memoryUsage": 25.6,
  "timestamp": "2024-01-15T10:30:00Z",
  "environment": "production"
}
```

### **GET /api/performance**
```typescript
// Get performance metrics
GET /api/performance?environment=production&date=2024-01-15&limit=100

// Response
{
  "data": [...],
  "summary": {
    "totalEntries": 50,
    "averageLoadTime": 1200,
    "averageCacheHitRate": 0.85,
    "averageNetworkRequests": 12
  }
}
```

### **DELETE /api/performance**
```typescript
// Clear performance data
DELETE /api/performance?environment=all&date=2024-01-15
```

## 📊 **Performance Analysis**

### **Automatic Analysis**
```typescript
import { analyzePerformance } from '@/lib/performanceAnalysis';

const analysis = analyzePerformance(metrics);

// Analysis includes:
// - Summary statistics
// - Performance trends
// - Recommendations
// - Alerts and warnings
```

### **Performance Grades**
- **A**: Load time < 1000ms (Excellent)
- **B**: Load time 1000-2000ms (Good)
- **C**: Load time 2000-3000ms (Needs improvement)
- **D**: Load time > 3000ms (Poor)

### **Recommendations Engine**
- Cache optimization suggestions
- Network request reduction tips
- Memory usage optimization
- Page-specific performance improvements

## 🚀 **Best Practices**

### **1. Development**
- Enable monitoring di development untuk testing
- Use `autoSave={true}` untuk local analysis
- Monitor cache hit rates untuk SWR optimization

### **2. Production**
- Use `autoSend={true}` untuk server-side analysis
- Monitor Core Web Vitals untuk SEO
- Set up alerts untuk performance degradation

### **3. Analysis**
- Export data regularly untuk trend analysis
- Compare development vs production metrics
- Focus on slowest pages first

## 🔧 **Troubleshooting**

### **Common Issues**

#### **1. Metrics Not Showing**
```bash
# Check if monitoring is enabled
localStorage.getItem('better-planner-performance-enabled')

# Check browser console for errors
# Ensure PerformanceWrapper is properly imported
```

#### **2. Data Not Saving**
```bash
# Check localStorage quota
# Ensure autoSave is enabled
# Check for JavaScript errors
```

#### **3. API Errors**
```bash
# Check server logs
# Ensure data/performance directory exists
# Check file permissions
```

### **Debug Mode**
```typescript
// Enable debug logging
localStorage.setItem('better-planner-debug', 'true');

// Check performance data
console.log(getPerformanceMetrics());
```

## 📈 **Performance Targets**

### **Recommended Metrics**
- **Load Time**: < 2000ms
- **Cache Hit Rate**: > 70%
- **Network Requests**: < 20
- **Memory Usage**: < 50MB
- **FCP**: < 1500ms
- **LCP**: < 2500ms
- **FID**: < 100ms
- **CLS**: < 0.1

### **Monitoring Alerts**
- Load time > 3000ms (Warning)
- Cache hit rate < 50% (Warning)
- Network requests > 30 (Info)
- Memory usage > 100MB (Warning)

## 🎯 **Next Steps**

### **Planned Features**
1. **Real-time Alerts**: Push notifications untuk performance issues
2. **A/B Testing**: Compare performance between versions
3. **User Journey Tracking**: Track performance across user flows
4. **Automated Reports**: Email reports dengan insights
5. **Performance Budgets**: Set dan monitor performance budgets

### **Integration Ideas**
1. **Sentry Integration**: Error tracking dengan performance data
2. **Google Analytics**: Combine dengan GA4 metrics
3. **Lighthouse CI**: Automated performance testing
4. **CDN Integration**: Monitor CDN performance impact

---

**Status**: ✅ **Production Ready**  
**Version**: 1.0.0  
**Last Updated**: January 2024  
**Maintainer**: Better Planner Team
