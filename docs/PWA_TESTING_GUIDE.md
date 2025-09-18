# PWA Testing Guide - Better Planner

## 🚀 Quick Testing Steps

### 1. **Start Development Server**
```bash
npm run dev
```

### 2. **Open in Chrome**
- Buka `http://localhost:3000`
- Pastikan menggunakan Chrome (PWA features work best in Chrome)

### 3. **Check PWA Debug Info**
- Lihat debug panel di pojok kanan bawah
- Semua status harus ✅ (hijau)

### 4. **Wait for Install Prompt**
- Install prompt akan muncul setelah 5-10 detik
- Jika tidak muncul, lihat troubleshooting di bawah

## 🔧 PWA Debug Panel

Debug panel akan menampilkan:
- ✅ **Online**: Status koneksi internet
- ✅ **SW Supported**: Service Worker support
- ✅ **SW Registered**: Service Worker terdaftar
- ✅ **Manifest**: Web app manifest loaded
- ✅ **Install Prompt**: beforeinstallprompt event supported
- ✅ **Standalone**: App running in standalone mode

## 📱 Testing Install Prompt

### **Method 1: Automatic (Recommended)**
1. Buka app di Chrome
2. Tunggu 5-10 detik
3. Install prompt akan muncul otomatis

### **Method 2: Manual Trigger**
1. Buka Chrome DevTools (F12)
2. Go to **Application** tab
3. Click **Manifest** in left sidebar
4. Click **Add to homescreen** button

### **Method 3: Chrome Menu**
1. Click **⋮** (three dots) in Chrome
2. Select **Install Better Planner**
3. Click **Install**

## 🔍 Troubleshooting Install Prompt

### **Problem: Install Prompt Tidak Muncul**

#### **Solution 1: Check Browser Requirements**
- ✅ Gunakan Chrome (latest version)
- ✅ Pastikan tidak dalam incognito mode
- ✅ Pastikan HTTPS (atau localhost)

#### **Solution 2: Check PWA Requirements**
- ✅ Manifest valid dan loaded
- ✅ Service Worker registered
- ✅ App belum diinstall sebelumnya

#### **Solution 3: Clear Browser Data**
```bash
# Clear Chrome data
1. Chrome Settings > Privacy and Security > Clear browsing data
2. Select "All time"
3. Check "Cached images and files"
4. Click "Clear data"
5. Refresh page
```

#### **Solution 4: Check Console Logs**
1. Open DevTools (F12)
2. Go to **Console** tab
3. Look for PWA-related logs:
   - `🔔 Install prompt event triggered!`
   - `🔔 Showing install prompt...`
   - `🔔 Fallback: Showing install prompt for testing...`

### **Problem: Service Worker Tidak Register**

#### **Solution 1: Check PWA Configuration**
```bash
# Verify next.config.ts
disable: false  # Should be false for development
```

#### **Solution 2: Check Service Worker File**
```bash
# Check if service worker exists
ls -la public/sw.js
ls -la public/workbox-*.js
```

#### **Solution 3: Manual Service Worker Registration**
1. Open DevTools > **Application** > **Service Workers**
2. Check if service worker is registered
3. If not, click **Register** button

### **Problem: Manifest Tidak Load**

#### **Solution 1: Check Manifest File**
```bash
# Verify manifest exists and is valid
cat public/manifest.json
```

#### **Solution 2: Check Manifest in DevTools**
1. Open DevTools > **Application** > **Manifest**
2. Check if manifest is loaded
3. Verify all required fields are present

## 🧪 Advanced Testing

### **Test Offline Functionality**
1. Open DevTools > **Network** tab
2. Check **Offline** checkbox
3. Test app functionality offline
4. Uncheck **Offline** to test sync

### **Test Service Worker Update**
1. Make changes to PWA components
2. Build and restart server
3. Check if update notification appears
4. Click **Update** to apply changes

