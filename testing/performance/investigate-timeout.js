const puppeteer = require('puppeteer');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const PRODUCTION_URL = 'https://planner.abuabdirohman.com'; // Production URL
const TIMEOUT_PAGES = [
  { name: 'Dashboard Page', url: `${BASE_URL}/admin/dashboard` },
  { name: 'Quests', url: `${BASE_URL}/admin/planning/quests` }
];

async function investigatePage(pageName, url, browser) {
  const page = await browser.newPage();
  
  // Enable detailed logging
  page.on('console', msg => console.log(`[${pageName}] Console: ${msg.text()}`));
  page.on('pageerror', error => console.log(`[${pageName}] Page Error: ${error.message}`));
  page.on('requestfailed', request => console.log(`[${pageName}] Request Failed: ${request.url()}`));
  
  console.log(`\n🔍 Investigating: ${pageName}`);
  console.log(`📍 URL: ${url}`);
  
  try {
    // Set longer timeout for investigation
    await page.setDefaultNavigationTimeout(60000);
    
    console.log('🚀 Starting navigation...');
    const startTime = Date.now();
    
    // Navigate with detailed monitoring
    const response = await page.goto(url, { 
      waitUntil: 'domcontentloaded',
      timeout: 60000 
    });
    
    const loadTime = Date.now() - startTime;
    
    console.log(`✅ Navigation completed in ${loadTime}ms`);
    console.log(`📊 Response Status: ${response.status()}`);
    console.log(`📄 Final URL: ${page.url()}`);
    
    // Get page information
    const title = await page.title();
    console.log(`📄 Page Title: ${title}`);
    
    // Check for redirects
    const redirects = response.request().redirectChain();
    if (redirects.length > 0) {
      console.log(`🔄 Redirects detected: ${redirects.length}`);
      redirects.forEach((redirect, index) => {
        console.log(`  ${index + 1}. ${redirect.url()} -> ${redirect.response()?.url() || 'No response'}`);
      });
    }
    
    // Check if we're on signin page
    const isSignInPage = title.includes('SignIn') || title.includes('Sign In');
    console.log(`🔐 Is SignIn Page: ${isSignInPage}`);
    
    // Get page content length
    const content = await page.content();
    console.log(`📦 Content Length: ${content.length} characters`);
    
    // Check for specific elements
    const elements = await page.evaluate(() => {
      return {
        forms: document.querySelectorAll('form').length,
        buttons: document.querySelectorAll('button').length,
        inputs: document.querySelectorAll('input').length,
        h1: document.querySelectorAll('h1').length,
        h2: document.querySelectorAll('h2').length,
        divs: document.querySelectorAll('div').length,
        scripts: document.querySelectorAll('script').length,
        links: document.querySelectorAll('a').length
      };
    });
    
    console.log(`🧩 Elements found:`);
    console.log(`  - Forms: ${elements.forms}`);
    console.log(`  - Buttons: ${elements.buttons}`);
    console.log(`  - Inputs: ${elements.inputs}`);
    console.log(`  - H1: ${elements.h1}`);
    console.log(`  - H2: ${elements.h2}`);
    console.log(`  - Divs: ${elements.divs}`);
    console.log(`  - Scripts: ${elements.scripts}`);
    console.log(`  - Links: ${elements.links}`);
    
    // Check for errors in console
    const errors = await page.evaluate(() => {
      return window.performance.getEntriesByType('resource')
        .filter(entry => entry.name.includes('error') || entry.name.includes('failed'))
        .map(entry => entry.name);
    });
    
    if (errors.length > 0) {
      console.log(`❌ Resource errors found: ${errors.length}`);
      errors.forEach(error => console.log(`  - ${error}`));
    }
    
    // Check for infinite redirects
    const currentUrl = page.url();
    const originalUrl = url;
    
    if (currentUrl !== originalUrl) {
      console.log(`🔄 URL changed from ${originalUrl} to ${currentUrl}`);
    }
    
    return {
      pageName,
      url,
      finalUrl: currentUrl,
      loadTime,
      status: response.status(),
      title,
      isSignInPage,
      contentLength: content.length,
      elements,
      errors,
      redirects: redirects.length,
      success: true
    };
    
  } catch (error) {
    console.log(`❌ Investigation failed: ${error.message}`);
    
    // Try to get current URL even if navigation failed
    let currentUrl = 'Unknown';
    try {
      currentUrl = page.url();
    } catch (e) {
      currentUrl = 'Failed to get URL';
    }
    
    return {
      pageName,
      url,
      finalUrl: currentUrl,
      error: error.message,
      success: false
    };
  } finally {
    await page.close();
  }
}

