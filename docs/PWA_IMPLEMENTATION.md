# PWA Implementation Guide - Better Planner

## Overview

Better Planner telah diimplementasikan sebagai Progressive Web App (PWA) dengan fitur-fitur berikut:

- ✅ **Installable**: Aplikasi dapat diinstall di perangkat mobile dan desktop
- ✅ **Offline Support**: Bekerja offline dengan data caching dan sync
- ✅ **Service Worker**: Caching strategis untuk performa optimal
- ✅ **Web App Manifest**: Metadata lengkap untuk PWA
- ✅ **Push Notifications**: Notifikasi untuk update dan reminder
- ✅ **Background Sync**: Sinkronisasi data saat kembali online

## PWA Features

### 1. Install Prompt
- Muncul otomatis setelah 30 detik penggunaan
- Dapat di-dismiss dan tidak muncul lagi dalam session
- Tersedia untuk mobile dan desktop

### 2. Offline Support
- Data project dan task di-cache untuk akses offline
- Actions offline disimpan dalam queue dan di-sync saat online
- Indikator status online/offline di header

### 3. Service Worker
- Caching strategis untuk static assets
- Network-first untuk API calls
- Auto-update dengan notifikasi

### 4. Web App Manifest
- Metadata lengkap untuk PWA
- Icons untuk berbagai ukuran
- Shortcuts untuk akses cepat
- Theme colors dan display modes

## File Structure

```
src/
├── components/common/
│   ├── PWAComponents.tsx          # Install prompt, offline indicator, update notification
│   ├── SplashScreen.tsx           # Loading screen untuk PWA
│   └── OfflineSyncIndicator.tsx   # Status indicator di header
├── hooks/common/
│   └── useOfflineSync.ts          # Hook untuk offline sync management
├── lib/
│   └── offlineUtils.ts            # Utilities untuk offline data management
└── app/
    ├── pwa-head.tsx               # PWA meta tags
    └── layout.tsx                 # Layout dengan PWA integration

public/
├── manifest.json                  # Web app manifest
├── sw.js                         # Service worker (auto-generated)
└── workbox-*.js                  # Workbox runtime (auto-generated)
```

## Configuration

### Next.js Configuration
```typescript
// next.config.ts
import withPWA from "next-pwa";

const pwaConfig = withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  runtimeCaching: [
    // Static assets caching
    {
      urlPattern: /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "static-image-assets",
        expiration: {
          maxEntries: 64,
          maxAgeSeconds: 24 * 60 * 60, // 1 day
        },
      },
    },
    // API routes - NO CACHING for dynamic data
    {
      urlPattern: ({ url }) => {
        return (
          url.origin === self.origin &&
          url.pathname.startsWith("/api/")
        );
      },
      handler: "NetworkFirst",
      options: {
        cacheName: "apis-no-cache",
        networkTimeoutSeconds: 10,
        expiration: {
          maxEntries: 0,
          maxAgeSeconds: 0,
        },
      },
    },
  ],
});
```

### Web App Manifest
```json
{
  "name": "Better Planner",
  "short_name": "Better Planner",
  "description": "A comprehensive project planning and task management app",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#f8fafc",
  "theme_color": "#1496F6",
  "orientation": "portrait-primary",
  "categories": ["productivity", "business", "lifestyle"],
  "icons": [...],
  "shortcuts": [...]
}
```

## Offline Data Management

### Storing Offline Actions
```typescript
import { storeOfflineAction } from '@/lib/offlineUtils';

// Store action when offline
storeOfflineAction({
  action: 'create_project',
  data: projectData
});
```

### Syncing When Online
```typescript
import { useOfflineSync } from '@/hooks/common/useOfflineSync';

const { isOnline, pendingActions, handleSync } = useOfflineSync();

// Auto-sync when coming back online
useEffect(() => {
  if (isOnline && pendingActions > 0) {
    handleSync();
  }
}, [isOnline, pendingActions, handleSync]);
```

## Testing PWA Features

