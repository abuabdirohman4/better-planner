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
    
    // Check for errors
    const errors = await page.evaluate(() => {
      return window.performance.getEntriesByType('resource')
        .filter(entry => entry.name.includes('error') || entry.name.includes('failed'))
        .length;
    });
    
    // Check if page loaded successfully
    const title = await page.title();
    console.log(`⏱️  Total Load Time: ${loadTime}ms`);
    console.log(`📊 DOM Content Loaded: ${performanceTiming.domContentLoaded}ms`);
    console.log(`📊 Load Complete: ${performanceTiming.loadComplete}ms`);
    console.log(`🎨 First Paint: ${performanceTiming.firstPaint}ms`);
    console.log(`🎨 First Contentful Paint: ${performanceTiming.firstContentfulPaint}ms`);
    console.log(`📈 Memory Usage: ${Math.round(metrics.JSHeapUsedSize / 1024 / 1024)}MB`);
    console.log(`❌ Errors: ${errors}`);
    console.log(`📄 Page Title: ${title}`);
    
    return {
      pageName,
      url,
      loadTime,
      domContentLoaded: performanceTiming.domContentLoaded,
      loadComplete: performanceTiming.loadComplete,
      firstPaint: performanceTiming.firstPaint,
      firstContentfulPaint: performanceTiming.firstContentfulPaint,
      memoryUsage: Math.round(metrics.JSHeapUsedSize / 1024 / 1024),
      errors,
      title,
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
  
  for (const page of PAGES_TO_TEST) {
    const result = await testPagePerformance(page.name, page.url, browser);
    results.push(result);
    
    // Wait between tests to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  await browser.close();
  
  // Generate summary report
  console.log('\n' + '='.repeat(60));
  console.log('📊 PERFORMANCE TEST SUMMARY');
  console.log('='.repeat(60));
  
  const successfulTests = results.filter(r => r.success);
  const failedTests = results.filter(r => !r.success);
  
  if (successfulTests.length > 0) {
    const avgLoadTime = successfulTests.reduce((sum, r) => sum + r.loadTime, 0) / successfulTests.length;
    const avgMemoryUsage = successfulTests.reduce((sum, r) => sum + r.memoryUsage, 0) / successfulTests.length;
    
    console.log(`✅ Successful Tests: ${successfulTests.length}/${results.length}`);
    console.log(`❌ Failed Tests: ${failedTests.length}/${results.length}`);
    console.log(`⏱️  Average Load Time: ${Math.round(avgLoadTime)}ms`);
    console.log(`📈 Average Memory Usage: ${Math.round(avgMemoryUsage)}MB`);
    
    console.log('\n🏆 FASTEST PAGES:');
    successfulTests
      .sort((a, b) => a.loadTime - b.loadTime)
      .slice(0, 3)
      .forEach((test, index) => {
        console.log(`${index + 1}. ${test.pageName}: ${test.loadTime}ms`);
      });
    
    console.log('\n🐌 SLOWEST PAGES:');
    successfulTests
      .sort((a, b) => b.loadTime - a.loadTime)
      .slice(0, 3)
      .forEach((test, index) => {
        console.log(`${index + 1}. ${test.pageName}: ${test.loadTime}ms`);
      });
  }
  
  if (failedTests.length > 0) {
    console.log('\n❌ FAILED TESTS:');
    failedTests.forEach(test => {
      console.log(`- ${test.pageName}: ${test.error}`);
    });
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('🎯 Performance Testing Complete!');
}

// Run the tests
runPerformanceTests().catch(console.error); 