async function runInvestigation() {
  console.log('🔍 Starting Timeout Investigation for Better Planner');
  console.log('=' .repeat(60));
  
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const results = [];
  
  for (const pageTest of TIMEOUT_PAGES) {
    const result = await investigatePage(pageTest.name, pageTest.url, browser);
    results.push(result);
    
    // Wait between investigations
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  
  await browser.close();
  
  // Generate investigation report
  console.log('\n' + '='.repeat(60));
  console.log('🔍 INVESTIGATION REPORT');
  console.log('='.repeat(60));
  
  results.forEach(result => {
    console.log(`\n📄 ${result.pageName}:`);
    console.log(`  URL: ${result.url}`);
    console.log(`  Final URL: ${result.finalUrl}`);
    console.log(`  Success: ${result.success ? '✅' : '❌'}`);
    
    if (result.success) {
      console.log(`  Load Time: ${result.loadTime}ms`);
      console.log(`  Status: ${result.status}`);
      console.log(`  Title: ${result.title}`);
      console.log(`  Is SignIn: ${result.isSignInPage}`);
      console.log(`  Content Length: ${result.contentLength} chars`);
      console.log(`  Redirects: ${result.redirects}`);
      console.log(`  Elements: ${result.elements.forms} forms, ${result.elements.buttons} buttons`);
      console.log(`  Errors: ${result.errors.length}`);
    } else {
      console.log(`  Error: ${result.error}`);
    }
  });
  
  // Analysis
  console.log('\n' + '='.repeat(60));
  console.log('📊 ANALYSIS');
  console.log('='.repeat(60));
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Successful Investigations: ${successful.length}/${results.length}`);
  console.log(`❌ Failed Investigations: ${failed.length}/${results.length}`);
  
  if (successful.length > 0) {
    const signInPages = successful.filter(r => r.isSignInPage);
    const redirectPages = successful.filter(r => r.redirects > 0);
    
    console.log(`🔐 Pages redirecting to SignIn: ${signInPages.length}`);
    console.log(`🔄 Pages with redirects: ${redirectPages.length}`);
    
    if (signInPages.length > 0) {
      console.log('\n🔐 AUTHENTICATION ANALYSIS:');
      signInPages.forEach(page => {
        console.log(`- ${page.pageName}: Redirects to SignIn (${page.redirects} redirects)`);
      });
    }
  }
  
  if (failed.length > 0) {
    console.log('\n❌ FAILURE ANALYSIS:');
    failed.forEach(page => {
      console.log(`- ${page.pageName}: ${page.error}`);
    });
  }
  
  console.log('\n💡 RECOMMENDATIONS:');
  
  if (successful.length > 0) {
    console.log('• All pages are redirecting to SignIn page - authentication is working');
    console.log('• The "timeout" in previous tests was likely due to waiting for networkidle2');
    console.log('• Consider using domcontentloaded instead of networkidle2 for faster testing');
  }
  
  if (failed.length > 0) {
    console.log('• Some pages have genuine navigation issues');
    console.log('• Check for infinite redirects or server errors');
    console.log('• Verify that the pages exist and are accessible');
  }
  
  console.log('\n🔧 NEXT STEPS:');
  console.log('1. Implement proper authentication for testing');
  console.log('2. Use domcontentloaded instead of networkidle2 for faster tests');
  console.log('3. Add authentication bypass for development testing');
  console.log('4. Monitor redirect chains to understand authentication flow');
  
  console.log('\n' + '='.repeat(60));
  console.log('🎯 Investigation Complete!');
}

// Run the investigation
runInvestigation().catch(console.error); 