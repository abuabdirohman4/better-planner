/**
 * Performance Analysis Utilities
 * Provides functions to analyze and generate insights from performance data
 */

import type { PerformanceMetrics } from './performanceUtils';

export interface PerformanceAnalysis {
  summary: {
    totalPages: number;
    averageLoadTime: number;
    fastestPage: string;
    slowestPage: string;
    cacheHitRate: number;
    networkEfficiency: number;
  };
  trends: {
    loadTimeTrend: 'improving' | 'degrading' | 'stable';
    cacheEfficiencyTrend: 'improving' | 'degrading' | 'stable';
    networkOptimizationTrend: 'improving' | 'degrading' | 'stable';
  };
  recommendations: string[];
  alerts: {
    type: 'warning' | 'error' | 'info';
    message: string;
    page?: string;
  }[];
}

/**
 * Analyze performance metrics and generate insights
 */
export function analyzePerformance(metrics: PerformanceMetrics[]): PerformanceAnalysis {
  if (metrics.length === 0) {
    return {
      summary: {
        totalPages: 0,
        averageLoadTime: 0,
        fastestPage: '',
        slowestPage: '',
        cacheHitRate: 0,
        networkEfficiency: 0,
      },
      trends: {
        loadTimeTrend: 'stable',
        cacheEfficiencyTrend: 'stable',
        networkOptimizationTrend: 'stable',
      },
      recommendations: ['No data available for analysis'],
      alerts: [],
    };
  }

  // Calculate summary statistics
  const loadTimes = metrics.map(m => m.loadTime);
  const cacheHitRates = metrics.map(m => m.cacheHitRate);
  const networkRequests = metrics.map(m => m.networkRequests);

  const averageLoadTime = loadTimes.reduce((a, b) => a + b, 0) / loadTimes.length;
  const averageCacheHitRate = cacheHitRates.reduce((a, b) => a + b, 0) / cacheHitRates.length;
  const averageNetworkRequests = networkRequests.reduce((a, b) => a + b, 0) / networkRequests.length;

  // Find fastest and slowest pages
  const pageStats = metrics.reduce((acc, metric) => {
    if (!acc[metric.pageName]) {
      acc[metric.pageName] = {
        loadTimes: [],
        cacheHitRates: [],
        networkRequests: [],
      };
    }
    acc[metric.pageName].loadTimes.push(metric.loadTime);
    acc[metric.pageName].cacheHitRates.push(metric.cacheHitRate);
    acc[metric.pageName].networkRequests.push(metric.networkRequests);
    return acc;
  }, {} as Record<string, { loadTimes: number[]; cacheHitRates: number[]; networkRequests: number[]; }>);

  const pageAverages = Object.entries(pageStats).map(([page, stats]) => ({
    page,
    avgLoadTime: stats.loadTimes.reduce((a, b) => a + b, 0) / stats.loadTimes.length,
    avgCacheHitRate: stats.cacheHitRates.reduce((a, b) => a + b, 0) / stats.cacheHitRates.length,
    avgNetworkRequests: stats.networkRequests.reduce((a, b) => a + b, 0) / stats.networkRequests.length,
  }));

  const fastestPage = pageAverages.reduce((min, current) => 
    current.avgLoadTime < min.avgLoadTime ? current : min
  ).page;

  const slowestPage = pageAverages.reduce((max, current) => 
    current.avgLoadTime > max.avgLoadTime ? current : max
  ).page;

  // Calculate trends (simplified - compare first half vs second half)
  const midPoint = Math.floor(metrics.length / 2);
  const firstHalf = metrics.slice(0, midPoint);
  const secondHalf = metrics.slice(midPoint);

  const firstHalfAvgLoadTime = firstHalf.reduce((sum, m) => sum + m.loadTime, 0) / firstHalf.length;
  const secondHalfAvgLoadTime = secondHalf.reduce((sum, m) => sum + m.loadTime, 0) / secondHalf.length;

  const firstHalfAvgCacheHitRate = firstHalf.reduce((sum, m) => sum + m.cacheHitRate, 0) / firstHalf.length;
  const secondHalfAvgCacheHitRate = secondHalf.reduce((sum, m) => sum + m.cacheHitRate, 0) / secondHalf.length;

  const firstHalfAvgNetworkRequests = firstHalf.reduce((sum, m) => sum + m.networkRequests, 0) / firstHalf.length;
  const secondHalfAvgNetworkRequests = secondHalf.reduce((sum, m) => sum + m.networkRequests, 0) / secondHalf.length;

  // Generate recommendations
  const recommendations: string[] = [];
  const alerts: { type: 'warning' | 'error' | 'info'; message: string; page?: string }[] = [];

  // Load time recommendations
  if (averageLoadTime > 3000) {
    recommendations.push('Consider optimizing page load times - current average is above 3 seconds');
    alerts.push({
      type: 'warning',
      message: `Average load time is ${averageLoadTime.toFixed(0)}ms, which is above recommended 3 seconds`,
    });
  } else if (averageLoadTime < 1000) {
    recommendations.push('Excellent load times! Consider maintaining current optimization strategies');
  }

  // Cache efficiency recommendations
  if (averageCacheHitRate < 0.5) {
    recommendations.push('Cache hit rate is low - consider implementing more aggressive caching strategies');
    alerts.push({
      type: 'warning',
      message: `Cache hit rate is ${(averageCacheHitRate * 100).toFixed(1)}%, which is below recommended 50%`,
    });
  } else if (averageCacheHitRate > 0.8) {
    recommendations.push('Great cache efficiency! Your caching strategy is working well');
  }

  // Network optimization recommendations
  if (averageNetworkRequests > 20) {
    recommendations.push('High number of network requests - consider bundling or reducing API calls');
    alerts.push({
      type: 'info',
      message: `Average network requests is ${averageNetworkRequests.toFixed(0)}, consider optimization`,
    });
  }

  // Page-specific recommendations
  pageAverages.forEach(({ page, avgLoadTime, avgCacheHitRate, avgNetworkRequests }) => {
    if (avgLoadTime > 5000) {
      alerts.push({
        type: 'error',
        message: `Page "${page}" has very slow load time: ${avgLoadTime.toFixed(0)}ms`,
        page,
      });
    }

    if (avgCacheHitRate < 0.3) {
      alerts.push({
        type: 'warning',
        message: `Page "${page}" has low cache hit rate: ${(avgCacheHitRate * 100).toFixed(1)}%`,
        page,
      });
    }

    if (avgNetworkRequests > 30) {
      alerts.push({
        type: 'info',
        message: `Page "${page}" has high network requests: ${avgNetworkRequests.toFixed(0)}`,
        page,
      });
    }
  });

  // Environment-specific recommendations
  const productionMetrics = metrics.filter(m => m.environment === 'production');
  // const developmentMetrics = metrics.filter(m => m.environment === 'development');

  if (productionMetrics.length > 0) {
    const prodAvgLoadTime = productionMetrics.reduce((sum, m) => sum + m.loadTime, 0) / productionMetrics.length;
    if (prodAvgLoadTime > 2000) {
      recommendations.push('Production load times are above 2 seconds - consider CDN or server optimization');
    }
  }

  return {
    summary: {
      totalPages: metrics.length,
      averageLoadTime,
      fastestPage,
      slowestPage,
      cacheHitRate: averageCacheHitRate,
      networkEfficiency: 1 - (averageNetworkRequests / 50), // Normalize to 0-1 scale
    },
    trends: {
      loadTimeTrend: secondHalfAvgLoadTime < firstHalfAvgLoadTime * 0.9 ? 'improving' : 
                    secondHalfAvgLoadTime > firstHalfAvgLoadTime * 1.1 ? 'degrading' : 'stable',
      cacheEfficiencyTrend: secondHalfAvgCacheHitRate > firstHalfAvgCacheHitRate * 1.1 ? 'improving' :
                           secondHalfAvgCacheHitRate < firstHalfAvgCacheHitRate * 0.9 ? 'degrading' : 'stable',
      networkOptimizationTrend: secondHalfAvgNetworkRequests < firstHalfAvgNetworkRequests * 0.9 ? 'improving' :
                               secondHalfAvgNetworkRequests > firstHalfAvgNetworkRequests * 1.1 ? 'degrading' : 'stable',
    },
    recommendations,
    alerts,
  };
}

