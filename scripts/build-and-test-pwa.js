#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Building PWA for Testing...');
console.log('============================');

try {
  // Build the application
  console.log('📦 Building Next.js application...');
  execSync('npm run build', { stdio: 'inherit' });

  // Check if PWA files are generated
  console.log('\n🔍 Checking PWA files...');
  
  const pwaFiles = [
    'public/sw.js',
    'public/workbox-*.js',
    'public/manifest.json'
  ];

  let allFilesExist = true;
  
  pwaFiles.forEach(file => {
    if (file.includes('*')) {
      // Check for workbox files
      const workboxFiles = fs.readdirSync('public').filter(f => f.startsWith('workbox-') && f.endsWith('.js'));
      if (workboxFiles.length === 0) {
        console.log(`❌ No workbox files found`);
        allFilesExist = false;
      } else {
        console.log(`✅ Found ${workboxFiles.length} workbox files`);
      }
    } else {
      if (fs.existsSync(file)) {
        console.log(`✅ ${file}`);
      } else {
        console.log(`❌ ${file} not found`);
        allFilesExist = false;
      }
    }
  });

  if (allFilesExist) {
    console.log('\n🎉 PWA build successful!');
    console.log('\n📱 Testing PWA Features:');
    console.log('1. Start production server: npm start');
    console.log('2. Open http://localhost:3000 on mobile');
    console.log('3. Look for install prompt or "Add to Home Screen" option');
    console.log('4. Test offline functionality');
    console.log('5. Check browser menu for "Install App" option');
    
    console.log('\n🔧 PWA Debug Commands:');
    console.log('- Check service worker: chrome://serviceworker-internals/');
    console.log('- PWA audit: Run Lighthouse in Chrome DevTools');
    console.log('- Manifest check: chrome://flags/#enable-manifest-id');
    
    console.log('\n✨ PWA is ready for production testing!');
  } else {
    console.log('\n❌ PWA build failed - some files are missing');
    process.exit(1);
  }

} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
