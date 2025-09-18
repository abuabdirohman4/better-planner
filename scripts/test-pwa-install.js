#!/usr/bin/env node

/**
 * PWA Install Testing Script
 * Tests install prompt functionality specifically
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔔 PWA Install Prompt Testing Script');
console.log('====================================\n');

// Check if development server is running
const checkDevServer = () => {
  return new Promise((resolve) => {
    exec('curl -s -o /dev/null -w "%{http_code}" http://localhost:3000', (error, stdout) => {
      const statusCode = stdout.trim();
      if (statusCode === '200' || statusCode === '302' || statusCode === '301' || statusCode === '307') {
        console.log('✅ Development server is running on http://localhost:3000');
        resolve(true);
      } else {
        console.log(`❌ Development server is not running (status: ${statusCode})`);
        console.log('   Please run: npm run dev');
        resolve(false);
      }
    });
  });
};

// Check PWA configuration
const checkPWAConfig = () => {
  console.log('\n🔧 Checking PWA Configuration...');
  
  try {
    const configPath = path.join(process.cwd(), 'next.config.ts');
    const configContent = fs.readFileSync(configPath, 'utf8');
    
    const checks = [
      { name: 'PWA enabled in development', status: configContent.includes('disable: false') },
      { name: 'next-pwa imported', status: configContent.includes('import withPWA from "next-pwa"') },
      { name: 'Service worker dest set', status: configContent.includes('dest: "public"') },
      { name: 'Register enabled', status: configContent.includes('register: true') },
      { name: 'Skip waiting enabled', status: configContent.includes('skipWaiting: true') }
    ];
    
    checks.forEach(check => {
      console.log(`${check.status ? '✅' : '❌'} ${check.name}`);
    });
    
    return checks.every(check => check.status);
  } catch (error) {
    console.log('❌ Failed to check PWA configuration:', error.message);
    return false;
  }
};

// Check manifest file
const checkManifest = () => {
  console.log('\n📄 Checking Web App Manifest...');
  
  try {
    const manifestPath = path.join(process.cwd(), 'public/manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    
    const checks = [
      { name: 'Name', status: !!manifest.name },
      { name: 'Short name', status: !!manifest.short_name },
      { name: 'Start URL', status: !!manifest.start_url },
      { name: 'Display mode', status: !!manifest.display },
      { name: 'Theme color', status: !!manifest.theme_color },
      { name: 'Icons', status: manifest.icons && manifest.icons.length > 0 },
      { name: 'Shortcuts', status: manifest.shortcuts && manifest.shortcuts.length > 0 }
    ];
    
    checks.forEach(check => {
      console.log(`${check.status ? '✅' : '❌'} ${check.name}`);
    });
    
    return checks.every(check => check.status);
  } catch (error) {
    console.log('❌ Failed to check manifest:', error.message);
    return false;
  }
};

// Check service worker
const checkServiceWorker = () => {
  console.log('\n⚡ Checking Service Worker...');
  
  const swPath = path.join(process.cwd(), 'public/sw.js');
  
  // Check for workbox files
  const publicDir = path.join(process.cwd(), 'public');
  const files = fs.readdirSync(publicDir);
  const workboxFiles = files.filter(file => file.startsWith('workbox-') && file.endsWith('.js'));
  
  const checks = [
    { name: 'Service worker file exists', status: fs.existsSync(swPath) },
    { name: 'Workbox files exist', status: workboxFiles.length > 0 }
  ];
  
  checks.forEach(check => {
    console.log(`${check.status ? '✅' : '❌'} ${check.name}`);
  });
  
  if (workboxFiles.length > 0) {
    console.log(`   Found workbox files: ${workboxFiles.join(', ')}`);
  }
  
  return checks.every(check => check.status);
};

// Check PWA components
const checkPWAComponents = () => {
  console.log('\n🧩 Checking PWA Components...');
  
  const components = [
    'src/components/common/PWAComponents.tsx',
    'src/components/common/SplashScreen.tsx',
    'src/components/common/OfflineSyncIndicator.tsx',
    'src/components/common/PWADebug.tsx',
    'src/hooks/common/useOfflineSync.ts',
    'src/lib/offlineUtils.ts'
  ];
  
  let allExist = true;
  components.forEach(component => {
    const exists = fs.existsSync(path.join(process.cwd(), component));
    console.log(`${exists ? '✅' : '❌'} ${component}`);
    if (!exists) allExist = false;
  });
  
  return allExist;
};

// Main testing function
const runTests = async () => {
  console.log('🚀 Starting PWA Install Prompt Tests...\n');
  
  const devServerRunning = await checkDevServer();
  if (!devServerRunning) {
    console.log('\n❌ Cannot proceed without development server');
    process.exit(1);
  }
  
  const configOk = checkPWAConfig();
  const manifestOk = checkManifest();
  const swOk = checkServiceWorker();
  const componentsOk = checkPWAComponents();
  
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  console.log(`✅ Development Server: ${devServerRunning ? 'Running' : 'Not Running'}`);
  console.log(`✅ PWA Configuration: ${configOk ? 'Valid' : 'Invalid'}`);
  console.log(`✅ Web App Manifest: ${manifestOk ? 'Valid' : 'Invalid'}`);
  console.log(`✅ Service Worker: ${swOk ? 'Ready' : 'Not Ready'}`);
  console.log(`✅ PWA Components: ${componentsOk ? 'Complete' : 'Incomplete'}`);
  
  const allTestsPassed = configOk && manifestOk && swOk && componentsOk;
  
  if (allTestsPassed) {
    console.log('\n🎉 All tests passed! Install prompt should work.');
    console.log('\n🔧 Next Steps:');
    console.log('1. Open http://localhost:3000 in Chrome');
    console.log('2. Wait 5-10 seconds for install prompt');
    console.log('3. Check debug panel in bottom-right corner');
    console.log('4. Look for console logs: 🔔 Install prompt event triggered!');
    console.log('5. If prompt doesn\'t appear, check troubleshooting guide');
  } else {
    console.log('\n❌ Some tests failed. Please fix the issues above.');
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check PWA configuration in next.config.ts');
    console.log('2. Verify manifest.json is valid');
    console.log('3. Ensure all PWA components are present');
    console.log('4. Restart development server');
  }
  
  console.log('\n📚 Documentation:');
  console.log('- PWA Testing Guide: docs/PWA_TESTING_GUIDE.md');
  console.log('- PWA Implementation: docs/PWA_IMPLEMENTATION.md');
  
  console.log('\n✨ Happy Testing!');
};

// Run the tests
runTests().catch(console.error);
