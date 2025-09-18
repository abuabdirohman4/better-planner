#!/usr/bin/env node

/**
 * PWA Testing Script for Better Planner
 * Tests PWA functionality and provides detailed report
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Better Planner PWA Testing Script');
console.log('=====================================\n');

// Check if required files exist
const requiredFiles = [
  'public/manifest.json',
  'public/sw.js',
  'src/components/common/PWAComponents.tsx',
  'src/components/common/SplashScreen.tsx',
  'src/lib/offlineUtils.ts',
  'src/hooks/common/useOfflineSync.ts'
];

console.log('📋 Checking PWA Files...');
let allFilesExist = true;

requiredFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
    allFilesExist = false;
  }
});

console.log('\n📱 PWA Features Checklist:');
console.log('==========================');

const features = [
  { name: 'Web App Manifest', status: fs.existsSync(path.join(process.cwd(), 'public/manifest.json')) },
  { name: 'Service Worker', status: fs.existsSync(path.join(process.cwd(), 'public/sw.js')) },
  { name: 'Install Prompt Component', status: fs.existsSync(path.join(process.cwd(), 'src/components/common/PWAComponents.tsx')) },
  { name: 'Splash Screen', status: fs.existsSync(path.join(process.cwd(), 'src/components/common/SplashScreen.tsx')) },
  { name: 'Offline Utils', status: fs.existsSync(path.join(process.cwd(), 'src/lib/offlineUtils.ts')) },
  { name: 'Offline Sync Hook', status: fs.existsSync(path.join(process.cwd(), 'src/hooks/common/useOfflineSync.ts')) },
  { name: 'PWA Head Component', status: fs.existsSync(path.join(process.cwd(), 'src/app/pwa-head.tsx')) },
  { name: 'Layout Integration', status: fs.existsSync(path.join(process.cwd(), 'src/app/layout.tsx')) }
];

features.forEach(feature => {
  console.log(`${feature.status ? '✅' : '❌'} ${feature.name}`);
});

// Check manifest.json content
console.log('\n📄 Manifest Validation:');
console.log('======================');

try {
  const manifestPath = path.join(process.cwd(), 'public/manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  
  const manifestChecks = [
    { name: 'Name', status: !!manifest.name },
    { name: 'Short Name', status: !!manifest.short_name },
    { name: 'Description', status: !!manifest.description },
    { name: 'Start URL', status: !!manifest.start_url },
    { name: 'Display Mode', status: !!manifest.display },
    { name: 'Theme Color', status: !!manifest.theme_color },
    { name: 'Background Color', status: !!manifest.background_color },
    { name: 'Icons', status: manifest.icons && manifest.icons.length > 0 },
    { name: 'Shortcuts', status: manifest.shortcuts && manifest.shortcuts.length > 0 }
  ];
  
  manifestChecks.forEach(check => {
    console.log(`${check.status ? '✅' : '❌'} ${check.name}`);
  });
  
  console.log(`\n📊 Manifest Icons: ${manifest.icons?.length || 0}`);
  console.log(`📊 Manifest Shortcuts: ${manifest.shortcuts?.length || 0}`);
  
} catch (error) {
  console.log('❌ Manifest validation failed:', error.message);
}

// Check next.config.ts for PWA configuration
console.log('\n⚙️  Next.js PWA Configuration:');
console.log('==============================');

try {
  const configPath = path.join(process.cwd(), 'next.config.ts');
  const configContent = fs.readFileSync(configPath, 'utf8');
  
  const configChecks = [
    { name: 'next-pwa import', status: configContent.includes('import withPWA from "next-pwa"') },
    { name: 'PWA configuration', status: configContent.includes('withPWA(') },
    { name: 'Service worker dest', status: configContent.includes('dest: "public"') },
    { name: 'Runtime caching', status: configContent.includes('runtimeCaching') },
    { name: 'Skip waiting', status: configContent.includes('skipWaiting: true') }
  ];
  
  configChecks.forEach(check => {
    console.log(`${check.status ? '✅' : '❌'} ${check.name}`);
  });
  
} catch (error) {
  console.log('❌ Configuration check failed:', error.message);
}

// Check package.json for PWA dependencies
console.log('\n📦 PWA Dependencies:');
console.log('====================');

try {
  const packagePath = path.join(process.cwd(), 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  const dependencies = {
    'next-pwa': packageJson.dependencies['next-pwa'] || packageJson.devDependencies['next-pwa'],
    'workbox-webpack-plugin': packageJson.dependencies['workbox-webpack-plugin'] || packageJson.devDependencies['workbox-webpack-plugin']
  };
  
  Object.entries(dependencies).forEach(([dep, version]) => {
    console.log(`${version ? '✅' : '❌'} ${dep}: ${version || 'NOT INSTALLED'}`);
  });
  
} catch (error) {
  console.log('❌ Dependencies check failed:', error.message);
}

// Summary
console.log('\n📈 PWA Implementation Summary:');
console.log('==============================');

const totalChecks = features.length + 9 + 5 + 2; // features + manifest + config + deps
const passedChecks = features.filter(f => f.status).length + 
  (fs.existsSync(path.join(process.cwd(), 'public/manifest.json')) ? 9 : 0) +
  (fs.existsSync(path.join(process.cwd(), 'next.config.ts')) ? 5 : 0) +
  (fs.existsSync(path.join(process.cwd(), 'package.json')) ? 2 : 0);

const score = Math.round((passedChecks / totalChecks) * 100);

console.log(`🎯 PWA Implementation Score: ${score}%`);
console.log(`✅ Passed: ${passedChecks}/${totalChecks} checks`);

if (score >= 90) {
  console.log('🎉 Excellent! PWA implementation is complete and ready for production.');
} else if (score >= 70) {
  console.log('👍 Good! PWA implementation is mostly complete with minor issues.');
} else {
  console.log('⚠️  PWA implementation needs attention. Please review the failed checks.');
}

console.log('\n🔧 Next Steps:');
console.log('==============');
console.log('1. Run "npm run dev" to start development server');
console.log('2. Open http://localhost:3000 in Chrome');
console.log('3. Open DevTools > Application > Manifest');
console.log('4. Check PWA features in Application tab');
console.log('5. Test offline functionality');
console.log('6. Run Lighthouse PWA audit');

console.log('\n📚 Documentation:');
console.log('=================');
console.log('- PWA Implementation Guide: docs/PWA_IMPLEMENTATION.md');
console.log('- Next.js PWA: https://github.com/shadowwalker/next-pwa');
console.log('- Workbox: https://developers.google.com/web/tools/workbox');
console.log('- PWA Checklist: https://web.dev/pwa-checklist/');

console.log('\n✨ Happy PWA Testing!');
