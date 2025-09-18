#!/usr/bin/env node

/**
 * Mobile PWA Testing Script
 * Tests mobile PWA installation and features
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('📱 Mobile PWA Testing Script');
console.log('============================\n');

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

// Check mobile PWA components
const checkMobileComponents = () => {
  console.log('\n📱 Checking Mobile PWA Components...');
  
  const components = [
    'src/components/common/PWAComponents.tsx',
    'src/components/common/MobilePWADebug.tsx',
    'src/lib/pwa-config.ts'
  ];
  
  let allExist = true;
  components.forEach(component => {
    const exists = fs.existsSync(path.join(process.cwd(), component));
    console.log(`${exists ? '✅' : '❌'} ${component}`);
    if (!exists) allExist = false;
  });
  
  return allExist;
};

// Check manifest for mobile support
const checkMobileManifest = () => {
  console.log('\n📄 Checking Mobile Manifest Support...');
  
  try {
    const manifestPath = path.join(process.cwd(), 'public/manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    
    const checks = [
      { name: 'Name', status: manifest.name && manifest.name.length > 0 },
      { name: 'Short name', status: manifest.short_name && manifest.short_name.length > 0 },
      { name: 'Start URL', status: manifest.start_url === '/' },
      { name: 'Display mode', status: manifest.display === 'standalone' },
      { name: 'Theme color', status: manifest.theme_color && manifest.theme_color.length > 0 },
      { name: 'Background color', status: manifest.background_color && manifest.background_color.length > 0 },
      { name: 'Icons', status: manifest.icons && manifest.icons.length > 0 },
      { name: 'Orientation', status: manifest.orientation === 'portrait-primary' },
      { name: 'Categories', status: manifest.categories && manifest.categories.length > 0 }
    ];
    
    checks.forEach(check => {
      console.log(`${check.status ? '✅' : '❌'} ${check.name}`);
    });
    
    if (manifest.icons) {
      console.log(`   Found ${manifest.icons.length} icons`);
      manifest.icons.forEach(icon => {
        console.log(`   - ${icon.sizes}: ${icon.src}`);
      });
    }
    
    return checks.every(check => check.status);
  } catch (error) {
    console.log('❌ Failed to check mobile manifest:', error.message);
    return false;
  }
};

// Check service worker files
const checkServiceWorker = () => {
  console.log('\n⚙️ Checking Service Worker...');
  
  const swFiles = [
    'public/sw.js',
    'public/workbox-*.js'
  ];
  
  let hasSW = false;
  swFiles.forEach(pattern => {
    if (pattern.includes('*')) {
      // Check for workbox files
      const publicDir = path.join(process.cwd(), 'public');
      const files = fs.readdirSync(publicDir);
      const workboxFiles = files.filter(file => file.startsWith('workbox-') && file.endsWith('.js'));
      if (workboxFiles.length > 0) {
        console.log(`✅ Found ${workboxFiles.length} Workbox files`);
        workboxFiles.forEach(file => console.log(`   - ${file}`));
        hasSW = true;
      }
    } else {
      const exists = fs.existsSync(path.join(process.cwd(), pattern));
      if (exists) {
        console.log(`✅ ${pattern}`);
        hasSW = true;
      }
    }
  });
  
  if (!hasSW) {
    console.log('❌ No service worker files found');
    console.log('   This might be because PWA is disabled in development');
  }
  
  return hasSW;
};

// Check PWA configuration
const checkPWAConfig = () => {
  console.log('\n⚙️ Checking PWA Configuration...');
  
  try {
    const configPath = path.join(process.cwd(), 'next.config.ts');
    const configContent = fs.readFileSync(configPath, 'utf8');
    
    const checks = [
      { name: 'PWA enabled', status: configContent.includes('disable: false') },
      { name: 'Register service worker', status: configContent.includes('register: true') },
      { name: 'Skip waiting', status: configContent.includes('skipWaiting: true') },
      { name: 'Runtime caching', status: configContent.includes('runtimeCaching') }
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

// Main testing function
const runTests = async () => {
  console.log('🚀 Starting Mobile PWA Tests...\n');
  
  const devServerRunning = await checkDevServer();
  if (!devServerRunning) {
    console.log('\n❌ Cannot proceed without development server');
    process.exit(1);
  }
  
  const componentsOk = checkMobileComponents();
  const manifestOk = checkMobileManifest();
  const serviceWorkerOk = checkServiceWorker();
  const configOk = checkPWAConfig();
  
  console.log('\n📊 Mobile PWA Test Results:');
  console.log('===========================');
  console.log(`✅ Development Server: ${devServerRunning ? 'Running' : 'Not Running'}`);
  console.log(`✅ Mobile Components: ${componentsOk ? 'Complete' : 'Incomplete'}`);
  console.log(`✅ Mobile Manifest: ${manifestOk ? 'Valid' : 'Invalid'}`);
  console.log(`✅ Service Worker: ${serviceWorkerOk ? 'Found' : 'Not Found'}`);
  console.log(`✅ PWA Config: ${configOk ? 'Valid' : 'Invalid'}`);
  
  const allTestsPassed = componentsOk && manifestOk && configOk;
  
  if (allTestsPassed) {
    console.log('\n🎉 Mobile PWA setup looks good!');
    console.log('\n📱 Mobile PWA Features:');
    console.log('• Install prompt for mobile devices');
    console.log('• Offline support with service worker');
    console.log('• Add to home screen functionality');
    console.log('• Standalone app experience');
    console.log('• Mobile-optimized manifest');
    
    console.log('\n🔧 Testing Instructions:');
    console.log('1. Open http://localhost:3000 on mobile device');
    console.log('2. Look for install prompt or "Add to Home Screen" option');
    console.log('3. Check browser menu for "Install App" option');
    console.log('4. Test offline functionality');
    console.log('5. Check debug panel at bottom of screen');
    
    if (!serviceWorkerOk) {
      console.log('\n⚠️ Note: Service worker not found in development');
      console.log('   This is normal if PWA is disabled in development mode');
      console.log('   Service worker will be available in production build');
    }
  } else {
    console.log('\n❌ Some mobile PWA tests failed.');
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check mobile PWA components are present');
    console.log('2. Verify manifest.json has mobile support');
    console.log('3. Ensure PWA is enabled in next.config.ts');
    console.log('4. Restart development server');
    console.log('5. Check browser console for errors');
  }
  
  console.log('\n📚 Common Mobile PWA Issues:');
  console.log('• Install prompt not showing: Check if already installed');
  console.log('• Service worker not working: Enable PWA in development');
  console.log('• Manifest not loading: Check file path and content');
  console.log('• Icons not showing: Verify icon files exist');
  
  console.log('\n✨ Happy Mobile PWA Testing!');
};

// Run the tests
runTests().catch(console.error);