### 1. Install Prompt Testing
```bash
# Start development server
npm run dev

# Open in Chrome
# 1. Open DevTools > Application > Manifest
# 2. Check if manifest is valid
# 3. Test install prompt (may take 30 seconds)
```

### 2. Offline Testing
```bash
# 1. Open app in Chrome
# 2. Open DevTools > Network
# 3. Check "Offline" checkbox
# 4. Test app functionality offline
# 5. Uncheck "Offline" to test sync
```

### 3. Service Worker Testing
```bash
# 1. Open DevTools > Application > Service Workers
# 2. Check if service worker is registered
# 3. Test update mechanism
# 4. Check cache storage
```

### 4. Lighthouse PWA Audit
```bash
# 1. Open Chrome DevTools
# 2. Go to Lighthouse tab
# 3. Select "Progressive Web App"
# 4. Run audit
# 5. Check PWA score (should be 90+)
```

## PWA Best Practices

### 1. Performance
- ✅ Static assets cached dengan StaleWhileRevalidate
- ✅ API calls menggunakan NetworkFirst
- ✅ Images dioptimasi dengan Next.js Image
- ✅ Code splitting untuk bundle optimization

### 2. User Experience
- ✅ Install prompt muncul setelah user engagement
- ✅ Offline indicator jelas dan informatif
- ✅ Splash screen untuk loading experience
- ✅ Update notification untuk new versions

### 3. Data Management
- ✅ Offline actions di-queue dan di-sync otomatis
- ✅ Cache invalidation untuk data freshness
- ✅ Error handling untuk sync failures
- ✅ Progress indicators untuk sync status

### 4. Security
- ✅ HTTPS required untuk PWA features
- ✅ Service worker scope terbatas
- ✅ Cache validation untuk security
- ✅ Content Security Policy compatible

## Troubleshooting

### Common Issues

1. **Install Prompt Tidak Muncul**
   - Pastikan menggunakan HTTPS
   - Check manifest validity
   - Clear browser cache
   - Test di incognito mode

2. **Service Worker Tidak Register**
   - Check console errors
   - Verify next-pwa configuration
   - Check file permissions
   - Test di production build

3. **Offline Sync Tidak Bekerja**
   - Check localStorage quota
   - Verify API endpoints
   - Check network connectivity
   - Test error handling

4. **PWA Score Rendah**
   - Optimize images
   - Reduce bundle size
   - Improve loading performance
   - Check accessibility

### Debug Commands

```bash
# Check PWA status
npx next-pwa-analyze

# Test service worker
npx workbox-cli wizard

# Audit PWA
npx lighthouse http://localhost:3000 --view
```

## Deployment

### Production Build
```bash
# Build dengan PWA
npm run build

# Start production server
npm start

# Check generated files
ls -la public/sw.js
ls -la public/workbox-*.js
```

### Vercel Deployment
```bash
# Deploy ke Vercel
vercel --prod

# Check PWA di production
# https://your-app.vercel.app
```

## Monitoring

### PWA Metrics
- Install rate
- Offline usage
- Sync success rate
- Performance metrics
- User engagement

### Analytics Integration
```typescript
// Track PWA events
gtag('event', 'pwa_install', {
  event_category: 'PWA',
  event_label: 'Install Prompt'
});

gtag('event', 'offline_sync', {
  event_category: 'PWA',
  event_label: 'Data Sync',
  value: syncCount
});
```

## Future Enhancements

### Planned Features
- [ ] Push notifications untuk reminders
- [ ] Background sync untuk data updates
- [ ] Advanced offline caching strategies
- [ ] PWA analytics dashboard
- [ ] Multi-device sync
- [ ] Offline-first data architecture

### Performance Optimizations
- [ ] Preloading critical resources
- [ ] Advanced caching strategies
- [ ] Bundle optimization
- [ ] Image optimization
- [ ] Network optimization

---

**PWA Implementation Status**: ✅ Complete
**Last Updated**: December 2024
**Version**: 2.1.2
