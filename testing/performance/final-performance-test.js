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
    
    // Navigate to page and wait for DOM content loaded (faster than networkidle2)
    const response = await page.goto(url, { 
      waitUntil: 'domcontentloaded',
      timeout: 15000 
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
        fonts: entries.filter(e => e.name.includes('.woff') || e.name.includes('.ttf')).length,
        totalSize: entries.reduce((sum, e) => sum + (e.transferSize || 0), 0),
        failedResources: entries.filter(e => e.name.includes('error') || e.name.includes('failed')).length
      };
    });
    
    // Get page information
    const title = await page.title();
    const isSignInPage = title.includes('SignIn') || title.includes('Sign In');
    const finalUrl = page.url();
    const hasRedirect = finalUrl !== url;
    
    // Check for specific components
    const components = await page.evaluate(() => {
      const elements = {
        forms: document.querySelectorAll('form').length,
        buttons: document.querySelectorAll('button').length,
        inputs: document.querySelectorAll('input').length,
        images: document.querySelectorAll('img').length,
        divs: document.querySelectorAll('div').length,
        links: document.querySelectorAll('a').length,
        h1: document.querySelectorAll('h1').length,
        h2: document.querySelectorAll('h2').length,
        h3: document.querySelectorAll('h3').length,
        scripts: document.querySelectorAll('script').length,
        stylesheets: document.querySelectorAll('link[rel="stylesheet"]').length
      };
      return elements;
    });
    
    // Get page content length
    const content = await page.content();
    
    console.log(`⏱️  Total Load Time: ${loadTime}ms`);
    console.log(`📊 DOM Content Loaded: ${performanceTiming.domContentLoaded}ms`);
    console.log(`📊 Load Complete: ${performanceTiming.loadComplete}ms`);
    console.log(`🎨 First Paint: ${performanceTiming.firstPaint}ms`);
    console.log(`🎨 First Contentful Paint: ${performanceTiming.firstContentfulPaint}ms`);
    console.log(`📈 Memory Usage: ${Math.round(metrics.JSHeapUsedSize / 1024 / 1024)}MB`);
    console.log(`📦 Total Resources: ${resources.totalResources} (JS: ${resources.jsFiles}, CSS: ${resources.cssFiles}, Images: ${resources.images}, Fonts: ${resources.fonts})`);
    console.log(`📦 Total Size: ${Math.round(resources.totalSize / 1024)}KB`);
    console.log(`❌ Failed Resources: ${resources.failedResources}`);
    console.log(`📄 Page Title: ${title}`);
    console.log(`🔗 Final URL: ${finalUrl}`);
    console.log(`🔄 Has Redirect: ${hasRedirect ? 'Yes' : 'No'}`);
    console.log(`🔐 Authentication Required: ${isSignInPage ? 'Yes' : 'No'}`);
    console.log(`📦 Content Length: ${content.length} characters`);
    console.log(`🧩 Components: Forms(${components.forms}), Buttons(${components.buttons}), Inputs(${components.inputs}), Images(${components.images})`);
    
    return {
      pageName,
      url,
      finalUrl,
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
      fonts: resources.fonts,
      totalSize: Math.round(resources.totalSize / 1024),
      failedResources: resources.failedResources,
      title,
      isSignInPage,
      hasRedirect,
      contentLength: content.length,
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
  console.log('🎯 Starting Final Performance Testing for Better Planner Dashboard');
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
  console.log('📊 FINAL PERFORMANCE TEST SUMMARY');
  console.log('='.repeat(60));
  
  const successfulTests = results.filter(r => r.success);
  const failedTests = results.filter(r => !r.success);
  const authRequiredTests = successfulTests.filter(r => r.isSignInPage);
  const accessibleTests = successfulTests.filter(r => !r.isSignInPage);
  const redirectTests = successfulTests.filter(r => r.hasRedirect);
  
  console.log(`✅ Successful Tests: ${successfulTests.length}/${results.length}`);
  console.log(`❌ Failed Tests: ${failedTests.length}/${results.length}`);
  console.log(`🔐 Authentication Required: ${authRequiredTests.length}/${successfulTests.length}`);
  console.log(`🚀 Accessible Pages: ${accessibleTests.length}/${successfulTests.length}`);
  console.log(`🔄 Pages with Redirects: ${redirectTests.length}/${successfulTests.length}`);
  
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
    
    // Performance categories
    const fastPages = successfulTests.filter(r => r.loadTime < 1000);
    const mediumPages = successfulTests.filter(r => r.loadTime >= 1000 && r.loadTime < 2000);
    const slowPages = successfulTests.filter(r => r.loadTime >= 2000);
    
    console.log(`\n⚡ FAST PAGES (<1s): ${fastPages.length}`);
    console.log(`⚡ MEDIUM PAGES (1-2s): ${mediumPages.length}`);
    console.log(`🐌 SLOW PAGES (>2s): ${slowPages.length}`);
    
    if (fastPages.length > 0) {
      console.log('\n🏆 FASTEST PAGES:');
      fastPages
        .sort((a, b) => a.loadTime - b.loadTime)
        .forEach((test, index) => {
          console.log(`${index + 1}. ${test.pageName}: ${test.loadTime}ms (${test.totalSize}KB)`);
        });
    }
    
    if (slowPages.length > 0) {
      console.log('\n🐌 SLOWEST PAGES:');
      slowPages
        .sort((a, b) => b.loadTime - a.loadTime)
        .forEach((test, index) => {
          console.log(`${index + 1}. ${test.pageName}: ${test.loadTime}ms (${test.totalSize}KB)`);
        });
    }
  }
  
  if (failedTests.length > 0) {
    console.log('\n❌ FAILED TESTS:');
    failedTests.forEach(test => {
      console.log(`- ${test.pageName}: ${test.error}`);
    });
  }
  
  // Detailed analysis
  console.log('\n' + '='.repeat(60));
  console.log('📈 DETAILED ANALYSIS');
  console.log('='.repeat(60));
  
  if (successfulTests.length > 0) {
    // Resource analysis
    const heavyPages = successfulTests.filter(r => r.totalSize > 200);
    const lightPages = successfulTests.filter(r => r.totalSize < 100);
    
    if (heavyPages.length > 0) {
      console.log('\n📦 HEAVY PAGES (>200KB):');
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
    const avgComponents = {
      forms: Math.round(successfulTests.reduce((sum, r) => sum + r.components.forms, 0) / successfulTests.length),
      buttons: Math.round(successfulTests.reduce((sum, r) => sum + r.components.buttons, 0) / successfulTests.length),
      inputs: Math.round(successfulTests.reduce((sum, r) => sum + r.components.inputs, 0) / successfulTests.length),
      images: Math.round(successfulTests.reduce((sum, r) => sum + r.components.images, 0) / successfulTests.length),
      divs: Math.round(successfulTests.reduce((sum, r) => sum + r.components.divs, 0) / successfulTests.length),
      links: Math.round(successfulTests.reduce((sum, r) => sum + r.components.links, 0) / successfulTests.length)
    };
    
    console.log(`\n🧩 AVERAGE COMPONENTS PER PAGE:`);
    console.log(`- Forms: ${avgComponents.forms}`);
    console.log(`- Buttons: ${avgComponents.buttons}`);
    console.log(`- Inputs: ${avgComponents.inputs}`);
    console.log(`- Images: ${avgComponents.images}`);
    console.log(`- Divs: ${avgComponents.divs}`);
    console.log(`- Links: ${avgComponents.links}`);
  }
  
  // Performance recommendations
  console.log('\n' + '='.repeat(60));
  console.log('💡 PERFORMANCE RECOMMENDATIONS');
  console.log('='.repeat(60));
  
  if (authRequiredTests.length > 0) {
    console.log('🔐 AUTHENTICATION:');
    console.log('• All pages require authentication - this is expected behavior');
    console.log('• Consider implementing test authentication for automated testing');
    console.log('• Add authentication bypass for development environment');
  }
  
  if (successfulTests.length > 0) {
    const avgLoadTime = successfulTests.reduce((sum, r) => sum + r.loadTime, 0) / successfulTests.length;
    
    if (avgLoadTime > 2000) {
      console.log('\n⚡ PERFORMANCE OPTIMIZATION:');
      console.log('• Average load time is above 2 seconds - needs optimization');
      console.log('• Implement code splitting and lazy loading');
      console.log('• Optimize bundle size with tree shaking');
      console.log('• Use Next.js Image component for image optimization');
    } else if (avgLoadTime > 1000) {
      console.log('\n⚡ PERFORMANCE IMPROVEMENT:');
      console.log('• Average load time is acceptable but can be improved');
      console.log('• Consider implementing lazy loading for heavy components');
      console.log('• Optimize resource loading');
    } else {
      console.log('\n✅ PERFORMANCE STATUS:');
      console.log('• Excellent performance! Average load time is under 1 second');
      console.log('• Continue monitoring for any performance regressions');
    }
  }
  
  console.log('\n🔧 GENERAL RECOMMENDATIONS:');
  console.log('• Monitor memory usage and implement cleanup');
  console.log('• Use React.memo() for expensive components');
  console.log('• Implement proper error boundaries');
  console.log('• Add loading states for better UX');
  console.log('• Use performance monitoring tools');
  console.log('• Implement proper caching strategies');
  
  console.log('\n' + '='.repeat(60));
  console.log('🎯 Final Performance Testing Complete!');
  console.log(`📊 Total Test Time: ~${Math.round(results.length * 2.5)} seconds`);
  console.log(`📈 Overall Performance Rating: ${getPerformanceRating(successfulTests)}/10`);
}

function getPerformanceRating(tests) {
  if (tests.length === 0) return 0;
  
  const avgLoadTime = tests.reduce((sum, r) => sum + r.loadTime, 0) / tests.length;
  
  if (avgLoadTime < 1000) return 9;
  if (avgLoadTime < 1500) return 8;
  if (avgLoadTime < 2000) return 7;
  if (avgLoadTime < 2500) return 6;
  if (avgLoadTime < 3000) return 5;
  if (avgLoadTime < 4000) return 4;
  if (avgLoadTime < 5000) return 3;
  return 2;
}

// Run the tests
runPerformanceTests().catch(console.error); 