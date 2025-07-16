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

async function signIn(page) {
  console.log('🔐 Attempting to sign in...');
  
  try {
    // Go to signin page
    await page.goto(`${BASE_URL}/signin`, { waitUntil: 'networkidle2' });
    
    // Wait for form to load
    await page.waitForSelector('form', { timeout: 10000 });
    
    // Fill in credentials (you may need to adjust these selectors)
    await page.type('input[type="email"]', 'abuabdirohman4@gmail.com');
    await page.type('input[type="password"]', '123456');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for redirect or success
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 });
    
    console.log('✅ Sign in successful');
    return true;
  } catch (error) {
    console.log('❌ Sign in failed:', error.message);
    return false;
  }
}

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
    
    // Check for errors and get detailed network info
    const networkInfo = await page.evaluate(() => {
      const resources = window.performance.getEntriesByType('resource');
      const errors = resources.filter(entry => entry.name.includes('error') || entry.name.includes('failed'));
      
      // Get API calls specifically
      const apiCalls = resources.filter(entry => 
        entry.name.includes('/api/') || 
        entry.name.includes('daily-sync') || 
        entry.name.includes('weekly-sync') ||
        entry.name.includes('vision') ||
        entry.name.includes('quests')
      );
      
      return {
        totalResources: resources.length,
        errors: errors.length,
        apiCalls: apiCalls.map(call => ({
          name: call.name,
          duration: call.duration,
          startTime: call.startTime,
          transferSize: call.transferSize || 0
        })),
        totalApiTime: apiCalls.reduce((sum, call) => sum + call.duration, 0),
        slowestApiCall: apiCalls.length > 0 ? Math.max(...apiCalls.map(call => call.duration)) : 0
      };
    });
    
    // Check if we're on signin page (authentication required)
    const title = await page.title();
    const currentUrl = page.url();
    
    // More comprehensive authentication detection
    const hasSignInElements = await page.evaluate(() => {
      // Check for common sign-in form elements
      return !!(
        document.querySelector('input[type="email"]') ||
        document.querySelector('input[type="password"]') ||
        document.querySelector('form[action*="signin"]') ||
        document.querySelector('form[action*="login"]') ||
        document.querySelector('[data-testid="signin-form"]') ||
        document.querySelector('[data-testid="login-form"]')
      );
    });
    
    const isSignInPage = 
      title.includes('SignIn') || 
      title.includes('Sign In') || 
      title.includes('Login') ||
      currentUrl.includes('/signin') ||
      currentUrl.includes('/login') ||
      title === '' || // Empty title might indicate redirect
      hasSignInElements;
    
    console.log(`⏱️  Total Load Time: ${loadTime}ms`);
    console.log(`📊 DOM Content Loaded: ${performanceTiming.domContentLoaded}ms`);
    console.log(`📊 Load Complete: ${performanceTiming.loadComplete}ms`);
    console.log(`🎨 First Paint: ${performanceTiming.firstPaint}ms`);
    console.log(`🎨 First Contentful Paint: ${performanceTiming.firstContentfulPaint}ms`);
    console.log(`📈 Memory Usage: ${Math.round(metrics.JSHeapUsedSize / 1024 / 1024)}MB`);
    console.log(`❌ Errors: ${errors}`);
    console.log(`📄 Page Title: ${title}`);
    console.log(`🌐 Current URL: ${currentUrl}`);
    console.log(`🔐 Authentication Required: ${isSignInPage ? 'Yes' : 'No'}`);
    console.log(`🔍 Sign-in Elements Found: ${hasSignInElements ? 'Yes' : 'No'}`);
    
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
      isSignInPage,
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

