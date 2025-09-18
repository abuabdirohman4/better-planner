#!/usr/bin/env node

const http = require('http');
const fs = require('fs');
const path = require('path');

console.log('🚀 Production PWA Testing Script');
console.log('================================');

// Test production server
const testProductionServer = () => {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:3000', (res) => {
      console.log(`✅ Production server is running (status: ${res.statusCode})`);
      resolve(true);
    });
    
    req.on('error', () => {
      console.log('❌ Production server is not running');
      console.log('   Please run: npm start');
      resolve(false);
    });
    
    req.setTimeout(5000, () => {
      console.log('❌ Production server timeout');
      resolve(false);
    });
  });
};

// Check PWA files
const checkPWAFiles = () => {
  console.log('\n📱 Checking PWA Files...');
  
  const files = [
    { path: 'public/sw.js', name: 'Service Worker' },
    { path: 'public/manifest.json', name: 'Web App Manifest' }
  ];
  
  let allExist = true;
  
  files.forEach(file => {
    if (fs.existsSync(file.path)) {
      console.log(`✅ ${file.name}: ${file.path}`);
    } else {
      console.log(`❌ ${file.name}: ${file.path} not found`);
      allExist = false;
    }
  });
  
  // Check workbox files
  const workboxFiles = fs.readdirSync('public').filter(f => f.startsWith('workbox-') && f.endsWith('.js'));
  if (workboxFiles.length > 0) {
    console.log(`✅ Workbox files: ${workboxFiles.length} found`);
  } else {
    console.log('❌ No workbox files found');
    allExist = false;
  }
  
  return allExist;
};

// Check manifest content
const checkManifest = () => {
  console.log('\n📄 Checking Manifest Content...');
  
  try {
    const manifest = JSON.parse(fs.readFileSync('public/manifest.json', 'utf8'));
    
    const required = ['name', 'short_name', 'start_url', 'display', 'icons'];
    let valid = true;
    
    required.forEach(field => {
      if (manifest[field]) {
        console.log(`✅ ${field}: ${manifest[field]}`);
      } else {
        console.log(`❌ ${field}: missing`);
        valid = false;
      }
    });
    
    if (manifest.icons && manifest.icons.length > 0) {
      console.log(`✅ Icons: ${manifest.icons.length} found`);
    } else {
      console.log('❌ Icons: none found');
      valid = false;
    }
    
    return valid;
  } catch (error) {
    console.log('❌ Manifest parsing error:', error.message);
    return false;
  }
};

// Main test function
const runTests = async () => {
  console.log('🚀 Starting Production PWA Tests...\n');
  
  const serverRunning = await testProductionServer();
  if (!serverRunning) {
    console.log('\n❌ Cannot proceed without production server');
    return;
  }
  
  const filesExist = checkPWAFiles();
  const manifestValid = checkManifest();
  
  console.log('\n📊 Production PWA Test Results:');
  console.log('===============================');
  console.log(`✅ Production Server: ${serverRunning ? 'Running' : 'Not Running'}`);
  console.log(`✅ PWA Files: ${filesExist ? 'Complete' : 'Incomplete'}`);
  console.log(`✅ Manifest: ${manifestValid ? 'Valid' : 'Invalid'}`);
  
  if (serverRunning && filesExist && manifestValid) {
    console.log('\n🎉 Production PWA setup looks good!');
    console.log('\n📱 Mobile PWA Testing Instructions:');
    console.log('1. Open http://localhost:3000 on mobile device');
    console.log('2. Look for install prompt or "Add to Home Screen" option');
    console.log('3. Check browser menu for "Install App" option');
    console.log('4. Test offline functionality');
    console.log('5. Check if app can be installed');
    
    console.log('\n🔧 PWA Debug Tools:');
    console.log('- Chrome DevTools: Application tab');
    console.log('- Lighthouse: PWA audit');
    console.log('- Service Worker: chrome://serviceworker-internals/');
    
    console.log('\n✨ Ready for mobile PWA testing!');
  } else {
    console.log('\n❌ PWA setup has issues - please fix before testing');
  }
};

runTests().catch(console.error);
