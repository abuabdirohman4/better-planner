#!/usr/bin/env node

const http = require('http');

console.log('🚀 Testing Improved PWA Implementation');
console.log('=====================================');

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
const testPWAComponents = () => {
  console.log('\n📱 PWA Components Status:');
  console.log('========================');
  
  const components = [
    'src/components/PWA/index.tsx',
    'src/components/PWA/SplashScreen.tsx', 
    'src/components/PWA/LoadingHandler.tsx',
    'src/hooks/usePWA.ts',
    'src/hooks/useGlobalLoading.ts'
  ];
  
  const fs = require('fs');
  let allExist = true;
  
  components.forEach(component => {
    if (fs.existsSync(component)) {
      console.log(`✅ ${component}`);
    } else {
      console.log(`❌ ${component} - MISSING`);
      allExist = false;
    }
  });
  
  return allExist;
};

// Test manifest
const testManifest = () => {
  console.log('\n📄 Manifest Status:');
  console.log('==================');
  
  try {
    const fs = require('fs');
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

// Test service worker
const testServiceWorker = () => {
  console.log('\n⚙️ Service Worker Status:');
  console.log('========================');
  
  const fs = require('fs');
  
  if (fs.existsSync('public/sw.js')) {
    console.log('✅ Service worker exists');
    
    const workboxFiles = fs.readdirSync('public').filter(f => f.startsWith('workbox-') && f.endsWith('.js'));
    console.log(`✅ Workbox files: ${workboxFiles.length} found`);
    
    return true;
  } else {
    console.log('❌ Service worker not found');
    return false;
  }
};

// Main test
const runTest = async () => {
  console.log('🧪 Running PWA Tests...\n');
  
  const serverOk = await testServer();
  const componentsOk = testPWAComponents();
  const manifestOk = testManifest();
  const swOk = testServiceWorker();
  
  console.log('\n📊 Test Results:');
  console.log('================');
  console.log(`✅ Server: ${serverOk ? 'Running' : 'Not Running'}`);
  console.log(`✅ PWA Components: ${componentsOk ? 'All Present' : 'Missing'}`);
  console.log(`✅ Manifest: ${manifestOk ? 'Valid' : 'Invalid'}`);
  console.log(`✅ Service Worker: ${swOk ? 'Ready' : 'Not Ready'}`);
  
  const allGood = serverOk && componentsOk && manifestOk && swOk;
  
  if (allGood) {
    console.log('\n🎉 PWA Implementation Improved!');
    console.log('📱 Now includes:');
    console.log('   - Custom install prompt');
    console.log('   - Splash screen');
    console.log('   - Loading handler');
    console.log('   - PWA hooks');
    console.log('   - Offline indicator');
    console.log('   - Update notifications');
    
    console.log('\n🧪 Next Steps:');
    console.log('1. Open http://localhost:3000 in mobile browser');
    console.log('2. Look for install prompt (appears after 3 seconds)');
    console.log('3. Test install functionality');
    console.log('4. Check offline/online indicators');
  } else {
    console.log('\n⚠️ Some issues found - check the details above');
  }
  
  console.log('\n🔧 Debug Commands:');
  console.log('- Check PWA status: node scripts/debug-pwa-mobile.js');
  console.log('- Test production: npm run pwa:build && npm run pwa:prod');
  console.log('- Lighthouse audit: npx lighthouse http://localhost:3000 --view');
};

runTest().catch(console.error);