async function testPagePerformanceWithAuth(pageName, url, authPage) {
  console.log(`\n🚀 Testing: ${pageName}`);
  console.log(`📍 URL: ${url}`);

  // --- Network request tracking ---
  const requests = [];
  const responses = [];
  const apiRequests = [];

  function isApiRequest(request) {
    const url = request.url();
    return (
      url.includes('/api/') ||
      url.includes('daily-sync') ||
      url.includes('weekly-sync') ||
      url.includes('vision') ||
      url.includes('quests')
    );
  }

  const requestMap = new Map();

  const onRequest = (request) => {
    if (isApiRequest(request)) {
      requestMap.set(request._requestId, { url: request.url(), startTime: Date.now() });
    }
  };
  const onResponse = async (response) => {
    const req = response.request();
    if (isApiRequest(req)) {
      const id = req._requestId;
      const entry = requestMap.get(id);
      if (entry) {
        entry.endTime = Date.now();
        entry.status = response.status();
        entry.duration = entry.endTime - entry.startTime;
        entry.size = parseInt(response.headers()['content-length'] || '0', 10);
        apiRequests.push(entry);
        requestMap.delete(id);
      }
    }
  };

  authPage.on('request', onRequest);
  authPage.on('response', onResponse);

  try {
    const startTime = Date.now();
    await authPage.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    const loadTime = Date.now() - startTime;

    // Tunggu 5 detik setelah page load untuk menangkap fetch/polling
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Lepas event listener agar tidak bocor
    authPage.off('request', onRequest);
    authPage.off('response', onResponse);

    // Get performance metrics
    const metrics = await authPage.metrics();
    const performanceTiming = await authPage.evaluate(() => {
      const timing = performance.timing;
      return {
        domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
        loadComplete: timing.loadEventEnd - timing.navigationStart,
        firstPaint: performance.getEntriesByType('paint')[0]?.startTime || 0,
        firstContentfulPaint: performance.getEntriesByType('paint')[1]?.startTime || 0
      };
    });

    // Check if we're on signin page (authentication required)
    const title = await authPage.title();
    const currentUrl = authPage.url();
    const hasSignInElements = await authPage.evaluate(() => {
      return !!(
        document.querySelector('input[type="email"]') ||
        document.querySelector('input[type="password"]') ||
        document.querySelector('form[action*="signin"]') ||
        document.querySelector('form[action*="login"]') ||
        document.querySelector('[data-testid="signin-form"]') ||
        document.querySelector('[data-testid="login-form"]')
      );
    });
    const isSignInPage =
      title.includes('SignIn') ||
      title.includes('Sign In') ||
      title.includes('Login') ||
      currentUrl.includes('/signin') ||
      currentUrl.includes('/login') ||
      title === '' ||
      hasSignInElements;

    // --- Output summary mirip Network tab ---
    if (apiRequests.length > 0) {
      console.log('\nAPI Request Summary:');
      apiRequests.forEach((req) => {
        console.log(`- ${req.url} | Status: ${req.status} | Size: ${req.size}B | Duration: ${(req.duration / 1000).toFixed(2)}s`);
      });
      const slowest = apiRequests.reduce((a, b) => (a.duration > b.duration ? a : b));
      console.log(`🐌 Slowest API: ${slowest.url} (${(slowest.duration / 1000).toFixed(2)}s)`);
    } else {
      console.log('No API requests detected.');
    }

    console.log(`\n⏱️  Total Load Time: ${loadTime}ms`);
    console.log(`📊 DOM Content Loaded: ${performanceTiming.domContentLoaded}ms`);
    console.log(`📊 Load Complete: ${performanceTiming.loadComplete}ms`);
    console.log(`🎨 First Paint: ${performanceTiming.firstPaint}ms`);
    console.log(`🎨 First Contentful Paint: ${performanceTiming.firstContentfulPaint}ms`);
    console.log(`📈 Memory Usage: ${Math.round(metrics.JSHeapUsedSize / 1024 / 1024)}MB`);
    console.log(`📄 Page Title: ${title}`);
    console.log(`🌐 Current URL: ${currentUrl}`);
    console.log(`🔐 Authentication Required: ${isSignInPage ? 'Yes' : 'No'}`);
    console.log(`🔍 Sign-in Elements Found: ${hasSignInElements ? 'Yes' : 'No'}`);

    return {
      pageName,
      url,
      loadTime,
      domContentLoaded: performanceTiming.domContentLoaded,
      loadComplete: performanceTiming.loadComplete,
      firstPaint: performanceTiming.firstPaint,
      firstContentfulPaint: performanceTiming.firstContentfulPaint,
      memoryUsage: Math.round(metrics.JSHeapUsedSize / 1024 / 1024),
      title,
      isSignInPage,
      apiRequests,
      success: true
    };
  } catch (error) {
    authPage.off('request', onRequest);
    authPage.off('response', onResponse);
    console.log(`❌ Error loading ${pageName}: ${error.message}`);
    return {
      pageName,
      url,
      error: error.message,
      success: false
    };
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
  
  // First, try to sign in and keep the authenticated page
  const authPage = await browser.newPage();
  const signInSuccess = await signIn(authPage);
  
  if (!signInSuccess) {
    console.log('⚠️  Proceeding with tests without authentication...');
    await authPage.close();
  } else {
    console.log('✅ Authentication successful, using authenticated session');
  }
  
  for (const pageTest of PAGES_TO_TEST) {
    let result;
    if (signInSuccess) {
      // Use the authenticated page for testing
      result = await testPagePerformanceWithAuth(pageTest.name, pageTest.url, authPage);
    } else {
      // Use new page without authentication
      result = await testPagePerformance(pageTest.name, pageTest.url, browser);
    }
    results.push(result);
    
    // Wait between tests to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  if (signInSuccess) {
    await authPage.close();
  }
  await browser.close();
  
  // Generate summary report
  console.log('\n' + '='.repeat(60));
  console.log('📊 PERFORMANCE TEST SUMMARY');
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
    
    console.log(`⏱️  Average Load Time: ${Math.round(avgLoadTime)}ms`);
    console.log(`📈 Average Memory Usage: ${Math.round(avgMemoryUsage)}MB`);
    
    if (accessibleTests.length > 0) {
      console.log('\n🏆 FASTEST ACCESSIBLE PAGES:');
      accessibleTests
        .sort((a, b) => a.loadTime - b.loadTime)
        .slice(0, 3)
        .forEach((test, index) => {
          console.log(`${index + 1}. ${test.pageName}: ${test.loadTime}ms`);
        });
      
      console.log('\n🐌 SLOWEST ACCESSIBLE PAGES:');
      accessibleTests
        .sort((a, b) => b.loadTime - a.loadTime)
        .slice(0, 3)
        .forEach((test, index) => {
          console.log(`${index + 1}. ${test.pageName}: ${test.loadTime}ms`);
        });
    }
    
    if (authRequiredTests.length > 0) {
      console.log('\n🔐 PAGES REQUIRING AUTHENTICATION:');
      authRequiredTests.forEach(test => {
        console.log(`- ${test.pageName}: ${test.loadTime}ms`);
      });
    }
  }
  
  if (failedTests.length > 0) {
    console.log('\n❌ FAILED TESTS:');
    failedTests.forEach(test => {
      console.log(`- ${test.pageName}: ${test.error}`);
    });
  }
  
  // Performance analysis
  console.log('\n' + '='.repeat(60));
  console.log('📈 PERFORMANCE ANALYSIS');
  console.log('='.repeat(60));
  
  const slowPages = successfulTests.filter(r => r.loadTime > 3000);
  const fastPages = successfulTests.filter(r => r.loadTime < 1000);
  
  if (slowPages.length > 0) {
    console.log('\n⚠️  PAGES NEEDING OPTIMIZATION (>3s):');
    slowPages.forEach(page => {
      console.log(`- ${page.pageName}: ${page.loadTime}ms`);
    });
  }
  
  if (fastPages.length > 0) {
    console.log('\n✅ WELL-PERFORMING PAGES (<1s):');
    fastPages.forEach(page => {
      console.log(`- ${page.pageName}: ${page.loadTime}ms`);
    });
  }
  
  console.log('\n💡 RECOMMENDATIONS:');
  if (authRequiredTests.length > 0) {
    console.log('• Implement proper authentication flow for testing');
    console.log('• Consider using test credentials for automated testing');
  }
  
  if (slowPages.length > 0) {
    console.log('• Optimize slow pages with code splitting');
    console.log('• Implement lazy loading for heavy components');
    console.log('• Consider server-side rendering for complex pages');
  }
  
  console.log('• Monitor memory usage and implement cleanup');
  console.log('• Use Next.js Image component for image optimization');
  console.log('• Implement proper caching strategies');
  
  console.log('\n' + '='.repeat(60));
  console.log('🎯 Performance Testing Complete!');
}

// Run the tests
runPerformanceTests().catch(console.error); 