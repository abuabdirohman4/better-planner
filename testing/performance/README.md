# 🚀 Performance Testing - Better Planner

## 📋 Overview

This directory contains comprehensive performance testing scripts for the Better Planner application using Puppeteer. The tests measure page load times, performance metrics, and authentication flows for admin dashboard pages.

## ⚙️ Configuration

### URLs
- **Local URL**: `http://localhost:3000` (default)
- **Production URL**: `https://planner.abuabdirohman.com/` (hardcoded in scripts)

### Test Credentials
- **Email**: `abuabdirohman4@gmail.com`
- **Password**: `123456`

## 🚀 Quick Start

### Prerequisites
- Node.js installed
- Puppeteer installed (`npm install puppeteer`)
- Better Planner app running locally or production URL

### Running Tests

#### Local Testing
```bash
# Test without authentication
npm run test:performance

# Test with authentication
npm run test:performance:auth

# Simple performance test
npm run test:performance:simple

# Investigate timeout issues
npm run test:performance:timeout

# Final comprehensive test
npm run test:performance:final
```

#### Production Testing
```bash
# Set production URL
export BASE_URL=https://planner.abuabdirohman.com

# Run any of the test commands above
npm run test:performance
```

#### Using Production URL Directly
All scripts now include the production URL as a constant. You can modify the scripts to use production by default by changing:
```javascript
const BASE_URL = process.env.BASE_URL || 'https://planner.abuabdirohman.com';
```

## 📁 Test Files

### 1. `performance-test.js`
- **Purpose**: Basic performance testing without authentication
- **Measures**: Load time, memory usage, performance metrics
- **Use Case**: Quick performance check

### 2. `performance-test-auth.js`
- **Purpose**: Performance testing with authentication
- **Measures**: Load time, auth flow, redirect performance
- **Use Case**: Testing authenticated pages

### 3. `simple-performance-test.js`
- **Purpose**: Simplified performance testing
- **Measures**: Basic load time and resource analysis
- **Use Case**: Quick overview of performance

### 4. `investigate-timeout.js`
- **Purpose**: Debug timeout and loading issues
- **Measures**: Detailed loading analysis, error detection
- **Use Case**: Troubleshooting slow pages

### 5. `final-performance-test.js`
- **Purpose**: Comprehensive performance testing
- **Measures**: All metrics, detailed analysis, recommendations
- **Use Case**: Complete performance audit

## 📊 Metrics Measured

### Performance Metrics
- **Load Time**: Total page load time
- **DOM Content Loaded**: Time to DOM ready
- **Load Complete**: Time to full page load
- **First Paint**: Time to first visual paint
- **First Contentful Paint**: Time to first content paint
- **Memory Usage**: JavaScript heap usage

### Resource Analysis
- **Total Resources**: Number of loaded resources
- **Resource Types**: JavaScript, CSS, images, fonts
- **Total Size**: Combined size of all resources
- **Error Count**: Number of failed resources

### Authentication Analysis
- **Auth Required**: Whether page requires authentication
- **Redirect Time**: Time taken for auth redirects
- **Login Success**: Whether authentication was successful

## 🎯 Tested Pages

The following admin dashboard pages are tested:

1. **Dashboard Main** (`/admin`)
2. **Dashboard Page** (`/admin/dashboard`)
3. **Daily Sync** (`/admin/execution/daily-sync`)
4. **Weekly Sync** (`/admin/execution/weekly-sync`)
5. **Vision** (`/admin/planning/vision`)
6. **Main Quests** (`/admin/planning/main-quests`)
7. **12 Week Quests** (`/admin/planning/12-week-quests`)
8. **Quests** (`/admin/planning/quests`)

## 📈 Expected Results

### Performance Targets
- **Load Time**: < 500ms (excellent), < 1000ms (good)
- **Memory Usage**: < 50MB
- **Resource Count**: < 20 resources
- **Error Count**: 0 errors

### Authentication Flow
- **Redirect Time**: < 200ms
- **Login Success Rate**: 100%
- **Session Persistence**: Maintained across pages

## 🔧 Customization

### Environment Variables
```bash
# Set custom base URL
export BASE_URL=https://your-domain.com

# Set custom credentials
export TEST_EMAIL=your-email@example.com
export TEST_PASSWORD=your-password
```

### Modifying Test Pages
Edit the `PAGES_TO_TEST` array in any script to add/remove pages:
```javascript
const PAGES_TO_TEST = [
  { name: 'Custom Page', url: `${BASE_URL}/custom-path` },
  // ... other pages
];
```

### Adjusting Timeouts
Modify timeout values for different environments:
```javascript
await page.goto(url, { 
  waitUntil: 'networkidle2',
  timeout: 30000 // 30 seconds
});
```

## 📊 Reading Results

### Console Output
Each test provides detailed console output including:
- Individual page metrics
- Summary statistics
- Performance rankings
- Error reports

### Performance Report
See `performance-report.md` for detailed analysis of test results.

## 🚨 Troubleshooting

### Common Issues

#### Authentication Failures
- Verify credentials are correct
- Check if login form selectors have changed
- Ensure app is running and accessible

#### Timeout Errors
- Increase timeout values for slower environments
- Check network connectivity
- Verify app is responding

#### Memory Issues
- Close browser between tests
- Reduce concurrent test count
- Monitor system resources

### Debug Mode
Run tests with debug logging:
```bash
DEBUG=puppeteer:* npm run test:performance
```

## 📚 Additional Resources

- [Puppeteer Documentation](https://pptr.dev/)
- [Performance Testing Best Practices](https://web.dev/performance/)
- [Better Planner Documentation](../docs/)

---

**Last Updated**: $(date)
**Version**: 1.0.0 