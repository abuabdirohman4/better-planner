# 📱 PWA Implementation Guide - Better Planner

## 🎯 **Overview**

Better Planner telah diimplementasikan sebagai **Progressive Web App (PWA)** dengan fitur-fitur lengkap untuk mobile dan desktop experience.

## 🚀 **Quick Start**

### **Development Mode (No PWA)**
```bash
npm run dev
# PWA disabled to avoid GenerateSW warnings
```

### **Production Mode (Full PWA)**
```bash
# Build and test PWA
npm run pwa:build

# Start production server
npm run pwa:prod

# Test PWA features
npm run pwa:test
```

## 🔧 **PWA Configuration**

### **next.config.ts**
```typescript
const pwaConfig = withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development", // Disable in dev to avoid warnings
  buildExcludes: [/middleware-manifest\.json$/],
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

## 📱 **PWA Features**

### **1. Install Prompt**
- **Custom install banner** dengan UX yang baik
- **Platform-specific instructions** (iOS/Android)
- **Fallback handling** jika `beforeinstallprompt` tidak tersedia

### **2. Offline Support**
- **Service Worker** dengan smart caching
- **Offline indicator** untuk status koneksi
- **Data persistence** dengan localStorage

### **3. Web App Manifest**
- **App metadata** lengkap
- **Icons** multiple sizes
- **Display mode** standalone
- **Theme colors** dan background

### **4. Update Management**
- **Auto-update** service worker
- **Update prompt** untuk user
- **Version management**

## 🛠️ **PWA Components**

### **PWAComponents.tsx**
```typescript
// Main PWA component dengan:
- Install prompt handling
- Offline/online detection
- Service worker update management
- Platform-specific instructions
```

### **PWAInstallGuide.tsx**
```typescript
// Custom install guide dengan:
- iOS/Android specific instructions
- Visual step-by-step guide
- App benefits explanation
```

### **DevelopmentPWAManager.tsx**
```typescript
// Development PWA management:
- Manual service worker registration
- PWA testing controls
- Debug information
```

## 📊 **Testing PWA**

### **Manual Testing Checklist**
- [ ] **Install Prompt**: Muncul di mobile browser
- [ ] **Offline Mode**: App berfungsi tanpa internet
- [ ] **Service Worker**: Terdaftar dan aktif
- [ ] **Manifest**: Valid dan dapat diakses
- [ ] **Icons**: Tampil dengan benar
- [ ] **App Shortcuts**: Berfungsi di home screen

### **Automated Testing**
```bash
# Test PWA build
npm run pwa:build

# Test production PWA
npm run pwa:test

# Run Lighthouse audit
npx lighthouse http://localhost:3000 --view
```

## 🐛 **Troubleshooting**

### **Common Issues**

#### **1. GenerateSW Warning**
```
⚠ GenerateSW has been called multiple times
```
**Solution**: PWA disabled in development mode by default

#### **2. Install Prompt Not Showing**
**Causes**:
- App already installed
- Browser doesn't support PWA
- Manifest not valid
- Service worker not registered

**Debug**:
```javascript
// Check in console
console.log('SW registered:', !!navigator.serviceWorker.controller);
console.log('Manifest loaded:', !!document.querySelector('link[rel="manifest"]'));
console.log('Standalone mode:', window.matchMedia('(display-mode: standalone)').matches);
```

#### **3. Service Worker Not Working**
**Check**:
- HTTPS required (except localhost)
- Service worker file exists
- Registration successful
- No console errors

## 🚀 **Deployment**

### **Production Deployment**
1. **Build PWA**: `npm run pwa:build`
2. **Test locally**: `npm run pwa:test`
3. **Deploy**: Upload to hosting service
4. **Verify**: Check PWA features work

### **Environment Variables**
```bash
# Required for PWA
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-key
```

## 📱 **Mobile Testing**

### **iOS Safari**
1. Open app in Safari
2. Tap Share button (□↑)
3. Select "Add to Home Screen"
4. Tap "Add"

### **Android Chrome**
1. Open app in Chrome
2. Tap menu (⋮)
3. Select "Add to Home screen"
4. Tap "Add"

### **Desktop Chrome**
1. Look for install icon in address bar
2. Click install icon
3. Follow prompts

## 🔍 **PWA Audit**

### **Lighthouse Score**
- **PWA**: 100/100
- **Performance**: 90+/100
- **Accessibility**: 90+/100
- **Best Practices**: 90+/100
- **SEO**: 90+/100

### **PWA Checklist**
- [ ] Web App Manifest
- [ ] Service Worker
- [ ] HTTPS
- [ ] Responsive Design
- [ ] Offline Functionality
- [ ] Installable
- [ ] Fast Loading

## 📚 **Resources**

### **Documentation**
- [PWA Guidelines](./.cursor/rules/pwa-guidelines.mdc)
- [Next.js PWA](https://github.com/shadowwalker/next-pwa)
- [Workbox](https://developers.google.com/web/tools/workbox)

### **Testing Tools**
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [PWA Builder](https://www.pwabuilder.com/)
- [Chrome DevTools](https://developers.google.com/web/tools/chrome-devtools)

## 🎯 **Best Practices**

1. **Always test in production mode** for PWA features
2. **Use HTTPS** for PWA deployment
3. **Optimize images** for mobile performance
4. **Test offline functionality** thoroughly
5. **Monitor PWA metrics** in production
6. **Keep service worker updated**
7. **Provide fallbacks** for unsupported browsers

---

**✨ PWA Implementation Complete! Ready for mobile and desktop installation! 📱💻**