/**
 * Generate performance report
 */
export function generatePerformanceReport(metrics: PerformanceMetrics[]): string {
  const analysis = analyzePerformance(metrics);
  
  let report = '# Better Planner Performance Report\n\n';
  report += `Generated on: ${new Date().toLocaleString()}\n`;
  report += `Total measurements: ${analysis.summary.totalPages}\n\n`;

  // Summary section
  report += '## Summary\n\n';
  report += `- **Average Load Time**: ${analysis.summary.averageLoadTime.toFixed(0)}ms\n`;
  report += `- **Fastest Page**: ${analysis.summary.fastestPage}\n`;
  report += `- **Slowest Page**: ${analysis.summary.slowestPage}\n`;
  report += `- **Cache Hit Rate**: ${(analysis.summary.cacheHitRate * 100).toFixed(1)}%\n`;
  report += `- **Network Efficiency**: ${(analysis.summary.networkEfficiency * 100).toFixed(1)}%\n\n`;

  // Trends section
  report += '## Trends\n\n';
  report += `- **Load Time Trend**: ${analysis.trends.loadTimeTrend}\n`;
  report += `- **Cache Efficiency Trend**: ${analysis.trends.cacheEfficiencyTrend}\n`;
  report += `- **Network Optimization Trend**: ${analysis.trends.networkOptimizationTrend}\n\n`;

  // Recommendations section
  report += '## Recommendations\n\n';
  analysis.recommendations.forEach((rec, index) => {
    report += `${index + 1}. ${rec}\n`;
  });
  report += '\n';

  // Alerts section
  if (analysis.alerts.length > 0) {
    report += '## Alerts\n\n';
    analysis.alerts.forEach((alert, index) => {
      report += `${index + 1}. **[${alert.type.toUpperCase()}]** ${alert.message}\n`;
      if (alert.page) {
        report += `   - Page: ${alert.page}\n`;
      }
    });
    report += '\n';
  }

  // Page breakdown
  const pageStats = metrics.reduce((acc, metric) => {
    if (!acc[metric.pageName]) {
      acc[metric.pageName] = {
        loadTimes: [],
        cacheHitRates: [],
        networkRequests: [],
        count: 0,
      };
    }
    acc[metric.pageName].loadTimes.push(metric.loadTime);
    acc[metric.pageName].cacheHitRates.push(metric.cacheHitRate);
    acc[metric.pageName].networkRequests.push(metric.networkRequests);
    acc[metric.pageName].count++;
    return acc;
  }, {} as Record<string, { loadTimes: number[]; cacheHitRates: number[]; networkRequests: number[]; count: number; }>);

  report += '## Page Breakdown\n\n';
  Object.entries(pageStats).forEach(([page, stats]) => {
    const avgLoadTime = stats.loadTimes.reduce((a, b) => a + b, 0) / stats.loadTimes.length;
    const avgCacheHitRate = stats.cacheHitRates.reduce((a, b) => a + b, 0) / stats.cacheHitRates.length;
    const avgNetworkRequests = stats.networkRequests.reduce((a, b) => a + b, 0) / stats.networkRequests.length;
    
    report += `### ${page}\n`;
    report += `- **Measurements**: ${stats.count}\n`;
    report += `- **Average Load Time**: ${avgLoadTime.toFixed(0)}ms\n`;
    report += `- **Average Cache Hit Rate**: ${(avgCacheHitRate * 100).toFixed(1)}%\n`;
    report += `- **Average Network Requests**: ${avgNetworkRequests.toFixed(0)}\n\n`;
  });

  return report;
}

/**
 * Export performance data as CSV
 */
export function exportPerformanceCSV(metrics: PerformanceMetrics[]): string {
  const headers = [
    'Page Name',
    'Load Time (ms)',
    'Cache Hit Rate (%)',
    'Network Requests',
    'Cache Size',
    'Memory Usage (MB)',
    'Environment',
    'Timestamp',
    'URL',
    'User Agent'
  ];

  const rows = metrics.map(metric => [
    metric.pageName,
    metric.loadTime.toFixed(0),
    (metric.cacheHitRate * 100).toFixed(1),
    metric.networkRequests.toString(),
    metric.swrCacheSize.toString(),
    (metric.memoryUsage / 1024 / 1024).toFixed(2),
    metric.environment,
    metric.timestamp,
    metric.url,
    metric.userAgent
  ]);

  return [headers, ...rows].map(row => row.join(',')).join('\n');
}
