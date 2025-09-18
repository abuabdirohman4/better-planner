#!/usr/bin/env node

const http = require('http');
const fs = require('fs');
const path = require('path');

console.log('🔍 PWA Mobile Install Debug Script');
console.log('==================================');

// Check development server
const checkServer = () => {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:3000', (res) => {
      console.log(`✅ Server running (status: ${res.statusCode})`);
      resolve(true);
    });
    
    req.on('error', () => {
      console.log('❌ Server not running - please run: npm run dev');
      resolve(false);
    });
    
    req.setTimeout(5000, () => {
      console.log('❌ Server timeout');
      resolve(false);
    });
  });
};

// Check PWA manifest issues
const checkManifest = () => {
  console.log('\n📄 Checking Manifest Issues...');
  
  try {
    const manifest = JSON.parse(fs.readFileSync('public/manifest.json', 'utf8'));
    
    // Check critical PWA requirements
    const issues = [];
    
    // 1. Check icons
    if (!manifest.icons || manifest.icons.length === 0) {
      issues.push('❌ No icons found in manifest');
    } else {
      // Check for PNG icons (SVG might not work on all devices)
      const pngIcons = manifest.icons.filter(icon => icon.type?.includes('png'));
      if (pngIcons.length === 0) {
        issues.push('⚠️ No PNG icons found - SVG icons might not work on all mobile devices');
      }
      
      // Check for required sizes
      const requiredSizes = ['192x192', '512x512'];
      const availableSizes = manifest.icons.map(icon => icon.sizes);
      
      requiredSizes.forEach(size => {
        if (!availableSizes.includes(size)) {
          issues.push(`⚠️ Missing icon size: ${size}`);
        }
      });
    }
    
    // 2. Check display mode
    if (manifest.display !== 'standalone') {
      issues.push(`⚠️ Display mode is '${manifest.display}' - should be 'standalone' for PWA`);
    }
    
    // 3. Check start_url
    if (!manifest.start_url || manifest.start_url !== '/') {
      issues.push(`⚠️ start_url is '${manifest.start_url}' - should be '/'`);
    }
    
    // 4. Check theme colors
    if (!manifest.theme_color) {
      issues.push('⚠️ No theme_color specified');
    }
    
    if (!manifest.background_color) {
      issues.push('⚠️ No background_color specified');
    }
    
    // 5. Check scope
    if (!manifest.scope) {
      issues.push('⚠️ No scope specified');
    }
    
    if (issues.length === 0) {
      console.log('✅ Manifest looks good!');
      return true;
    } else {
      console.log('📱 Manifest Issues Found:');
      issues.forEach(issue => console.log(`   ${issue}`));
      return false;
    }
    
  } catch (error) {
    console.log('❌ Manifest error:', error.message);
    return false;
  }
};

// Check icon files exist
const checkIconFiles = () => {
  console.log('\n🖼️ Checking Icon Files...');
  
  try {
    const manifest = JSON.parse(fs.readFileSync('public/manifest.json', 'utf8'));
    let allExist = true;
    
    if (manifest.icons) {
      manifest.icons.forEach(icon => {
        const iconPath = path.join('public', icon.src);
        if (fs.existsSync(iconPath)) {
          console.log(`✅ ${icon.src} (${icon.sizes})`);
        } else {
          console.log(`❌ ${icon.src} NOT FOUND`);
          allExist = false;
        }
      });
    }
    
    return allExist;
  } catch (error) {
    console.log('❌ Error checking icon files:', error.message);
    return false;
  }
};

// Check service worker in development
const checkServiceWorker = () => {
  console.log('\n⚙️ Checking Service Worker...');
  
  // Check if sw.js exists
  if (fs.existsSync('public/sw.js')) {
    console.log('✅ public/sw.js exists');
    
    // Check workbox files
    const workboxFiles = fs.readdirSync('public').filter(f => f.startsWith('workbox-') && f.endsWith('.js'));
    if (workboxFiles.length > 0) {
      console.log(`✅ Workbox files: ${workboxFiles.length} found`);
      return true;
    } else {
      console.log('⚠️ No workbox files found');
      return false;
    }
  } else {
    console.log('❌ public/sw.js not found');
    return false;
  }
};

// Generate PWA recommendations
const generateRecommendations = (manifestOk, iconsOk, swOk) => {
  console.log('\n💡 PWA Mobile Install Recommendations:');
  console.log('=====================================');
  
  if (!manifestOk) {
    console.log('🔧 Fix Manifest Issues:');
    console.log('   1. Add PNG icons (192x192, 512x512)');
    console.log('   2. Set display: "standalone"');
    console.log('   3. Ensure all required fields are present');
  }
  
  if (!iconsOk) {
    console.log('🔧 Fix Icon Issues:');
    console.log('   1. Add PNG versions of icons to public/images/');
    console.log('   2. Update manifest.json to reference PNG icons');
    console.log('   3. Include both 192x192 and 512x512 sizes');
  }
  
  if (!swOk) {
    console.log('🔧 Fix Service Worker Issues:');
    console.log('   1. Build app in production mode: npm run build');
    console.log('   2. Or enable PWA in development: disable: false in next.config.ts');
  }
  
  console.log('\n📱 Mobile Testing Steps:');
  console.log('1. Use production build: npm run build && npm start');
  console.log('2. Test on HTTPS (required for PWA)');
  console.log('3. Try different browsers: Chrome, Samsung Internet');
  console.log('4. Clear browser cache and try again');
  console.log('5. Check browser console for errors');
  
  console.log('\n🛠️ Debug Commands:');
  console.log('- Production build: npm run pwa:build');
  console.log('- Production test: npm run pwa:prod');
  console.log('- Lighthouse audit: npx lighthouse http://localhost:3000 --view');
};

// Main debug function
const runDebug = async () => {
  console.log('🚀 Starting PWA Mobile Debug...\n');
  
  const serverOk = await checkServer();
  if (!serverOk) return;
  
  const manifestOk = checkManifest();
  const iconsOk = checkIconFiles();
  const swOk = checkServiceWorker();
  
  console.log('\n📊 PWA Mobile Debug Results:');
  console.log('============================');
  console.log(`✅ Server: ${serverOk ? 'Running' : 'Not Running'}`);
  console.log(`✅ Manifest: ${manifestOk ? 'Valid' : 'Has Issues'}`);
  console.log(`✅ Icons: ${iconsOk ? 'All Found' : 'Missing Files'}`);
  console.log(`✅ Service Worker: ${swOk ? 'Ready' : 'Not Ready'}`);
  
  const allGood = manifestOk && iconsOk && swOk;
  
  if (allGood) {
    console.log('\n🎉 PWA setup looks good!');
    console.log('📱 Try testing on mobile with production build:');
    console.log('   npm run pwa:prod');
  } else {
    generateRecommendations(manifestOk, iconsOk, swOk);
  }
};

runDebug().catch(console.error);
