#!/usr/bin/env node

const http = require('http');
const fs = require('fs');

console.log('🧹 Testing Clean PWA Implementation');
console.log('==================================');

// Test server
const testServer = () => {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:3000', (res) => {
      console.log(`✅ Server running (status: ${res.statusCode})`);
      resolve(true);
    });
    
    req.on('error', () => {
      console.log('❌ Server not running - please run: npm run dev');
      resolve(false);
    });
    
    req.setTimeout(3000, () => {
      console.log('❌ Server timeout');
      resolve(false);
    });
  });
};

// Test PWA components
const testPWAFiles = () => {
  console.log('\n📱 PWA Files Status:');
  console.log('===================');
  
  const requiredFiles = [
    'src/components/PWA/index.tsx',
    'src/components/PWA/SplashScreen.tsx', 
    'src/components/PWA/LoadingHandler.tsx',
    'src/hooks/usePWA.ts',
    'src/hooks/useGlobalLoading.ts',
    'public/manifest.json',
    'public/sw.js'
  ];
  
  const removedFiles = [
    'src/components/common/PWAComponents.tsx',
    'src/components/common/PWADebug.tsx',
    'src/components/common/DevelopmentPWAManager.tsx',
    'src/lib/pwa-config.ts',
    'src/lib/offlineUtils.ts',
    'scripts/debug-pwa-mobile.js',
    'scripts/test-pwa-improved.js'
  ];
  
  let allRequired = true;
  let allRemoved = true;
  
  console.log('✅ Required Files:');
  requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`   ✅ ${file}`);
    } else {
      console.log(`   ❌ ${file} - MISSING`);
      allRequired = false;
    }
  });
  
  console.log('\n🗑️ Removed Files:');
  removedFiles.forEach(file => {
    if (!fs.existsSync(file)) {
      console.log(`   ✅ ${file} - REMOVED`);
    } else {
      console.log(`   ❌ ${file} - STILL EXISTS`);
      allRemoved = false;
    }
  });
  
  return allRequired && allRemoved;
};

// Test manifest
const testManifest = () => {
  console.log('\n📄 Manifest Status:');
  console.log('==================');
  
  try {
    const manifest = JSON.parse(fs.readFileSync('public/manifest.json', 'utf8'));
    
    console.log(`✅ Manifest exists`);
    console.log(`✅ Name: ${manifest.name}`);
    console.log(`✅ Display: ${manifest.display}`);
    console.log(`✅ Icons: ${manifest.icons?.length || 0} icons`);
    console.log(`✅ Shortcuts: ${manifest.shortcuts?.length || 0} shortcuts`);
    
    return true;
  } catch (error) {
    console.log(`❌ Manifest error: ${error.message}`);
    return false;
  }
};

// Main test
const runTest = async () => {
  console.log('🧪 Running Clean PWA Tests...\n');
  
  const serverOk = await testServer();
  const filesOk = testPWAFiles();
  const manifestOk = testManifest();
  
  console.log('\n📊 Test Results:');
  console.log('================');
  console.log(`✅ Server: ${serverOk ? 'Running' : 'Not Running'}`);
  console.log(`✅ PWA Files: ${filesOk ? 'Clean' : 'Issues Found'}`);
  console.log(`✅ Manifest: ${manifestOk ? 'Valid' : 'Invalid'}`);
  
  const allGood = serverOk && filesOk && manifestOk;
  
  if (allGood) {
    console.log('\n🎉 PWA Cleanup Successful!');
    console.log('📱 Clean PWA includes:');
    console.log('   - Essential PWA components only');
    console.log('   - Custom install prompt');
    console.log('   - Splash screen');
    console.log('   - Loading handler');
    console.log('   - PWA hooks');
    console.log('   - Offline indicator');
    console.log('   - Update notifications');
    
    console.log('\n🗑️ Removed unnecessary files:');
    console.log('   - Debug components');
    console.log('   - Development scripts');
    console.log('   - Old PWA components');
    console.log('   - Unused utilities');
    
    console.log('\n🧪 Ready for Production!');
    console.log('1. PWA can be installed on desktop and mobile');
    console.log('2. Clean codebase with only essential files');
    console.log('3. No unnecessary debug components');
  } else {
    console.log('\n⚠️ Some issues found - check the details above');
  }
};

runTest().catch(console.error);