### **Test Install on Mobile**
1. Open app on mobile device
2. Use Chrome mobile browser
3. Look for "Add to Home Screen" option
4. Test installed app functionality

## 📊 PWA Audit with Lighthouse

### **Run Lighthouse Audit**
1. Open Chrome DevTools (F12)
2. Go to **Lighthouse** tab
3. Select **Progressive Web App**
4. Click **Generate report**
5. Check PWA score (should be 90+)

### **Expected PWA Score: 90+**
- ✅ **Installable**: App can be installed
- ✅ **PWA Optimized**: Good performance
- ✅ **Offline**: Works offline
- ✅ **Responsive**: Mobile-friendly
- ✅ **Fast**: Good loading performance

## 🐛 Common Issues & Solutions

### **Issue: "PWA support is disabled"**
```bash
# Solution: Enable PWA in development
# In next.config.ts, change:
disable: false  # Instead of process.env.NODE_ENV === "development"
```

### **Issue: Install prompt appears but doesn't work**
```bash
# Solution: Check browser compatibility
# Install prompt only works in:
# - Chrome (desktop & mobile)
# - Edge (Chromium-based)
# - Samsung Internet
# - Not in Firefox or Safari
```

### **Issue: Service Worker not updating**
```bash
# Solution: Force update
# 1. Open DevTools > Application > Service Workers
# 2. Check "Update on reload"
# 3. Refresh page
```

### **Issue: Manifest validation errors**
```bash
# Solution: Check manifest.json
# 1. Validate JSON syntax
# 2. Check required fields
# 3. Verify icon paths
```

## 🎯 Testing Checklist

### **Pre-Testing Setup**
- [ ] Development server running (`npm run dev`)
- [ ] Chrome browser (latest version)
- [ ] DevTools open (F12)
- [ ] Console tab visible

### **PWA Features Testing**
- [ ] Debug panel shows all ✅
- [ ] Install prompt appears (5-10 seconds)
- [ ] Install prompt works (installs app)
- [ ] Offline indicator works
- [ ] Service Worker registered
- [ ] Manifest loaded correctly

### **App Functionality Testing**
- [ ] App works offline
- [ ] Data syncs when online
- [ ] Install prompt dismissible
- [ ] Update notifications work
- [ ] Splash screen appears

### **Mobile Testing**
- [ ] App responsive on mobile
- [ ] Install prompt appears on mobile
- [ ] App installs on mobile home screen
- [ ] Installed app works properly

## 📱 Mobile Testing Tips

### **Chrome Mobile**
1. Open `http://localhost:3000` on mobile
2. Look for "Add to Home Screen" banner
3. Or use Chrome menu > "Install app"

### **Samsung Internet**
1. Open app in Samsung Internet
2. Look for "Add to Home Screen" option
3. Test installed app functionality

### **iOS Safari**
1. Open app in Safari
2. Tap Share button
3. Select "Add to Home Screen"
4. Test installed app

## 🔧 Development Tips

### **Enable PWA in Development**
```typescript
// next.config.ts
const pwaConfig = withPWA({
  disable: false, // Enable for testing
  // ... other config
});
```

### **Debug PWA Events**
```javascript
// Add to console for debugging
window.addEventListener('beforeinstallprompt', (e) => {
  console.log('🔔 Install prompt available!');
});

window.addEventListener('appinstalled', (e) => {
  console.log('🎉 App installed!');
});
```

### **Test Different Scenarios**
- Test on different devices
- Test with different network conditions
- Test with different browser versions
- Test with different screen sizes

## 📚 Additional Resources

- **PWA Checklist**: https://web.dev/pwa-checklist/
- **Next.js PWA**: https://github.com/shadowwalker/next-pwa
- **Workbox**: https://developers.google.com/web/tools/workbox
- **Chrome DevTools**: https://developers.google.com/web/tools/chrome-devtools

---

**Happy PWA Testing!** 🚀

Jika masih ada masalah, check console logs dan debug panel untuk informasi lebih detail.
