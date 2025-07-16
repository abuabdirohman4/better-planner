const puppeteer = require('puppeteer');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const PRODUCTION_URL = 'https://planner.abuabdirohman.com'; // Production URL
const PAGES_TO_TEST = [
  { name: 'Dashboard Main', url: `${BASE_URL}/admin` },
  { name: 'Dashboard Page', url: `${BASE_URL}/admin/dashboard` },
  { name: 'Daily Sync', url: `${BASE_URL}/admin/execution/daily-sync` },
  { name: 'Weekly Sync', url: `${BASE_URL}/admin/execution/weekly-sync` },
  { name: 'Vision', url: `${BASE_URL}/admin/planning/vision` },
  { name: 'Main Quests', url: `${BASE_URL}/admin/planning/main-quests` },
  { name: '12 Week Quests', url: `${BASE_URL}/admin/planning/12-week-quests` },
  { name: 'Quests', url: `${BASE_URL}/admin/planning/quests` }
];

async function testPagePerformance(pageName, url, browser) {
  const page = await browser.newPage();
  
  // Enable performance monitoring
  await page.setCacheEnabled(false);
  
  console.log(`\n🚀 Testing: ${pageName}`);
  console.log(`📍 URL: ${url}`);
  
  try {
    const startTime = Date.now();
    
    // Navigate to page and wait for network idle
    await page.goto(url, { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    const loadTime = Date.now() - startTime;
    
    // Get performance metrics
    const metrics = await page.metrics();
    const performanceTiming = await page.evaluate(() => {
      const timing = performance.timing;
      return {
        domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
        loadComplete: timing.loadEventEnd - timing.navigationStart,
        firstPaint: performance.getEntriesByType('paint')[0]?.startTime || 0,
        firstContentfulPaint: performance.getEntriesByType('paint')[1]?.startTime || 0
      };
    });
    
    // Get resource loading information
    const resources = await page.evaluate(() => {
      const entries = performance.getEntriesByType('resource');
      return {
        totalResources: entries.length,
        jsFiles: entries.filter(e => e.name.includes('.js')).length,
        cssFiles: entries.filter(e => e.name.includes('.css')).length,
        images: entries.filter(e => e.name.includes('.png') || e.name.includes('.jpg') || e.name.includes('.svg')).length,
        totalSize: entries.reduce((sum, e) => sum + (e.transferSize || 0), 0)
      };
    });
    
    // Check for errors
    const errors = await page.evaluate(() => {
      return window.performance.getEntriesByType('resource')
        .filter(entry => entry.name.includes('error') || entry.name.includes('failed'))
        .length;
    });
    
    // Get page title and check authentication status
    const title = await page.title();
    const isSignInPage = title.includes('SignIn') || title.includes('Sign In');
    
    // Check for specific components
    const components = await page.evaluate(() => {
      const elements = {
        forms: document.querySelectorAll('form').length,
        buttons: document.querySelectorAll('button').length,
        inputs: document.querySelectorAll('input').length,
        images: document.querySelectorAll('img').length,
        divs: document.querySelectorAll('div').length,
        links: document.querySelectorAll('a').length
      };
      return elements;
    });
    
    console.log(`⏱️  Total Load Time: ${loadTime}ms`);
    console.log(`📊 DOM Content Loaded: ${performanceTiming.domContentLoaded}ms`);
    console.log(`📊 Load Complete: ${performanceTiming.loadComplete}ms`);
    console.log(`🎨 First Paint: ${performanceTiming.firstPaint}ms`);
    console.log(`🎨 First Contentful Paint: ${performanceTiming.firstContentfulPaint}ms`);
    console.log(`📈 Memory Usage: ${Math.round(metrics.JSHeapUsedSize / 1024 / 1024)}MB`);
    console.log(`📦 Total Resources: ${resources.totalResources} (JS: ${resources.jsFiles}, CSS: ${resources.cssFiles}, Images: ${resources.images})`);
    console.log(`📦 Total Size: ${Math.round(resources.totalSize / 1024)}KB`);
    console.log(`❌ Errors: ${errors}`);
    console.log(`📄 Page Title: ${title}`);
    console.log(`🔐 Authentication Required: ${isSignInPage ? 'Yes' : 'No'}`);
    console.log(`🧩 Components: Forms(${components.forms}), Buttons(${components.buttons}), Inputs(${components.inputs}), Images(${components.images})`);
    
    return {
      pageName,
      url,
      loadTime,
      domContentLoaded: performanceTiming.domContentLoaded,
      loadComplete: performanceTiming.loadComplete,
      firstPaint: performanceTiming.firstPaint,
      firstContentfulPaint: performanceTiming.firstContentfulPaint,
      memoryUsage: Math.round(metrics.JSHeapUsedSize / 1024 / 1024),
      totalResources: resources.totalResources,
      jsFiles: resources.jsFiles,
      cssFiles: resources.cssFiles,
      images: resources.images,
      totalSize: Math.round(resources.totalSize / 1024),
      errors,
      title,
      isSignInPage,
      components,
      success: true
    };
    
  } catch (error) {
    console.log(`❌ Error loading ${pageName}: ${error.message}`);
    return {
      pageName,
      url,
      error: error.message,
      success: false
    };
  } finally {
    await page.close();
  }
}

async function runPerformanceTests() {
  console.log('🎯 Starting Performance Testing for Better Planner Dashboard');
  console.log('=' .repeat(60));
  
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const results = [];
  
  for (const pageTest of PAGES_TO_TEST) {
    const result = await testPagePerformance(pageTest.name, pageTest.url, browser);
    results.push(result);
    
    // Wait between tests to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  await browser.close();
  
  // Generate comprehensive summary report
  console.log('\n' + '='.repeat(60));
  console.log('📊 COMPREHENSIVE PERFORMANCE TEST SUMMARY');
  console.log('='.repeat(60));
  
  const successfulTests = results.filter(r => r.success);
  const failedTests = results.filter(r => !r.success);
  const authRequiredTests = successfulTests.filter(r => r.isSignInPage);
  const accessibleTests = successfulTests.filter(r => !r.isSignInPage);
  
  console.log(`✅ Successful Tests: ${successfulTests.length}/${results.length}`);
  console.log(`❌ Failed Tests: ${failedTests.length}/${results.length}`);
  console.log(`🔐 Authentication Required: ${authRequiredTests.length}/${successfulTests.length}`);
  console.log(`🚀 Accessible Pages: ${accessibleTests.length}/${successfulTests.length}`);
  
  if (successfulTests.length > 0) {
    const avgLoadTime = successfulTests.reduce((sum, r) => sum + r.loadTime, 0) / successfulTests.length;
    const avgMemoryUsage = successfulTests.reduce((sum, r) => sum + r.memoryUsage, 0) / successfulTests.length;
    const avgTotalSize = successfulTests.reduce((sum, r) => sum + r.totalSize, 0) / successfulTests.length;
    const avgResources = successfulTests.reduce((sum, r) => sum + r.totalResources, 0) / successfulTests.length;
    
    console.log(`\n📈 AVERAGE METRICS:`);
    console.log(`⏱️  Average Load Time: ${Math.round(avgLoadTime)}ms`);
    console.log(`📈 Average Memory Usage: ${Math.round(avgMemoryUsage)}MB`);
    console.log(`📦 Average Total Size: ${Math.round(avgTotalSize)}KB`);
    console.log(`📦 Average Resources: ${Math.round(avgResources)}`);
    
    if (accessibleTests.length > 0) {
      console.log('\n🏆 FASTEST ACCESSIBLE PAGES:');
      accessibleTests
        .sort((a, b) => a.loadTime - b.loadTime)
        .slice(0, 3)
        .forEach((test, index) => {
          console.log(`${index + 1}. ${test.pageName}: ${test.loadTime}ms (${test.totalSize}KB)`);
        });
      
      console.log('\n🐌 SLOWEST ACCESSIBLE PAGES:');
      accessibleTests
        .sort((a, b) => b.loadTime - a.loadTime)
        .slice(0, 3)
        .forEach((test, index) => {
          console.log(`${index + 1}. ${test.pageName}: ${test.loadTime}ms (${test.totalSize}KB)`);
        });
    }
    
    if (authRequiredTests.length > 0) {
      console.log('\n🔐 PAGES REQUIRING AUTHENTICATION:');
      authRequiredTests.forEach(test => {
        console.log(`- ${test.pageName}: ${test.loadTime}ms (${test.totalSize}KB)`);
      });
    }
  }
  
  if (failedTests.length > 0) {
    console.log('\n❌ FAILED TESTS:');
    failedTests.forEach(test => {
      console.log(`- ${test.pageName}: ${test.error}`);
    });
  }
  
  // Detailed performance analysis
  console.log('\n' + '='.repeat(60));
  console.log('📈 DETAILED PERFORMANCE ANALYSIS');
  console.log('='.repeat(60));
  
  const slowPages = successfulTests.filter(r => r.loadTime > 3000);
  const fastPages = successfulTests.filter(r => r.loadTime < 1000);
  const heavyPages = successfulTests.filter(r => r.totalSize > 500);
  const lightPages = successfulTests.filter(r => r.totalSize < 100);
  
  if (slowPages.length > 0) {
    console.log('\n⚠️  PAGES NEEDING OPTIMIZATION (>3s):');
    slowPages.forEach(page => {
      console.log(`- ${page.pageName}: ${page.loadTime}ms (${page.totalSize}KB, ${page.totalResources} resources)`);
    });
  }
  
  if (fastPages.length > 0) {
    console.log('\n✅ WELL-PERFORMING PAGES (<1s):');
    fastPages.forEach(page => {
      console.log(`- ${page.pageName}: ${page.loadTime}ms (${page.totalSize}KB, ${page.totalResources} resources)`);
    });
  }
  
  if (heavyPages.length > 0) {
    console.log('\n📦 HEAVY PAGES (>500KB):');
    heavyPages.forEach(page => {
      console.log(`- ${page.pageName}: ${page.totalSize}KB (JS: ${page.jsFiles}, CSS: ${page.cssFiles}, Images: ${page.images})`);
    });
  }
  
  if (lightPages.length > 0) {
    console.log('\n⚡ LIGHT PAGES (<100KB):');
    lightPages.forEach(page => {
      console.log(`- ${page.pageName}: ${page.totalSize}KB (JS: ${page.jsFiles}, CSS: ${page.cssFiles}, Images: ${page.images})`);
    });
  }
  
  // Component analysis
  console.log('\n' + '='.repeat(60));
  console.log('🧩 COMPONENT ANALYSIS');
  console.log('='.repeat(60));
  
  if (successfulTests.length > 0) {
    const avgComponents = {
      forms: Math.round(successfulTests.reduce((sum, r) => sum + r.components.forms, 0) / successfulTests.length),
      buttons: Math.round(successfulTests.reduce((sum, r) => sum + r.components.buttons, 0) / successfulTests.length),
      inputs: Math.round(successfulTests.reduce((sum, r) => sum + r.components.inputs, 0) / successfulTests.length),
      images: Math.round(successfulTests.reduce((sum, r) => sum + r.components.images, 0) / successfulTests.length),
      divs: Math.round(successfulTests.reduce((sum, r) => sum + r.components.divs, 0) / successfulTests.length),
      links: Math.round(successfulTests.reduce((sum, r) => sum + r.components.links, 0) / successfulTests.length)
    };
    
    console.log(`📊 Average Components per Page:`);
    console.log(`- Forms: ${avgComponents.forms}`);
    console.log(`- Buttons: ${avgComponents.buttons}`);
    console.log(`- Inputs: ${avgComponents.inputs}`);
    console.log(`- Images: ${avgComponents.images}`);
    console.log(`- Divs: ${avgComponents.divs}`);
    console.log(`- Links: ${avgComponents.links}`);
  }
  
  // Recommendations
  console.log('\n' + '='.repeat(60));
  console.log('💡 OPTIMIZATION RECOMMENDATIONS');
  console.log('='.repeat(60));
  
  if (authRequiredTests.length > 0) {
    console.log('🔐 Authentication Issues:');
    console.log('• Implement proper authentication flow for testing');
    console.log('• Consider using test credentials for automated testing');
    console.log('• Add authentication bypass for development testing');
  }
  
  if (slowPages.length > 0) {
    console.log('\n⚡ Performance Optimizations:');
    console.log('• Implement code splitting for heavy pages');
    console.log('• Use React.lazy() for component lazy loading');
    console.log('• Optimize bundle size with tree shaking');
    console.log('• Implement server-side rendering for complex pages');
    console.log('• Use Next.js Image component for image optimization');
  }
  
  if (heavyPages.length > 0) {
    console.log('\n📦 Resource Optimizations:');
    console.log('• Compress and optimize images');
    console.log('• Minify CSS and JavaScript files');
    console.log('• Implement proper caching strategies');
    console.log('• Use CDN for static assets');
    console.log('• Consider using WebP format for images');
  }
  
  console.log('\n🔧 General Improvements:');
  console.log('• Monitor memory usage and implement cleanup');
  console.log('• Use React.memo() for expensive components');
  console.log('• Implement proper error boundaries');
  console.log('• Add loading states for better UX');
  console.log('• Use performance monitoring tools');
  
  console.log('\n' + '='.repeat(60));
  console.log('🎯 Performance Testing Complete!');
  console.log('📊 Total Test Time: ~' + Math.round(results.length * 2.5) + ' seconds');
}

// Run the tests
runPerformanceTests().catch(console.error); 